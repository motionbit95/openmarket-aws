# Phase 4: Lambda Functions 구현 완료 ✅

## 개요

Phase 4에서는 OpenMarket 플랫폼의 서버리스 아키텍처를 구현하기 위한 4개의 Lambda Functions를 작성하고, Terraform 모듈로 배포 인프라를 구성했습니다.

## 🎉 구현 완료 현황

- ✅ **Image Processor**: S3 이미지 자동 리사이징 (4가지 크기)
- ✅ **Email Sender**: SQS 기반 비동기 이메일 발송 (4가지 템플릿)
- ✅ **Settlement Report**: 판매자 정산 리포트 자동 생성 (일/주/월)
- ✅ **Webhook Handler**: 결제/배송/환불 웹훅 처리
- ✅ **Terraform Module**: Lambda 인프라 코드 작성

## 생성된 파일 구조

```
lambda/
├── image-processor/
│   ├── index.js                 # Lambda 핸들러
│   ├── package.json            # 의존성
│   └── README.md               # 문서
│
├── email-sender/
│   ├── index.js                 # SQS 트리거 핸들러
│   ├── package.json
│   └── README.md
│
├── settlement-report/
│   ├── index.js                 # EventBridge 스케줄러
│   ├── package.json
│   └── README.md
│
└── webhook-handler/
    ├── index.js                 # API Gateway 핸들러
    ├── package.json
    └── README.md

infrastructure/terraform/modules/lambda/
├── main.tf                      # Lambda 리소스
├── iam.tf                       # IAM Roles & Policies
├── variables.tf                 # 입력 변수
└── outputs.tf                   # 출력 값
```

## Lambda Functions 상세

### 1. Image Processor

**목적**: S3에 업로드된 이미지를 자동으로 여러 크기로 리사이징

**트리거**: S3 Event (`s3:ObjectCreated:*`)

**이미지 크기**:
- **Large**: 1200x1200 (상품 상세)
- **Medium**: 800x800 (상품 목록)
- **Small**: 400x400 (카드 뷰)
- **Thumbnail**: 200x200 (썸네일)

**기술 스택**:
- Node.js 20
- Sharp (이미지 처리)
- AWS SDK

**리소스**:
- Memory: 1024 MB
- Timeout: 60초
- Runtime: Node.js 20.x

**처리 흐름**:
```
S3 Upload → Lambda Trigger → Sharp Resize → S3 Save
    ↓                                            ↓
uploads/products/                    uploads/products/processed/
    image.jpg                            large/image.jpg
                                         medium/image.jpg
                                         small/image.jpg
                                         thumbnail/image.jpg
```

**IAM 권한**:
- `s3:GetObject` - 원본 이미지 읽기
- `s3:PutObject` - 리사이즈된 이미지 저장

**비용 예측** (월 10,000개 이미지):
- Lambda: ~$0.75/월
- S3 PUT: ~$0.05/월
- **총**: ~$0.80/월

---

### 2. Email Sender

**목적**: SQS 메시지를 받아 Amazon SES로 이메일 발송

**트리거**: SQS (`openmarket-{env}-email-queue`)

**이메일 템플릿**:
1. **ORDER_CONFIRMATION**: 주문 확인 이메일
2. **SHIPPING_NOTIFICATION**: 배송 시작 알림
3. **PASSWORD_RESET**: 비밀번호 재설정
4. **PROMOTIONAL**: 프로모션/마케팅 이메일

**기술 스택**:
- Node.js 20
- AWS SDK (SES)
- HTML 이메일 템플릿

**리소스**:
- Memory: 256 MB
- Timeout: 30초
- Batch Size: 10 (SQS)

**SQS 메시지 형식**:
```json
{
  "template": "ORDER_CONFIRMATION",
  "toEmail": "customer@example.com",
  "data": {
    "customerName": "홍길동",
    "orderNumber": "ORD-20231115-12345",
    "totalAmount": 58000
  }
}
```

**IAM 권한**:
- `ses:SendEmail` - 이메일 발송
- `sqs:ReceiveMessage` - SQS 메시지 수신
- `sqs:DeleteMessage` - 처리 완료 후 삭제

