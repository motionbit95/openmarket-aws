# ✅ OpenMarket 배포 체크리스트

빠른 참조용 단계별 배포 체크리스트입니다.

---

## 📋 사전 준비 (10분)

### AWS 계정 및 자격 증명
- [ ] AWS 계정 생성 완료
- [ ] AWS CLI 설치 및 구성
  ```bash
  aws configure
  aws sts get-caller-identity  # 확인
  ```
- [ ] IAM 사용자 권한 확인 (AdministratorAccess 또는 필요한 권한)

### 필수 도구 설치
- [ ] Terraform >= 1.5.0
  ```bash
  terraform --version
  ```
- [ ] kubectl >= 1.28
  ```bash
  kubectl version --client
  ```
- [ ] Docker >= 24.x
  ```bash
  docker --version
  ```
- [ ] Node.js >= 18.x
  ```bash
  node --version
  ```
- [ ] AWS CLI >= 2.x
  ```bash
  aws --version
  ```

### 저장소 클론
- [ ] Git 저장소 클론
  ```bash
  git clone <repository-url>
  cd openmarket-aws
  ```

---

## 🏗️ Phase 1: 인프라 배포 (60-90분)

### Terraform 백엔드 설정
- [ ] S3 버킷 생성 (Terraform 상태 저장용)
  ```bash
  aws s3api create-bucket \
    --bucket openmarket-dev-terraform-state-478266318018 \
    --region ap-northeast-2 \
    --create-bucket-configuration LocationConstraint=ap-northeast-2
  ```
- [ ] S3 버전 관리 활성화
  ```bash
  aws s3api put-bucket-versioning \
    --bucket openmarket-dev-terraform-state-478266318018 \
    --versioning-configuration Status=Enabled
  ```
- [ ] DynamoDB 테이블 생성 (상태 잠금용)
  ```bash
  aws dynamodb create-table \
    --table-name openmarket-terraform-lock \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region ap-northeast-2
  ```

### Terraform 초기화 및 배포
- [ ] Terraform 작업 디렉토리 이동
  ```bash
  cd infrastructure/terraform/environments/dev
  ```
- [ ] Terraform 초기화
  ```bash
  terraform init
  ```
- [ ] Terraform 계획 검토
  ```bash
  terraform plan
  ```
- [ ] Terraform 배포 실행
  ```bash
  terraform apply  # yes 입력
  ```
- [ ] 배포 완료 확인 (60-90분 소요)
  - [ ] VPC 생성 완료
  - [ ] EKS 클러스터 생성 완료 (10-15분)
  - [ ] RDS Aurora 생성 완료 (10-15분)
  - [ ] ElastiCache Redis 생성 완료
  - [ ] S3 버킷 생성 완료
  - [ ] ECR 레포지토리 생성 완료

### Terraform 출력 저장
- [ ] 중요한 출력 값 저장
  ```bash
  terraform output > ../../outputs.txt
  ```
- [ ] RDS 엔드포인트 확인
  ```bash
  terraform output rds_cluster_endpoint
  ```
- [ ] Redis 엔드포인트 확인
  ```bash
  terraform output redis_endpoint
  ```

---

## ⚙️ Phase 2: EKS 설정 (20-30분)

### Kubeconfig 설정
- [ ] EKS 클러스터 kubeconfig 업데이트
  ```bash
  aws eks update-kubeconfig \
    --name openmarket-dev-eks \
    --region ap-northeast-2
  ```
- [ ] 연결 확인
  ```bash
  kubectl get nodes
  ```

### EKS Add-ons 설치
- [ ] AWS Load Balancer Controller 설치
  ```bash
  # OIDC Provider 생성
  eksctl utils associate-iam-oidc-provider \
    --cluster openmarket-dev-eks \
    --region ap-northeast-2 \
    --approve

  # Helm으로 설치
  helm repo add eks https://aws.github.io/eks-charts
  helm repo update
  helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    -n kube-system \
    --set clusterName=openmarket-dev-eks \
    --set serviceAccount.create=true \
    --set serviceAccount.name=aws-load-balancer-controller
  ```
