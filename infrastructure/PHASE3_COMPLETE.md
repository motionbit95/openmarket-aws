# Phase 3: Kubernetes 배포 구성 완료

## 개요

Phase 3에서는 EKS 클러스터에 OpenMarket 애플리케이션을 배포하기 위한 Kubernetes 매니페스트, Helm Charts, 배포 스크립트를 작성했습니다.

## 생성된 파일 구조

```
k8s/
├── base/                          # 기본 Kubernetes 매니페스트
│   ├── namespace.yaml             # Namespace 정의
│   ├── configmap.yaml             # ConfigMap
│   ├── secrets.yaml               # Secrets (External Secrets 포함)
│   ├── backend-deployment.yaml    # Backend Deployment
│   ├── backend-hpa.yaml           # Backend HPA
│   ├── frontend-deployment.yaml   # Frontend Deployment
│   ├── frontend-hpa.yaml          # Frontend HPA
│   ├── ingress.yaml               # ALB Ingress
│   ├── network-policy.yaml        # Network Policies
│   └── kustomization.yaml         # Kustomize 기본 설정
│
├── overlays/                      # 환경별 오버레이
│   ├── dev/                       # Development 환경
│   │   ├── kustomization.yaml
│   │   ├── secrets.env
│   │   ├── backend-patch.yaml
│   │   ├── frontend-patch.yaml
│   │   └── ingress-patch.yaml
│   ├── staging/                   # Staging 환경
│   │   └── kustomization.yaml
│   └── prod/                      # Production 환경
│       ├── kustomization.yaml
│       ├── backend-patch.yaml
│       ├── frontend-patch.yaml
│       └── ingress-patch.yaml
│
└── helm/                          # Helm Charts
    └── openmarket/
        ├── Chart.yaml             # Chart 메타데이터
        ├── values.yaml            # 기본 values
        ├── values-dev.yaml        # Dev values
        ├── values-prod.yaml       # Prod values
        ├── templates/             # Helm 템플릿
        │   ├── _helpers.tpl
        │   ├── backend-deployment.yaml
        │   ├── backend-service.yaml
        │   ├── backend-hpa.yaml
        │   ├── backend-serviceaccount.yaml
        │   ├── frontend-deployment.yaml
        │   ├── frontend-service.yaml
        │   ├── frontend-hpa.yaml
        │   ├── frontend-serviceaccount.yaml
        │   ├── ingress.yaml
        │   ├── configmap.yaml
        │   └── pdb.yaml
        └── charts/

scripts/
├── deploy-k8s.sh                  # Kubernetes 배포 스크립트
├── setup-eks-addons.sh            # EKS Add-ons 설치 스크립트
└── build-and-push.sh              # Docker 이미지 빌드/푸시 스크립트

infrastructure/terraform/
└── modules/
    └── iam/                       # IRSA 모듈
        ├── main.tf
        ├── variables.tf
        ├── outputs.tf
        └── policies/
            └── aws-load-balancer-controller-policy.json
```

## 주요 구성 요소

### 1. Kubernetes 매니페스트

#### Backend API
- **Deployment**:
  - 3개 replica (dev), 5개 (prod)
  - Rolling update 전략
  - Init container for DB migration
  - Health checks (liveness, readiness, startup)
  - Resource limits 설정
  - Security context (non-root, read-only filesystem)

- **Service**:
  - ClusterIP 타입
  - Port 3000

- **HPA**:
  - CPU 70%, Memory 80% 기준 자동 스케일링
  - Min: 3, Max: 20 (dev)
  - Min: 5, Max: 50 (prod)

#### Frontend Web
- **Deployment**:
  - 2개 replica (dev), 3개 (prod)
  - Next.js standalone 빌드
  - Health checks
  - Resource limits

- **Service**:
  - ClusterIP 타입
  - Port 3000

- **HPA**:
  - Min: 2, Max: 10 (dev)
  - Min: 3, Max: 20 (prod)

#### Ingress (ALB)
- **AWS Load Balancer Controller 사용**
- **도메인 구성**:
  - `dev.openmarket.example.com` → Frontend
  - `api.dev.openmarket.example.com` → Backend API
  - `admin.dev.openmarket.example.com` → Frontend (관리자)
  - `seller.dev.openmarket.example.com` → Frontend (판매자)

- **기능**:
  - HTTPS 리다이렉트 (80 → 443)
  - SSL/TLS 인증서 (ACM)
  - Health check 설정
  - Session stickiness
  - WAF 통합 (prod)
  - Shield Advanced (prod)

#### Network Policies
- Backend: Frontend와 Ingress에서만 접근 허용
- Frontend: Ingress에서만 접근 허용
- Egress: DNS, RDS, Redis, HTTPS 허용

