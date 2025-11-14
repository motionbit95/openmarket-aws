# 🔧 AWS 계정 및 환경 설정 가이드

**Phase 2 시작 전 필수 작업**

## 📋 사전 요구사항

### 1. AWS 계정
- [ ] AWS 계정 생성 (https://aws.amazon.com)
- [ ] 결제 정보 등록
- [ ] 루트 계정 MFA 활성화

### 2. 필수 도구 설치

#### Terraform 설치
```bash
# macOS (Homebrew)
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# 버전 확인
terraform version
# Required: v1.5.0 이상
```

#### AWS CLI 설치
```bash
# macOS
brew install awscli

# 버전 확인
aws --version
# Required: AWS CLI 2.0 이상
```

#### kubectl 설치
```bash
# macOS
brew install kubectl

# 버전 확인
kubectl version --client
```

## 🔐 AWS IAM 사용자 생성

### Step 1: IAM 사용자 생성

1. AWS Console 로그인
2. IAM 서비스로 이동
3. **Users** → **Add users**

**사용자 정보:**
```
User name: terraform-admin
Access type: ☑ Programmatic access
```

### Step 2: 권한 설정

**옵션 1: 관리자 권한 (개발 환경)**
```
Attach existing policies directly:
☑ AdministratorAccess
```

**옵션 2: 최소 권한 (프로덕션 권장)**
```
필요한 권한:
- AmazonEC2FullAccess
- AmazonEKSClusterPolicy
- AmazonEKSWorkerNodePolicy
- AmazonRDSFullAccess
- AmazonElastiCacheFullAccess
- AmazonS3FullAccess
- CloudFrontFullAccess
- IAMFullAccess
- AmazonVPCFullAccess
```

### Step 3: Access Key 저장

**중요: Access Key는 한 번만 표시됩니다!**

```
Access key ID: AKIA...
Secret access key: wJalrXUtnFEMI/K7MDENG/...
```

**안전하게 저장:**
```bash
# ~/.aws/credentials 파일에 저장
mkdir -p ~/.aws
cat > ~/.aws/credentials << 'EOF'
[openmarket]
aws_access_key_id = YOUR_ACCESS_KEY_ID
aws_secret_access_key = YOUR_SECRET_ACCESS_KEY
EOF

# ~/.aws/config 파일 생성
cat > ~/.aws/config << 'EOF'
[profile openmarket]
region = ap-northeast-2
output = json
EOF
```

## 🌏 AWS CLI 설정

### 기본 설정
```bash
# AWS CLI 구성
aws configure --profile openmarket

# 입력 정보:
AWS Access Key ID [None]: YOUR_ACCESS_KEY_ID
AWS Secret Access Key [None]: YOUR_SECRET_ACCESS_KEY
Default region name [None]: ap-northeast-2
Default output format [None]: json
```

### 설정 확인
```bash
# 프로필 확인
aws sts get-caller-identity --profile openmarket

# 출력 예시:
{
    "UserId": "AIDAI...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/terraform-admin"
}
```

### 환경 변수 설정 (선택사항)
```bash
# ~/.zshrc 또는 ~/.bashrc에 추가
export AWS_PROFILE=openmarket
export AWS_REGION=ap-northeast-2

# 적용
source ~/.zshrc
```

## 📊 비용 알림 설정

### CloudWatch Billing Alarm 생성

**예산 초과 방지:**

1. **Billing Dashboard** → **Budgets**
2. **Create budget**

```yaml
Budget details:
  Name: openmarket-monthly-budget
  Period: Monthly
  Budgeted amount: $50 (또는 예상 비용)

Alert threshold:
  Alert when: Actual
  Threshold: 80% of budgeted amount
  Email: your-email@example.com
```

### 권장 예산 (월간)

```
개발 환경 (dev):
  EKS: $73
  EC2: $50-100
  RDS: $50-100
  Others: $50
  Total: ~$200-300/월

스테이징 (staging):
  Total: ~$400-500/월

프로덕션 (prod):
  Total: ~$1,000-1,500/월
```

## 🗂️ Terraform Backend 설정 (State 관리)

### S3 버킷 생성 (Terraform State 저장용)

```bash
# S3 버킷 생성
aws s3 mb s3://openmarket-terraform-state \
  --region ap-northeast-2 \
  --profile openmarket

# 버저닝 활성화
aws s3api put-bucket-versioning \
  --bucket openmarket-terraform-state \
  --versioning-configuration Status=Enabled \
  --profile openmarket

# 암호화 활성화
aws s3api put-bucket-encryption \
  --bucket openmarket-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }' \
  --profile openmarket
```

### DynamoDB 테이블 생성 (State Lock용)

```bash
aws dynamodb create-table \
  --table-name openmarket-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-2 \
  --profile openmarket
```

## ✅ 사전 체크리스트

배포 전에 모든 항목을 확인하세요:

### AWS 계정
- [ ] AWS 계정 생성 완료
- [ ] 루트 계정 MFA 활성화
- [ ] IAM 사용자 생성 (terraform-admin)
- [ ] Access Key 생성 및 안전하게 저장
- [ ] 비용 알림 설정

### 도구 설치
- [ ] Terraform 설치 확인 (`terraform version`)
- [ ] AWS CLI 설치 확인 (`aws --version`)
- [ ] kubectl 설치 확인 (`kubectl version`)

### AWS 설정
- [ ] AWS CLI 프로필 구성 (`~/.aws/credentials`)
- [ ] 기본 리전 설정 (ap-northeast-2)
- [ ] 계정 확인 (`aws sts get-caller-identity`)

### Terraform Backend
- [ ] S3 버킷 생성 (terraform state)
- [ ] S3 버저닝 활성화
- [ ] DynamoDB 테이블 생성 (state lock)

### 비용 관리
- [ ] 예산 설정
- [ ] 비용 알림 이메일 등록
- [ ] Billing Dashboard 확인 방법 숙지

## 🔒 보안 Best Practices

### 1. Access Key 보안
```bash
# NEVER commit to Git
echo ".aws/" >> ~/.gitignore
echo "*.pem" >> ~/.gitignore
echo "terraform.tfvars" >> ~/.gitignore

# 권한 설정
chmod 600 ~/.aws/credentials
chmod 600 ~/.aws/config
```

### 2. MFA 활성화
```bash
# IAM 사용자에 MFA 디바이스 추가
# AWS Console → IAM → Users → Security credentials → MFA
```

### 3. 정기적인 Access Key 교체
```bash
# 90일마다 교체 권장
# AWS Console → IAM → Users → Security credentials → Access keys
```

## 🧪 연결 테스트

### AWS 연결 확인
```bash
# 1. 계정 정보 확인
aws sts get-caller-identity --profile openmarket

# 2. S3 목록 확인
aws s3 ls --profile openmarket

# 3. EC2 리전 확인
aws ec2 describe-regions --profile openmarket

# 4. VPC 목록 (빈 목록이어야 함)
aws ec2 describe-vpcs --profile openmarket
```

### Terraform 초기화 테스트
```bash
cd infrastructure/terraform/environments/dev

# Terraform 초기화
terraform init

# 예상 출력:
# Initializing the backend...
# Terraform has been successfully initialized!
```

## 📚 참고 문서

- [AWS CLI 설치](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [Terraform 설치](https://developer.hashicorp.com/terraform/downloads)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## ⚠️ 주의사항

### 비용 발생 알림
```
⚠️ 다음 리소스는 비용이 발생합니다:

시간당 과금:
- EKS Control Plane: $0.10/시간 (~$73/월)
- EC2 Instances: $0.052/시간부터
- NAT Gateway: $0.059/시간 (~$43/월)
- RDS Aurora: $0.082/시간부터
- ElastiCache: $0.034/시간부터

월간 과금:
- S3 Storage: $0.025/GB
- CloudFront: 트래픽량에 따라

💡 비용 절감 팁:
- 개발 환경은 사용 후 중지
- Reserved Instances 고려 (프로덕션)
- Spot Instances 활용 (개발/테스트)
```

### 삭제 시 주의
```bash
# 리소스 삭제 전 반드시 확인
terraform plan -destroy

# 실수로 삭제 방지
# 중요 리소스에 lifecycle 설정:
lifecycle {
  prevent_destroy = true
}
```

## 🆘 문제 해결

### Access Denied 에러
```bash
# 권한 확인
aws iam get-user --profile openmarket
aws iam list-attached-user-policies --user-name terraform-admin
```

### 잘못된 리전
```bash
# 리전 변경
aws configure set region ap-northeast-2 --profile openmarket
```

### Terraform State Lock 에러
```bash
# DynamoDB 테이블 확인
aws dynamodb describe-table \
  --table-name openmarket-terraform-locks \
  --profile openmarket
```

## ✅ 설정 완료 확인

모든 설정이 완료되었다면:

```bash
# 최종 확인 스크립트
cd infrastructure/terraform/environments/dev

# 1. AWS 연결
echo "1. Testing AWS connection..."
aws sts get-caller-identity --profile openmarket

# 2. S3 Backend
echo "2. Checking S3 backend..."
aws s3 ls openmarket-terraform-state --profile openmarket

# 3. DynamoDB Lock
echo "3. Checking DynamoDB lock table..."
aws dynamodb describe-table \
  --table-name openmarket-terraform-locks \
  --profile openmarket \
  --query 'Table.TableName'

echo "✅ All checks passed! Ready for Terraform deployment."
```

---

**다음 단계**: Terraform 코드 작성 시작!

Terraform 모듈부터 차근차근 작성하겠습니다.