- [ ] Controller Pod 확인
  ```bash
  kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
  ```

### 네임스페이스 생성
- [ ] 네임스페이스 적용
  ```bash
  kubectl apply -f k8s/overlays/dev/namespace.yaml
  kubectl apply -f k8s/overlays/dev/serviceaccount.yaml
  ```

---

## 🐳 Phase 3: Docker 이미지 빌드 (20-30분)

### ECR 로그인
- [ ] ECR 레포지토리 URI 확인
  ```bash
  aws ecr describe-repositories --repository-names openmarket/backend openmarket/frontend-web
  ```
- [ ] ECR 로그인
  ```bash
  aws ecr get-login-password --region ap-northeast-2 | \
    docker login --username AWS --password-stdin 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com
  ```

### Backend 이미지 빌드
- [ ] Backend 디렉토리 이동
  ```bash
  cd apps/backend
  ```
- [ ] .env 파일 생성 (RDS, Redis 정보 입력)
  ```bash
  cp .env.example .env
  # .env 파일 편집
  ```
- [ ] Docker 이미지 빌드
  ```bash
  docker build -t openmarket/backend:dev-latest .
  ```
- [ ] 이미지 태그
  ```bash
  docker tag openmarket/backend:dev-latest \
    478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/openmarket/backend:dev-latest
  ```
- [ ] ECR에 푸시
  ```bash
  docker push 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/openmarket/backend:dev-latest
  ```

### Frontend 이미지 빌드
- [ ] Frontend 디렉토리 이동
  ```bash
  cd ../frontend-web
  ```
- [ ] .env 파일 생성
  ```bash
  cp .env.example .env
  # .env 파일 편집
  ```
- [ ] Docker 이미지 빌드
  ```bash
  docker build -t openmarket/frontend-web:dev-latest .
  ```
- [ ] 이미지 태그
  ```bash
  docker tag openmarket/frontend-web:dev-latest \
    478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/openmarket/frontend-web:dev-latest
  ```
- [ ] ECR에 푸시
  ```bash
  docker push 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/openmarket/frontend-web:dev-latest
  ```

---

## 🚀 Phase 4: Kubernetes 배포 (30-40분)

### ConfigMap 및 Secret 생성
- [ ] Backend ConfigMap 수정
  ```bash
  # k8s/overlays/dev/backend-config.yaml 편집
  # RDS, Redis 엔드포인트 입력
  ```
- [ ] Backend Secret 생성 (Base64 인코딩)
  ```bash
  echo -n 'your-db-password' | base64
  # k8s/overlays/dev/backend-secrets.yaml 편집
  ```
- [ ] ConfigMap/Secret 적용
  ```bash
  kubectl apply -k k8s/overlays/dev
  ```

### 애플리케이션 배포
- [ ] Kustomize로 전체 배포
  ```bash
  kubectl apply -k k8s/overlays/dev
  ```
- [ ] 배포 확인
  ```bash
  kubectl get all -n openmarket-dev
  ```

### Pod 상태 확인
- [ ] 모든 Pod가 Running 상태 확인
  ```bash
  kubectl get pods -n openmarket-dev
  ```
- [ ] Pod 로그 확인 (오류 있을 경우)
  ```bash
  kubectl logs -l app=backend -n openmarket-dev --tail=50
  kubectl logs -l app=frontend -n openmarket-dev --tail=50
  ```

### 데이터베이스 마이그레이션
- [ ] Backend Pod에서 마이그레이션 실행
  ```bash
  BACKEND_POD=$(kubectl get pods -n openmarket-dev -l app=backend -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -it $BACKEND_POD -n openmarket-dev -- npm run migrate
  ```
- [ ] 시드 데이터 삽입 (옵션)
  ```bash
  kubectl exec -it $BACKEND_POD -n openmarket-dev -- npm run seed
  ```

### Ingress 확인
- [ ] Ingress 생성 확인
  ```bash
  kubectl get ingress -n openmarket-dev
  ```
