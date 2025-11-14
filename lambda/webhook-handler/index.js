/**
 * Webhook Handler Lambda Function
 *
 * 외부 서비스(결제, 배송 등)에서 오는 웹훅을 처리
 * - 결제 완료/실패 (Toss, KakaoPay, NaverPay 등)
 * - 배송 상태 업데이트 (CJ대한통운, 우체국 등)
 * - 환불 처리
 * - 기타 외부 이벤트
 *
 * Trigger: API Gateway
 * Input: HTTP POST Request
 * Output: HTTP Response
 */

const AWS = require('aws-sdk');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

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
 * 웹훅 서명 검증
 */
function verifySignature(payload, signature, secret, algorithm = 'sha256') {
  const expectedSignature = crypto
    .createHmac(algorithm, secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * 결제 웹훅 처리
 */
async function handlePaymentWebhook(data) {
  console.log('Processing payment webhook:', data);

  const connection = await getDbConnection();

  const { orderId, status, paymentMethod, transactionId, amount, paidAt } = data;

  // 주문 상태 업데이트
  const [result] = await connection.execute(`
    UPDATE orders
    SET
      payment_status = ?,
      payment_method = ?,
      transaction_id = ?,
      paid_amount = ?,
      paid_at = ?
    WHERE id = ?
  `, [status, paymentMethod, transactionId, amount, paidAt, orderId]);

  if (result.affectedRows === 0) {
    throw new Error(`Order ${orderId} not found`);
  }

  // 결제 완료 시 이메일 발송
  if (status === 'completed') {
    const [orders] = await connection.execute(`
      SELECT o.*, u.email, u.name as customer_name
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (orders.length > 0) {
      const order = orders[0];

      // SQS로 이메일 발송 요청
      await sqs.sendMessage({
        QueueUrl: process.env.EMAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
          template: 'ORDER_CONFIRMATION',
          toEmail: order.email,
          data: {
            customerName: order.customer_name,
            orderNumber: order.order_number,
            orderDate: order.created_at,
            totalAmount: order.total_amount
          }
        })
      }).promise();
    }
  }

  return {
    success: true,
    orderId,
    status,
    message: 'Payment webhook processed successfully'
  };
}

/**
 * 배송 웹훅 처리
 */
async function handleShippingWebhook(data) {
  console.log('Processing shipping webhook:', data);

  const connection = await getDbConnection();

  const { orderId, trackingNumber, carrier, status, location, timestamp } = data;

  // 배송 정보 업데이트
  const [result] = await connection.execute(`
    UPDATE orders
    SET
      shipping_status = ?,
      tracking_number = ?,
      carrier = ?,
      last_location = ?,
      shipping_updated_at = ?
    WHERE id = ?
  `, [status, trackingNumber, carrier, location, timestamp, orderId]);

  if (result.affectedRows === 0) {
    throw new Error(`Order ${orderId} not found`);
  }

  // 배송 시작 시 이메일 발송
  if (status === 'in_transit') {
    const [orders] = await connection.execute(`
      SELECT o.*, u.email, u.name as customer_name
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (orders.length > 0) {
      const order = orders[0];

      await sqs.sendMessage({
        QueueUrl: process.env.EMAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
          template: 'SHIPPING_NOTIFICATION',
          toEmail: order.email,
          data: {
            customerName: order.customer_name,
            carrier: carrier,
            trackingNumber: trackingNumber,
            estimatedDelivery: calculateEstimatedDelivery(timestamp),
            trackingUrl: getTrackingUrl(carrier, trackingNumber)
          }
        })
      }).promise();
    }
  }

  return {
    success: true,
    orderId,
    trackingNumber,
    status,
    message: 'Shipping webhook processed successfully'
  };
}

/**
 * 환불 웹훅 처리
 */
async function handleRefundWebhook(data) {
  console.log('Processing refund webhook:', data);

  const connection = await getDbConnection();

  const { orderId, refundId, amount, reason, status, processedAt } = data;

  // 환불 정보 삽입
  await connection.execute(`
    INSERT INTO refunds (order_id, refund_id, amount, reason, status, processed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [orderId, refundId, amount, reason, status, processedAt]);

  // 주문 상태 업데이트
  await connection.execute(`
    UPDATE orders
    SET
      refund_status = ?,
      refunded_amount = ?
    WHERE id = ?
  `, [status, amount, orderId]);

  return {
    success: true,
    orderId,
    refundId,
    status,
    message: 'Refund webhook processed successfully'
  };
}

/**
 * 예상 배송일 계산
 */
function calculateEstimatedDelivery(startDate) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + 2); // 2일 후
  return date.toISOString().split('T')[0];
}

/**
 * 배송 추적 URL 생성
 */
function getTrackingUrl(carrier, trackingNumber) {
  const trackingUrls = {
    'CJ대한통운': `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${trackingNumber}`,
    '우체국': `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${trackingNumber}`,
    '한진택배': `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnum=${trackingNumber}`,
    '로젠택배': `https://www.ilogen.com/web/personal/trace/${trackingNumber}`
  };

  return trackingUrls[carrier] || `https://openmarket.com/tracking/${trackingNumber}`;
}

/**
 * Webhook 타입별 핸들러 매핑
 */
const webhookHandlers = {
  payment: handlePaymentWebhook,
  shipping: handleShippingWebhook,
  refund: handleRefundWebhook
};

/**
 * Lambda Handler
 */
exports.handler = async (event) => {
  console.log('Webhook Handler Lambda triggered', JSON.stringify(event, null, 2));

  try {
    // API Gateway 이벤트 파싱
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const headers = event.headers || {};

    // Webhook 타입 확인
    const webhookType = event.pathParameters?.type || body.type;

    if (!webhookType) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Webhook type is required'
        })
      };
    }

    // 서명 검증 (옵션)
    const signature = headers['x-webhook-signature'] || headers['X-Webhook-Signature'];
    if (signature && process.env.WEBHOOK_SECRET) {
      const isValid = verifySignature(body, signature, process.env.WEBHOOK_SECRET);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Invalid signature'
          })
        };
      }
    }

    // 핸들러 찾기
    const handler = webhookHandlers[webhookType];

    if (!handler) {
      console.error(`Unknown webhook type: ${webhookType}`);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: `Unknown webhook type: ${webhookType}`
        })
      };
    }

    // 웹훅 처리
    const result = await handler(body);

    // 성공 응답
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error processing webhook:', error);

    // 에러 응답
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Error processing webhook',
        error: error.message
      })
    };
  }
};
