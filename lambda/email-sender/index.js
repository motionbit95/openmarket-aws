/**
 * Email Sender Lambda Function
 *
 * SQS 메시지를 받아 이메일을 발송하는 Lambda Function
 * - 주문 확인 이메일
 * - 배송 알림
 * - 비밀번호 재설정
 * - 프로모션 이메일
 *
 * Trigger: SQS
 * Input: SQS Message
 * Output: Email sent via SES
 */

const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: process.env.AWS_REGION || 'ap-northeast-2' });

// 이메일 템플릿
const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: {
    subject: '주문이 완료되었습니다 - OpenMarket',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .order-info { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .product { border-bottom: 1px solid #eee; padding: 10px 0; }
            .total { font-size: 18px; font-weight: bold; color: #4CAF50; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>주문 확인</h1>
            </div>
            <div class="content">
              <p>${data.customerName}님, 안녕하세요!</p>
              <p>주문이 정상적으로 완료되었습니다.</p>

              <div class="order-info">
                <h3>주문 정보</h3>
                <p><strong>주문 번호:</strong> ${data.orderNumber}</p>
                <p><strong>주문 일시:</strong> ${data.orderDate}</p>

                <h4>주문 상품</h4>
                ${data.items.map(item => `
                  <div class="product">
                    <p><strong>${item.name}</strong></p>
                    <p>수량: ${item.quantity}개 × ${item.price.toLocaleString()}원</p>
                  </div>
                `).join('')}

                <p class="total">총 결제 금액: ${data.totalAmount.toLocaleString()}원</p>
              </div>

              <p>배송 준비가 완료되면 알려드리겠습니다.</p>
            </div>
            <div class="footer">
              <p>OpenMarket | <a href="mailto:support@openmarket.com">support@openmarket.com</a></p>
              <p>이 이메일은 자동 발송 메일입니다.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  SHIPPING_NOTIFICATION: {
    subject: '상품이 발송되었습니다 - OpenMarket',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .tracking { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .button { background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>배송 시작</h1>
            </div>
            <div class="content">
              <p>${data.customerName}님, 안녕하세요!</p>
              <p>주문하신 상품이 발송되었습니다.</p>

              <div class="tracking">
                <h3>배송 정보</h3>
                <p><strong>택배사:</strong> ${data.carrier}</p>
                <p><strong>운송장 번호:</strong> ${data.trackingNumber}</p>
                <p><strong>예상 도착일:</strong> ${data.estimatedDelivery}</p>

                <a href="${data.trackingUrl}" class="button">배송 조회하기</a>
              </div>

              <p>곧 만나뵙겠습니다!</p>
            </div>
            <div class="footer">
              <p>OpenMarket | <a href="mailto:support@openmarket.com">support@openmarket.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  PASSWORD_RESET: {
    subject: '비밀번호 재설정 - OpenMarket',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { background: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>비밀번호 재설정</h1>
            </div>
            <div class="content">
              <p>${data.userName}님, 안녕하세요!</p>
              <p>비밀번호 재설정 요청을 받았습니다.</p>

              <p>아래 버튼을 클릭하여 비밀번호를 재설정하세요:</p>
              <a href="${data.resetUrl}" class="button">비밀번호 재설정하기</a>

              <div class="warning">
                <p><strong>주의:</strong> 이 링크는 ${data.expiresIn}분 동안만 유효합니다.</p>
                <p>요청하지 않으셨다면 이 이메일을 무시하세요.</p>
              </div>
            </div>
            <div class="footer">
              <p>OpenMarket | <a href="mailto:support@openmarket.com">support@openmarket.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  PROMOTIONAL: {
    subject: (data) => data.subject || '특별한 혜택을 확인하세요 - OpenMarket',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #E91E63; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .promo { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; text-align: center; }
            .discount { font-size: 36px; font-weight: bold; color: #E91E63; }
            .button { background: #E91E63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.title}</h1>
            </div>
            <div class="content">
              <p>${data.customerName}님, 안녕하세요!</p>

              <div class="promo">
                <p class="discount">${data.discount}% OFF</p>
                <h2>${data.promoTitle}</h2>
                <p>${data.description}</p>
                <p><strong>프로모션 코드:</strong> <code>${data.promoCode}</code></p>
                <p><strong>유효 기간:</strong> ${data.validUntil}</p>

                <a href="${data.shopUrl}" class="button">지금 쇼핑하기</a>
              </div>
            </div>
            <div class="footer">
              <p>OpenMarket | <a href="${data.unsubscribeUrl}">수신 거부</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  }
};

/**
 * 이메일 발송 함수
 */
async function sendEmail(template, toEmail, data) {
  const templateConfig = EMAIL_TEMPLATES[template];

  if (!templateConfig) {
    throw new Error(`Unknown email template: ${template}`);
  }

  const subject = typeof templateConfig.subject === 'function'
    ? templateConfig.subject(data)
    : templateConfig.subject;

  const htmlBody = templateConfig.getHtml(data);

  const params = {
    Source: process.env.FROM_EMAIL || 'noreply@openmarket.com',
    Destination: {
      ToAddresses: [toEmail]
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8'
        }
      }
    }
  };

  // BCC 추가 (로깅용)
  if (process.env.BCC_EMAIL) {
    params.Destination.BccAddresses = [process.env.BCC_EMAIL];
  }

  try {
    const result = await ses.sendEmail(params).promise();
    console.log('Email sent successfully:', result.MessageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Lambda Handler
 */
exports.handler = async (event) => {
  console.log('Email Sender Lambda triggered', JSON.stringify(event, null, 2));

  const results = [];
  const errors = [];

  // SQS 메시지 처리
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      console.log('Processing message:', message);

      const { template, toEmail, data } = message;

      if (!template || !toEmail || !data) {
        throw new Error('Missing required fields: template, toEmail, or data');
      }

      // 이메일 발송
      const result = await sendEmail(template, toEmail, data);

      results.push({
        messageId: record.messageId,
        emailMessageId: result.MessageId,
        toEmail,
        template,
        status: 'success'
      });

    } catch (error) {
      console.error('Error processing message:', error);
      errors.push({
        messageId: record.messageId,
        error: error.message,
        status: 'failed'
      });
    }
  }

  // 결과 반환
  return {
    statusCode: errors.length === 0 ? 200 : 207, // 207: Multi-Status
    body: JSON.stringify({
      processed: results.length,
      succeeded: results.length,
      failed: errors.length,
      results,
      errors
    })
  };
};
