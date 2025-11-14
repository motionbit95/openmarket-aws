# Settlement Report Lambda Function

판매자별 정산 리포트를 자동으로 생성하고 이메일로 발송하는 Lambda Function입니다.

## 기능

- **자동 정산 계산**: 판매 금액, 수수료, 순 정산 금액 계산
- **리포트 생성**: CSV 및 HTML 형식의 리포트 생성
- **S3 저장**: 생성된 리포트를 S3에 저장
- **이메일 발송**: SQS를 통해 이메일 발송 요청
- **스케줄 실행**: EventBridge로 정기적 실행

## 리포트 유형

| 유형 | 실행 주기 | 기간 | Cron 표현식 |
|------|-----------|------|-------------|
| Daily | 매일 오전 9시 | 전일 | `0 0 * * ? *` |
| Weekly | 매주 월요일 9시 | 지난 7일 | `0 0 ? * MON *` |
| Monthly | 매월 1일 9시 | 지난 달 | `0 0 1 * ? *` |

## Trigger

- **Type**: EventBridge (CloudWatch Events)
- **Schedule**: Cron expression
- **Input**: Event payload

## EventBridge 입력 형식

### 전체 판매자 리포트 (스케줄)
```json
{
  "reportType": "daily"
}
```

### 특정 판매자 리포트 (수동)
```json
{
  "reportType": "monthly",
  "sellerId": 123
}
```

## 정산 로직

```javascript
총 판매 금액 = Σ(주문 금액)
총 수수료 = Σ(주문 금액 × 수수료율)
정산 금액 = 총 판매 금액 - 총 수수료
```

## 출력 파일

### CSV 파일
```csv
주문번호,주문일시,상품명,수량,단가,판매금액,수수료율(%),수수료,정산금액
ORD-001,2023-11-15 14:30,상품A,2,10000,20000,10,2000,18000
```

### HTML 파일
- 판매자 정보
- 요약 (주문 건수, 판매 금액, 수수료, 정산 금액)
- 주문 상세 테이블

## S3 저장 경로

```
s3://openmarket-{env}-reports/
└── settlements/
    ├── daily/
    │   └── 2023-11-15/
    │       ├── seller-123.csv
    │       └── seller-123.html
    ├── weekly/
    │   └── 2023-11-13/
    │       └── ...
    └── monthly/
        └── 2023-11-01/
            └── ...
```

## 환경 변수

