# 🎉 Phase 2 완료 보고서 - AWS 인프라 구축

**날짜**: 2025년 11월 14일
**단계**: Phase 2 - AWS Infrastructure as Code
**상태**: ✅ 완료 (코드 작성)

## 📋 완료된 작업

### 1. Terraform 프로젝트 구조 ✅

```
infrastructure/terraform/
├── versions.tf                 # Provider 버전 정의
├── variables.tf                # 전역 변수
├── outputs.tf                  # 전역 출력
│
├── modules/                    # 재사용 가능한 모듈
│   ├── vpc/                    # VPC 및 네트워킹
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── security/               # Security Groups
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── eks/                    # EKS 클러스터
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── rds/                    # RDS Aurora MySQL
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── elasticache/            # ElastiCache Redis
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── s3/                     # S3 & CloudFront
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
└── environments/               # 환경별 설정
    └── dev/                    # 개발 환경
        ├── main.tf             # 모듈 호출
        ├── variables.tf        # 환경 변수
        ├── terraform.tfvars    # 실제 값
        └── outputs.tf          # 환경 출력
```

## 🏗️ 생성되는 AWS 리소스

### 1. VPC 모듈 (네트워킹)

**생성 리소스:**
- ✅ VPC (10.0.0.0/16)
- ✅ Internet Gateway
- ✅ NAT Gateway × 1 (개발 환경)
- ✅ Public Subnets × 3 (각 AZ)
- ✅ Private Subnets × 3 (EKS Nodes용)
- ✅ Database Subnets × 3 (RDS, Redis용)
- ✅ Route Tables 및 연결

**주요 기능:**
```hcl
# Public Subnet (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- Internet Gateway를 통한 인터넷 접근
- ALB, NAT Gateway 위치

# Private Subnet (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
- NAT Gateway를 통한 아웃바운드 접근
- EKS Worker Nodes 위치

# Database Subnet (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24)
- 인터넷 접근 불가 (격리)
- RDS, ElastiCache 위치
```

### 2. Security Groups 모듈

**생성 리소스:**
- ✅ EKS Cluster Security Group
- ✅ EKS Nodes Security Group
- ✅ RDS Security Group (Port 3306)
- ✅ ElastiCache Security Group (Port 6379)
- ✅ ALB Security Group (Port 80, 443)

**보안 규칙:**
```
EKS Nodes → RDS (3306)           ✓ 허용
EKS Nodes → ElastiCache (6379)   ✓ 허용
Internet → ALB (80, 443)         ✓ 허용
ALB → EKS Nodes                  ✓ 허용
```

### 3. EKS 모듈 (Kubernetes)

**생성 리소스:**
- ✅ EKS Cluster (v1.28)
- ✅ EKS Node Group (t3.medium × 2~4)
- ✅ IAM Roles & Policies
- ✅ OIDC Provider (IRSA용)
- ✅ CloudWatch Log Groups

**설정:**
```yaml
Cluster Version: 1.28
Node Type: t3.medium
Min Nodes: 2
Max Nodes: 4
Desired Nodes: 2

Features:
- Auto Scaling ✓
- IRSA (IAM Roles for Service Accounts) ✓
- Cluster Logging ✓
- Private API Endpoint ✓
- Public API Endpoint ✓
```

### 4. RDS 모듈 (데이터베이스)

**생성 리소스:**
- ✅ Aurora MySQL Cluster (v8.0)
- ✅ Writer Instance × 1
- ✅ Reader Instance × 1
- ✅ DB Subnet Group
- ✅ Secrets Manager (비밀번호)
- ✅ CloudWatch Monitoring

**설정:**
```yaml
Engine: Aurora MySQL 8.0
Instance Class: db.t3.medium
Multi-AZ: ✓
Backup Retention: 3 days
Encryption: ✓
Enhanced Monitoring: ✓

Endpoints:
- Writer: openmarket-dev-aurora-cluster.cluster-xxx.ap-northeast-2.rds.amazonaws.com
- Reader: openmarket-dev-aurora-cluster.cluster-ro-xxx.ap-northeast-2.rds.amazonaws.com
```

### 5. ElastiCache 모듈 (Redis)

**생성 리소스:**
- ✅ Redis Replication Group
- ✅ Redis Subnet Group
- ✅ Parameter Group
- ✅ Secrets Manager (Auth Token)
- ✅ Automatic Failover (Multi-AZ)

**설정:**
```yaml
Engine: Redis 7.0
Node Type: cache.t3.micro
Nodes: 1 (개발 환경)
Encryption:
  - At-rest: ✓
  - In-transit: ✓
  - Auth Token: ✓

Features:
- Automatic Failover: ✗ (단일 노드)
- Backup: ✓
```

### 6. S3 & CloudFront 모듈

**생성 리소스:**
- ✅ S3 Bucket (static-assets)
- ✅ S3 Bucket (user-uploads)
- ✅ S3 Bucket (backups)
- ✅ CloudFront Distribution
- ✅ Origin Access Identity

