# 📊 OpenMarket 모니터링 가이드

완전한 옵저버빌리티(Observability) 스택 구현 가이드입니다.

## 📋 목차

- [아키텍처](#-아키텍처)
- [구성 요소](#-구성-요소)
- [설치](#-설치)
- [접근 방법](#-접근-방법)
- [대시보드](#-대시보드)
- [알림 설정](#-알림-설정)
- [로그 수집](#-로그-수집)
- [트러블슈팅](#-트러블슈팅)

---

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Applications                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Backend  │  │ Frontend │  │  Lambda  │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼───────────────────┘
        │             │             │
        │ (Metrics)   │ (Metrics)   │ (Logs)
        ▼             ▼             ▼
┌───────────────────────────────────────────────────────┐
│              Monitoring Namespace                      │
│                                                        │
│  ┌─────────────┐    ┌──────────────┐   ┌──────────┐ │
│  │ Prometheus  │◄───│ Node Exporter│   │FluentBit │ │
│  │             │    └──────────────┘   └────┬─────┘ │
│  │  (Metrics)  │                             │       │
│  └──────┬──────┘    ┌──────────────┐        │       │
│         │           │ Kube State   │        │       │
│         │           │   Metrics    │        │       │
│         ▼           └──────┬───────┘        │       │
│  ┌─────────────┐           │                │       │
│  │  Grafana    │◄──────────┘                │       │
│  │ (Dashboard) │                             │       │
│  └─────────────┘                             │       │
│                                               │       │
│  ┌─────────────┐    ┌──────────────┐        │       │
│  │Alertmanager │    │   Slack      │        │       │
│  │  (Alerts)   │───►│ Notification │        │       │
│  └─────────────┘    └──────────────┘        │       │
└──────────────────────────────────────────────┼───────┘
                                               │
                                               ▼
                                    ┌────────────────────┐
                                    │  CloudWatch Logs   │
                                    └────────────────────┘
```

---

## 🧩 구성 요소

### 1. Prometheus
- **역할**: 메트릭 수집 및 저장
- **포트**: 9090
- **데이터 보관**: 30일
- **스크랩 간격**: 15초

### 2. Grafana
- **역할**: 시각화 및 대시보드
- **포트**: 3000
- **기본 자격증명**: `admin / openmarket2024!`
- **데이터소스**: Prometheus

### 3. Alertmanager
- **역할**: 알림 관리 및 라우팅
- **포트**: 9093
- **알림 채널**: Slack

### 4. Node Exporter
- **역할**: 노드 시스템 메트릭 수집
- **포트**: 9100
- **배포**: DaemonSet (모든 노드)

### 5. Kube State Metrics
- **역할**: Kubernetes 오브젝트 메트릭 수집
- **포트**: 8080
- **메트릭**: Pod, Deployment, Service 상태

### 6. Fluent Bit
- **역할**: 로그 수집 및 CloudWatch 전송
- **포트**: 2020
- **배포**: DaemonSet (모든 노드)

---

## 🚀 설치

### 전체 모니터링 스택 설치

```bash
# 1. 스크립트 실행 권한 부여
chmod +x scripts/setup-monitoring.sh

# 2. 모니터링 스택 설치
./scripts/setup-monitoring.sh dev

# 3. 설치 확인
kubectl get pods -n monitoring

# 예상 출력:
# NAME                                   READY   STATUS    RESTARTS   AGE
# prometheus-xxxxxxxxxx-xxxxx            1/1     Running   0          2m
# grafana-xxxxxxxxxx-xxxxx               1/1     Running   0          2m
# alertmanager-xxxxxxxxxx-xxxxx          1/1     Running   0          2m
# node-exporter-xxxxx                    1/1     Running   0          2m
# node-exporter-yyyyy                    1/1     Running   0          2m
# kube-state-metrics-xxxxxxxxxx-xxxxx    1/1     Running   0          2m
# fluent-bit-xxxxx                       1/1     Running   0          2m
# fluent-bit-yyyyy                       1/1     Running   0          2m
```

### 개별 컴포넌트 설치

```bash
# Prometheus만 설치
kubectl apply -f k8s/monitoring/prometheus/

# Grafana만 설치
kubectl apply -f k8s/monitoring/grafana/

# Alertmanager만 설치
kubectl apply -f k8s/monitoring/alertmanager/

# Node Exporter만 설치
kubectl apply -f k8s/monitoring/node-exporter/

# Kube State Metrics만 설치
kubectl apply -f k8s/monitoring/kube-state-metrics/

# Fluent Bit만 설치
kubectl apply -f k8s/monitoring/fluent-bit/
```

---

## 🔍 접근 방법

### 1. Prometheus 접근

```bash
# Port Forward
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# 브라우저에서 접속
open http://localhost:9090
```

**주요 기능**:
- **Targets**: 스크랩 대상 상태 확인
- **Graph**: PromQL 쿼리 실행
- **Alerts**: 알림 규칙 상태 확인

**유용한 PromQL 쿼리**:
```promql
# CPU 사용률
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# 메모리 사용률
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Pod 개수
count(kube_pod_info{namespace="openmarket-dev"})

# HTTP 요청률
sum(rate(http_requests_total[5m])) by (service)

# HTTP 에러율
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100
```

### 2. Grafana 접근

```bash
# Port Forward
kubectl port-forward -n monitoring svc/grafana 3000:3000

# 브라우저에서 접속
open http://localhost:3000
```

**로그인**:
- **Username**: `admin`
- **Password**: `openmarket2024!`

**초기 설정**:
1. 좌측 메뉴 → Configuration → Data Sources
2. Prometheus 데이터소스 확인 (이미 설정됨)
3. Dashboards → Browse → 미리 설정된 대시보드 확인

### 3. Alertmanager 접근

```bash
# Port Forward
kubectl port-forward -n monitoring svc/alertmanager 9093:9093

# 브라우저에서 접속
open http://localhost:9093
```

---

## 📈 대시보드

### 사전 구성된 대시보드

#### 1. Kubernetes Cluster Overview
- **설명**: 클러스터 전체 리소스 사용률
- **메트릭**:
  - CPU 사용률
  - 메모리 사용률
  - Pod 상태
  - Node 상태

#### 2. OpenMarket Application
- **설명**: OpenMarket 애플리케이션 메트릭
- **메트릭**:
  - Backend API 요청률
  - Backend 에러율
  - Frontend 요청률
  - Database 연결 풀
  - Redis 캐시 히트율

#### 3. Node Exporter Full
- **설명**: 노드 시스템 메트릭
- **메트릭**:
  - CPU 사용률
  - 메모리 사용률
  - 디스크 I/O
  - 네트워크 트래픽

### 커스텀 대시보드 추가

1. Grafana UI에서 **+ Create → Dashboard**
2. **Add new panel** 클릭
3. PromQL 쿼리 입력
4. 시각화 타입 선택 (Graph, Stat, Table 등)
5. **Save dashboard** 클릭

---

## 🚨 알림 설정

### Slack 웹훅 설정

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

### 알림 채널

- **#openmarket-alerts**: 모든 알림
- **#openmarket-critical**: 긴급 알림 (severity: critical)
- **#openmarket-warnings**: 경고 알림 (severity: warning)
- **#openmarket-infra**: 인프라 관련 알림
- **#openmarket-app**: 애플리케이션 관련 알림

### 사전 구성된 알림 규칙

| 알림 이름 | 조건 | 지속 시간 | 심각도 |
|-----------|------|-----------|--------|
| HighCPUUsage | CPU > 80% | 5분 | warning |
| HighMemoryUsage | Memory > 85% | 5분 | warning |
| PodRestarting | 재시작률 > 0 | 5분 | warning |
| PodNotReady | Pod not Running | 10분 | critical |
| HighAPIErrorRate | 에러율 > 5% | 5분 | critical |
| HighAPILatency | P95 > 1초 | 10분 | warning |
| RDSHighCPU | RDS CPU > 80% | 10분 | warning |
| ElastiCacheHighMemory | Memory > 90% | 10분 | warning |
| DiskSpaceLow | Disk < 15% | 10분 | warning |
| DeploymentReplicaMismatch | 복제본 불일치 | 10분 | warning |

---

## 📜 로그 수집

### Fluent Bit 구성

Fluent Bit는 모든 노드에서 DaemonSet으로 실행되며, 다음 로그를 수집합니다:

1. **Kubernetes Pod 로그**
   - 경로: `/var/log/containers/*openmarket*.log`
   - 파서: Docker JSON

2. **출력 대상**
   - CloudWatch Logs
   - Stdout (디버깅용)

### CloudWatch Logs 확인

```bash
# AWS CLI로 로그 확인
aws logs tail /aws/eks/openmarket-dev/application --follow

# 특정 Pod 로그 필터링
aws logs filter-log-events \
  --log-group-name /aws/eks/openmarket-dev/application \
  --filter-pattern "backend" \
  --start-time $(date -u -d '1 hour ago' +%s)000
```

### Fluent Bit 디버깅

```bash
# Fluent Bit Pod 로그 확인
kubectl logs -n monitoring -l app=fluent-bit --tail=100

# ConfigMap 확인
kubectl get configmap fluent-bit-config -n monitoring -o yaml
```

---

## 🔧 트러블슈팅

### 1. Prometheus가 메트릭을 수집하지 못함

**증상**: Targets가 "Down" 상태

**해결 방법**:
```bash
# 1. Prometheus Pod 로그 확인
kubectl logs -n monitoring -l app=prometheus --tail=50

# 2. Service Endpoint 확인
kubectl get endpoints -n monitoring

# 3. Pod annotations 확인
kubectl get pods -n openmarket-dev -o yaml | grep prometheus.io
```

**해결책**:
- Pod에 올바른 annotation 추가:
  ```yaml
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "3001"
  ```

### 2. Grafana가 데이터를 표시하지 않음

**증상**: "No data" 또는 빈 그래프

**해결 방법**:
```bash
# 1. Grafana Pod 로그 확인
kubectl logs -n monitoring -l app=grafana --tail=50

# 2. Prometheus 데이터소스 테스트
# Grafana UI → Configuration → Data Sources → Prometheus → Test

# 3. PromQL 쿼리 직접 테스트
# Prometheus UI (9090)에서 쿼리 실행
```

### 3. Alertmanager가 Slack에 알림을 보내지 못함

**증상**: 알림이 Slack에 도착하지 않음

**해결 방법**:
```bash
# 1. Alertmanager Pod 로그 확인
kubectl logs -n monitoring -l app=alertmanager --tail=100

# 2. Secret 확인
kubectl get secret alertmanager-secrets -n monitoring -o yaml

# 3. Alertmanager 설정 확인
kubectl get configmap alertmanager-config -n monitoring -o yaml

# 4. Webhook URL 테스트
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message from OpenMarket"}' \
  YOUR_SLACK_WEBHOOK_URL
```

### 4. Fluent Bit가 로그를 수집하지 못함

**증상**: CloudWatch Logs에 로그가 없음

**해결 방법**:
```bash
# 1. Fluent Bit Pod 로그 확인
kubectl logs -n monitoring daemonset/fluent-bit --tail=100

# 2. IAM 권한 확인
# Node IAM Role에 CloudWatch Logs 쓰기 권한 필요

# 3. CloudWatch Log Group 확인
aws logs describe-log-groups \
  --log-group-name-prefix /aws/eks/openmarket

# 4. ConfigMap 확인
kubectl describe configmap fluent-bit-config -n monitoring
```

### 5. Node Exporter가 실행되지 않음

**증상**: Node 메트릭이 수집되지 않음

**해결 방법**:
```bash
# 1. DaemonSet 상태 확인
kubectl get daemonset node-exporter -n monitoring

# 2. Pod 로그 확인
kubectl logs -n monitoring -l app=node-exporter --tail=50

# 3. Taint/Toleration 확인
kubectl describe daemonset node-exporter -n monitoring
```

---

## 📊 성능 최적화

### Prometheus 메트릭 보관 기간 조정

```yaml
# k8s/monitoring/prometheus/deployment.yaml
args:
  - '--storage.tsdb.retention.time=30d'  # 30일 → 15일로 변경
  - '--storage.tsdb.retention.size=50GB' # 50GB → 30GB로 변경
```

### Scrape 간격 조정

```yaml
# k8s/monitoring/prometheus/configmap.yaml
global:
  scrape_interval: 15s  # 15초 → 30초로 변경 (부하 감소)
```

### 메트릭 필터링

```yaml
# 불필요한 메트릭 제외
scrape_configs:
  - job_name: 'kubernetes-pods'
    metric_relabel_configs:
      - source_labels: [__name__]
        regex: 'go_.*'  # Go 런타임 메트릭 제외
        action: drop
```

---

## 🔗 참고 자료

- [Prometheus 공식 문서](https://prometheus.io/docs/)
- [Grafana 공식 문서](https://grafana.com/docs/)
- [Fluent Bit 공식 문서](https://docs.fluentbit.io/)
- [Kubernetes Monitoring Best Practices](https://kubernetes.io/docs/tasks/debug/debug-cluster/resource-usage-monitoring/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)

---

**최종 업데이트**: 2025-01-15