- [ ] ALB DNS 가져오기
  ```bash
  ALB_DNS=$(kubectl get ingress openmarket-ingress -n openmarket-dev \
    -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
  echo "ALB DNS: $ALB_DNS"
  ```
- [ ] ALB 생성 대기 (5-10분)
  ```bash
  aws elbv2 describe-load-balancers \
    --query 'LoadBalancers[?contains(LoadBalancerName, `k8s-openmake`)]'
  ```

---

## ⚡ Phase 5: Lambda 함수 배포 (20-30분)

### Lambda 함수 디렉토리 이동
- [ ] Lambda 디렉토리로 이동
  ```bash
  cd infrastructure/terraform/environments/dev
  ```

### Lambda 배포 (Terraform으로 관리되는 경우)
- [ ] Lambda 모듈 확인
  ```bash
  terraform plan -target=module.lambda
  ```
- [ ] Lambda 배포
  ```bash
  terraform apply -target=module.lambda
  ```

### Lambda 함수 확인
- [ ] 4개 함수 모두 생성 확인
  ```bash
  aws lambda list-functions \
    --query 'Functions[?contains(FunctionName, `openmarket-dev`)].[FunctionName,Runtime,State]' \
    --output table
  ```
- [ ] 각 함수 상태가 Active인지 확인

### Lambda 환경 변수 설정
- [ ] Image Processor 환경 변수 확인
- [ ] Order Notification 환경 변수 확인
- [ ] Report Generator 환경 변수 확인
- [ ] Data Sync 환경 변수 확인

---

## 📊 Phase 6: 모니터링 스택 배포 (15-20분)

### 모니터링 네임스페이스 생성
- [ ] Monitoring 네임스페이스 생성
  ```bash
  kubectl apply -f k8s/monitoring/namespace.yaml
  ```

### Prometheus 배포
- [ ] Prometheus ConfigMap 적용
  ```bash
  kubectl apply -f k8s/monitoring/prometheus/configmap.yaml
  ```
- [ ] Prometheus Deployment 적용
  ```bash
  kubectl apply -f k8s/monitoring/prometheus/deployment.yaml
  kubectl apply -f k8s/monitoring/prometheus/service.yaml
  ```
- [ ] Prometheus Pod 확인
  ```bash
  kubectl get pods -n monitoring -l app=prometheus
  ```

### Grafana 배포
- [ ] Grafana ConfigMap 적용 (Datasources, Dashboards)
  ```bash
  kubectl apply -f k8s/monitoring/grafana/configmap-datasources.yaml
  kubectl apply -f k8s/monitoring/grafana/configmap-dashboards-provider.yaml
  kubectl apply -f k8s/monitoring/grafana/configmap-dashboards.yaml
  ```
- [ ] Grafana Deployment 적용
  ```bash
  kubectl apply -f k8s/monitoring/grafana/deployment.yaml
  kubectl apply -f k8s/monitoring/grafana/service.yaml
  ```
- [ ] Grafana Pod 확인
  ```bash
  kubectl get pods -n monitoring -l app=grafana
  ```

### Alertmanager 배포
- [ ] Slack Webhook Secret 생성 (옵션)
  ```bash
  kubectl create secret generic alertmanager-secrets \
    --from-literal=slack-webhook-url='YOUR_WEBHOOK_URL' \
    -n monitoring
  ```
- [ ] Alertmanager ConfigMap 적용
  ```bash
  kubectl apply -f k8s/monitoring/alertmanager/configmap.yaml
  ```
- [ ] Alertmanager Deployment 적용
  ```bash
  kubectl apply -f k8s/monitoring/alertmanager/deployment.yaml
  kubectl apply -f k8s/monitoring/alertmanager/service.yaml
  ```

### Node Exporter 배포
- [ ] Node Exporter DaemonSet 적용
  ```bash
  kubectl apply -f k8s/monitoring/node-exporter/daemonset.yaml
  kubectl apply -f k8s/monitoring/node-exporter/service.yaml
  ```
- [ ] 모든 노드에 Pod 실행 확인
  ```bash
  kubectl get pods -n monitoring -l app=node-exporter
  ```

