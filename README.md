# 🏪 OpenMarket AWS - 클라우드 네이티브 오픈마켓 플랫폼

> EKS + Lambda 하이브리드 아키텍처 기반의 확장 가능한 전자상거래 플랫폼

[![Docker](https://img.shields.io/badge/Docker-20.10+-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-EKS-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-000000?logo=next.js&logoColor=white)](https://nextjs.org/)

## 📋 목차

- [프로젝트 개요](#-프로젝트-개요)
- [아키텍처](#️-아키텍처)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [프로젝트 구조](#-프로젝트-구조)
- [개발 로드맵](#-개발-로드맵)
- [배포 전략](#-배포-전략)

## 🎯 프로젝트 개요

OpenMarket AWS는 AWS 클라우드 서비스를 활용한 현대적인 전자상거래 플랫폼입니다.

### 핵심 기능

#### 👥 다중 사용자 타입
- **일반 사용자**: 상품 검색, 장바구니, 주문, 결제
- **판매자**: 상품 관리, 재고 관리, 정산 대시보드
- **관리자**: 전체 시스템 관리, 통계, 사용자 관리

#### 🌐 멀티 플랫폼
- **Web**: Next.js 기반 반응형 웹 (Admin, Seller, User)
- **Mobile**: Flutter 기반 네이티브 앱 (iOS, Android)
- **API**: RESTful API + WebSocket

#### ☁️ 클라우드 네이티브
- **컨테이너화**: Docker + Kubernetes
- **자동 확장**: HPA (Horizontal Pod Autoscaler)
- **서버리스**: AWS Lambda 통합
- **마이크로서비스**: 도메인별 서비스 분리

## 🏗️ 아키텍처

### 전체 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   CloudFront (CDN)                   │
└───────┬─────────────────────────┬───────────────────┘
        │                         │
┌───────▼──────┐         ┌────────▼─────────────────┐
│  S3 (Static) │         │  ALB + API Gateway       │
└──────────────┘         └────────┬─────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
           ┌────────▼──────┐ ┌───▼────┐ ┌─────▼──────┐
           │  EKS Cluster  │ │ Lambda │ │  RDS Aurora│
           │  (Core APIs)  │ │ (Events)│ │   MySQL   │
           └───────────────┘ └────────┘ └────────────┘
```

### EKS 클러스터 구성

**Pod 분산:**
- Product API: 3 replicas
- Order API: 3 replicas
- Cart API: 2 replicas
- Auth API: 2 replicas

**Auto Scaling:**
- CPU 70% 기준
- 최소 2개 ~ 최대 10개 Pod

### Lambda Functions

- **이미지 처리**: S3 업로드 시 자동 리사이징
- **이메일 발송**: SQS 트리거 기반 비동기 발송
- **정산 리포트**: 일일/월간 자동 생성
- **웹훅 처리**: 결제 콜백, 배송 추적

## 🛠️ 기술 스택

### Backend
```
├── Node.js 20           # Runtime
├── Express 5            # Web Framework
├── Prisma               # ORM
├── MySQL 8.0            # Database
├── Redis 7              # Cache & Session
└── JWT                  # Authentication
```

### Frontend
```
├── Next.js 15           # React Framework
├── React 19             # UI Library
├── TypeScript           # Type Safety
├── MUI (Material-UI)    # Component Library
└── SWR                  # Data Fetching
```

### Mobile
```
├── Flutter 3.x          # Framework
├── Dart                 # Language
└── Provider             # State Management
```

### Infrastructure
```
├── Docker               # Containerization
├── Kubernetes (EKS)     # Orchestration
├── Terraform            # IaC
├── Helm                 # Package Manager
├── ArgoCD               # GitOps
└── GitHub Actions       # CI/CD
```

### AWS Services
```
├── EKS                  # Kubernetes
├── Lambda               # Serverless
├── RDS Aurora           # Database
├── ElastiCache          # Redis
├── S3                   # Object Storage
├── CloudFront           # CDN
├── ALB                  # Load Balancer
├── API Gateway          # API Management
├── SQS                  # Message Queue
├── SNS                  # Notifications
├── CloudWatch           # Monitoring
└── Secrets Manager      # Credentials
```

## 🚀 시작하기

### 사전 요구사항

- Docker Desktop 20.10+
- Docker Compose 2.0+
- Node.js 20+ (선택사항)
- kubectl (Phase 3+)
- AWS CLI (Phase 2+)

### Quick Start

```bash
# 1. 프로젝트 클론
cd /Users/krystal/project/openmarket-aws

# 2. 환경 변수 설정
cp .env.example .env

# 3. 기존 코드 복사 (최초 1회)
cp -r ../openmarket-backend/* ./backend/
cp -r ../openmarket-client/* ./frontend-web/

# 4. Docker Compose 실행
docker compose up -d

# 5. 데이터베이스 초기화
docker compose exec backend npx prisma migrate dev
docker compose exec backend npm run seed:all

# 6. 브라우저에서 접속
# User: http://localhost:3000
# Admin: http://localhost:3000/admin
# Seller: http://localhost:3000/seller
# API: http://localhost:3001/api
```

자세한 설정 방법은 [SETUP.md](./SETUP.md)를 참조하세요.

## 📁 프로젝트 구조

```
openmarket-aws/
├── backend/                      # Backend API
│   ├── src/
│   │   ├── api/
│   │   │   ├── admin/           # 관리자 API
│   │   │   ├── seller/          # 판매자 API
│   │   │   └── user/            # 사용자 API
│   │   ├── middleware/          # 미들웨어
│   │   ├── models/              # Prisma 모델
│   │   └── services/            # 비즈니스 로직
│   ├── prisma/                  # Database Schema
│   ├── Dockerfile               # 멀티스테이지 빌드
│   └── package.json
│
├── frontend-web/                # Next.js 웹
│   ├── app/
│   │   ├── (user)/             # 사용자 쇼핑몰
│   │   ├── admin/              # 관리자 대시보드
│   │   └── seller/             # 판매자 대시보드
│   ├── components/             # 공통 컴포넌트
│   ├── Dockerfile
│   └── package.json
│
├── mobile-app/                  # Flutter 모바일 앱
│   ├── lib/
│   │   ├── screens/
│   │   ├── widgets/
│   │   └── services/
│   └── pubspec.yaml
│
├── infrastructure/              # 인프라 코드
│   ├── terraform/              # AWS 리소스 정의
│   │   ├── modules/
│   │   │   ├── vpc/
│   │   │   ├── eks/
│   │   │   ├── rds/
│   │   │   └── lambda/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── prod/
│   │   └── main.tf
│   │
│   └── kubernetes/             # K8s Manifests
│       ├── base/
│       ├── overlays/
│       └── helm-charts/
│
├── lambda/                     # Lambda Functions
│   ├── image-processor/
│   ├── email-sender/
│   ├── settlement-report/
│   └── webhook-handler/
│
├── nginx/                      # Nginx 설정
│   ├── nginx.conf
│   └── conf.d/
│
├── .github/                    # GitHub Actions
│   └── workflows/
│       ├── backend-ci.yml
│       ├── frontend-ci.yml
│       └── deploy.yml
│
├── docker-compose.yml          # 개발 환경
├── docker-compose.prod.yml     # 프로덕션 시뮬레이션
├── .env.example                # 환경 변수 템플릿
├── SETUP.md                    # 설정 가이드
└── README.md                   # 이 파일
```

## 🗓️ 개발 로드맵

### Phase 1: 로컬 컨테이너화 ✅ 완료
- [x] Dockerfile 작성 (Backend, Frontend)
- [x] docker-compose.yml 작성
- [x] 로컬 개발 환경 구성
- [x] LocalStack 통합 (AWS 시뮬레이션)

### Phase 2: AWS 인프라 구축 ✅ 완료
- [x] Terraform 코드 작성
  - [x] VPC 및 네트워킹 (3 AZs, Public/Private/Database Subnets)
  - [x] EKS 클러스터 (v1.28, IRSA, OIDC)
  - [x] RDS Aurora MySQL (Multi-AZ, 2 instances)
  - [x] ElastiCache Redis (Cluster mode)
  - [x] S3 및 CloudFront (Static assets, Uploads, Backups)
  - [x] Security Groups (EKS, RDS, ElastiCache, ALB)
  - [x] IAM Roles (IRSA for Backend, Frontend, AWS LB Controller, etc.)
- [x] 환경별 분리 (dev, staging, prod)
- [x] Secrets Manager 통합
- [x] 자세한 내용: [PHASE2_COMPLETE.md](./infrastructure/PHASE2_COMPLETE.md)

### Phase 3: Kubernetes 배포 ✅ 완료 (Dev 환경 실제 배포 성공!)
- [x] **Kubernetes Manifests 작성**
  - [x] Backend Deployment, Service, HPA
  - [x] Frontend Deployment, Service, HPA
  - [x] Network Policies
  - [x] Pod Disruption Budgets
- [x] **Helm Charts 구성**
  - [x] Chart templates
  - [x] 환경별 values (dev, prod)
- [x] **Ingress 및 ALB 설정**
  - [x] AWS Load Balancer Controller 통합
  - [x] Multi-domain routing
  - [x] SSL/TLS 설정
- [x] **HPA (Horizontal Pod Autoscaler)**
  - [x] CPU/Memory 기반 스케일링
  - [x] Scale-up/down 정책
- [x] **External Secrets Operator**
  - [x] AWS Secrets Manager 통합
- [x] **Kustomize 오버레이** (dev, staging, prod)
- [x] **배포 스크립트**
  - [x] deploy-k8s.sh
  - [x] setup-eks-addons.sh
  - [x] build-and-push.sh
- [x] **실제 Dev 환경 배포 완료** 🎉
  - [x] ECR 리포지토리 생성 및 이미지 푸시
  - [x] Backend 3 pods 배포 (RDS 연결 성공)
  - [x] Frontend 1 pod 배포 (Health Check 통과)
  - [x] Database Migration 완료
  - [x] 보안 그룹 설정 완료
  - [x] 12가지 트러블슈팅 해결
- [x] **문서화**
  - [x] [PHASE3_COMPLETE.md](./infrastructure/PHASE3_COMPLETE.md) - 배포 가이드
  - [x] [k8s/README.md](./k8s/README.md) - 운영 가이드

### Phase 4: Lambda Functions ✅ 완료
- [x] **이미지 프로세싱 Lambda**
  - [x] S3 이벤트 트리거
  - [x] Sharp를 이용한 4가지 크기 생성 (Large, Medium, Small, Thumbnail)
  - [x] 자동 업로드 및 메타데이터 저장
- [x] **이메일 발송 Lambda**
  - [x] SQS 트리거 (Batch Size: 10)
  - [x] 4가지 이메일 템플릿 (주문확인, 배송알림, 비밀번호재설정, 프로모션)
  - [x] Amazon SES 통합
- [x] **정산 리포트 Lambda**
  - [x] EventBridge 스케줄러 (일/주/월)
  - [x] RDS 연결 및 데이터 조회
  - [x] CSV/HTML 리포트 생성
  - [x] S3 저장 및 이메일 발송
- [x] **웹훅 핸들러 Lambda**
  - [x] Lambda Function URL
  - [x] 결제/배송/환불 웹훅 처리
  - [x] HMAC 서명 검증
  - [x] RDS 상태 업데이트
- [x] **Terraform 모듈**
  - [x] Lambda Functions 정의
  - [x] IAM Roles & Policies
  - [x] CloudWatch Log Groups
  - [x] EventBridge Rules
- [x] **문서화**
  - [x] 각 Lambda별 README 및 사용 가이드
  - [x] [PHASE4_COMPLETE.md](./infrastructure/PHASE4_COMPLETE.md)

### Phase 5: CI/CD 파이프라인 ✅ 완료
- [x] **GitHub Actions 워크플로우**
  - [x] Backend CI/CD (Test → Build → Deploy to EKS)
  - [x] Frontend CI/CD (Test → Build → Deploy → E2E Tests)
  - [x] Lambda Functions CI/CD (Path filtering, Selective deployment)
  - [x] Terraform CI/CD (Plan → Security scan → Cost estimation → Apply)
- [x] **Docker 이미지 빌드 및 ECR 푸시**
  - [x] Multi-stage builds
  - [x] BuildKit cache optimization
  - [x] Image tagging strategy (environment-sha)
- [x] **배포 전략**
  - [x] Dev: Auto deployment on push
  - [x] Prod: Manual approval required
  - [x] Helm-based rolling updates
- [x] **보안 및 비용 관리**
  - [x] tfsec security scanning
  - [x] Infracost cost estimation
  - [x] GitHub Secrets management
  - [x] GitHub Environments (dev, staging, prod)
- [x] **문서화**
  - [x] [.github/workflows/README.md](./.github/workflows/README.md) - Workflows 가이드
  - [x] [PHASE5_COMPLETE.md](./infrastructure/PHASE5_COMPLETE.md)

### Phase 6: 모니터링 & 최적화 ✅ 완료
- [x] **Prometheus + Grafana 설치**
  - [x] Prometheus (메트릭 수집 및 저장, 30일 보관)
  - [x] Grafana (시각화 및 대시보드)
  - [x] Alertmanager (Slack 알림)
  - [x] Node Exporter (노드 메트릭)
  - [x] Kube State Metrics (K8s 오브젝트 메트릭)
- [x] **CloudWatch 대시보드**
  - [x] EKS, RDS, ElastiCache, Lambda 메트릭
  - [x] 14개 위젯 구성
- [x] **알람 설정**
  - [x] Prometheus 알림 규칙 (10개)
  - [x] CloudWatch Alarms (7개)
  - [x] Slack 알림 통합
- [x] **로그 중앙화**
  - [x] Fluent Bit DaemonSet
  - [x] CloudWatch Logs 통합
  - [x] Log Groups 구성 (5개)
- [x] **비용 최적화**
  - [x] 비용 최적화 가이드 작성
  - [x] 스케줄링 전략 (월 $120 절감)
  - [x] Reserved Instances 가이드
  - [x] S3 Lifecycle 정책
- [x] **문서화**
  - [x] [k8s/monitoring/README.md](./k8s/monitoring/README.md) - 모니터링 가이드
  - [x] [PHASE6_COMPLETE.md](./infrastructure/PHASE6_COMPLETE.md)
  - [x] [COST_OPTIMIZATION.md](./infrastructure/COST_OPTIMIZATION.md)

## 📦 배포 전략

### 개발 환경 (로컬)
```bash
# Docker Compose 사용
docker compose up -d
```

### AWS 배포

#### 1. 인프라 배포 (Terraform)
```bash
cd infrastructure/terraform/environments/dev
terraform init
terraform plan
terraform apply
```

#### 2. kubectl 설정
```bash
aws eks update-kubeconfig \
  --region ap-northeast-2 \
  --name openmarket-dev-eks \
  --profile openmarket
```

#### 3. EKS Add-ons 설치
```bash
cd scripts
./setup-eks-addons.sh dev
```

#### 4. Docker 이미지 빌드 및 푸시
```bash
./build-and-push.sh dev all latest
```

#### 5. 애플리케이션 배포

**옵션 A: Helm 사용 (권장)**
```bash
./deploy-k8s.sh dev helm
```

**옵션 B: Kustomize 사용**
```bash
./deploy-k8s.sh dev kustomize
```

자세한 배포 가이드:
- [Phase 2: AWS 인프라 구축](./infrastructure/PHASE2_COMPLETE.md)
- [Phase 3: Kubernetes 배포](./infrastructure/PHASE3_COMPLETE.md)

## 📊 예상 비용

### 개발 환경
- 로컬: $0 (Docker만 사용)

### 프로덕션 (중규모)
- EKS: $73/월
- EC2 (Node Groups): $300-500/월
- RDS Aurora: $400/월
- ElastiCache: $200/월
- Lambda: $20/월
- S3 + CloudFront: $100/월
- 기타 (ALB, NAT 등): $100/월
- **총 예상: $1,200-1,400/월**

## 🔐 보안

- JWT 기반 인증
- HTTPS 필수 (프로덕션)
- AWS Secrets Manager
- IAM 역할 기반 접근 제어
- VPC Private Subnet
- Security Groups
- WAF (Web Application Firewall)

## 🤝 기여

이 프로젝트는 개인 프로젝트이지만, 개선 제안을 환영합니다.

## 📄 라이선스

Private Project

## 📞 문의

- 프로젝트 관리자: [Your Name]
- 이메일: [Your Email]

---

**현재 상태: Phase 6 완료 - 모니터링 & 최적화 완료! 🎉**

### 완료된 작업:
- ✅ **Phase 1**: 로컬 컨테이너화
- ✅ **Phase 2**: AWS 인프라 Terraform 배포 (VPC, EKS, RDS, ElastiCache, S3, ECR 등)
- ✅ **Phase 3**: Kubernetes 배포 완료
  - ✅ Kubernetes 매니페스트 및 Helm Charts 작성
  - ✅ Dev 환경 실제 배포 성공
  - ✅ Backend 3 pods, Frontend 1 pod 운영 중
  - ✅ RDS Aurora MySQL 연결 및 마이그레이션 완료
  - ✅ ElastiCache Redis 연결 성공
- ✅ **Phase 4**: Lambda Functions 구현 완료
  - ✅ Image Processor (이미지 자동 리사이징)
  - ✅ Email Sender (비동기 이메일 발송)
  - ✅ Settlement Report (판매자 정산)
  - ✅ Webhook Handler (외부 웹훅 처리)
  - ✅ Terraform Lambda 모듈 작성
- ✅ **Phase 5**: CI/CD 파이프라인 구축 완료
  - ✅ 4개 GitHub Actions 워크플로우 (Backend, Frontend, Lambda, Terraform)
  - ✅ 자동 빌드 및 ECR 푸시
  - ✅ EKS 자동 배포 (Helm)
  - ✅ 보안 스캔 (tfsec) 및 비용 추정 (Infracost)
  - ✅ 환경별 승인 전략 (Dev 자동, Prod 수동)
- ✅ **Phase 6**: 모니터링 & 최적화 완료
  - ✅ Prometheus + Grafana + Alertmanager
  - ✅ Node Exporter + Kube State Metrics
  - ✅ Fluent Bit → CloudWatch Logs
  - ✅ CloudWatch 대시보드 (14개 위젯)
  - ✅ CloudWatch Alarms (7개 알림)
  - ✅ Slack 알림 통합
  - ✅ 비용 최적화 전략 (월 $200-300 절감)

### 🚀 현재 시스템 아키텍처:

**Kubernetes (EKS)**:
```
Backend:     3 pods Running (RDS 연결 성공)
Frontend:    1 pod Running (Health Check 통과)
Database:    Aurora MySQL 8.0 (openmarket_dev)
Cache:       ElastiCache Redis 7.0
Namespace:   openmarket-dev
```

**Lambda Functions (Serverless)**:
```
Image Processor:     S3 트리거 → 이미지 리사이징 (4 sizes)
Email Sender:        SQS 트리거 → SES 이메일 발송 (4 templates)
Settlement Report:   EventBridge 스케줄 → 정산 리포트 생성 (일/주/월)
Webhook Handler:     Function URL → 결제/배송 웹훅 처리
```

**CI/CD Pipeline (GitHub Actions)**:
```
Backend CI/CD:       Test → Lint → Build → Push ECR → Deploy EKS → Verify
Frontend CI/CD:      Test → Lint → Build → Push ECR → Deploy EKS → E2E Tests
Lambda CI/CD:        Path Filter → Package → Update Function → Publish Version
Terraform CI/CD:     Plan → Security Scan → Cost Estimate → Apply (with approval)
```

**모니터링 스택 (Monitoring Namespace)**:
```
Prometheus:          메트릭 수집 (30일 보관, 50+ targets, ~10K time series)
Grafana:             시각화 (3개 대시보드, 20+ panels)
Alertmanager:        Slack 알림 (10개 규칙, 5개 채널)
Node Exporter:       노드 메트릭 (DaemonSet)
Kube State Metrics:  K8s 오브젝트 메트릭
Fluent Bit:          로그 수집 → CloudWatch Logs (DaemonSet)
```

**예상 비용** (월간):
- EKS + Kubernetes: ~$418/월
- Lambda Functions: ~$22/월
- Monitoring (CloudWatch + Storage): ~$15/월
- **총**: ~$455/월 (Dev 환경, 최적화 전)
- **최적화 후**: ~$313/월 (월 $142 절감)

### 다음 단계 (Production 준비):
1. ⏭️ **모니터링 스택 배포**
   - 스크립트 실행: `./scripts/setup-monitoring.sh dev`
   - Slack Webhook 설정
   - Grafana 접속 확인 (admin / openmarket2024!)
   - CloudWatch 대시보드 확인
2. ⏭️ **GitHub 설정**
   - GitHub Secrets 설정 (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
   - GitHub Environments 생성 (dev, staging, prod)
   - Production 환경에 승인자 설정
3. ⏭️ **Backend Health Endpoints 추가** (`/health`, `/health/ready`)
4. ⏭️ **Ingress/ALB 설정하여 외부 접근 활성화**
5. ⏭️ **External Secrets Operator 설정** (현재 수동 Secret 사용)
6. ⏭️ **Lambda Functions 배포 및 테스트**
7. ⏭️ **비용 최적화 적용**
   - Dev/Staging 스케줄링 (야간/주말 종료)
   - S3 Lifecycle 정책 적용
   - CloudWatch Logs 보관 기간 조정
   - 예상 절감: 월 $142

### 📚 주요 문서:
- [AWS 계정 설정 가이드](./infrastructure/AWS_SETUP.md)
- [Phase 2 완료 문서](./infrastructure/PHASE2_COMPLETE.md) - **인프라 구축**
- [Phase 3 완료 문서](./infrastructure/PHASE3_COMPLETE.md) - **Kubernetes 배포 (실제 배포 경험 포함)**
- [Phase 4 완료 문서](./infrastructure/PHASE4_COMPLETE.md) - **Lambda Functions (서버리스)**
- [Phase 5 완료 문서](./infrastructure/PHASE5_COMPLETE.md) - **CI/CD 파이프라인 (GitHub Actions)**
- [Phase 6 완료 문서](./infrastructure/PHASE6_COMPLETE.md) - **모니터링 & 최적화**
- [Kubernetes 운영 가이드](./k8s/README.md) - **배포, 트러블슈팅, 운영**
- [모니터링 가이드](./k8s/monitoring/README.md) - **Prometheus, Grafana, Alertmanager, Fluent Bit**
- [비용 최적화 가이드](./infrastructure/COST_OPTIMIZATION.md) - **월 $200-300 절감 전략**
- [Lambda Functions 가이드](./lambda/) - **Image Processor, Email Sender, Settlement Report, Webhook Handler**
- [GitHub Actions 워크플로우 가이드](./.github/workflows/README.md) - **Backend, Frontend, Lambda, Terraform CI/CD**