**설정:**
```yaml
S3 Buckets:
1. static-assets:
   - Versioning: ✓
   - Encryption: AES256
   - Public Access: ✗ (CloudFront만 접근)

2. user-uploads:
   - Versioning: ✓
   - Encryption: AES256
   - CORS: ✓
   - Public Access: ✗

3. backups:
   - Lifecycle: 90일 후 삭제
   - Versioning: ✓

CloudFront:
- SSL: CloudFront 기본 인증서
- Caching: ✓
- Compression: ✓
```

## 💰 예상 비용 (개발 환경 - 월간)

```
리소스                    수량        단가              월간 비용
============================================================
EKS Control Plane        1개      $0.10/시간         $73
EC2 (t3.medium)         2개      $0.042/시간        $61
NAT Gateway             1개      $0.059/시간        $43
RDS (db.t3.medium)      2개      $0.082/시간        $119
ElastiCache (t3.micro)  1개      $0.017/시간        $12
S3 Storage              50GB     $0.025/GB          $1.25
CloudFront              50GB     $0.085/GB          $4.25
Data Transfer           100GB    $0.09/GB           $9
============================================================
                                  총 예상 비용:      ~$322/월
```

## 📊 Terraform 변수 설명

### 환경별 차이점

#### Development (개발)
```hcl
vpc_cidr           = "10.0.0.0/16"
single_nat_gateway = true              # 비용 절감
eks_node_groups = {
  general = {
    instance_types = ["t3.medium"]
    min_size       = 2
    max_size       = 4
    desired_size   = 2
  }
}
rds_instance_class          = "db.t3.medium"
rds_backup_retention_period = 3
elasticache_node_type       = "cache.t3.micro"
elasticache_num_cache_nodes = 1
enable_deletion_protection  = false
enable_monitoring           = false
```

#### Production (프로덕션 - 참고용)
```hcl
vpc_cidr           = "10.0.0.0/16"
single_nat_gateway = false            # 고가용성
eks_node_groups = {
  general = {
    instance_types = ["t3.large"]
    min_size       = 3
    max_size       = 10
    desired_size   = 3
  }
}
rds_instance_class          = "db.r6g.large"
rds_backup_retention_period = 7
elasticache_node_type       = "cache.r6g.large"
elasticache_num_cache_nodes = 2
enable_deletion_protection  = true
enable_monitoring           = true
```

## 🚀 배포 가이드

### 사전 준비

**1. AWS 계정 설정**
```bash
# IAM 사용자 생성
# Access Key 발급
# ~/.aws/credentials 설정

[openmarket]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

**2. S3 Backend 생성**
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

# DynamoDB 테이블 생성 (State Lock)
aws dynamodb create-table \
  --table-name openmarket-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-2 \
  --profile openmarket
```

### Terraform 실행

**1. 초기화**
```bash
cd infrastructure/terraform/environments/dev

terraform init
```

**2. 계획 확인**
```bash
terraform plan

# 출력 예시:
Plan: 50+ to add, 0 to change, 0 to destroy
```

**3. 배포 실행**
```bash
terraform apply

# 확인 후 yes 입력
# 예상 시간: 15-20분
```

**4. 출력 확인**
```bash
terraform output

# 주요 출력:
# - vpc_id
# - eks_cluster_endpoint
# - rds_cluster_endpoint
# - redis_endpoint
# - cloudfront_domain_name
```

### kubectl 설정

```bash
# EKS 클러스터에 연결
aws eks update-kubeconfig \
  --region ap-northeast-2 \
  --name openmarket-dev-eks \
  --profile openmarket

# 확인
kubectl get nodes
```

## 📝 중요 출력값

배포 후 다음 정보를 확인하세요:

### 1. 데이터베이스 접속 정보
```bash
# RDS 엔드포인트
terraform output rds_cluster_endpoint

# Secrets Manager에서 비밀번호 조회
aws secretsmanager get-secret-value \
  --secret-id openmarket-dev-db-master-password \
  --profile openmarket \
  --query SecretString \
  --output text | jq
```

### 2. Redis 접속 정보
```bash
# Redis 엔드포인트
terraform output redis_endpoint

# Auth Token 조회
aws secretsmanager get-secret-value \
  --secret-id openmarket-dev-redis-auth-token \
  --profile openmarket \
  --query SecretString \
  --output text | jq
```

### 3. S3 버킷
```bash
terraform output static_assets_bucket
terraform output user_uploads_bucket
```

### 4. CloudFront URL
```bash
terraform output cloudfront_domain_name
```

## 🔒 보안 Best Practices

### 1. Secrets 관리
```
✓ RDS 비밀번호: Secrets Manager
✓ Redis Auth Token: Secrets Manager
✓ 자동 로테이션: 설정 권장
```

### 2. 네트워크 격리
```
✓ Private Subnets: EKS Nodes
✓ Database Subnets: RDS, Redis (격리)
✓ Security Groups: 최소 권한
```

### 3. 암호화
```
✓ RDS: At-rest encryption
✓ ElastiCache: At-rest + In-transit
✓ S3: AES256
✓ EBS: 자동 암호화
```

