# Webhook Handler Lambda Function

외부 서비스(결제 게이트웨이, 배송 추적 등)에서 오는 웹훅을 처리하는 Lambda Function입니다.

## 기능

- **결제 웹훅**: Toss, KakaoPay, NaverPay 등 결제 완료/실패 처리
- **배송 웹훅**: CJ대한통운, 우체국 등 배송 상태 업데이트
- **환불 웹훅**: 환불 요청 및 처리
- **서명 검증**: HMAC 기반 웹훅 서명 검증
- **DB 업데이트**: 주문 상태 실시간 업데이트
- **이메일 알림**: SQS를 통한 고객 알림

## Trigger

- **Type**: API Gateway (HTTP POST)
- **Endpoint**: `/webhooks/{type}`
- **Method**: POST
- **Authentication**: HMAC Signature (Optional)

## API 엔드포인트

| 엔드포인트 | 웹훅 타입 | 설명 |
|-----------|----------|------|
| `POST /webhooks/payment` | 결제 | 결제 완료/실패 |
| `POST /webhooks/shipping` | 배송 | 배송 상태 업데이트 |
| `POST /webhooks/refund` | 환불 | 환불 처리 |

## 웹훅 페이로드

### 결제 웹훅
```json
{
  "type": "payment",
  "orderId": 123,
  "status": "completed",
  "paymentMethod": "card",
  "transactionId": "TXN-20231115-12345",
  "amount": 58000,
  "paidAt": "2023-11-15T14:30:00Z"
}
```

**결제 상태**:
- `completed`: 결제 완료
- `failed`: 결제 실패
- `cancelled`: 결제 취소
- `pending`: 결제 대기

### 배송 웹훅
```json
{
  "type": "shipping",
  "orderId": 123,
  "trackingNumber": "123456789012",
  "carrier": "CJ대한통운",
  "status": "in_transit",
  "location": "서울 강남구 물류센터",
  "timestamp": "2023-11-15T10:00:00Z"
}
```

**배송 상태**:
- `preparing`: 상품 준비중
- `in_transit`: 배송중
- `out_for_delivery`: 배송 출발
- `delivered`: 배송 완료
- `failed`: 배송 실패

### 환불 웹훅
```json
{
  "type": "refund",
  "orderId": 123,
  "refundId": "REF-20231115-12345",
  "amount": 58000,
  "reason": "단순 변심",
  "status": "completed",
  "processedAt": "2023-11-15T16:00:00Z"
}
```

**환불 상태**:
- `pending`: 환불 대기
- `processing`: 환불 처리중
- `completed`: 환불 완료
- `rejected`: 환불 거부

## 서명 검증

### HMAC SHA256 서명
```javascript
const crypto = require('crypto');

function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// 웹훅 발송 시
const signature = generateSignature(webhookPayload, WEBHOOK_SECRET);

// HTTP Header에 포함
headers: {
  'X-Webhook-Signature': signature
}
```

## 환경 변수

| 변수 | 설명 | 필수 | 기본값 |
|------|------|------|--------|
| AWS_REGION | AWS 리전 | No | ap-northeast-2 |
| DB_SECRET_NAME | DB Credentials Secret | Yes | openmarket-dev-rds-credentials |
| DB_NAME | 데이터베이스 이름 | No | openmarket_dev |
| EMAIL_QUEUE_URL | 이메일 SQS URL | Yes | - |
| WEBHOOK_SECRET | 웹훅 서명 검증 비밀키 | No | - |

## IAM 권한

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:openmarket-*-rds-credentials-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": "arn:aws:sqs:*:*:openmarket-*-email-queue"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface"
      ],
      "Resource": "*"
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

## API Gateway 설정

### Lambda Function URL (간단)
```bash
aws lambda create-function-url-config \
  --function-name openmarket-dev-webhook-handler \
  --auth-type NONE \
  --profile openmarket
```

### REST API (권장)
```yaml
Resources:
  WebhookApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: OpenMarket Webhook API
      Description: Webhook endpoints for external services

  WebhookResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      ParentId: !GetAtt WebhookApi.RootResourceId
      PathPart: webhooks
      RestApiId: !Ref WebhookApi

  WebhookTypeResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      ParentId: !Ref WebhookResource
      PathPart: "{type}"
      RestApiId: !Ref WebhookApi

  WebhookMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      HttpMethod: POST
      ResourceId: !Ref WebhookTypeResource
      RestApiId: !Ref WebhookApi
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${WebhookHandlerFunction.Arn}/invocations"
```

## 배포

### 1. 의존성 설치
```bash
cd lambda/webhook-handler
npm install
```

### 2. 패키지 생성
```bash
zip -r function.zip index.js node_modules/ package.json
```

### 3. Lambda 업로드
```bash
aws lambda update-function-code \
  --function-name openmarket-dev-webhook-handler \
  --zip-file fileb://function.zip \
  --profile openmarket
```

## 외부 서비스 설정

