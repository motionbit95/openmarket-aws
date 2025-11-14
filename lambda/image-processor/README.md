# Image Processor Lambda Function

S3에 이미지가 업로드되면 자동으로 여러 크기의 썸네일을 생성하는 Lambda Function입니다.

## 기능

- **자동 이미지 리사이징**: 업로드된 이미지를 4가지 크기로 자동 생성
- **효율적인 저장**: Sharp 라이브러리를 사용한 고성능 이미지 처리
- **무한 루프 방지**: 처리된 이미지는 재처리하지 않음
- **메타데이터 저장**: 원본 이미지 정보와 처리 시간 저장

## 이미지 크기

| 크기 | 해상도 | 용도 |
|------|--------|------|
| Large | 1200x1200 | 상품 상세 페이지 |
| Medium | 800x800 | 상품 목록 |
| Small | 400x400 | 카드 뷰 |
| Thumbnail | 200x200 | 썸네일, 미리보기 |

## Trigger

- **Type**: S3 Event
- **Event**: `s3:ObjectCreated:*`
- **Bucket**: `openmarket-{env}-uploads`
- **Prefix**: `uploads/`

## 처리 흐름

```
1. 사용자가 S3에 이미지 업로드
   ↓
2. S3 Event가 Lambda 트리거
   ↓
3. Lambda가 이미지 다운로드
   ↓
4. Sharp로 4가지 크기 생성
   ↓
5. processed/{size}/ 경로에 저장
```

## 디렉토리 구조

```
uploads/
├── products/
│   ├── product-123.jpg                 # 원본
│   └── processed/
│       ├── large/
│       │   └── product-123.jpg         # 1200x1200
│       ├── medium/
│       │   └── product-123.jpg         # 800x800
│       ├── small/
│       │   └── product-123.jpg         # 400x400
│       └── thumbnail/
│           └── product-123.jpg         # 200x200
```

## 환경 변수

이 Lambda는 환경 변수가 필요하지 않습니다. S3 이벤트에서 모든 정보를 가져옵니다.

## IAM 권한

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::openmarket-*-uploads/*"
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

## 배포

### 1. 의존성 설치
```bash
cd lambda/image-processor
npm install
```

### 2. 패키지 생성
```bash
zip -r function.zip index.js node_modules/ package.json
```

### 3. Lambda 업로드
```bash
aws lambda update-function-code \
  --function-name openmarket-dev-image-processor \
  --zip-file fileb://function.zip \
  --profile openmarket
```

## 테스트

### 로컬 테스트
```javascript
const event = {
  "Records": [{
    "s3": {
      "bucket": {
        "name": "openmarket-dev-uploads"
      },
      "object": {
        "key": "uploads/products/test-image.jpg"
      }
    }
  }]
};

// handler(event);
```

### S3 업로드 테스트
```bash
aws s3 cp test-image.jpg s3://openmarket-dev-uploads/uploads/products/ \
  --profile openmarket
```

## 모니터링

### CloudWatch Logs
```bash
aws logs tail /aws/lambda/openmarket-dev-image-processor --follow \
  --profile openmarket
```

### 메트릭
- **Invocations**: 호출 횟수
- **Duration**: 실행 시간
- **Errors**: 에러 발생 횟수
- **Throttles**: 제한 횟수

## 성능 최적화

- **메모리**: 1024 MB (Sharp 라이브러리는 메모리 집약적)
- **타임아웃**: 60초
- **동시 실행**: 10 (burst 처리)
- **예약된 동시성**: 없음 (비용 절감)

## 에러 처리

- **지원하지 않는 파일 형식**: 스킵
- **이미 처리된 이미지**: 스킵 (무한 루프 방지)
- **Sharp 에러**: 로그 기록 및 500 반환
- **S3 에러**: 재시도 (Lambda 자동 재시도 3회)

## 비용 추정

### 가정
- 월 10,000개 이미지 업로드
- 평균 이미지 크기: 2MB
- 평균 실행 시간: 3초
- 메모리: 1024 MB

### 비용
- **Lambda 호출**: $0.20/월
- **Lambda 실행**: $0.50/월
- **S3 PUT**: $0.05/월
- **총**: ~$0.75/월

## 개선 사항

향후 추가 기능:
- [ ] WebP 포맷 변환
- [ ] 메타데이터 추출 (EXIF)
- [ ] 이미지 최적화 (압축)
- [ ] 워터마크 추가
- [ ] DynamoDB에 메타데이터 저장