## 🧹 리소스 삭제

**주의: 프로덕션 환경에서는 절대 실행하지 마세요!**

```bash
cd infrastructure/terraform/environments/dev

# 삭제 계획 확인
terraform plan -destroy

# 실행
terraform destroy

# 확인 후 yes 입력
# 예상 시간: 10-15분
```

## 📚 모듈 설명

### VPC 모듈
**목적**: 네트워크 기반 구조 생성
**주요 리소스**: VPC, Subnets, NAT Gateway, Route Tables
**특징**:
- 3 AZ에 걸친 고가용성
- Public/Private/Database Subnet 분리
- EKS와 통합된 태깅

### Security Groups 모듈
**목적**: 네트워크 보안 규칙 정의
**주요 리소스**: Security Groups
**특징**:
- 최소 권한 원칙
- 명시적 허용 규칙만
- EKS, RDS, Redis 간 통신 허용

### EKS 모듈
**목적**: Kubernetes 클러스터 생성
**주요 리소스**: EKS Cluster, Node Groups, IAM Roles
**특징**:
- IRSA 지원
- Auto Scaling
- CloudWatch 로깅

### RDS 모듈
**목적**: 관리형 MySQL 데이터베이스
**주요 리소스**: Aurora Cluster, Instances, Secrets
**특징**:
- Multi-AZ 고가용성
- 자동 백업
- Secrets Manager 통합

### ElastiCache 모듈
**목적**: 관리형 Redis 캐시
**주요 리소스**: Redis Replication Group, Secrets
**특징**:
- 암호화 (at-rest, in-transit)
- Auth Token
- 자동 스냅샷

### S3 모듈
**목적**: 객체 스토리지 및 CDN
**주요 리소스**: S3 Buckets, CloudFront
**특징**:
- 버저닝
- 암호화
- CloudFront CDN

## ⚠️ 알려진 이슈

### 1. Aurora Serverless v2 미사용
**이유**: 비용 최적화
**해결**: 필요시 모듈 수정

### 2. 단일 NAT Gateway (개발)
**영향**: 고가용성 제한
**해결**: 프로덕션에서는 multi-nat 사용

### 3. CloudFront SSL
**현재**: CloudFront 기본 인증서
**개선**: ACM 인증서 + 사용자 도메인

## 📈 다음 단계: Phase 3

### Phase 3: Kubernetes 배포 (예상 2주)

#### 준비 사항
- [ ] Phase 2 리소스 배포 완료
- [ ] kubectl 설치 및 설정
- [ ] Helm 설치

#### 주요 작업
1. **Kubernetes Manifests**
   - Deployment (API 서비스)
   - Service (ClusterIP, LoadBalancer)
   - ConfigMap (환경 설정)
   - Secrets (자격증명)
   - HPA (Auto Scaling)
   - Ingress (라우팅)

2. **Helm Charts**
   - Backend API Chart
   - 환경별 Values 파일

3. **배포 테스트**
   - kubectl apply
   - 서비스 동작 확인
   - Load Testing

## ✅ Phase 2 체크리스트

- [x] Terraform 프로젝트 구조 생성
- [x] VPC 모듈 작성
- [x] Security Groups 모듈 작성
- [x] EKS 모듈 작성
- [x] RDS 모듈 작성
- [x] ElastiCache 모듈 작성
- [x] S3 & CloudFront 모듈 작성
- [x] Dev 환경 설정
- [ ] 실제 AWS 배포 (사용자 작업)
- [ ] 배포 검증 (사용자 작업)

## 💡 유용한 명령어

### Terraform
```bash
# 포맷 정리
terraform fmt -recursive

# 유효성 검사
terraform validate

# 상태 확인
terraform state list

# 특정 리소스 정보
terraform state show module.vpc.aws_vpc.main

# 출력값 다시 보기
terraform output

# 특정 모듈만 적용
terraform apply -target=module.vpc
```

### AWS CLI
```bash
# EKS 클러스터 확인
aws eks list-clusters --region ap-northeast-2 --profile openmarket

# RDS 클러스터 확인
aws rds describe-db-clusters --region ap-northeast-2 --profile openmarket

# S3 버킷 목록
aws s3 ls --profile openmarket
```

---

## 🎓 학습 포인트

### Terraform Modules
- 재사용 가능한 코드 구조
- 입력 변수와 출력값
- 모듈 간 의존성 관리

### AWS 네트워킹
- VPC, Subnet, Route Table 관계
- NAT Gateway vs Internet Gateway
- Security Groups vs NACLs

### IaC Best Practices
- Remote State 관리 (S3 + DynamoDB)
- 환경별 분리 (dev, staging, prod)
- Secrets 관리 (Secrets Manager)

## 📞 지원

문제 발생 시:
1. Terraform 에러 메시지 확인
2. AWS CloudWatch 로그 확인
3. `terraform plan` 재실행

---

**작성일**: 2025-11-14
**작성자**: Claude Code
**프로젝트**: OpenMarket AWS
**다음**: Phase 3 - Kubernetes 배포