### 2. IRSA (IAM Roles for Service Accounts)

**생성된 IAM 역할**:

1. **Backend IRSA**:
   - S3 접근 (uploads, static assets)
   - Secrets Manager 접근 (DB, Redis credentials)
   - CloudWatch Logs
   - SES (이메일 전송)

2. **Frontend IRSA**:
   - CloudWatch Logs

3. **External Secrets Operator**:
   - Secrets Manager 접근

4. **AWS Load Balancer Controller**:
   - ALB/NLB 생성 및 관리
   - EC2 리소스 조회
   - WAF 통합

5. **Cluster Autoscaler**:
   - Auto Scaling Group 관리
   - EC2 인스턴스 관리

6. **EBS CSI Driver**:
   - EBS 볼륨 생성 및 관리

### 3. Kustomize 설정

**환경별 차별화**:

| 설정 | Dev | Staging | Prod |
|------|-----|---------|------|
| Backend Replicas | 2 | 3 | 5 |
| Frontend Replicas | 2 | 2 | 3 |
| Backend Max Replicas | 20 | 30 | 50 |
| Log Level | debug | info | warn |
| Node ENV | development | production | production |
| Resources | Low | Medium | High |

**사용법**:
```bash
# Dev 환경 배포
kubectl apply -k k8s/overlays/dev

# Prod 환경 배포
kubectl apply -k k8s/overlays/prod
```

### 4. Helm Charts

**장점**:
- 템플릿 기반 재사용성
- 버전 관리
- Rollback 기능
- Values 오버라이드

**사용법**:
```bash
# Dev 환경 설치
helm install openmarket-dev ./k8s/helm/openmarket \
  --namespace openmarket-dev \
  --values ./k8s/helm/openmarket/values-dev.yaml

# Prod 환경 업그레이드
helm upgrade openmarket-prod ./k8s/helm/openmarket \
  --namespace openmarket-prod \
  --values ./k8s/helm/openmarket/values-prod.yaml
```

## 배포 프로세스

### Step 1: 인프라 배포 (Phase 2)

```bash
cd infrastructure/terraform/environments/dev
terraform init
terraform plan
terraform apply
```

**생성되는 리소스**:
- VPC, Subnets, NAT Gateway
- EKS Cluster
- RDS Aurora MySQL
- ElastiCache Redis
- S3 Buckets
- CloudFront
- IAM Roles (IRSA)

### Step 2: kubectl 설정

```bash
aws eks update-kubeconfig \
  --region ap-northeast-2 \
  --name openmarket-dev-eks \
  --profile openmarket
```

### Step 3: EKS Add-ons 설치

```bash
cd scripts
./setup-eks-addons.sh dev
```

**설치되는 Add-ons**:
1. AWS Load Balancer Controller
2. External Secrets Operator
3. Cluster Autoscaler
4. Metrics Server
5. EBS CSI Driver

### Step 4: Docker 이미지 빌드 및 푸시

```bash
./build-and-push.sh dev all latest
```

이 스크립트는:
1. ECR 로그인
2. Backend 이미지 빌드 및 푸시
3. Frontend 이미지 빌드 및 푸시
4. 환경별 태그 생성 (dev-latest, prod-latest)

### Step 5: Kubernetes 배포

**옵션 1: Helm 사용 (권장)**
```bash
./deploy-k8s.sh dev helm
```

**옵션 2: Kustomize 사용**
```bash
./deploy-k8s.sh dev kustomize
```

**Dry-run 먼저 확인**:
```bash
./deploy-k8s.sh dev helm true
```

### Step 6: 배포 확인

```bash
# Pods 상태 확인
kubectl get pods -n openmarket-dev

# Services 확인
kubectl get svc -n openmarket-dev

# Ingress 확인 (ALB DNS 확인)
kubectl get ingress -n openmarket-dev

# HPA 상태 확인
kubectl get hpa -n openmarket-dev

# Logs 확인
kubectl logs -f deployment/backend-api -n openmarket-dev
```

## 환경 변수 및 Secrets 관리

### ConfigMap
일반적인 설정값:
- `NODE_ENV`, `LOG_LEVEL`
- `DB_PORT`, `REDIS_PORT`
- `API_PORT`
- Feature flags

### Secrets (AWS Secrets Manager)
민감한 정보:
- Database credentials
- Redis auth token
- JWT secrets
- AWS credentials
- API keys

**External Secrets Operator가 자동으로 동기화**:
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: openmarket-db-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: openmarket-dev-rds-credentials
        property: password
```

## 모니터링 및 관찰성

### Metrics Server
- CPU/Memory 메트릭 수집
- HPA에서 사용

### Prometheus (향후 설치)
```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