### Kube State Metrics 배포
- [ ] Kube State Metrics Deployment 적용
  ```bash
  kubectl apply -f k8s/monitoring/kube-state-metrics/deployment.yaml
  kubectl apply -f k8s/monitoring/kube-state-metrics/service.yaml
  ```

### Fluent Bit 배포
- [ ] Fluent Bit ConfigMap 적용
  ```bash
  kubectl apply -f k8s/monitoring/fluent-bit/configmap.yaml
  ```
- [ ] Fluent Bit DaemonSet 적용
  ```bash
  kubectl apply -f k8s/monitoring/fluent-bit/daemonset.yaml
  ```
- [ ] CloudWatch Logs 확인
  ```bash
  aws logs describe-log-groups --log-group-name-prefix /aws/eks/openmarket
  ```

### CloudWatch 대시보드 및 알람 생성
- [ ] CloudWatch 모듈 배포
  ```bash
  cd infrastructure/terraform/environments/dev
  terraform apply -target=module.cloudwatch
  ```
- [ ] CloudWatch 대시보드 확인
  ```bash
  aws cloudwatch list-dashboards
  ```
- [ ] CloudWatch 알람 확인
  ```bash
  aws cloudwatch describe-alarms --alarm-name-prefix openmarket-dev
  ```

---

## 🔄 Phase 7: CI/CD 파이프라인 설정 (30분)

### GitHub Secrets 설정
- [ ] GitHub 저장소 Settings → Secrets and variables → Actions
- [ ] 다음 Secrets 추가:
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `AWS_REGION` (ap-northeast-2)
  - [ ] `ECR_REGISTRY` (478266318018.dkr.ecr.ap-northeast-2.amazonaws.com)
  - [ ] `EKS_CLUSTER_NAME` (openmarket-dev-eks)

### GitHub Actions Workflow 확인
- [ ] `.github/workflows/backend-ci.yml` 확인
- [ ] `.github/workflows/frontend-ci.yml` 확인
- [ ] `.github/workflows/lambda-ci.yml` 확인

### 첫 번째 배포 테스트
- [ ] 코드 변경 및 푸시
  ```bash
  git add .
  git commit -m "Initial deployment"
  git push origin main
  ```
- [ ] GitHub Actions 실행 확인
  - [ ] Backend CI/CD 성공
  - [ ] Frontend CI/CD 성공
  - [ ] Lambda CI/CD 성공

---

## ✅ Phase 8: 최종 검증 (30-45분)

### 인프라 검증
- [ ] VPC 및 서브넷 확인
  ```bash
  aws ec2 describe-vpcs --filters "Name=tag:Name,Values=openmarket-dev-vpc"
  ```
- [ ] EKS 클러스터 상태 확인
  ```bash
  aws eks describe-cluster --name openmarket-dev-eks --query 'cluster.status'
  ```
- [ ] RDS 상태 확인
  ```bash
  aws rds describe-db-clusters --db-cluster-identifier openmarket-dev-aurora-cluster
  ```
- [ ] Redis 상태 확인
  ```bash
  aws elasticache describe-replication-groups --replication-group-id openmarket-dev-redis
  ```

### 애플리케이션 테스트
- [ ] API 헬스체크
  ```bash
  curl http://$ALB_DNS/api/health
  ```
- [ ] 회원가입 테스트
  ```bash
  curl -X POST http://$ALB_DNS/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test1234!","name":"Test User"}'
  ```
- [ ] 로그인 테스트
  ```bash
  curl -X POST http://$ALB_DNS/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test1234!"}'
  ```
- [ ] 상품 목록 조회
  ```bash
  curl http://$ALB_DNS/api/products
  ```
- [ ] 프론트엔드 접속
  ```bash
  echo "브라우저에서 http://$ALB_DNS 접속"
  ```

### 모니터링 확인
- [ ] Prometheus 접속
  ```bash
  kubectl port-forward -n monitoring svc/prometheus 9090:9090
  # http://localhost:9090
  ```
- [ ] Grafana 접속
  ```bash
  kubectl port-forward -n monitoring svc/grafana 3000:3000
  # http://localhost:3000 (admin / openmarket2024!)
  ```