### Toss Payments 웹훅 설정
```
웹훅 URL: https://api.openmarket.com/webhooks/payment
HTTP Method: POST
Content-Type: application/json
```

### CJ대한통운 배송 추적
```
웹훅 URL: https://api.openmarket.com/webhooks/shipping
송장번호: {trackingNumber}
```

## 테스트

### cURL 테스트
```bash
# 결제 웹훅
curl -X POST https://api.openmarket.com/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: abc123..." \
  -d '{
    "type": "payment",
    "orderId": 1,
    "status": "completed",
    "paymentMethod": "card",
    "transactionId": "TXN-TEST-001",
    "amount": 10000,
    "paidAt": "2023-11-15T14:30:00Z"
  }'

# 배송 웹훅
curl -X POST https://api.openmarket.com/webhooks/shipping \
  -H "Content-Type: application/json" \
  -d '{
    "type": "shipping",
    "orderId": 1,
    "trackingNumber": "123456789012",
    "carrier": "CJ대한통운",
    "status": "in_transit",
    "location": "서울 강남구",
    "timestamp": "2023-11-15T10:00:00Z"
  }'
```

### Postman Collection
```json
{
  "info": {
    "name": "OpenMarket Webhooks",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Payment Webhook",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/webhooks/payment",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"orderId\": 1,\n  \"status\": \"completed\"\n}"
        }
      }
    }
  ]
}
```

## 모니터링

### CloudWatch Logs
```bash
aws logs tail /aws/lambda/openmarket-dev-webhook-handler --follow \
  --profile openmarket
```

### 메트릭
- **Invocations**: 웹훅 호출 횟수
- **Duration**: 처리 시간
- **Errors**: 에러 발생 횟수
- **4xx Errors**: 클라이언트 에러
- **5xx Errors**: 서버 에러

### CloudWatch 알람
```bash
# 웹훅 에러율 > 5%
aws cloudwatch put-metric-alarm \
  --alarm-name webhook-high-error-rate \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --period 300 \
  --statistic Average \
  --threshold 0.05 \
  --profile openmarket
```

## 에러 처리

### 재시도 정책
외부 서비스는 일반적으로 다음과 같이 재시도합니다:
- **1차 시도**: 즉시
- **2차 시도**: 5분 후
- **3차 시도**: 1시간 후
- **4차 시도**: 24시간 후

### 응답 코드
- `200 OK`: 웹훅 처리 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 서명 검증 실패
- `500 Internal Server Error`: 서버 에러

## 보안

### Rate Limiting
API Gateway에서 Rate Limiting 설정:
```yaml
MethodSettings:
  - ResourcePath: "/*"
    HttpMethod: "*"
    ThrottlingBurstLimit: 100
    ThrottlingRateLimit: 50
```

### IP Whitelist
특정 IP만 허용:
```yaml
ResourcePolicy:
  Version: "2012-10-17"
  Statement:
    - Effect: Allow
      Principal: "*"
      Action: "execute-api:Invoke"
      Resource: "*"
      Condition:
        IpAddress:
          "aws:SourceIp":
            - "123.456.789.0/24"  # Toss Payments IP
            - "234.567.890.0/24"  # CJ대한통운 IP
```

## 성능 최적화

- **메모리**: 512 MB
- **타임아웃**: 30초
- **동시 실행**: 100
- **예약된 동시성**: 없음
- **Connection Pooling**: MySQL2 사용

## 비용 추정

### 가정
- 월 50,000개 웹훅 요청
- 평균 실행 시간: 1초

### 비용
- **Lambda 호출**: $1.00/월
- **Lambda 실행**: $1.04/월
- **API Gateway**: $0.18/월
- **총**: ~$2.22/월

## 데이터베이스 스키마

### 필요한 테이블
```sql
-- 주문 테이블 (업데이트)
ALTER TABLE orders
ADD COLUMN payment_status VARCHAR(20),
ADD COLUMN payment_method VARCHAR(50),
ADD COLUMN transaction_id VARCHAR(100),
ADD COLUMN paid_amount DECIMAL(10,2),
ADD COLUMN paid_at TIMESTAMP,
ADD COLUMN shipping_status VARCHAR(20),
ADD COLUMN tracking_number VARCHAR(50),
ADD COLUMN carrier VARCHAR(50),
ADD COLUMN last_location VARCHAR(200),
ADD COLUMN shipping_updated_at TIMESTAMP,
ADD COLUMN refund_status VARCHAR(20),
ADD COLUMN refunded_amount DECIMAL(10,2);

-- 환불 테이블
CREATE TABLE refunds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  refund_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status VARCHAR(20),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

## 개선 사항

향후 추가 기능:
- [ ] 웹훅 재시도 큐 (DLQ)
- [ ] 웹훅 로그 DynamoDB 저장
- [ ] 웹훅 이벤트 대시보드
- [ ] 다중 결제 게이트웨이 지원
- [ ] Idempotency 키 지원
- [ ] 웹훅 시뮬레이터 (테스트용)
