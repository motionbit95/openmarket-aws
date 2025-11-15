# 🧪 OpenMarket 테스트 가이드

전체 시스템의 End-to-End 테스트 가이드입니다.

## 📋 목차

- [테스트 개요](#-테스트-개요)
- [사전 요구사항](#-사전-요구사항)
- [1단계: 인프라 검증](#1단계-인프라-검증)
- [2단계: 데이터베이스 연결 테스트](#2단계-데이터베이스-연결-테스트)
- [3단계: Kubernetes 배포 테스트](#3단계-kubernetes-배포-테스트)
- [4단계: API 엔드포인트 테스트](#4단계-api-엔드포인트-테스트)
- [5단계: 프론트엔드 테스트](#5단계-프론트엔드-테스트)
- [6단계: Lambda 함수 테스트](#6단계-lambda-함수-테스트)
- [7단계: 모니터링 스택 테스트](#7단계-모니터링-스택-테스트)
- [8단계: 성능 테스트](#8단계-성능-테스트)
- [9단계: 보안 테스트](#9단계-보안-테스트)
- [자동화 테스트 스크립트](#-자동화-테스트-스크립트)

---

## 🎯 테스트 개요

### 테스트 범위

| 테스트 유형 | 대상 | 소요 시간 |
|------------|------|----------|
| 인프라 검증 | VPC, EKS, RDS, ElastiCache, S3 | 10분 |
| 데이터베이스 연결 | RDS Aurora, ElastiCache Redis | 10분 |
| Kubernetes 배포 | Pod, Service, Ingress | 15분 |
| API 엔드포인트 | REST API 모든 엔드포인트 | 20분 |
| 프론트엔드 | UI 동작 및 렌더링 | 15분 |
| Lambda 함수 | 4개 Lambda 함수 | 10분 |
| 모니터링 스택 | Prometheus, Grafana, Alertmanager | 10분 |
| 성능 테스트 | 부하 테스트, 응답 시간 | 20분 |
| 보안 테스트 | 취약점 스캔, 인증/인가 | 15분 |
| **총 소요 시간** | | **2시간 5분** |

### 테스트 환경

```
Environment: dev
Region: ap-northeast-2
EKS Cluster: openmarket-dev-eks
RDS Endpoint: openmarket-dev-aurora-cluster.cluster-c3e8ci0mgsqi.ap-northeast-2.rds.amazonaws.com
```

---

## ✅ 사전 요구사항

### 1. 필수 도구 설치 확인

```bash
# AWS CLI
aws --version  # >= 2.x

# kubectl
kubectl version --client  # >= 1.28

# Docker
docker --version  # >= 24.x

# curl
curl --version

# jq (JSON 처리)
jq --version
```

### 2. AWS 자격 증명 확인

```bash
# 현재 AWS 계정 확인
aws sts get-caller-identity

# 출력 예시:
# {
#     "UserId": "AIDAI...",
#     "Account": "478266318018",
#     "Arn": "arn:aws:iam::478266318018:user/admin"
# }
```

### 3. Kubernetes 컨텍스트 설정

```bash
# EKS 클러스터 kubeconfig 업데이트
aws eks update-kubeconfig --name openmarket-dev-eks --region ap-northeast-2

# 현재 컨텍스트 확인
kubectl config current-context

# 네임스페이스 확인
kubectl get namespaces
```

---

## 1단계: 인프라 검증

### 1.1 VPC 및 네트워크 확인

```bash
# VPC 확인
aws ec2 describe-vpcs \
  --filters "Name=tag:Name,Values=openmarket-dev-vpc" \
  --query 'Vpcs[0].[VpcId,CidrBlock,State]' \
  --output table

# 서브넷 확인 (6개 예상)
aws ec2 describe-subnets \
  --filters "Name=tag:Project,Values=openmarket" \
  --query 'Subnets[*].[SubnetId,CidrBlock,AvailabilityZone,Tags[?Key==`Name`].Value|[0]]' \
  --output table

# NAT Gateway 확인 (2개 예상)
aws ec2 describe-nat-gateways \
  --filter "Name=tag:Project,Values=openmarket" \
  --query 'NatGateways[*].[NatGatewayId,State,SubnetId]' \
  --output table
```

**예상 결과**:
- VPC: 1개 (10.0.0.0/16)
- Public Subnets: 2개
- Private Subnets: 2개
- Database Subnets: 2개
- NAT Gateways: 2개 (available)

### 1.2 EKS 클러스터 확인

```bash
# EKS 클러스터 상태
aws eks describe-cluster \
  --name openmarket-dev-eks \
  --query 'cluster.[name,status,version,endpoint]' \
  --output table

# Node Group 확인
aws eks describe-nodegroup \
  --cluster-name openmarket-dev-eks \
  --nodegroup-name openmarket-dev-node-group \
  --query 'nodegroup.[nodegroupName,status,scalingConfig,instanceTypes]' \
  --output table

# 노드 확인
kubectl get nodes -o wide
```

**예상 결과**:
- Cluster Status: ACTIVE
- Version: 1.28
- Node Group: ACTIVE
- Nodes: 2개 이상 (Ready 상태)

### 1.3 RDS Aurora 확인

```bash
# RDS 클러스터 상태
aws rds describe-db-clusters \
  --db-cluster-identifier openmarket-dev-aurora-cluster \
  --query 'DBClusters[0].[DBClusterIdentifier,Status,Engine,EngineVersion,Endpoint]' \
  --output table

# RDS 인스턴스 확인
aws rds describe-db-instances \
  --filters "Name=db-cluster-id,Values=openmarket-dev-aurora-cluster" \
  --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus,DBInstanceClass,AvailabilityZone]' \
  --output table
```

**예상 결과**:
- Cluster Status: available
- Engine: aurora-mysql
- Instances: 2개 이상 (available)

### 1.4 ElastiCache Redis 확인

```bash
# Redis 클러스터 상태
aws elasticache describe-replication-groups \
  --replication-group-id openmarket-dev-redis \
  --query 'ReplicationGroups[0].[ReplicationGroupId,Status,CacheNodeType,MemberClusters]' \
  --output table

# Redis 엔드포인트 확인
aws elasticache describe-replication-groups \
  --replication-group-id openmarket-dev-redis \
  --query 'ReplicationGroups[0].NodeGroups[0].PrimaryEndpoint.{Address:Address,Port:Port}' \
  --output table
```

**예상 결과**:
- Status: available
- Node Type: cache.t3.micro
- Primary Endpoint: 존재

### 1.5 S3 버킷 확인

```bash
# S3 버킷 목록
aws s3 ls | grep openmarket-dev

# 각 버킷 상세 정보
aws s3api list-buckets \
  --query 'Buckets[?contains(Name, `openmarket-dev`)].[Name,CreationDate]' \
  --output table

# 버킷 버저닝 확인
aws s3api get-bucket-versioning --bucket openmarket-dev-uploads-478266318018
```

**예상 결과**:
- openmarket-dev-terraform-state-478266318018
- openmarket-dev-uploads-478266318018
- openmarket-dev-logs-478266318018

### 1.6 ECR 레포지토리 확인

```bash
# ECR 레포지토리 목록
aws ecr describe-repositories \
  --query 'repositories[*].[repositoryName,repositoryUri,createdAt]' \
  --output table

# 이미지 확인
aws ecr list-images --repository-name openmarket/backend --max-items 5
aws ecr list-images --repository-name openmarket/frontend-web --max-items 5
```

**예상 결과**:
- openmarket/backend: 이미지 존재
- openmarket/frontend-web: 이미지 존재

---

## 2단계: 데이터베이스 연결 테스트

### 2.1 RDS Aurora MySQL 연결 테스트

```bash
# RDS 엔드포인트 가져오기
RDS_ENDPOINT=$(aws rds describe-db-clusters \
  --db-cluster-identifier openmarket-dev-aurora-cluster \
  --query 'DBClusters[0].Endpoint' \
  --output text)

echo "RDS Endpoint: $RDS_ENDPOINT"

# Kubernetes에서 MySQL 클라이언트로 연결 테스트
kubectl run mysql-test \
  --image=mysql:8.0 \
  --rm -it \
  --restart=Never \
  -n openmarket-dev \
  -- mysql -h $RDS_ENDPOINT -u admin -p

# 연결 후 실행할 SQL:
# SHOW DATABASES;
# USE openmarket;
# SHOW TABLES;
# SELECT COUNT(*) FROM users;
# EXIT;
```

**예상 결과**:
- 연결 성공
- openmarket 데이터베이스 존재
- 테이블 존재 (users, products, orders 등)

### 2.2 ElastiCache Redis 연결 테스트

```bash
# Redis 엔드포인트 가져오기
REDIS_ENDPOINT=$(aws elasticache describe-replication-groups \
  --replication-group-id openmarket-dev-redis \
  --query 'ReplicationGroups[0].NodeGroups[0].PrimaryEndpoint.Address' \
  --output text)

echo "Redis Endpoint: $REDIS_ENDPOINT"

# Kubernetes에서 Redis CLI로 연결 테스트
kubectl run redis-test \
  --image=redis:7-alpine \
  --rm -it \
  --restart=Never \
  -n openmarket-dev \
  -- redis-cli -h $REDIS_ENDPOINT

# 연결 후 실행할 명령:
# PING
# INFO server
# SET test "Hello OpenMarket"
# GET test
# DEL test
# EXIT
```

**예상 결과**:
- PING → PONG
- SET/GET 성공
- Redis 버전 7.x

---

## 3단계: Kubernetes 배포 테스트

### 3.1 네임스페이스 확인

```bash
# 모든 네임스페이스 확인
kubectl get namespaces

# OpenMarket 네임스페이스 상세
kubectl describe namespace openmarket-dev
```

**예상 결과**:
- openmarket-dev: Active
- monitoring: Active

### 3.2 Pod 상태 확인

```bash
# 모든 Pod 확인
kubectl get pods -n openmarket-dev -o wide

# Pod 상태 요약
kubectl get pods -n openmarket-dev \
  --field-selector=status.phase=Running \
  --no-headers | wc -l

# 비정상 Pod 확인
kubectl get pods -n openmarket-dev \
  --field-selector=status.phase!=Running,status.phase!=Succeeded
```

**예상 결과**:
- backend: 2개 (Running)
- frontend: 2개 (Running)
- 모든 Pod: Ready 1/1

### 3.3 Service 확인

```bash
# 모든 Service 확인
kubectl get svc -n openmarket-dev

# Backend Service 상세
kubectl describe svc backend -n openmarket-dev

# Frontend Service 상세
kubectl describe svc frontend -n openmarket-dev

# Endpoints 확인
kubectl get endpoints -n openmarket-dev
```

**예상 결과**:
- backend: ClusterIP (Port 3001)
- frontend: ClusterIP (Port 3000)
- Endpoints: Pod IP 존재

### 3.4 Ingress 확인

```bash
# Ingress 목록
kubectl get ingress -n openmarket-dev

# Ingress 상세
kubectl describe ingress openmarket-ingress -n openmarket-dev

# ALB 생성 확인
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[?contains(LoadBalancerName, `k8s-openmake`)].[LoadBalancerName,DNSName,State.Code]' \
  --output table
```

**예상 결과**:
- Ingress: ADDRESS 값 존재 (ALB DNS)
- ALB State: active

### 3.5 ConfigMap 및 Secret 확인

```bash
# ConfigMap 목록
kubectl get configmap -n openmarket-dev

# ConfigMap 내용 확인
kubectl describe configmap backend-config -n openmarket-dev
kubectl describe configmap frontend-config -n openmarket-dev

# Secret 목록 (값은 표시되지 않음)
kubectl get secrets -n openmarket-dev

# Secret 키 확인
kubectl get secret backend-secrets -n openmarket-dev -o jsonpath='{.data}' | jq 'keys'
```

**예상 결과**:
- backend-config: 환경 변수 존재
- frontend-config: 환경 변수 존재
- backend-secrets: DB 자격 증명 존재

### 3.6 PersistentVolumeClaim 확인

```bash
# PVC 목록
kubectl get pvc -n openmarket-dev

# PVC 상세
kubectl describe pvc -n openmarket-dev
```

---

## 4단계: API 엔드포인트 테스트

### 4.1 ALB 엔드포인트 가져오기

```bash
# Ingress에서 ALB DNS 가져오기
ALB_DNS=$(kubectl get ingress openmarket-ingress -n openmarket-dev \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "ALB DNS: $ALB_DNS"

# ALB 상태 확인
curl -I http://$ALB_DNS
```

### 4.2 헬스체크 테스트

```bash
# Backend 헬스체크
curl -s http://$ALB_DNS/api/health | jq '.'

# 예상 출력:
# {
#   "status": "healthy",
#   "timestamp": "2025-01-15T12:00:00.000Z",
#   "uptime": 3600,
#   "database": "connected",
#   "redis": "connected"
# }

# Frontend 헬스체크
curl -I http://$ALB_DNS/

# 예상: HTTP 200 OK
```

### 4.3 인증 API 테스트

```bash
# 1. 회원가입
REGISTER_RESPONSE=$(curl -s -X POST http://$ALB_DNS/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "name": "Test User",
    "phone": "010-1234-5678"
  }')

echo $REGISTER_RESPONSE | jq '.'

# 2. 로그인
LOGIN_RESPONSE=$(curl -s -X POST http://$ALB_DNS/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }')

echo $LOGIN_RESPONSE | jq '.'

# 액세스 토큰 추출
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')
echo "Access Token: $ACCESS_TOKEN"
```

### 4.4 상품 API 테스트

```bash
# 상품 목록 조회 (인증 불필요)
curl -s http://$ALB_DNS/api/products?page=1&limit=10 | jq '.'

# 상품 상세 조회
curl -s http://$ALB_DNS/api/products/1 | jq '.'

# 카테고리 목록
curl -s http://$ALB_DNS/api/categories | jq '.'
```

### 4.5 사용자 API 테스트

```bash
# 내 프로필 조회 (인증 필요)
curl -s http://$ALB_DNS/api/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

# 프로필 수정
curl -s -X PUT http://$ALB_DNS/api/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "phone": "010-9999-8888"
  }' | jq '.'
```

### 4.6 장바구니 API 테스트

```bash
# 장바구니 조회
curl -s http://$ALB_DNS/api/cart \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

# 장바구니에 상품 추가
curl -s -X POST http://$ALB_DNS/api/cart \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 2
  }' | jq '.'

# 장바구니 수량 변경
curl -s -X PUT http://$ALB_DNS/api/cart/1 \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 3
  }' | jq '.'
```

### 4.7 주문 API 테스트

```bash
# 주문 생성
ORDER_RESPONSE=$(curl -s -X POST http://$ALB_DNS/api/orders \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": 1,
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "recipient": "Test User",
      "phone": "010-1234-5678",
      "address": "서울시 강남구 테헤란로 123",
      "zipCode": "12345"
    },
    "paymentMethod": "CARD"
  }')

echo $ORDER_RESPONSE | jq '.'

# 주문 ID 추출
ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.id')

# 주문 목록 조회
curl -s http://$ALB_DNS/api/orders \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

# 주문 상세 조회
curl -s http://$ALB_DNS/api/orders/$ORDER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

### 4.8 API 응답 시간 측정

```bash
# 여러 엔드포인트 응답 시간 측정
for endpoint in "/api/health" "/api/products" "/api/categories"; do
  echo "Testing $endpoint..."
  curl -w "Response time: %{time_total}s\n" -o /dev/null -s http://$ALB_DNS$endpoint
done
```

**예상 결과**:
- 모든 API: HTTP 200 OK
- 응답 시간: < 500ms (헬스체크 < 100ms)
- JSON 형식 응답

---

## 5단계: 프론트엔드 테스트

### 5.1 정적 파일 제공 확인

```bash
# HTML 파일 확인
curl -I http://$ALB_DNS/

# CSS/JS 파일 확인
curl -I http://$ALB_DNS/static/css/main.css
curl -I http://$ALB_DNS/static/js/main.js

# Favicon 확인
curl -I http://$ALB_DNS/favicon.ico
```

### 5.2 라우팅 테스트

```bash
# 메인 페이지
curl -s http://$ALB_DNS/ | grep -o "<title>.*</title>"

# 상품 목록 페이지
curl -I http://$ALB_DNS/products

# 로그인 페이지
curl -I http://$ALB_DNS/login

# 회원가입 페이지
curl -I http://$ALB_DNS/register
```

### 5.3 API 프록시 테스트

```bash
# Frontend가 Backend API를 프록시하는지 확인
curl -s http://$ALB_DNS/api/health | jq '.'
```

### 5.4 브라우저 테스트

**수동 테스트 항목**:

```bash
# ALB DNS 출력
echo "브라우저에서 다음 URL로 접속하세요:"
echo "http://$ALB_DNS"
```

1. **메인 페이지 접속**
   - [ ] 페이지 로딩 성공
   - [ ] 상품 목록 표시
   - [ ] 이미지 로딩 정상

2. **회원가입**
   - [ ] /register 페이지 접속
   - [ ] 회원가입 폼 작성
   - [ ] 회원가입 성공

3. **로그인**
   - [ ] /login 페이지 접속
   - [ ] 로그인 성공
   - [ ] JWT 토큰 저장 확인 (개발자 도구 → Application → Local Storage)

4. **상품 검색/필터**
   - [ ] 상품 검색 기능
   - [ ] 카테고리 필터
   - [ ] 가격 정렬

5. **장바구니**
   - [ ] 상품 추가
   - [ ] 수량 변경
   - [ ] 상품 삭제

6. **주문**
   - [ ] 주문 생성
   - [ ] 주문 목록 확인
   - [ ] 주문 상세 확인

---

## 6단계: Lambda 함수 테스트

### 6.1 Lambda 함수 목록 확인

```bash
# Lambda 함수 목록
aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `openmarket-dev`)].[FunctionName,Runtime,LastModified,State]' \
  --output table
```

**예상 결과**:
- openmarket-dev-image-processor
- openmarket-dev-order-notification
- openmarket-dev-report-generator
- openmarket-dev-data-sync

### 6.2 Image Processor 테스트

```bash
# 테스트 이벤트 생성
cat > /tmp/image-processor-test.json <<'EOF'
{
  "Records": [
    {
      "s3": {
        "bucket": {
          "name": "openmarket-dev-uploads-478266318018"
        },
        "object": {
          "key": "products/test-image.jpg"
        }
      }
    }
  ]
}
EOF

# Lambda 함수 호출
aws lambda invoke \
  --function-name openmarket-dev-image-processor \
  --payload file:///tmp/image-processor-test.json \
  --cli-binary-format raw-in-base64-out \
  /tmp/image-processor-response.json

# 응답 확인
cat /tmp/image-processor-response.json | jq '.'

# CloudWatch Logs 확인
aws logs tail /aws/lambda/openmarket-dev-image-processor --follow
```

### 6.3 Order Notification 테스트

```bash
# 테스트 이벤트 생성
cat > /tmp/order-notification-test.json <<'EOF'
{
  "orderId": "TEST-001",
  "userId": 1,
  "email": "test@example.com",
  "orderTotal": 50000,
  "items": [
    {
      "productName": "테스트 상품",
      "quantity": 2,
      "price": 25000
    }
  ]
}
EOF

# Lambda 함수 호출
aws lambda invoke \
  --function-name openmarket-dev-order-notification \
  --payload file:///tmp/order-notification-test.json \
  --cli-binary-format raw-in-base64-out \
  /tmp/order-notification-response.json

# 응답 확인
cat /tmp/order-notification-response.json | jq '.'
```

### 6.4 Report Generator 테스트

```bash
# 테스트 이벤트 (CloudWatch Events에서 트리거)
cat > /tmp/report-generator-test.json <<'EOF'
{
  "reportType": "daily-sales",
  "date": "2025-01-15"
}
EOF

# Lambda 함수 호출
aws lambda invoke \
  --function-name openmarket-dev-report-generator \
  --payload file:///tmp/report-generator-test.json \
  --cli-binary-format raw-in-base64-out \
  /tmp/report-generator-response.json

# 응답 확인
cat /tmp/report-generator-response.json | jq '.'

# S3에 저장된 리포트 확인
aws s3 ls s3://openmarket-dev-uploads-478266318018/reports/
```

### 6.5 Data Sync 테스트

```bash
# 테스트 이벤트
cat > /tmp/data-sync-test.json <<'EOF'
{
  "syncType": "product-inventory"
}
EOF

# Lambda 함수 호출
aws lambda invoke \
  --function-name openmarket-dev-data-sync \
  --payload file:///tmp/data-sync-test.json \
  --cli-binary-format raw-in-base64-out \
  /tmp/data-sync-response.json

# 응답 확인
cat /tmp/data-sync-response.json | jq '.'
```

### 6.6 Lambda 모니터링 확인

```bash
# 최근 실행 로그 확인
for func in image-processor order-notification report-generator data-sync; do
  echo "=== openmarket-dev-$func ==="
  aws logs tail /aws/lambda/openmarket-dev-$func --since 1h
  echo ""
done

# Lambda 메트릭 확인
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=openmarket-dev-image-processor \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

---

## 7단계: 모니터링 스택 테스트

### 7.1 모니터링 Pod 확인

```bash
# 모든 모니터링 Pod 확인
kubectl get pods -n monitoring

# Pod 상태 요약
kubectl get pods -n monitoring \
  --field-selector=status.phase=Running \
  --no-headers | wc -l
```

**예상 결과**:
- prometheus: Running
- grafana: Running
- alertmanager: Running
- node-exporter: Running (DaemonSet, 노드 수만큼)
- kube-state-metrics: Running
- fluent-bit: Running (DaemonSet, 노드 수만큼)

### 7.2 Prometheus 테스트

```bash
# Prometheus에 Port Forward
kubectl port-forward -n monitoring svc/prometheus 9090:9090 &

# 잠시 대기
sleep 3

# Prometheus 헬스체크
curl -s http://localhost:9090/-/healthy

# Targets 확인
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# 메트릭 쿼리 테스트
curl -s http://localhost:9090/api/v1/query \
  --data-urlencode 'query=up' | jq '.data.result[] | {instance: .metric.instance, value: .value[1]}'

# CPU 사용률 쿼리
curl -s http://localhost:9090/api/v1/query \
  --data-urlencode 'query=100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)' | jq '.'

# Port Forward 종료
pkill -f "port-forward.*prometheus"
```

**예상 결과**:
- Health: OK
- Targets: 모두 UP 상태
- Metrics: 값 반환

### 7.3 Grafana 테스트

```bash
# Grafana에 Port Forward
kubectl port-forward -n monitoring svc/grafana 3000:3000 &

sleep 3

# Grafana 헬스체크
curl -s http://localhost:3000/api/health | jq '.'

# Datasource 확인
curl -s -u admin:openmarket2024! http://localhost:3000/api/datasources | jq '.'

# Dashboard 목록
curl -s -u admin:openmarket2024! http://localhost:3000/api/search?type=dash-db | jq '.[] | {title: .title, uid: .uid}'

echo ""
echo "Grafana에 접속하려면:"
echo "http://localhost:3000"
echo "Username: admin"
echo "Password: openmarket2024!"

# Port Forward 종료 (수동으로 브라우저 테스트 후)
# pkill -f "port-forward.*grafana"
```

**수동 브라우저 테스트**:
1. http://localhost:3000 접속
2. admin / openmarket2024! 로그인
3. Dashboards 확인:
   - [ ] Kubernetes Cluster Overview
   - [ ] OpenMarket Application
   - [ ] Node Exporter Full
4. 데이터가 정상적으로 표시되는지 확인

### 7.4 Alertmanager 테스트

```bash
# Alertmanager에 Port Forward
kubectl port-forward -n monitoring svc/alertmanager 9093:9093 &

sleep 3

# Alertmanager 헬스체크
curl -s http://localhost:9093/-/healthy

# 활성 알림 확인
curl -s http://localhost:9093/api/v2/alerts | jq '.'

# Alertmanager 설정 확인
curl -s http://localhost:9093/api/v1/status | jq '.data.config'

# Port Forward 종료
pkill -f "port-forward.*alertmanager"
```

### 7.5 Node Exporter 테스트

```bash
# Node Exporter Pod 목록
kubectl get pods -n monitoring -l app=node-exporter

# 하나의 Node Exporter에 연결
NODE_EXPORTER_POD=$(kubectl get pods -n monitoring -l app=node-exporter -o jsonpath='{.items[0].metadata.name}')

kubectl port-forward -n monitoring $NODE_EXPORTER_POD 9100:9100 &

sleep 3

# 메트릭 확인
curl -s http://localhost:9100/metrics | grep node_cpu_seconds_total | head -5

# Port Forward 종료
pkill -f "port-forward.*9100"
```

### 7.6 Fluent Bit 로그 수집 테스트

```bash
# Fluent Bit Pod 목록
kubectl get pods -n monitoring -l app=fluent-bit

# Fluent Bit 로그 확인
kubectl logs -n monitoring -l app=fluent-bit --tail=50

# CloudWatch Logs 확인
aws logs describe-log-streams \
  --log-group-name /aws/eks/openmarket-dev/application \
  --max-items 10

# 최근 로그 확인
aws logs tail /aws/eks/openmarket-dev/application --follow --since 5m
```

---

## 8단계: 성능 테스트

### 8.1 부하 테스트 도구 설치

```bash
# Apache Bench 설치 확인
ab -V

# 또는 hey 사용 (더 현대적)
# https://github.com/rakyll/hey
# macOS: brew install hey
# Linux: wget https://hey-release.s3.us-east-2.amazonaws.com/hey_linux_amd64 && chmod +x hey_linux_amd64
```

### 8.2 API 부하 테스트

```bash
# ALB DNS 가져오기
ALB_DNS=$(kubectl get ingress openmarket-ingress -n openmarket-dev \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# 1. 헬스체크 엔드포인트 부하 테스트 (100 요청, 10 동시)
ab -n 100 -c 10 http://$ALB_DNS/api/health

# 2. 상품 목록 API 부하 테스트 (500 요청, 50 동시)
ab -n 500 -c 50 http://$ALB_DNS/api/products?page=1&limit=20

# 3. 상품 상세 API 부하 테스트
ab -n 1000 -c 100 http://$ALB_DNS/api/products/1
```

**성능 목표**:
- Requests per second: > 100 RPS
- Time per request (mean): < 500ms
- Failed requests: 0%

### 8.3 부하 테스트 중 모니터링

```bash
# 터미널 1: 부하 테스트 실행
ab -n 10000 -c 100 http://$ALB_DNS/api/products &

# 터미널 2: Pod 리소스 사용량 모니터링
watch -n 1 'kubectl top pods -n openmarket-dev'

# 터미널 3: HPA 상태 모니터링 (있는 경우)
watch -n 1 'kubectl get hpa -n openmarket-dev'

# 터미널 4: Node 리소스 사용량
watch -n 1 'kubectl top nodes'
```

### 8.4 데이터베이스 성능 테스트

```bash
# RDS CloudWatch 메트릭 확인
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBClusterIdentifier,Value=openmarket-dev-aurora-cluster \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum

# Database Connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBClusterIdentifier,Value=openmarket-dev-aurora-cluster \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum
```

### 8.5 Redis 성능 테스트

```bash
# ElastiCache CloudWatch 메트릭
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name CPUUtilization \
  --dimensions Name=ReplicationGroupId,Value=openmarket-dev-redis \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum

# Cache Hit Rate
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name CacheHitRate \
  --dimensions Name=ReplicationGroupId,Value=openmarket-dev-redis \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average
```

---

## 9단계: 보안 테스트

### 9.1 SSL/TLS 설정 확인

```bash
# ALB HTTPS 리스너 확인
aws elbv2 describe-listeners \
  --load-balancer-arn $(aws elbv2 describe-load-balancers \
    --query 'LoadBalancers[?contains(LoadBalancerName, `k8s-openmake`)].LoadBalancerArn' \
    --output text) \
  --query 'Listeners[*].[Protocol,Port,SslPolicy]' \
  --output table
```

### 9.2 보안 그룹 검증

```bash
# EKS 노드 보안 그룹 확인
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=*openmarket-dev*node*" \
  --query 'SecurityGroups[*].[GroupId,GroupName,Description]' \
  --output table

# RDS 보안 그룹 확인
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=*openmarket-dev*rds*" \
  --query 'SecurityGroups[*].[GroupId,GroupName,IpPermissions[*].FromPort]' \
  --output table
```

### 9.3 IAM 역할 및 정책 확인

```bash
# EKS 노드 IAM 역할 확인
aws iam list-roles \
  --query 'Roles[?contains(RoleName, `openmarket-dev-node`)].RoleName' \
  --output table

# 연결된 정책 확인
NODE_ROLE=$(aws iam list-roles \
  --query 'Roles[?contains(RoleName, `openmarket-dev-node`)].RoleName' \
  --output text | head -1)

aws iam list-attached-role-policies --role-name $NODE_ROLE
```

### 9.4 네트워크 정책 확인

```bash
# NetworkPolicy 확인 (있는 경우)
kubectl get networkpolicies -n openmarket-dev

# Pod Security Policy 확인 (Kubernetes 1.25 이하)
kubectl get psp
```

### 9.5 Secret 암호화 확인

```bash
# Secret이 암호화되어 저장되는지 확인
kubectl get secrets -n openmarket-dev backend-secrets -o yaml | grep -A 5 "data:"

# Base64 디코딩 (로컬에서만)
kubectl get secret backend-secrets -n openmarket-dev -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
```

### 9.6 취약점 스캔

```bash
# Trivy로 Docker 이미지 스캔
# trivy image 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/openmarket/backend:dev-latest

# kubectl scan (있는 경우)
# kubectl scan -n openmarket-dev
```

---

## 🤖 자동화 테스트 스크립트

### 전체 테스트 자동화

```bash
#!/bin/bash
# test-openmarket.sh

set -e

echo "================================"
echo "OpenMarket E2E Test Suite"
echo "================================"
echo ""

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 테스트 결과 카운터
PASSED=0
FAILED=0

# 테스트 함수
test_pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED++))
}

test_fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAILED++))
}

test_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# 1. 환경 확인
echo "1. Checking Prerequisites..."
command -v aws >/dev/null 2>&1 && test_pass "AWS CLI installed" || test_fail "AWS CLI not found"
command -v kubectl >/dev/null 2>&1 && test_pass "kubectl installed" || test_fail "kubectl not found"
command -v jq >/dev/null 2>&1 && test_pass "jq installed" || test_fail "jq not found"
echo ""

# 2. AWS 연결 확인
echo "2. Checking AWS Connection..."
if aws sts get-caller-identity >/dev/null 2>&1; then
  test_pass "AWS credentials valid"
else
  test_fail "AWS credentials invalid"
fi
echo ""

# 3. EKS 클러스터 확인
echo "3. Checking EKS Cluster..."
if kubectl get nodes >/dev/null 2>&1; then
  NODE_COUNT=$(kubectl get nodes --no-headers | wc -l)
  test_pass "EKS cluster accessible ($NODE_COUNT nodes)"
else
  test_fail "Cannot access EKS cluster"
fi
echo ""

# 4. Pod 상태 확인
echo "4. Checking Pods..."
BACKEND_PODS=$(kubectl get pods -n openmarket-dev -l app=backend --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l)
FRONTEND_PODS=$(kubectl get pods -n openmarket-dev -l app=frontend --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l)

if [ "$BACKEND_PODS" -ge 1 ]; then
  test_pass "Backend pods running ($BACKEND_PODS)"
else
  test_fail "No backend pods running"
fi

if [ "$FRONTEND_PODS" -ge 1 ]; then
  test_pass "Frontend pods running ($FRONTEND_PODS)"
else
  test_fail "No frontend pods running"
fi
echo ""

# 5. Service 확인
echo "5. Checking Services..."
if kubectl get svc backend -n openmarket-dev >/dev/null 2>&1; then
  test_pass "Backend service exists"
else
  test_fail "Backend service not found"
fi

if kubectl get svc frontend -n openmarket-dev >/dev/null 2>&1; then
  test_pass "Frontend service exists"
else
  test_fail "Frontend service not found"
fi
echo ""

# 6. Ingress 확인
echo "6. Checking Ingress..."
ALB_DNS=$(kubectl get ingress openmarket-ingress -n openmarket-dev -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
if [ -n "$ALB_DNS" ]; then
  test_pass "Ingress configured ($ALB_DNS)"
else
  test_fail "Ingress not configured"
  exit 1
fi
echo ""

# 7. API 헬스체크
echo "7. Testing API Health..."
if curl -s -f http://$ALB_DNS/api/health >/dev/null 2>&1; then
  test_pass "API health endpoint accessible"
else
  test_fail "API health endpoint not accessible"
fi
echo ""

# 8. RDS 확인
echo "8. Checking RDS..."
RDS_STATUS=$(aws rds describe-db-clusters \
  --db-cluster-identifier openmarket-dev-aurora-cluster \
  --query 'DBClusters[0].Status' \
  --output text 2>/dev/null)

if [ "$RDS_STATUS" == "available" ]; then
  test_pass "RDS cluster available"
else
  test_fail "RDS cluster not available (Status: $RDS_STATUS)"
fi
echo ""

# 9. ElastiCache 확인
echo "9. Checking ElastiCache..."
REDIS_STATUS=$(aws elasticache describe-replication-groups \
  --replication-group-id openmarket-dev-redis \
  --query 'ReplicationGroups[0].Status' \
  --output text 2>/dev/null)

if [ "$REDIS_STATUS" == "available" ]; then
  test_pass "Redis cluster available"
else
  test_fail "Redis cluster not available (Status: $REDIS_STATUS)"
fi
echo ""

# 10. Lambda 함수 확인
echo "10. Checking Lambda Functions..."
LAMBDA_COUNT=$(aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `openmarket-dev`)]' \
  --output json | jq '. | length')

if [ "$LAMBDA_COUNT" -eq 4 ]; then
  test_pass "All Lambda functions exist ($LAMBDA_COUNT)"
else
  test_warn "Expected 4 Lambda functions, found $LAMBDA_COUNT"
fi
echo ""

# 11. 모니터링 스택 확인
echo "11. Checking Monitoring Stack..."
MONITORING_PODS=$(kubectl get pods -n monitoring --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l)

if [ "$MONITORING_PODS" -ge 3 ]; then
  test_pass "Monitoring stack running ($MONITORING_PODS pods)"
else
  test_warn "Monitoring stack not fully running ($MONITORING_PODS pods)"
fi
echo ""

# 결과 요약
echo "================================"
echo "Test Summary"
echo "================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed!${NC}"
  exit 1
fi
```

### 스크립트 사용 방법

```bash
# 스크립트에 실행 권한 부여
chmod +x test-openmarket.sh

# 테스트 실행
./test-openmarket.sh

# 출력 예시:
# ================================
# OpenMarket E2E Test Suite
# ================================
#
# 1. Checking Prerequisites...
# ✓ AWS CLI installed
# ✓ kubectl installed
# ✓ jq installed
#
# 2. Checking AWS Connection...
# ✓ AWS credentials valid
# ...
```

---

## 📊 테스트 체크리스트

### 배포 후 필수 테스트

- [ ] 1. 인프라 검증
  - [ ] VPC 및 서브넷 확인
  - [ ] EKS 클러스터 ACTIVE
  - [ ] RDS Aurora available
  - [ ] ElastiCache Redis available
  - [ ] S3 버킷 존재
  - [ ] ECR 이미지 존재

- [ ] 2. Kubernetes 배포
  - [ ] 모든 Pod Running
  - [ ] Service 생성 완료
  - [ ] Ingress ADDRESS 할당
  - [ ] ConfigMap/Secret 존재

- [ ] 3. API 테스트
  - [ ] 헬스체크 성공
  - [ ] 회원가입 성공
  - [ ] 로그인 성공
  - [ ] 상품 조회 성공
  - [ ] 장바구니 기능
  - [ ] 주문 기능

- [ ] 4. 프론트엔드
  - [ ] 페이지 로딩 성공
  - [ ] API 프록시 동작
  - [ ] 라우팅 정상

- [ ] 5. Lambda 함수
  - [ ] 4개 함수 모두 Active
  - [ ] 테스트 호출 성공
  - [ ] CloudWatch Logs 확인

- [ ] 6. 모니터링
  - [ ] Prometheus 메트릭 수집
  - [ ] Grafana 대시보드 표시
  - [ ] Alertmanager 설정 완료
  - [ ] Fluent Bit 로그 전송

- [ ] 7. 성능
  - [ ] API 응답 시간 < 500ms
  - [ ] 부하 테스트 통과
  - [ ] RDS CPU < 50%
  - [ ] Redis 캐시 히트율 > 80%

- [ ] 8. 보안
  - [ ] HTTPS 설정 (프로덕션)
  - [ ] 보안 그룹 최소 권한
  - [ ] IAM 역할 적절
  - [ ] Secret 암호화

---

## 🔧 일반적인 문제 해결

### Pod가 Running 상태가 아님

```bash
# Pod 상세 확인
kubectl describe pod <pod-name> -n openmarket-dev

# Pod 로그 확인
kubectl logs <pod-name> -n openmarket-dev --tail=100

# 이전 Pod 로그 (재시작된 경우)
kubectl logs <pod-name> -n openmarket-dev --previous
```

### API 응답 없음

```bash
# Pod 내부에서 API 테스트
kubectl exec -it <backend-pod> -n openmarket-dev -- curl http://localhost:3001/api/health

# Service에서 API 테스트
kubectl run curl-test --image=curlimages/curl:latest --rm -it --restart=Never -n openmarket-dev \
  -- curl http://backend:3001/api/health
```

### 데이터베이스 연결 실패

```bash
# 보안 그룹 확인
aws ec2 describe-security-groups --filters "Name=group-name,Values=*rds*"

# RDS 엔드포인트 ping 테스트
kubectl run netcat-test --image=busybox:latest --rm -it --restart=Never -n openmarket-dev \
  -- nc -zv <rds-endpoint> 3306
```

---

**최종 업데이트**: 2025-01-15
**작성자**: OpenMarket DevOps Team
**버전**: 1.0.0
