# Email Sender Lambda Function

SQS 메시지를 받아 Amazon SES를 통해 이메일을 발송하는 Lambda Function입니다.

## 기능

- **트랜잭션 이메일**: 주문 확인, 배송 알림, 비밀번호 재설정
- **프로모션 이메일**: 마케팅, 쿠폰, 이벤트 알림
- **템플릿 시스템**: HTML 이메일 템플릿 관리
- **배치 처리**: SQS에서 여러 메시지 한 번에 처리

## 이메일 템플릿

| 템플릿 | 용도 | 트리거 |
|--------|------|--------|
| ORDER_CONFIRMATION | 주문 확인 | 주문 완료 시 |
| SHIPPING_NOTIFICATION | 배송 시작 | 상품 발송 시 |
| PASSWORD_RESET | 비밀번호 재설정 | 재설정 요청 시 |
| PROMOTIONAL | 프로모션 | 마케팅 캠페인 |

## Trigger

- **Type**: SQS
- **Queue**: `openmarket-{env}-email-queue`
- **Batch Size**: 10
- **Visibility Timeout**: 60초

## SQS 메시지 형식

### 주문 확인 이메일
```json
{
  "template": "ORDER_CONFIRMATION",
  "toEmail": "customer@example.com",
  "data": {
    "customerName": "홍길동",
    "orderNumber": "ORD-20231115-12345",
    "orderDate": "2023-11-15 14:30:00",
    "items": [
      {
        "name": "상품명",
        "quantity": 2,
        "price": 29000
      }
    ],
    "totalAmount": 58000
  }
}
```

### 배송 알림
```json
{
  "template": "SHIPPING_NOTIFICATION",
  "toEmail": "customer@example.com",
  "data": {
    "customerName": "홍길동",
    "carrier": "CJ대한통운",
    "trackingNumber": "123456789012",
    "estimatedDelivery": "2023-11-17",
    "trackingUrl": "https://tracking.example.com/123456789012"
  }
}
```

### 비밀번호 재설정
```json
{
  "template": "PASSWORD_RESET",
  "toEmail": "user@example.com",
  "data": {
    "userName": "홍길동",
    "resetUrl": "https://openmarket.com/reset-password?token=abc123",
    "expiresIn": 30
  }
}
```

### 프로모션
```json
{
  "template": "PROMOTIONAL",
  "toEmail": "customer@example.com",
  "data": {
    "customerName": "홍길동",
    "subject": "블랙프라이데이 특가!",
    "title": "최대 50% 할인",
    "discount": 50,
    "promoTitle": "블랙프라이데이 초특가",
    "description": "11월 한정, 놓치지 마세요!",
    "promoCode": "BF2023",
    "validUntil": "2023-11-30",
    "shopUrl": "https://openmarket.com/sale",
    "unsubscribeUrl": "https://openmarket.com/unsubscribe?email=customer@example.com"
  }
}
```

## 환경 변수

| 변수 | 설명 | 필수 | 기본값 |
|------|------|------|--------|
| AWS_REGION | AWS 리전 | No | ap-northeast-2 |
| FROM_EMAIL | 발신 이메일 주소 | Yes | noreply@openmarket.com |
| BCC_EMAIL | BCC 이메일 (로깅) | No | - |

## IAM 권한

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:*:*:openmarket-*-email-queue"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

## SES 설정

### 1. 이메일 주소 검증 (Sandbox)
```bash
aws ses verify-email-identity \
  --email-address noreply@openmarket.com \
  --region ap-northeast-2 \
  --profile openmarket
```

### 2. Production 전환
- AWS Console에서 SES 프로덕션 액세스 요청
- 도메인 검증 (DKIM, SPF, DMARC)
- Sending limits 확인

### 3. 도메인 검증 (권장)
```bash
aws ses verify-domain-identity \
  --domain openmarket.com \
  --region ap-northeast-2 \
  --profile openmarket
```

## Backend에서 이메일 발송 요청