- [ ] CloudWatch 대시보드 확인
  ```bash
  # AWS Console → CloudWatch → Dashboards
  ```

### 로그 확인
- [ ] 애플리케이션 로그
  ```bash
  kubectl logs -l app=backend -n openmarket-dev --tail=50
  ```
- [ ] CloudWatch Logs
  ```bash
  aws logs tail /aws/eks/openmarket-dev/application --follow
  ```

### 성능 테스트
- [ ] 간단한 부하 테스트
  ```bash
  ab -n 100 -c 10 http://$ALB_DNS/api/health
  ```
- [ ] API 응답 시간 확인 (< 500ms)

---

## 📝 배포 후 작업

### 문서화
- [ ] Terraform outputs 저장
- [ ] ALB DNS 기록
- [ ] RDS/Redis 엔드포인트 기록
- [ ] Grafana 로그인 정보 안전하게 저장

### 백업 설정
- [ ] RDS 자동 백업 확인 (7일)
- [ ] S3 버전 관리 활성화 확인
- [ ] Terraform 상태 파일 백업

### 보안 강화
- [ ] IAM 역할 최소 권한 검토
- [ ] 보안 그룹 규칙 검토
- [ ] Secret 암호화 확인
- [ ] SSL/TLS 인증서 설정 (프로덕션)

### 알림 설정
- [ ] CloudWatch 알람 SNS 구독
- [ ] Slack Webhook 설정 (Alertmanager)
- [ ] 이메일 알림 설정

### 비용 최적화
- [ ] COST_OPTIMIZATION.md 검토
- [ ] Dev 환경 스케줄링 설정 (야간/주말 종료)
- [ ] AWS Budgets 설정
  ```bash
  # AWS Console → Billing → Budgets → Create budget
  # 월 $500 예산 설정
  ```

---

## 🚨 트러블슈팅

### EKS 노드가 Ready 상태가 아님
```bash
kubectl describe node <node-name>
aws eks update-nodegroup-version --cluster-name openmarket-dev-eks --nodegroup-name openmarket-dev-node-group
```

### Pod가 ImagePullBackOff
```bash
# ECR 로그인 재시도
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com
# 이미지 재푸시
```

### ALB가 생성되지 않음
```bash
# AWS Load Balancer Controller 로그 확인
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
```

### RDS 연결 실패
```bash
# 보안 그룹 확인
# EKS 노드 보안 그룹이 RDS 보안 그룹의 인바운드 규칙에 있는지 확인
```

---

## 📊 배포 완료 체크리스트

### 필수 항목
- [ ] 모든 인프라 리소스 생성 완료
- [ ] EKS 클러스터 ACTIVE
- [ ] Backend/Frontend Pod Running (각 2개 이상)
- [ ] Ingress ALB 생성 완료
- [ ] API 헬스체크 성공
- [ ] 프론트엔드 브라우저 접속 성공
- [ ] Lambda 함수 4개 모두 Active
- [ ] 모니터링 스택 실행 중
- [ ] CI/CD 파이프라인 설정 완료

### 권장 항목
- [ ] HTTPS 설정 (프로덕션)
- [ ] 도메인 연결 (Route 53)
- [ ] WAF 설정
- [ ] CloudFront 배포
- [ ] 백업 자동화
- [ ] 비용 알림 설정
- [ ] 성능 모니터링 대시보드
- [ ] 로그 보관 정책 설정

---

**배포 소요 시간**: 약 4-5시간
**유지보수 비용**: 월 $313 (최적화 후)
**다음 단계**: COST_OPTIMIZATION.md 참고하여 비용 최적화

**참고 문서**:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 상세 배포 가이드
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API 문서
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - 테스트 가이드
- [k8s/monitoring/README.md](./k8s/monitoring/README.md) - 모니터링 가이드
- [COST_OPTIMIZATION.md](./infrastructure/COST_OPTIMIZATION.md) - 비용 최적화

---

**최종 업데이트**: 2025-01-15
**버전**: 1.0.0