**비용 예측** (월 100,000개 이메일):
- Lambda: ~$2.40/월
- SES: ~$10.00/월
- SQS: ~$0.40/월
- **총**: ~$12.80/월

---

### 3. Settlement Report

**목적**: 판매자별 정산 리포트 자동 생성 및 발송

**트리거**: EventBridge (CloudWatch Events)

**스케줄**:
- **Daily**: 매일 오전 9시 KST (`cron(0 0 * * ? *)`)
- **Weekly**: 매주 월요일 9시 (`cron(0 0 ? * MON *)`)
- **Monthly**: 매월 1일 9시 (`cron(0 0 1 * ? *)`)

**기능**:
- RDS에서 판매자별 주문 데이터 조회
- 정산 금액 계산 (판매액 - 수수료)
- CSV 및 HTML 리포트 생성
- S3에 저장
- 이메일 발송 (SQS)

**기술 스택**:
- Node.js 20
- MySQL2 (RDS 연결)
- AWS SDK (S3, SQS, Secrets Manager)

**리소스**:
- Memory: 512 MB
- Timeout: 300초 (5분)
- VPC: Private Subnets

**리포트 저장 경로**:
```
s3://openmarket-{env}-reports/
└── settlements/
    ├── daily/2023-11-15/
    │   ├── seller-123.csv
    │   └── seller-123.html
    ├── weekly/2023-11-13/
    └── monthly/2023-11-01/
```

**IAM 권한**:
- `secretsmanager:GetSecretValue` - DB 자격증명
- `s3:PutObject` - 리포트 저장
- `sqs:SendMessage` - 이메일 발송 요청
- `ec2:CreateNetworkInterface` - VPC 액세스

**비용 예측** (100명 판매자, 월간):
- Lambda: ~$6.40/월
- S3 PUT: ~$0.01/월
- **총**: ~$6.41/월

---

### 4. Webhook Handler

**목적**: 외부 서비스(결제, 배송)의 웹훅 처리

**트리거**: Lambda Function URL (API Gateway 대체)

**웹훅 타입**:
1. **Payment**: 결제 완료/실패 (Toss, KakaoPay 등)
2. **Shipping**: 배송 상태 업데이트 (CJ대한통운 등)
3. **Refund**: 환불 처리

**엔드포인트**:
```
POST /webhooks/payment
POST /webhooks/shipping
POST /webhooks/refund
```

**기능**:
- HMAC 서명 검증 (보안)
- RDS 주문 상태 업데이트
- 이메일 알림 발송 (SQS)

**기술 스택**:
- Node.js 20
- MySQL2 (RDS)
- crypto (서명 검증)

**리소스**:
- Memory: 512 MB
- Timeout: 30초
- VPC: Private Subnets

**페이로드 예시 (결제)**:
```json
{
  "type": "payment",
  "orderId": 123,
  "status": "completed",
  "transactionId": "TXN-001",
  "amount": 58000
}
```

**IAM 권한**:
- `secretsmanager:GetSecretValue` - DB 자격증명
- `sqs:SendMessage` - 이메일 발송
- `ec2:CreateNetworkInterface` - VPC 액세스

**비용 예측** (월 50,000개 웹훅):
- Lambda: ~$2.04/월
- **총**: ~$2.04/월

---

## Terraform 모듈 구성

### 리소스 생성

`infrastructure/terraform/modules/lambda/`에 다음 리소스를 정의:

1. **Lambda Functions** (4개)
2. **IAM Roles & Policies** (4개)
3. **CloudWatch Log Groups** (4개)
4. **S3 Event Notification** (Image Processor)
5. **SQS Event Source Mapping** (Email Sender)
6. **EventBridge Rules** (Settlement Report - 3개)
7. **Lambda Function URL** (Webhook Handler)

### 환경별 구성

| 리소스 | Dev | Prod |
|--------|-----|------|
| Image Processor Memory | 1024 MB | 1024 MB |
| Email Sender Batch | 10 | 10 |
| Settlement Timeout | 300s | 300s |
| Log Retention | 7 days | 30 days |

## 배포 프로세스