| 변수 | 설명 | 필수 | 기본값 |
|------|------|------|--------|
| AWS_REGION | AWS 리전 | No | ap-northeast-2 |
| DB_SECRET_NAME | DB Credentials Secret | Yes | openmarket-dev-rds-credentials |
| DB_NAME | 데이터베이스 이름 | No | openmarket_dev |
| REPORTS_BUCKET | 리포트 저장 S3 버킷 | No | openmarket-dev-reports |
| EMAIL_QUEUE_URL | 이메일 SQS URL | Yes | - |

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
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::openmarket-*-reports/*"
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

## VPC 구성

Lambda가 RDS에 접근하려면 VPC 내에서 실행되어야 합니다:

- **VPC**: openmarket-dev-vpc
- **Subnets**: Private subnets (10.0.10.0/24, 10.0.11.0/24)
- **Security Group**: Lambda SG (RDS SG에 3306 포트 허용)

## EventBridge 설정

### Daily Report (매일 오전 9시)
```bash
aws events put-rule \
  --name openmarket-daily-settlement \
  --schedule-expression "cron(0 0 * * ? *)" \
  --state ENABLED \
  --profile openmarket

aws events put-targets \
  --rule openmarket-daily-settlement \
  --targets "Id"="1","Arn"="arn:aws:lambda:ap-northeast-2:478266318018:function:openmarket-dev-settlement-report","Input"='{"reportType":"daily"}' \
  --profile openmarket
```

### Weekly Report (매주 월요일 오전 9시)
```bash
aws events put-rule \
  --name openmarket-weekly-settlement \
  --schedule-expression "cron(0 0 ? * MON *)" \
  --state ENABLED \
  --profile openmarket
```

### Monthly Report (매월 1일 오전 9시)
```bash
aws events put-rule \
  --name openmarket-monthly-settlement \
  --schedule-expression "cron(0 0 1 * ? *)" \
  --state ENABLED \
  --profile openmarket
```

## 배포

### 1. 의존성 설치
```bash
cd lambda/settlement-report
npm install
```

### 2. 패키지 생성
```bash
zip -r function.zip index.js node_modules/ package.json
```

### 3. Lambda 업로드
```bash
aws lambda update-function-code \
  --function-name openmarket-dev-settlement-report \
  --zip-file fileb://function.zip \
  --profile openmarket
```

## 테스트

### 수동 실행
```bash
aws lambda invoke \
  --function-name openmarket-dev-settlement-report \
  --payload '{"reportType":"daily","sellerId":1}' \
  --profile openmarket \
  response.json

cat response.json
```

### 특정 기간 테스트
```javascript
// Lambda 콘솔에서 테스트
{
  "reportType": "custom",
  "sellerId": 1,
  "startDate": "2023-11-01",
  "endDate": "2023-11-15"
}
```

## 모니터링

### CloudWatch Logs
```bash
aws logs tail /aws/lambda/openmarket-dev-settlement-report --follow \
  --profile openmarket
```

### 메트릭
- **Invocations**: 실행 횟수
- **Duration**: 실행 시간 (DB 쿼리 시간 포함)
- **Errors**: 에러 발생 횟수
- **Generated Reports**: 생성된 리포트 수 (Custom Metric)

### CloudWatch 알람
```bash
# 리포트 생성 실패 알람
aws cloudwatch put-metric-alarm \
  --alarm-name settlement-report-errors \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --period 300 \
  --statistic Sum \
  --threshold 0 \
  --dimensions Name=FunctionName,Value=openmarket-dev-settlement-report \
  --profile openmarket
```

## 에러 처리

### DB 연결 실패
- **Retry**: Lambda 자동 재시도 2회
- **Fallback**: CloudWatch Logs에 에러 기록

### S3 업로드 실패
- **Retry**: AWS SDK 자동 재시도
- **Alternative**: 로컬에 저장 후 수동 업로드

### 판매자 데이터 없음
- **Skip**: 해당 판매자 스킵, 다음 판매자 처리

## 성능 최적화

- **메모리**: 512 MB (DB 연결 및 리포트 생성)
- **타임아웃**: 300초 (5분)
- **동시 실행**: 5 (DB 연결 풀 제한)
- **예약된 동시성**: 2 (스케줄 실행용)
- **Connection Pooling**: MySQL2 connection pool 사용

## 비용 추정

### 가정
- 판매자 수: 100명
- Daily report 실행: 매일 1회
- 평균 실행 시간: 30초/판매자

### 비용
- **Lambda 호출**: $0.60/월
- **Lambda 실행**: $6.00/월 (100 sellers × 30s × 30 days)
- **S3 PUT**: $0.01/월
- **SQS**: $0.10/월
- **총**: ~$6.71/월

## 데이터베이스 스키마

### 필요한 테이블
```sql
-- 주문 테이블
CREATE TABLE orders (
  id INT PRIMARY KEY,
  order_number VARCHAR(50),
  total_amount DECIMAL(10,2),
  status VARCHAR(20),
  created_at TIMESTAMP
);

-- 주문 아이템 테이블
CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT,
  product_id INT,
  product_name VARCHAR(200),
  quantity INT,
  price DECIMAL(10,2),
  total_price DECIMAL(10,2)
);

-- 상품 테이블
CREATE TABLE products (
  id INT PRIMARY KEY,
  seller_id INT,
  commission_rate DECIMAL(5,2)
);

-- 판매자 테이블
CREATE TABLE sellers (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(200),
  business_name VARCHAR(200),
  business_number VARCHAR(50),
  status VARCHAR(20)
);
```

## 개선 사항

향후 추가 기능:
- [ ] PDF 리포트 생성 (jsPDF)
- [ ] 엑셀 리포트 (xlsx)
- [ ] 그래프 및 차트 포함
- [ ] 멀티 통화 지원
- [ ] 세금 계산 포함
- [ ] DynamoDB에 리포트 메타데이터 저장
- [ ] 리포트 다운로드 대시보드
- [ ] Slack/Discord 알림
