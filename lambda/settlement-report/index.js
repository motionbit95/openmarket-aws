/**
 * Settlement Report Lambda Function
 *
 * 판매자별 정산 리포트를 생성하고 이메일로 발송
 * - 일일 정산: 매일 오전 9시
 * - 주간 정산: 매주 월요일 오전 9시
 * - 월간 정산: 매월 1일 오전 9시
 *
 * Trigger: EventBridge (CloudWatch Events)
 * Input: Schedule Event
 * Output: Report saved to S3, Email sent via SQS
 */

const AWS = require('aws-sdk');
const mysql = require('mysql2/promise');

const s3 = new AWS.S3();
const sqs = new AWS.SQS({ region: process.env.AWS_REGION || 'ap-northeast-2' });
const secretsManager = new AWS.SecretsManager({ region: process.env.AWS_REGION || 'ap-northeast-2' });

// 데이터베이스 연결 풀
let dbPool = null;

/**
 * Secrets Manager에서 DB credentials 가져오기
 */
async function getDbCredentials() {
  try {
    const secret = await secretsManager.getSecretValue({
      SecretId: process.env.DB_SECRET_NAME || 'openmarket-dev-rds-credentials'
    }).promise();

    return JSON.parse(secret.SecretString);
  } catch (error) {
    console.error('Error getting DB credentials:', error);
    throw error;
  }
}

/**
 * 데이터베이스 연결
 */
async function getDbConnection() {
  if (!dbPool) {
    const credentials = await getDbCredentials();

    dbPool = mysql.createPool({
      host: credentials.host,
      user: credentials.username,
      password: credentials.password,
      database: process.env.DB_NAME || 'openmarket_dev',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });
  }

  return dbPool;
}

/**
 * 판매자별 정산 데이터 조회
 */
async function getSettlementData(sellerId, startDate, endDate) {
  const connection = await getDbConnection();

  const [orders] = await connection.execute(`
    SELECT
      o.id as order_id,
      o.order_number,
      o.created_at,
      o.total_amount,
      o.status,
      oi.product_id,
      oi.product_name,
      oi.quantity,
      oi.price,
      oi.total_price,
      p.commission_rate
    FROM orders o
    INNER JOIN order_items oi ON o.id = oi.order_id
    INNER JOIN products p ON oi.product_id = p.id
    WHERE p.seller_id = ?
      AND o.status IN ('completed', 'delivered')
      AND o.created_at >= ?
      AND o.created_at < ?
    ORDER BY o.created_at DESC
  `, [sellerId, startDate, endDate]);

  // 정산 계산
  const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
  const totalCommission = orders.reduce((sum, order) => {
    const commissionRate = parseFloat(order.commission_rate) / 100;
    return sum + (parseFloat(order.total_price) * commissionRate);
  }, 0);
  const netAmount = totalSales - totalCommission;

  return {
    sellerId,
    period: {
      start: startDate,
      end: endDate
    },
    summary: {
      totalOrders: orders.length,
      totalSales: Math.round(totalSales),
      totalCommission: Math.round(totalCommission),
      netAmount: Math.round(netAmount)
    },
    orders: orders.map(order => ({
      orderNumber: order.order_number,
      date: order.created_at,
      productName: order.product_name,
      quantity: order.quantity,
      price: order.price,
      totalPrice: order.total_price,
      commissionRate: order.commission_rate,
      commission: Math.round(parseFloat(order.total_price) * parseFloat(order.commission_rate) / 100)
    }))
  };
}

/**
 * 판매자 정보 조회
 */
async function getSellerInfo(sellerId) {
  const connection = await getDbConnection();

  const [sellers] = await connection.execute(`
    SELECT
      id,
      name,
      email,
      business_name,
      business_number
    FROM sellers
    WHERE id = ?
  `, [sellerId]);

  return sellers[0] || null;
}

/**
 * 모든 활성 판매자 조회
 */
async function getAllActiveSellers() {
  const connection = await getDbConnection();

  const [sellers] = await connection.execute(`
    SELECT id FROM sellers WHERE status = 'active'
  `);

  return sellers.map(s => s.id);
}

/**
 * 리포트를 CSV로 변환
 */