### Step 1: Lambda 함수 패키징

```bash
# Image Processor
cd lambda/image-processor
npm install
zip -r function.zip index.js node_modules/ package.json

# Email Sender
cd ../email-sender
npm install
zip -r function.zip index.js node_modules/ package.json

# Settlement Report
cd ../settlement-report
npm install
zip -r function.zip index.js node_modules/ package.json

# Webhook Handler
cd ../webhook-handler
npm install
zip -r function.zip index.js node_modules/ package.json
```

### Step 2: Terraform 변수 설정

`environments/dev/terraform.tfvars`:
```hcl
# Lambda ZIP 파일 경로
image_processor_zip = "../../../lambda/image-processor/function.zip"
email_sender_zip = "../../../lambda/email-sender/function.zip"
settlement_report_zip = "../../../lambda/settlement-report/function.zip"
webhook_handler_zip = "../../../lambda/webhook-handler/function.zip"
```

### Step 3: Terraform 배포

```bash
cd infrastructure/terraform/environments/dev

# Lambda 모듈만 배포
terraform apply -target=module.lambda

# 또는 전체 배포
terraform apply
```

### Step 4: 배포 확인

```bash
# Lambda 함수 목록
aws lambda list-functions --profile openmarket | grep openmarket-dev

# 함수 상세 정보
aws lambda get-function \
  --function-name openmarket-dev-image-processor \
  --profile openmarket

# 로그 확인
aws logs tail /aws/lambda/openmarket-dev-image-processor --follow \
  --profile openmarket
```

## 통합 테스트

### 1. Image Processor 테스트

```bash
# S3에 이미지 업로드
aws s3 cp test-image.jpg \
  s3://openmarket-dev-uploads/uploads/products/test-image.jpg \
  --profile openmarket

# 처리된 이미지 확인
aws s3 ls s3://openmarket-dev-uploads/uploads/products/processed/ \
  --recursive \
  --profile openmarket
```

### 2. Email Sender 테스트

```bash
# SQS 메시지 전송
aws sqs send-message \
  --queue-url https://sqs.ap-northeast-2.amazonaws.com/478266318018/openmarket-dev-email-queue \
  --message-body '{
    "template": "ORDER_CONFIRMATION",
    "toEmail": "test@example.com",
    "data": {
      "customerName": "테스트",
      "orderNumber": "TEST-001"
    }
  }' \
  --profile openmarket
```

### 3. Settlement Report 테스트

```bash
# Lambda 수동 실행
aws lambda invoke \
  --function-name openmarket-dev-settlement-report \
  --payload '{"reportType":"daily","sellerId":1}' \
  --profile openmarket \
  response.json

cat response.json
```

### 4. Webhook Handler 테스트

```bash
# Function URL로 POST 요청
curl -X POST {FUNCTION_URL} \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "orderId": 1,
    "status": "completed",
    "amount": 10000
  }'
```

## 모니터링 및 알람

### CloudWatch 메트릭

각 Lambda Function의 주요 메트릭:
- **Invocations**: 호출 횟수
- **Duration**: 실행 시간
- **Errors**: 에러 발생 횟수
- **Throttles**: 제한 횟수
- **Concurrent Executions**: 동시 실행 수

### CloudWatch 알람 설정

```bash
# Lambda 에러율 > 5% 알람
aws cloudwatch put-metric-alarm \
  --alarm-name lambda-high-error-rate \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --period 300 \
  --statistic Sum \
  --threshold 5 \
  --dimensions Name=FunctionName,Value=openmarket-dev-image-processor \
  --profile openmarket
```

## 비용 최적화

### 총 예상 비용 (월간)

| Lambda Function | 호출 수 | 실행 시간 | 비용 |
|----------------|---------|----------|------|
| Image Processor | 10,000 | 3s | $0.75 |
| Email Sender | 100,000 | 2s | $2.40 |
| Settlement Report | 3,000 | 30s | $6.40 |
| Webhook Handler | 50,000 | 1s | $2.04 |
| **총계** | **163,000** | - | **~$11.59/월** |

추가 비용:
- SES: ~$10/월
- S3: ~$0.50/월
- SQS: ~$0.40/월

