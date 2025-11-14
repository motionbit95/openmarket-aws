# OpenMarket Kubernetes 배포 가이드

## 📋 목차
1. [아키텍처 개요](#아키텍처-개요)
2. [사전 요구사항](#사전-요구사항)
3. [배포 순서](#배포-순서)
4. [트러블슈팅](#트러블슈팅)
5. [운영 가이드](#운영-가이드)

## 🏗 아키텍처 개요

### 인프라 구성
- **EKS Cluster**: Kubernetes 1.31
- **Node Group**: t3.medium 인스턴스 (2개)
- **RDS Aurora MySQL**: 8.0 (2 인스턴스)
- **ElastiCache Redis**: 7.0
- **ECR**: Docker 이미지 레지스트리

### 네임스페이스 구조
```
openmarket-dev/
├── backend-api (Deployment)
│   ├── replicas: 3
│   └── port: 3000
├── frontend-web (Deployment)
│   ├── replicas: 2
│   └── port: 3000
└── Services, ConfigMaps, Secrets
```

## 📦 사전 요구사항

### 1. AWS 인증 설정
```bash
aws configure --profile openmarket
aws eks update-kubeconfig --region ap-northeast-2 --name openmarket-dev-eks --profile openmarket
```

### 2. 필수 도구 설치
- kubectl (1.31+)
- helm (3.0+)
- docker (with buildx)
- aws-cli (2.0+)

### 3. ECR 로그인
```bash
aws ecr get-login-password --region ap-northeast-2 --profile openmarket | \
  docker login --username AWS --password-stdin \
  478266318018.dkr.ecr.ap-northeast-2.amazonaws.com
```

## 🚀 배포 순서

### Step 1: 네임스페이스 생성
```bash
kubectl apply -f overlays/dev/namespace.yaml
```

### Step 2: Secrets 생성

#### RDS Credentials
```bash
kubectl create secret generic db-credentials \
  --from-literal=username=admin \
  --from-literal=password=DevPassword123! \
  --from-literal=host=openmarket-dev-aurora-cluster.cluster-c3e8ci0mgsqi.ap-northeast-2.rds.amazonaws.com \
  -n openmarket-dev
```

#### Redis Credentials
```bash
kubectl create secret generic redis-credentials \
  --from-literal=auth_token=<REDIS_AUTH_TOKEN> \
  --from-literal=configuration_endpoint=<REDIS_ENDPOINT>:6379 \
  -n openmarket-dev
```

**중요**: Production 환경에서는 External Secrets Operator를 사용하여 AWS Secrets Manager와 연동하세요.

### Step 3: Docker 이미지 빌드 및 푸시

#### Backend 이미지
```bash
cd backend
docker buildx build --platform linux/amd64 \
  -t 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/openmarket/backend:dev-latest \
  --push -f Dockerfile .
```

#### Frontend 이미지
```bash
cd frontend-web
docker buildx build --platform linux/amd64 \
  -t 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/openmarket/frontend-web:dev-latest \
  --push -f Dockerfile .
```

**주의**: EKS 노드는 x86_64 아키텍처이므로 `--platform linux/amd64` 옵션이 필수입니다.

### Step 4: Helm 차트 배포
```bash
helm install openmarket-dev ./helm/openmarket \
  -f ./helm/openmarket/values.yaml \
  -f ./helm/openmarket/values-dev.yaml \
  --namespace openmarket-dev
```

### Step 5: 배포 상태 확인
```bash
# Pod 상태 확인
kubectl get pods -n openmarket-dev

# 서비스 확인
kubectl get svc -n openmarket-dev

# 로그 확인
kubectl logs -f deployment/backend-api -n openmarket-dev
kubectl logs -f deployment/frontend-web -n openmarket-dev
```

## 🔧 트러블슈팅

### 문제 1: Pod가 Pending 상태

**증상**: Pod가 `Pending` 상태로 유지됨

**원인**: 리소스 부족 (CPU/Memory)

**해결방법**:
```bash
# 노드 리소스 확인
kubectl describe nodes

# HPA 비활성화 (개발 환경)
kubectl delete hpa backend-api-hpa frontend-web-hpa -n openmarket-dev

# 리소스 요청량 감소
# values-dev.yaml에서 resources.requests 값 조정
```

### 문제 2: Init Container 실패 (DATABASE_URL)

**증상**: `Error: P1001: Can't reach database server`

**원인**:
1. 보안 그룹 규칙 누락
2. 잘못된 데이터베이스 자격증명

**해결방법**:
```bash
# 1. 보안 그룹 규칙 확인
aws ec2 describe-security-groups \
  --group-ids sg-055da47d2eeec1b7c \
  --profile openmarket --region ap-northeast-2

# 2. EKS Cluster SG를 RDS SG에 추가
aws ec2 authorize-security-group-ingress \
  --group-id sg-055da47d2eeec1b7c \
  --protocol tcp --port 3306 \
  --source-group sg-07f997c6eb7570d12 \
  --profile openmarket --region ap-northeast-2

# 3. 연결 테스트
kubectl run mysql-test --image=mysql:8.0 -n openmarket-dev -- \
  mysql -h <RDS_HOST> -u admin -p<PASSWORD> -e "SELECT 1"
```

### 문제 3: Frontend OOMKilled

**증상**: Frontend Pod가 `OOMKilled` 상태로 재시작 반복

**원인**: 메모리 제한이 너무 낮음 (Next.js는 최소 256Mi 필요)

**해결방법**:
```yaml
# values-dev.yaml
frontend:
  resources:
    requests:
      memory: "128Mi"
    limits:
      memory: "256Mi"
```

### 문제 4: Health Check 실패

**증상**: Pod는 Running이지만 READY가 0/1

**원인**: Health check 엔드포인트 누락

**해결방법**:

Frontend에 `/api/health` 엔드포인트 추가:
```javascript
// frontend-web/src/app/api/health/route.js
export async function GET() {
  return Response.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'frontend-web',
    },
    { status: 200 }
  );
}
```

Backend에 `/health` 엔드포인트 추가 필요.

### 문제 5: 이미지 Pull 오류

**증상**: `ErrImagePull` 또는 `ImagePullBackOff`

**원인**:
1. ECR 인증 만료
2. 잘못된 이미지 태그
3. 플랫폼 불일치 (ARM vs x86)

**해결방법**:
```bash
# ECR 재로그인
aws ecr get-login-password --region ap-northeast-2 --profile openmarket | \
  docker login --username AWS --password-stdin \
  478266318018.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 확인
aws ecr describe-images \
  --repository-name openmarket/backend \
  --profile openmarket --region ap-northeast-2

# 플랫폼 확인 후 재빌드
docker buildx build --platform linux/amd64 ...
```

## 📊 운영 가이드

### 로그 확인
```bash
# 실시간 로그 스트리밍
kubectl logs -f deployment/backend-api -n openmarket-dev

# 특정 Pod 로그
kubectl logs backend-api-xxxxx -n openmarket-dev

# Init Container 로그
kubectl logs backend-api-xxxxx -c db-migration -n openmarket-dev

# 이전 컨테이너 로그 (재시작된 경우)
kubectl logs backend-api-xxxxx --previous -n openmarket-dev
```

### 스케일링
```bash
# 수동 스케일링
kubectl scale deployment backend-api --replicas=5 -n openmarket-dev

# HPA 활성화 (production)
kubectl autoscale deployment backend-api \
  --min=3 --max=10 \
  --cpu-percent=70 \
  -n openmarket-dev
```

### 롤링 업데이트
```bash
# 이미지 업데이트
kubectl set image deployment/backend-api \
  backend=478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/openmarket/backend:v1.2.0 \
  -n openmarket-dev

# 롤아웃 상태 확인
kubectl rollout status deployment/backend-api -n openmarket-dev

# 롤백
kubectl rollout undo deployment/backend-api -n openmarket-dev
```

### 리소스 사용량 모니터링
```bash
# Pod 리소스 사용량
kubectl top pods -n openmarket-dev

# 노드 리소스 사용량
kubectl top nodes

# Pod 상세 정보
kubectl describe pod backend-api-xxxxx -n openmarket-dev
```

### 디버깅
```bash
# Pod 내부 접속
kubectl exec -it backend-api-xxxxx -n openmarket-dev -- sh

# 특정 컨테이너 접속
kubectl exec -it backend-api-xxxxx -c backend -n openmarket-dev -- sh

# Port Forward (로컬 테스트)
kubectl port-forward deployment/backend-api 3000:3000 -n openmarket-dev
```

### ConfigMap 업데이트
```bash
# ConfigMap 수정
kubectl edit configmap openmarket-dev-config -n openmarket-dev

# Pod 재시작 (ConfigMap 변경사항 적용)
kubectl rollout restart deployment/backend-api -n openmarket-dev
```

### Secret 관리
```bash
# Secret 보기 (base64 디코딩)
kubectl get secret db-credentials -n openmarket-dev -o json | \
  jq -r '.data | map_values(@base64d)'

# Secret 업데이트
kubectl delete secret db-credentials -n openmarket-dev
kubectl create secret generic db-credentials \
  --from-literal=username=admin \
  --from-literal=password=NewPassword123! \
  -n openmarket-dev
```

## 🔒 보안 고려사항

### 1. 네트워크 정책
현재 구성:
- RDS: Private subnet (10.0.20.0/24)
- ElastiCache: Private subnet (10.0.21.0/24)
- EKS Pods: Private subnet (10.0.10.0/24)

필수 보안 그룹 규칙:
```
RDS SG: Allow 3306 from EKS Cluster SG (sg-07f997c6eb7570d12)
ElastiCache SG: Allow 6379 from EKS Cluster SG
```

### 2. IRSA (IAM Roles for Service Accounts)
```yaml
# Backend ServiceAccount
serviceAccount:
  annotations:
    eks.amazonaws.com/role-arn: "arn:aws:iam::478266318018:role/openmarket-dev-backend-irsa"
```

권한:
- S3 버킷 접근 (user-uploads, static-assets)
- Secrets Manager 읽기
- CloudWatch Logs 쓰기

### 3. Secret 관리
**개발 환경**: kubectl로 직접 생성
**운영 환경**: External Secrets Operator 사용 권장

## 📈 성능 최적화

### 리소스 할당 가이드

#### Development
```yaml
backend:
  resources:
    requests: { memory: "64Mi", cpu: "50m" }
    limits: { memory: "128Mi", cpu: "100m" }
frontend:
  resources:
    requests: { memory: "128Mi", cpu: "50m" }
    limits: { memory: "256Mi", cpu: "100m" }
```

#### Production
```yaml
backend:
  resources:
    requests: { memory: "128Mi", cpu: "100m" }
    limits: { memory: "256Mi", cpu: "200m" }
frontend:
  resources:
    requests: { memory: "256Mi", cpu: "100m" }
    limits: { memory: "512Mi", cpu: "200m" }
```

### 프로브 설정
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 60
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 5
```

## 🔄 CI/CD 통합

### GitHub Actions 예시
```yaml
name: Deploy to EKS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2

      - name: Login to Amazon ECR
        run: |
          aws ecr get-login-password --region ap-northeast-2 | \
            docker login --username AWS --password-stdin 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com

      - name: Build and push
        run: |
          docker buildx build --platform linux/amd64 \
            -t 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/openmarket/backend:${{ github.sha }} \
            --push ./backend

      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name openmarket-dev-eks --region ap-northeast-2

      - name: Deploy to EKS
        run: |
          kubectl set image deployment/backend-api \
            backend=478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/openmarket/backend:${{ github.sha }} \
            -n openmarket-dev
```

## 📝 체크리스트

### 배포 전
- [ ] ECR 로그인 완료
- [ ] Docker 이미지 빌드 및 푸시 완료
- [ ] Secrets 생성 완료
- [ ] 보안 그룹 규칙 확인
- [ ] Helm values 파일 검증

### 배포 후
- [ ] Pod 상태 확인 (모두 Running)
- [ ] 로그 확인 (에러 없음)
- [ ] Health check 통과
- [ ] 서비스 연결 테스트
- [ ] 데이터베이스 연결 확인

## 🆘 긴급 대응

### 서비스 다운 시
```bash
# 1. 즉시 이전 버전으로 롤백
kubectl rollout undo deployment/backend-api -n openmarket-dev

# 2. 로그 수집
kubectl logs deployment/backend-api -n openmarket-dev > backend-error.log

# 3. 이벤트 확인
kubectl get events -n openmarket-dev --sort-by='.lastTimestamp'
```

### 데이터베이스 연결 실패 시
```bash
# 1. 보안 그룹 확인
aws ec2 describe-security-groups --group-ids sg-055da47d2eeec1b7c

# 2. RDS 상태 확인
aws rds describe-db-clusters --db-cluster-identifier openmarket-dev-aurora-cluster

# 3. 네트워크 연결 테스트
kubectl run netcat-test --image=busybox -n openmarket-dev -- \
  nc -zv <RDS_HOST> 3306
```

## 📚 참고 자료
- [Kubernetes 공식 문서](https://kubernetes.io/docs/)
- [Helm 공식 문서](https://helm.sh/docs/)
- [AWS EKS 문서](https://docs.aws.amazon.com/eks/)
- [Prisma 문서](https://www.prisma.io/docs/)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
