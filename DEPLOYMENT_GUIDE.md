# 🚀 OpenMarket AWS 배포 가이드

> **완전한 처음부터 끝까지 배포 가이드**
>
> 이 문서는 OpenMarket을 AWS에 처음부터 배포하는 전체 과정을 단계별로 설명합니다.

---

## 📋 목차

1. [사전 요구사항](#-사전-요구사항)
2. [배포 순서 개요](#-배포-순서-개요)
3. [Step 1: AWS 계정 설정](#step-1-aws-계정-설정)
4. [Step 2: 인프라 배포 (Terraform)](#step-2-인프라-배포-terraform)
5. [Step 3: Docker 이미지 빌드](#step-3-docker-이미지-빌드)
6. [Step 4: Kubernetes 배포](#step-4-kubernetes-배포)
7. [Step 5: Lambda Functions 배포](#step-5-lambda-functions-배포)
8. [Step 6: 모니터링 스택 배포](#step-6-모니터링-스택-배포)
9. [Step 7: CI/CD 설정](#step-7-cicd-설정)
10. [검증 및 테스트](#-검증-및-테스트)
11. [트러블슈팅](#-트러블슈팅)

---

## ✅ 사전 요구사항

### 1. 로컬 환경 준비

#### 필수 소프트웨어
```bash
# macOS
brew install awscli terraform kubectl helm docker

# 버전 확인
aws --version        # >= 2.x
terraform --version  # >= 1.6.0
kubectl version      # >= 1.28
helm version         # >= 3.13
docker --version     # >= 20.10
```

#### AWS CLI 설정
```bash
# AWS 자격증명 설정
aws configure --profile openmarket

# 입력 정보:
# AWS Access Key ID: [YOUR_ACCESS_KEY]
# AWS Secret Access Key: [YOUR_SECRET_KEY]
# Default region name: ap-northeast-2
# Default output format: json

# 확인
aws sts get-caller-identity --profile openmarket
```

### 2. 소스 코드 준비

```bash
# 프로젝트 클론
cd /Users/krystal/project
git clone <your-repo-url> openmarket-aws
cd openmarket-aws

# 기존 코드 복사 (최초 1회)
cp -r ../openmarket-backend/* ./backend/
cp -r ../openmarket-client/* ./frontend-web/

# 환경 변수 파일 생성
cp .env.example .env
```

### 3. 비용 예상

| 환경 | 월간 예상 비용 | 설명 |
|------|---------------|------|
| Dev (8시간/일) | $313 | 야간/주말 종료 |
| Dev (24/7) | $455 | 24시간 운영 |
| Production | $800-1,000 | Reserved Instances 포함 |

---

## 📊 배포 순서 개요

```
┌─────────────────────────────────────────────────────┐
│ Phase 1: AWS 계정 설정 (30분)                        │
│  - IAM 사용자 생성                                   │
│  - 정책 연결                                         │
│  - Access Key 생성                                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Phase 2: 인프라 배포 (60-90분)                       │
│  - VPC, Subnets, NAT Gateway                        │
│  - EKS Cluster (10-15분)                            │
│  - RDS Aurora MySQL (10-15분)                       │
│  - ElastiCache Redis                                │
│  - S3, ECR, Secrets Manager                         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Phase 3: EKS Add-ons 설치 (20-30분)                 │
│  - AWS Load Balancer Controller                     │
│  - EBS CSI Driver                                   │
│  - CoreDNS                                          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Phase 4: Docker 이미지 빌드 (20-30분)                │
│  - Backend 이미지 빌드 및 ECR 푸시                   │
│  - Frontend 이미지 빌드 및 ECR 푸시                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Phase 5: Kubernetes 배포 (30-40분)                   │
│  - Namespace 생성                                    │
│  - Secrets 생성                                      │
│  - Backend Deployment (3 pods)                      │
│  - Frontend Deployment (1 pod)                      │
│  - Database Migration                               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Phase 6: Lambda Functions 배포 (20-30분)            │
│  - Image Processor                                  │
│  - Email Sender                                     │
│  - Settlement Report                                │
│  - Webhook Handler                                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Phase 7: 모니터링 스택 배포 (15-20분)                │
│  - Prometheus + Grafana                             │
│  - Alertmanager + Slack                             │
│  - Node Exporter + Kube State Metrics               │
│  - Fluent Bit + CloudWatch Logs                     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Phase 8: CI/CD 설정 (30분)                           │
│  - GitHub Secrets 설정                               │
│  - GitHub Environments 생성                          │
│  - Workflows 테스트                                  │
└─────────────────────────────────────────────────────┘

총 소요 시간: 약 4-5시간
```

---

## Step 1: AWS 계정 설정

### 1.1 IAM 사용자 생성

```bash
# AWS Console → IAM → Users → Add users

User name: openmarket-deployer
Access type: [✓] Programmatic access
```

### 1.2 정책 연결

다음 정책들을 연결:
- `AdministratorAccess` (개발 환경용)

또는 최소 권한 정책:
- `AmazonEC2FullAccess`
- `AmazonEKSClusterPolicy`
- `AmazonEKSWorkerNodePolicy`
- `AmazonRDSFullAccess`
- `AmazonElastiCacheFullAccess`
- `AmazonS3FullAccess`
- `IAMFullAccess`
- `AmazonVPCFullAccess`

### 1.3 Access Key 다운로드

```bash
# Access Key ID와 Secret Access Key를 안전하게 저장
# ~/.aws/credentials에 저장됨

aws configure --profile openmarket
```

**소요 시간**: 30분

---

## Step 2: 인프라 배포 (Terraform)

### 2.1 Terraform 초기화

```bash
cd infrastructure/terraform/environments/dev

# Backend 설정 (S3)
# main.tf에서 backend 블록 확인

terraform init
```

### 2.2 인프라 Plan 확인

```bash
# Plan 실행 (변경 사항 확인)
terraform plan

# 예상 생성 리소스:
# - VPC + Subnets (6개)
# - NAT Gateway (2개)
# - EKS Cluster
# - EKS Node Group (2 nodes)
# - RDS Aurora MySQL (2 instances)
# - ElastiCache Redis
# - S3 Buckets (3개)
# - ECR Repositories (2개)
# - Secrets Manager
# - IAM Roles (10+)
# - Security Groups (5개)
```

### 2.3 인프라 배포

```bash
# Apply 실행
terraform apply

# 확인 프롬프트에서 'yes' 입력

# 예상 소요 시간: 60-90분
# - VPC 생성: 5분
# - EKS Cluster 생성: 10-15분
# - RDS Aurora 생성: 10-15분
# - 기타 리소스: 30-50분
```

### 2.4 Output 확인

```bash
# 배포 완료 후 Output 확인
terraform output

# 중요한 Output:
# - eks_cluster_endpoint
# - eks_cluster_name
# - rds_cluster_endpoint
# - elasticache_endpoint
# - ecr_repository_urls
```

### 2.5 kubectl 설정

```bash
# EKS 클러스터에 접근 설정
aws eks update-kubeconfig \
  --region ap-northeast-2 \
  --name openmarket-dev-eks \
  --profile openmarket

# 확인
kubectl get nodes

# 예상 출력:
# NAME                                            STATUS   ROLES    AGE   VERSION
# ip-10-0-1-xxx.ap-northeast-2.compute.internal   Ready    <none>   5m    v1.28.x
# ip-10-0-2-xxx.ap-northeast-2.compute.internal   Ready    <none>   5m    v1.28.x
```

**소요 시간**: 60-90분

---

## Step 3: Docker 이미지 빌드

### 3.1 ECR 로그인

```bash
# ECR 로그인
aws ecr get-login-password \
  --region ap-northeast-2 \
  --profile openmarket | \
docker login \
  --username AWS \
  --password-stdin 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com
```

### 3.2 이미지 빌드 스크립트 실행

```bash
cd /Users/krystal/project/openmarket-aws

# 스크립트 실행 권한 부여
chmod +x scripts/build-and-push.sh

# Backend + Frontend 빌드
./scripts/build-and-push.sh dev all latest

# 개별 빌드
./scripts/build-and-push.sh dev backend latest
./scripts/build-and-push.sh dev frontend latest
```

### 3.3 이미지 확인

```bash
# ECR 리포지토리 확인
aws ecr describe-repositories --profile openmarket

# 이미지 목록 확인
aws ecr list-images \
  --repository-name openmarket/backend \
  --profile openmarket

aws ecr list-images \
  --repository-name openmarket/frontend-web \
  --profile openmarket
```

**소요 시간**: 20-30분

---

## Step 4: Kubernetes 배포

### 4.1 EKS Add-ons 설치

```bash
cd scripts

# Add-ons 설치 스크립트 실행
chmod +x setup-eks-addons.sh
./setup-eks-addons.sh dev

# 설치되는 Add-ons:
# 1. AWS Load Balancer Controller
# 2. EBS CSI Driver
# 3. CoreDNS (업데이트)
# 4. kube-proxy (업데이트)
# 5. vpc-cni (업데이트)
```

### 4.2 Namespace 생성

```bash
# Namespace 생성
kubectl apply -f k8s/overlays/dev/namespace.yaml

# 확인
kubectl get namespace openmarket-dev
```

### 4.3 Secrets 생성

```bash
# RDS 접속 정보 가져오기
export RDS_ENDPOINT=$(terraform output -raw rds_cluster_endpoint)
export RDS_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id openmarket-dev-rds-password \
  --query SecretString \
  --output text \
  --profile openmarket)

# ElastiCache 접속 정보
export REDIS_ENDPOINT=$(terraform output -raw elasticache_endpoint)

# Secrets 생성
kubectl create secret generic backend-secrets \
  --from-literal=DB_HOST="$RDS_ENDPOINT" \
  --from-literal=DB_NAME="openmarket_dev" \
  --from-literal=DB_USER="admin" \
  --from-literal=DB_PASSWORD="$RDS_PASSWORD" \
  --from-literal=REDIS_HOST="$REDIS_ENDPOINT" \
  --from-literal=REDIS_PORT="6379" \
  --from-literal=JWT_SECRET="your-jwt-secret-change-this" \
  -n openmarket-dev

# 확인
kubectl get secrets -n openmarket-dev
```

### 4.4 애플리케이션 배포 (Helm 방식 - 권장)

```bash
cd k8s/helm/openmarket

# Helm Chart 설치
helm install openmarket-dev . \
  --namespace openmarket-dev \
  --values values.yaml \
  --values values-dev.yaml \
  --set backend.image.tag=dev-latest \
  --set frontend.image.tag=dev-latest

# 배포 상태 확인
kubectl get pods -n openmarket-dev -w

# 예상 출력:
# NAME                          READY   STATUS    RESTARTS   AGE
# backend-xxxxxxxxxx-xxxxx      1/1     Running   0          2m
# backend-xxxxxxxxxx-yyyyy      1/1     Running   0          2m
# backend-xxxxxxxxxx-zzzzz      1/1     Running   0          2m
# frontend-web-xxxxxxxxxx-xxxxx 1/1     Running   0          2m
```

### 4.5 Database Migration

```bash
# Backend Pod에서 Migration 실행
BACKEND_POD=$(kubectl get pods -n openmarket-dev -l app=backend -o jsonpath='{.items[0].metadata.name}')

kubectl exec -it $BACKEND_POD -n openmarket-dev -- npm run migrate

# 또는
kubectl exec -it $BACKEND_POD -n openmarket-dev -- npx prisma migrate deploy
```

### 4.6 배포 검증

```bash
# Pod 상태 확인
kubectl get pods -n openmarket-dev

# Service 확인
kubectl get svc -n openmarket-dev

# Logs 확인
kubectl logs -n openmarket-dev -l app=backend --tail=50
kubectl logs -n openmarket-dev -l app=frontend-web --tail=50
```

**소요 시간**: 30-40분

---

## Step 5: Lambda Functions 배포

### 5.1 Lambda 코드 패키징

```bash
cd lambda

# 각 Lambda Function 패키징
for func in image-processor email-sender settlement-report webhook-handler; do
  echo "Packaging $func..."
  cd $func
  npm ci --production
  zip -r ../function-$func.zip index.js node_modules/ package.json
  cd ..
done
```

### 5.2 Terraform으로 Lambda 배포

```bash
cd infrastructure/terraform/environments/dev

# Lambda 모듈 추가 (main.tf에 이미 포함됨)
# module "lambda" {
#   source = "../../modules/lambda"
#   ...
# }

terraform plan -target=module.lambda
terraform apply -target=module.lambda
```

### 5.3 Lambda Functions 확인

```bash
# Lambda 목록 확인
aws lambda list-functions \
  --query 'Functions[?starts_with(FunctionName, `openmarket-dev`)].FunctionName' \
  --profile openmarket

# 예상 출력:
# [
#   "openmarket-dev-image-processor",
#   "openmarket-dev-email-sender",
#   "openmarket-dev-settlement-report",
#   "openmarket-dev-webhook-handler"
# ]
```

### 5.4 Lambda 테스트

```bash
# Image Processor 테스트 (S3 업로드)
aws s3 cp test-image.jpg \
  s3://openmarket-dev-uploads/products/test-image.jpg \
  --profile openmarket

# Email Sender 테스트 (SQS 메시지 전송)
aws sqs send-message \
  --queue-url $(aws sqs get-queue-url --queue-name openmarket-dev-email-queue --output text --profile openmarket) \
  --message-body '{"type":"ORDER_CONFIRMATION","email":"test@example.com","data":{"orderNumber":"ORD-001"}}' \
  --profile openmarket

# Lambda 로그 확인
aws logs tail /aws/lambda/openmarket-dev-image-processor --follow --profile openmarket
```

**소요 시간**: 20-30분

---

## Step 6: 모니터링 스택 배포

### 6.1 모니터링 스택 설치

```bash
cd scripts

# 모니터링 설치 스크립트 실행
chmod +x setup-monitoring.sh
./setup-monitoring.sh dev

# 예상 소요 시간: 5-10분
```

### 6.2 Slack Webhook 설정

```bash
# 1. Slack에서 Incoming Webhook 생성
# https://api.slack.com/messaging/webhooks

# 2. Webhook URL을 Secret에 저장
kubectl create secret generic alertmanager-secrets \
  --from-literal=slack-webhook-url='https://hooks.slack.com/services/YOUR/WEBHOOK/URL' \
  -n monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. Alertmanager 재시작
kubectl rollout restart deployment/alertmanager -n monitoring
```

### 6.3 모니터링 접근

```bash
# Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090 &
open http://localhost:9090

# Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000 &
open http://localhost:3000
# Login: admin / openmarket2024!

# Alertmanager
kubectl port-forward -n monitoring svc/alertmanager 9093:9093 &
open http://localhost:9093
```

### 6.4 CloudWatch 대시보드 배포

```bash
cd infrastructure/terraform/environments/dev

# CloudWatch 모듈 추가 (main.tf)
# module "cloudwatch" {
#   source = "../../modules/cloudwatch"
#   ...
# }

terraform plan -target=module.cloudwatch
terraform apply -target=module.cloudwatch
```

**소요 시간**: 15-20분

---

## Step 7: CI/CD 설정

### 7.1 GitHub Repository 설정

```bash
# GitHub Repository 생성 (이미 존재하는 경우 스킵)
# https://github.com/new

# 로컬 저장소와 연결
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

### 7.2 GitHub Secrets 설정

GitHub Repository → Settings → Secrets and variables → Actions → New repository secret

**필수 Secrets**:
```
AWS_ACCESS_KEY_ID: [YOUR_ACCESS_KEY_ID]
AWS_SECRET_ACCESS_KEY: [YOUR_SECRET_ACCESS_KEY]
```

**선택 Secrets**:
```
SLACK_WEBHOOK_URL: [YOUR_SLACK_WEBHOOK_URL]
INFRACOST_API_KEY: [YOUR_INFRACOST_API_KEY]
```

### 7.3 GitHub Environments 생성

GitHub Repository → Settings → Environments

**1. dev 환경**:
- Protection rules: None
- Deployment branches: `develop`, `main`

**2. staging 환경** (선택):
- Protection rules: Required reviewers (1명)
- Deployment branches: `main`

**3. prod 환경**:
- Protection rules:
  - Required reviewers (2명 이상)
  - Wait timer: 5분
- Deployment branches: `main` only

### 7.4 Workflows 테스트

```bash
# 코드 변경 후 Push
git add .
git commit -m "test: trigger CI/CD workflow"
git push origin develop

# GitHub Actions 페이지에서 확인
# https://github.com/<username>/<repo>/actions
```

**소요 시간**: 30분

---

## ✅ 검증 및 테스트

### 1. 인프라 검증

```bash
# EKS Cluster
kubectl get nodes
kubectl cluster-info

# RDS
aws rds describe-db-clusters \
  --db-cluster-identifier openmarket-dev-aurora-cluster \
  --profile openmarket

# ElastiCache
aws elasticache describe-cache-clusters \
  --cache-cluster-id openmarket-dev-redis-001 \
  --profile openmarket

# S3
aws s3 ls --profile openmarket | grep openmarket-dev
```

### 2. 애플리케이션 검증

```bash
# Pod 상태
kubectl get pods -n openmarket-dev

# 모든 Pod가 Running 상태여야 함
# NAME                          READY   STATUS    RESTARTS   AGE
# backend-xxx                   1/1     Running   0          10m
# backend-yyy                   1/1     Running   0          10m
# backend-zzz                   1/1     Running   0          10m
# frontend-web-xxx              1/1     Running   0          10m

# Backend Health Check
BACKEND_POD=$(kubectl get pods -n openmarket-dev -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $BACKEND_POD -n openmarket-dev -- curl localhost:3001/health

# Frontend Health Check
FRONTEND_POD=$(kubectl get pods -n openmarket-dev -l app=frontend-web -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $FRONTEND_POD -n openmarket-dev -- curl localhost:3000
```

### 3. 데이터베이스 검증

```bash
# RDS 연결 테스트
kubectl run mysql-client --image=mysql:8.0 --rm -it --restart=Never -n openmarket-dev -- \
  mysql -h $RDS_ENDPOINT -u admin -p$RDS_PASSWORD -e "SHOW DATABASES;"

# 예상 출력:
# +--------------------+
# | Database           |
# +--------------------+
# | information_schema |
# | mysql              |
# | openmarket_dev     |
# | performance_schema |
# | sys                |
# +--------------------+
```

### 4. Redis 검증

```bash
# Redis 연결 테스트
kubectl run redis-client --image=redis:7.0 --rm -it --restart=Never -n openmarket-dev -- \
  redis-cli -h $REDIS_ENDPOINT ping

# 예상 출력: PONG
```

### 5. Lambda Functions 검증

```bash
# Lambda 실행 테스트
aws lambda invoke \
  --function-name openmarket-dev-image-processor \
  --payload '{"test": true}' \
  response.json \
  --profile openmarket

cat response.json
```

### 6. 모니터링 검증

```bash
# Prometheus Targets 확인
# http://localhost:9090/targets
# 모든 타겟이 UP 상태여야 함

# Grafana 대시보드 확인
# http://localhost:3000
# Dashboards → Browse → 3개 대시보드 확인

# Alertmanager 알림 확인
# http://localhost:9093
# Alerts 페이지에서 알림 규칙 확인
```

### 7. End-to-End 테스트

```bash
# Port Forward로 서비스 노출
kubectl port-forward -n openmarket-dev svc/backend 3001:3001 &
kubectl port-forward -n openmarket-dev svc/frontend-web 3000:3000 &

# API 테스트
curl http://localhost:3001/api/health
curl http://localhost:3001/api/products

# Frontend 접속
open http://localhost:3000
```

---

## 🔧 트러블슈팅

### 문제 1: EKS 노드가 Ready 상태가 아님

**증상**:
```bash
kubectl get nodes
# NAME     STATUS     ROLES    AGE   VERSION
# node-1   NotReady   <none>   5m    v1.28.x
```

**해결 방법**:
```bash
# 1. Node 상세 정보 확인
kubectl describe node <node-name>

# 2. VPC CNI Plugin 확인
kubectl get pods -n kube-system -l k8s-app=aws-node

# 3. CoreDNS 확인
kubectl get pods -n kube-system -l k8s-app=kube-dns

# 4. Node IAM Role 확인
aws iam get-role --role-name openmarket-dev-eks-node-role --profile openmarket
```

### 문제 2: Pod가 ImagePullBackOff 상태

**증상**:
```bash
kubectl get pods -n openmarket-dev
# NAME          READY   STATUS             RESTARTS   AGE
# backend-xxx   0/1     ImagePullBackOff   0          2m
```

**해결 방법**:
```bash
# 1. Pod 이벤트 확인
kubectl describe pod <pod-name> -n openmarket-dev

# 2. ECR 이미지 존재 확인
aws ecr list-images --repository-name openmarket/backend --profile openmarket

# 3. ECR 권한 확인
# Node IAM Role에 ECR 읽기 권한 필요

# 4. 이미지 태그 확인
kubectl get deployment backend -n openmarket-dev -o yaml | grep image:
```

### 문제 3: Backend Pod가 CrashLoopBackOff

**증상**:
```bash
kubectl get pods -n openmarket-dev
# NAME          READY   STATUS             RESTARTS   AGE
# backend-xxx   0/1     CrashLoopBackOff   5          5m
```

**해결 방법**:
```bash
# 1. 로그 확인
kubectl logs <pod-name> -n openmarket-dev --previous

# 2. 일반적인 원인:
#    - DB 연결 실패 (RDS Endpoint 확인)
#    - Redis 연결 실패 (ElastiCache Endpoint 확인)
#    - 환경 변수 누락 (Secrets 확인)

# 3. Secrets 확인
kubectl get secret backend-secrets -n openmarket-dev -o yaml

# 4. RDS 연결 테스트
kubectl exec -it <pod-name> -n openmarket-dev -- \
  nc -zv $RDS_ENDPOINT 3306
```

### 문제 4: Terraform Apply 실패

**증상**:
```
Error: Error creating EKS Cluster: ResourceInUseException
```

**해결 방법**:
```bash
# 1. 기존 리소스 확인
aws eks list-clusters --profile openmarket

# 2. State 파일 확인
terraform state list

# 3. 문제가 있는 리소스 제거
terraform state rm <resource>

# 4. 다시 Apply
terraform apply
```

### 문제 5: Lambda Function이 실행되지 않음

**증상**:
- S3에 이미지 업로드해도 리사이징되지 않음
- SQS 메시지 전송해도 이메일 안 옴

**해결 방법**:
```bash
# 1. Lambda 로그 확인
aws logs tail /aws/lambda/openmarket-dev-image-processor --follow --profile openmarket

# 2. Lambda IAM Role 확인
aws lambda get-function \
  --function-name openmarket-dev-image-processor \
  --query 'Configuration.Role' \
  --profile openmarket

# 3. Trigger 설정 확인
aws lambda list-event-source-mappings \
  --function-name openmarket-dev-image-processor \
  --profile openmarket

# 4. 수동 테스트
aws lambda invoke \
  --function-name openmarket-dev-image-processor \
  --payload '{"test": true}' \
  response.json \
  --profile openmarket
```

---

## 📊 배포 완료 체크리스트

- [ ] AWS 계정 설정 완료
- [ ] Terraform으로 인프라 배포 완료
- [ ] EKS 클러스터 접근 가능
- [ ] Docker 이미지 빌드 및 ECR 푸시 완료
- [ ] EKS Add-ons 설치 완료
- [ ] Backend 3 pods Running
- [ ] Frontend 1 pod Running
- [ ] Database Migration 완료
- [ ] RDS 연결 확인
- [ ] Redis 연결 확인
- [ ] Lambda Functions 배포 완료
- [ ] Lambda Functions 테스트 성공
- [ ] Prometheus 설치 완료
- [ ] Grafana 접근 가능
- [ ] Alertmanager 설치 완료
- [ ] Slack 알림 테스트 성공
- [ ] Fluent Bit 로그 수집 확인
- [ ] CloudWatch 대시보드 생성 완료
- [ ] GitHub Secrets 설정 완료
- [ ] GitHub Environments 생성 완료
- [ ] CI/CD Workflows 테스트 성공

---

## 📚 추가 참고 자료

- [AWS 계정 설정 가이드](./infrastructure/AWS_SETUP.md)
- [Phase 2: 인프라 구축](./infrastructure/PHASE2_COMPLETE.md)
- [Phase 3: Kubernetes 배포](./infrastructure/PHASE3_COMPLETE.md)
- [Phase 4: Lambda Functions](./infrastructure/PHASE4_COMPLETE.md)
- [Phase 5: CI/CD 파이프라인](./infrastructure/PHASE5_COMPLETE.md)
- [Phase 6: 모니터링 & 최적화](./infrastructure/PHASE6_COMPLETE.md)
- [모니터링 가이드](./k8s/monitoring/README.md)
- [비용 최적화 가이드](./infrastructure/COST_OPTIMIZATION.md)
- [API 문서](./API_DOCUMENTATION.md)

---

**배포 성공!** 🎉

모든 단계가 완료되면 OpenMarket이 AWS에서 완전히 운영 중입니다!

다음 단계:
1. Production 환경 배포
2. 도메인 및 SSL 인증서 설정
3. 실제 트래픽 테스트
4. 성능 최적화
5. 비용 모니터링

---

**문서 버전**: 1.0
**최종 업데이트**: 2025-01-15