### Node.js 예제
```javascript
const AWS = require('aws-sdk');
const sqs = new AWS.SQS({ region: 'ap-northeast-2' });

async function sendOrderConfirmationEmail(order, customer) {
  const message = {
    template: 'ORDER_CONFIRMATION',
    toEmail: customer.email,
    data: {
      customerName: customer.name,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      items: order.items.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: order.totalAmount
    }
  };

  await sqs.sendMessage({
    QueueUrl: process.env.EMAIL_QUEUE_URL,
    MessageBody: JSON.stringify(message)
  }).promise();
}
```

## 배포

### 1. 의존성 설치
```bash
cd lambda/email-sender
npm install
```

### 2. 패키지 생성
```bash
zip -r function.zip index.js node_modules/ package.json
```

### 3. Lambda 업로드
```bash
aws lambda update-function-code \
  --function-name openmarket-dev-email-sender \
  --zip-file fileb://function.zip \
  --profile openmarket
```

## 테스트

### SQS 메시지 전송
```bash
aws sqs send-message \
  --queue-url https://sqs.ap-northeast-2.amazonaws.com/478266318018/openmarket-dev-email-queue \
  --message-body '{
    "template": "ORDER_CONFIRMATION",
    "toEmail": "test@example.com",
    "data": {
      "customerName": "테스트",
      "orderNumber": "TEST-001",
      "orderDate": "2023-11-15",
      "items": [{"name": "테스트 상품", "quantity": 1, "price": 10000}],
      "totalAmount": 10000
    }
  }' \
  --profile openmarket
```

## 모니터링

### CloudWatch Logs
```bash
aws logs tail /aws/lambda/openmarket-dev-email-sender --follow \
  --profile openmarket
```

### 메트릭
- **Invocations**: SQS 트리거 횟수
- **Duration**: 이메일 발송 시간
- **Errors**: 발송 실패 횟수
- **SES Bounce Rate**: 반송률
- **SES Complaint Rate**: 스팸 신고율

### CloudWatch 알람
```bash
# Bounce rate > 5%
aws cloudwatch put-metric-alarm \
  --alarm-name ses-high-bounce-rate \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --metric-name Reputation.BounceRate \
  --namespace AWS/SES \
  --period 300 \
  --statistic Average \
  --threshold 0.05 \
  --profile openmarket
```

## 에러 처리

### SQS Dead Letter Queue
발송 실패 시 DLQ로 이동:
- **Max Receive Count**: 3
- **DLQ**: `openmarket-dev-email-queue-dlq`
- **Retention**: 14일

### 재시도 전략
- Lambda 자동 재시도: 2회
- SQS 재처리: 3회
- DLQ 이동 후 수동 처리

## 성능 최적화

- **메모리**: 256 MB
- **타임아웃**: 30초
- **동시 실행**: 100
- **예약된 동시성**: 없음
- **Batch Size**: 10 (비용 절감)

## 비용 추정

### 가정
- 월 100,000개 이메일 발송
- SQS 배치 크기: 10
- 평균 실행 시간: 2초

### 비용
- **Lambda 호출**: $2.00/월
- **Lambda 실행**: $0.40/월
- **SES**: $10.00/월 (첫 62,000개 무료 후)
- **SQS**: $0.40/월
- **총**: ~$12.80/월

## SES Sending Limits

| 환경 | Sandbox | Production |
|------|---------|------------|
| 일일 전송량 | 200 | 50,000 (요청 가능) |
| 초당 전송량 | 1 | 14 (요청 가능) |
| 수신자 제한 | 검증된 주소만 | 제한 없음 |

## 개선 사항

향후 추가 기능:
- [ ] 이메일 템플릿 S3 저장
- [ ] Handlebars 템플릿 엔진 사용
- [ ] 다국어 지원
- [ ] 이메일 열람/클릭 추적
- [ ] A/B 테스팅
- [ ] DynamoDB에 발송 이력 저장
- [ ] 구독 취소 관리