### CloudWatch Container Insights
```bash
# FluentBit 설치
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentbit-quickstart.yaml
```

## 보안 고려사항

### 1. Network Policies
- Pod 간 통신 제한
- Ingress/Egress 규칙 정의

### 2. RBAC
- Service Account 별 권한 분리
- IRSA로 AWS 리소스 접근 제어

### 3. Security Context
- Non-root 컨테이너 실행
- Read-only root filesystem
- Capabilities drop

### 4. Secrets 관리
- AWS Secrets Manager 사용
- External Secrets Operator로 자동 동기화
- Git에 secrets 저장하지 않음

### 5. Image Scanning
- ECR 이미지 스캔 활성화
- 취약점 자동 탐지

## 성능 최적화

### 1. Auto Scaling
- **HPA**: CPU/Memory 기반 Pod 스케일링
- **Cluster Autoscaler**: Node 스케일링
- **VPA**: 리소스 요청 자동 조정 (선택사항)

### 2. Resource Limits
- Requests: 최소 보장 리소스
- Limits: 최대 사용 리소스
- QoS Class: Guaranteed (requests == limits)

### 3. Affinity & Anti-Affinity
- Pod를 여러 AZ에 분산
- 동일 노드에 같은 Pod 배치 방지

### 4. Pod Disruption Budget
- 최소 가용 Pod 수 보장
- 안전한 업데이트/유지보수

## 트러블슈팅

### Pod가 시작하지 않을 때

```bash
# Pod 상태 확인
kubectl describe pod <pod-name> -n openmarket-dev

# Events 확인
kubectl get events -n openmarket-dev --sort-by='.lastTimestamp'

# Logs 확인
kubectl logs <pod-name> -n openmarket-dev
kubectl logs <pod-name> -n openmarket-dev --previous  # 이전 컨테이너 로그
```

### Ingress/ALB 문제

```bash
# ALB Controller 로그 확인
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Ingress 상세 정보
kubectl describe ingress openmarket-ingress -n openmarket-dev

# AWS Console에서 ALB 상태 확인
```

### HPA가 작동하지 않을 때

```bash
# Metrics Server 확인
kubectl top nodes
kubectl top pods -n openmarket-dev

# HPA 상태 확인
kubectl describe hpa backend-api-hpa -n openmarket-dev
```

### Database 연결 문제

```bash
# Secrets 확인
kubectl get secret -n openmarket-dev
kubectl get externalsecret -n openmarket-dev

# External Secrets Operator 로그
kubectl logs -n kube-system deployment/external-secrets
```

## 비용 최적화

### Development 환경
- Single NAT Gateway
- 작은 인스턴스 타입 (t3.medium)
- 최소 replica 수
- Spot Instances 고려

### Production 환경
- Multi-AZ NAT Gateway (고가용성)
- 적절한 인스턴스 타입 (c5.xlarge, m5.xlarge)
- Auto Scaling으로 수요에 맞춰 조정
- Reserved Instances 고려

**예상 비용 (월)**:

| 환경 | EKS | EC2 | RDS | ElastiCache | S3/CloudFront | 기타 | 합계 |
|------|-----|-----|-----|-------------|---------------|------|------|
| Dev | $73 | $150 | $140 | $25 | $10 | $20 | ~$418 |
| Prod | $73 | $600 | $560 | $100 | $50 | $50 | ~$1,433 |

## 다음 단계 (Phase 4)

1. **Lambda Functions**
   - 이미지 처리 (리사이징, 썸네일)
   - 이메일 발송
   - 주문 처리 워크플로우
   - 스케줄된 작업 (배치)

2. **EventBridge 통합**
   - 이벤트 기반 아키텍처
   - Lambda 트리거

3. **SQS/SNS 통합**
   - 비동기 메시지 처리
   - 알림 시스템

## 참고 자료

- [Kubernetes 공식 문서](https://kubernetes.io/docs/)
- [Helm 공식 문서](https://helm.sh/docs/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [External Secrets Operator](https://external-secrets.io/)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)

## 요약

Phase 3에서 완성한 것:
- ✅ Kubernetes 매니페스트 (Deployment, Service, HPA, Ingress)
- ✅ IRSA (IAM Roles for Service Accounts)
- ✅ Kustomize 환경별 오버레이 (dev, staging, prod)
- ✅ Helm Charts
- ✅ 배포 스크립트 (deploy-k8s.sh, setup-eks-addons.sh, build-and-push.sh)
- ✅ Network Policies
- ✅ Pod Disruption Budgets
- ✅ External Secrets 통합

이제 Phase 2의 Terraform 인프라를 배포하고, 이 Phase 3 매니페스트를 사용하여 애플리케이션을 EKS에 배포할 수 있습니다!