**Phase 4 총 비용**: ~$22.49/월

### 최적화 팁

1. **메모리 최적화**: Lambda Power Tuning 사용
2. **예약된 동시성**: Production에서만 사용
3. **배치 크기**: SQS 배치 크기 증가 (10 → 100)
4. **로그 보존**: Dev는 7일, Prod는 30일
5. **Cold Start 최소화**: Provisioned Concurrency 고려

## 보안

### 1. 네트워크 보안

- Settlement Report, Webhook Handler는 VPC 내에서 실행
- Private Subnet에 배치
- RDS Security Group이 Lambda SG 허용

### 2. IAM 최소 권한

각 Lambda는 필요한 권한만 부여:
- Image Processor: S3만
- Email Sender: SES + SQS만
- Settlement Report: Secrets Manager + S3 + SQS
- Webhook Handler: Secrets Manager + SQS

### 3. Secrets 관리

- DB 자격증명: AWS Secrets Manager
- Webhook Secret: 환경 변수 (암호화)

### 4. 서명 검증

Webhook Handler에서 HMAC SHA256 서명 검증

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                       Lambda Functions                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐
│  S3 Upload  │
│  (Images)   │
└──────┬──────┘
       │ S3 Event
       ▼
┌─────────────────┐
│ Image Processor │ ──────► S3 (processed/)
│   (1024 MB)     │
└─────────────────┘

┌─────────────┐
│ Backend API │
│  (Orders)   │
└──────┬──────┘
       │ SQS Message
       ▼
┌─────────────────┐
│  Email Sender   │ ──────► SES ──────► Customer
│    (256 MB)     │
└─────────────────┘

┌─────────────────┐
│  EventBridge    │
│ (Cron Schedule) │
└──────┬──────────┘
       │ Daily/Weekly/Monthly
       ▼
┌─────────────────┐
│ Settlement      │ ──────► S3 (reports/)
│   Report        │ ──────► SQS ──────► Seller Email
│   (512 MB)      │
│   (VPC)         │ ──────► RDS (Query)
└─────────────────┘

┌─────────────┐
│ External    │
│ Services    │
│ (Payment)   │
└──────┬──────┘
       │ HTTPS POST
       ▼
┌─────────────────┐
│  Webhook        │ ──────► RDS (Update)
│  Handler        │ ──────► SQS ──────► Email
│  (512 MB)       │
│  (VPC)          │
└─────────────────┘
```

## 다음 단계 (Phase 5)

1. ⏭️ **CI/CD 파이프라인**
   - GitHub Actions 워크플로우
   - 자동 빌드 및 배포
   - Blue-Green 배포

2. ⏭️ **모니터링 강화**
   - X-Ray 트레이싱
   - CloudWatch Insights
   - 커스텀 메트릭

3. ⏭️ **추가 Lambda Functions**
   - Notification Service (Push, SMS)
   - Data Export Service
   - Analytics Processor

## 참고 자료

- [AWS Lambda 공식 문서](https://docs.aws.amazon.com/lambda/)
- [AWS EventBridge 문서](https://docs.aws.amazon.com/eventbridge/)
- [AWS SES 문서](https://docs.aws.amazon.com/ses/)
- [Sharp 이미지 라이브러리](https://sharp.pixelplumbing.com/)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

## 요약

Phase 4에서 완성한 것:
- ✅ **4개 Lambda Functions** 구현 및 문서화
  1. Image Processor (이미지 자동 리사이징)
  2. Email Sender (비동기 이메일 발송)
  3. Settlement Report (판매자 정산)
  4. Webhook Handler (외부 웹훅 처리)
- ✅ **Terraform Lambda 모듈** 작성
  - IAM Roles & Policies
  - CloudWatch Log Groups
  - EventBridge Rules
  - S3/SQS Triggers
- ✅ **완전한 문서화**
  - 각 Lambda별 README
  - 배포 가이드
  - 테스트 가이드
  - 트러블슈팅

**Phase 4 완료!** 🎉

서버리스 아키텍처가 구축되어 확장성과 비용 효율성이 극대화되었습니다!