function generateCsv(data) {
  const headers = [
    '주문번호',
    '주문일시',
    '상품명',
    '수량',
    '단가',
    '판매금액',
    '수수료율(%)',
    '수수료',
    '정산금액'
  ];

  const rows = data.orders.map(order => [
    order.orderNumber,
    new Date(order.date).toLocaleString('ko-KR'),
    order.productName,
    order.quantity,
    order.price.toLocaleString(),
    order.totalPrice.toLocaleString(),
    order.commissionRate,
    order.commission.toLocaleString(),
    (order.totalPrice - order.commission).toLocaleString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * 리포트를 HTML로 변환
 */
function generateHtml(seller, data) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .summary { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .summary-item { display: inline-block; margin: 10px 20px; }
          .summary-label { font-size: 14px; color: #666; }
          .summary-value { font-size: 24px; font-weight: bold; color: #4CAF50; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #4CAF50; color: white; }
          tr:hover { background: #f5f5f5; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>정산 리포트</h1>
            <p>${data.period.start} ~ ${data.period.end}</p>
          </div>

          <div class="seller-info">
            <h2>${seller.business_name || seller.name}</h2>
            <p>사업자번호: ${seller.business_number || 'N/A'}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">총 주문 건수</div>
              <div class="summary-value">${data.summary.totalOrders.toLocaleString()}건</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">총 판매 금액</div>
              <div class="summary-value">${data.summary.totalSales.toLocaleString()}원</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">총 수수료</div>
              <div class="summary-value">${data.summary.totalCommission.toLocaleString()}원</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">정산 금액</div>
              <div class="summary-value" style="color: #E91E63;">${data.summary.netAmount.toLocaleString()}원</div>
            </div>
          </div>

          <h3>주문 상세</h3>
          <table>
            <thead>
              <tr>
                <th>주문번호</th>
                <th>주문일시</th>
                <th>상품명</th>
                <th>수량</th>
                <th>판매금액</th>
                <th>수수료</th>
                <th>정산금액</th>
              </tr>
            </thead>
            <tbody>
              ${data.orders.map(order => `
                <tr>
                  <td>${order.orderNumber}</td>
                  <td>${new Date(order.date).toLocaleString('ko-KR')}</td>
                  <td>${order.productName}</td>
                  <td>${order.quantity}</td>
                  <td>${order.totalPrice.toLocaleString()}원</td>
                  <td>${order.commission.toLocaleString()}원</td>
                  <td>${(order.totalPrice - order.commission).toLocaleString()}원</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>OpenMarket 정산 시스템</p>
            <p>문의: seller-support@openmarket.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * S3에 리포트 저장
 */
async function saveReportToS3(sellerId, reportType, data, content, format) {
  const bucket = process.env.REPORTS_BUCKET || 'openmarket-dev-reports';
  const date = new Date().toISOString().split('T')[0];
  const key = `settlements/${reportType}/${date}/${sellerId}.${format}`;

  await s3.putObject({
    Bucket: bucket,
    Key: key,
    Body: content,
    ContentType: format === 'csv' ? 'text/csv' : 'text/html',
    Metadata: {
      'seller-id': sellerId.toString(),
      'report-type': reportType,
      'generated-at': new Date().toISOString()
    }
  }).promise();

  console.log(`Report saved to S3: ${key}`);

  return `s3://${bucket}/${key}`;
}

/**
 * 이메일 발송 요청 (SQS)
 */
async function sendEmailNotification(seller, data, s3Url) {
  const message = {
    template: 'SETTLEMENT_REPORT',
    toEmail: seller.email,
    data: {
      sellerName: seller.name,
      businessName: seller.business_name,
      period: `${data.period.start} ~ ${data.period.end}`,
      totalOrders: data.summary.totalOrders,
      totalSales: data.summary.totalSales,
      totalCommission: data.summary.totalCommission,
      netAmount: data.summary.netAmount,
      reportUrl: s3Url
    }
  };

  await sqs.sendMessage({
    QueueUrl: process.env.EMAIL_QUEUE_URL,
    MessageBody: JSON.stringify(message)
  }).promise();

  console.log(`Email notification sent for seller ${seller.id}`);
}

/**
 * Lambda Handler
 */
exports.handler = async (event) => {
  console.log('Settlement Report Lambda triggered', JSON.stringify(event, null, 2));

  try {
    // 리포트 타입 결정 (daily, weekly, monthly)
    const reportType = event.reportType || 'daily';

    // 기간 계산
    const endDate = new Date();
    const startDate = new Date();

    switch (reportType) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`Generating ${reportType} report for period: ${startDateStr} ~ ${endDateStr}`);

    // 모든 활성 판매자 조회
    const sellerIds = event.sellerId
      ? [event.sellerId]
      : await getAllActiveSellers();

    console.log(`Processing ${sellerIds.length} sellers`);

    const results = [];

    // 각 판매자별로 리포트 생성
    for (const sellerId of sellerIds) {
      try {
        // 판매자 정보 조회
        const seller = await getSellerInfo(sellerId);
        if (!seller) {
          console.log(`Seller ${sellerId} not found, skipping...`);
          continue;
        }

        // 정산 데이터 조회
        const data = await getSettlementData(sellerId, startDateStr, endDateStr);

        if (data.summary.totalOrders === 0) {
          console.log(`No orders for seller ${sellerId}, skipping...`);
          continue;
        }

        // CSV 생성 및 저장
        const csv = generateCsv(data);
        const csvS3Url = await saveReportToS3(sellerId, reportType, data, csv, 'csv');

        // HTML 생성 및 저장
        const html = generateHtml(seller, data);
        const htmlS3Url = await saveReportToS3(sellerId, reportType, data, html, 'html');

        // 이메일 발송
        await sendEmailNotification(seller, data, csvS3Url);

        results.push({
          sellerId,
          sellerName: seller.name,
          reportType,
          period: `${startDateStr} ~ ${endDateStr}`,
          summary: data.summary,
          csvUrl: csvS3Url,
          htmlUrl: htmlS3Url,
          status: 'success'
        });

      } catch (error) {
        console.error(`Error processing seller ${sellerId}:`, error);
        results.push({
          sellerId,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log('Settlement report generation completed', results);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Settlement reports generated successfully',
        reportType,
        period: {
          start: startDateStr,
          end: endDateStr
        },
        processed: results.length,
        succeeded: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length,
        results
      })
    };

  } catch (error) {
    console.error('Error generating settlement reports:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error generating settlement reports',
        error: error.message
      })
    };
  }
};
