# 💰 OpenMarket AWS 비용 최적화 가이드

## 📊 현재 예상 비용 (Dev 환경)

### 월간 예상 비용 (2025년 기준)

| 서비스 | 사양 | 월간 비용 (USD) | 비고 |
|--------|------|----------------|------|
| **Compute** |
| EKS Control Plane | 1 cluster | $73 | 고정 비용 |
| EC2 (Node Group) | 2x t3.medium | $60 | 8시간/일 가동 시 |
| NAT Gateway | 1x NAT | $32 | + 데이터 전송 비용 |
| **Database** |
| RDS Aurora MySQL | 2x db.t4g.medium | $100 | On-Demand 기준 |
| ElastiCache Redis | 1x cache.t4g.micro | $12 | |
| **Storage** |
| EBS (gp3) | 100 GB | $8 | Node + DB 스토리지 |
| S3 | 50 GB | $1 | 표준 스토리지 |
| **Serverless** |
| Lambda | 1M requests | $0.20 | + 실행 시간 |
| **Monitoring** |
| CloudWatch | Logs + Metrics | $10 | 기본 모니터링 |
| **Network** |
| Data Transfer | 10 GB/month | $1 | 아웃바운드 |
| ALB | 1x ALB | $16 | + LCU 비용 |
| **총 예상 비용** | | **~$313/month** | 8시간/일 가동 기준 |

### 24/7 가동 시 비용
- **EC2 (Node Group)**: $60 → $120 (t3.medium 2대)
- **총 예상 비용**: **~$373/month**

---

## 🎯 비용 최적화 전략

### 1. ⏰ 환경별 스케줄링

#### Dev/Staging 환경 자동 종료
```bash
# 평일 09:00 - 18:00만 운영 (주말 종료)
# EventBridge + Lambda로 자동화

# 연간 절감액: ~$2,400 (Dev 환경 기준)
```

**구현 예시**:
```python
# lambda/auto-scaling/scheduler.py
import boto3
from datetime import datetime

def lambda_handler(event, context):
    asg_client = boto3.client('autoscaling')

    # 현재 시간 체크 (KST)
    now = datetime.now()
    is_business_hours = (
        now.weekday() < 5 and  # 월-금
        9 <= now.hour < 18     # 09:00-18:00
    )

    if is_business_hours:
        # Scale up
        asg_client.update_auto_scaling_group(
            AutoScalingGroupName='openmarket-dev-node-group',
            MinSize=2,
            MaxSize=4,
            DesiredCapacity=2
        )
    else:
        # Scale down
        asg_client.update_auto_scaling_group(
            AutoScalingGroupName='openmarket-dev-node-group',
            MinSize=0,
            MaxSize=0,
            DesiredCapacity=0
        )
```

#### RDS Aurora 자동 정지/시작
```bash
# Dev 환경에서 야간/주말 자동 정지
aws rds stop-db-cluster --db-cluster-identifier openmarket-dev-aurora-cluster
```

### 2. 💾 예약 인스턴스 (Reserved Instances)

#### Production 환경만 적용
- **RDS Aurora**: 1년 예약 (부분 선결제) → **~40% 절감**
  - 월 $100 → $60
- **EC2 (t3.medium)**: 1년 예약 (부분 선결제) → **~30% 절감**
  - 월 $60 → $42

**연간 절감액**: ~$700

### 3. 🚀 Spot Instances 활용

#### Non-critical 워크로드용
```hcl
# terraform/modules/eks/node-group.tf
resource "aws_eks_node_group" "spot" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.project_name}-${var.environment}-spot"
  node_role_arn   = aws_iam_role.node.arn

  capacity_type   = "SPOT"  # Spot Instances

  scaling_config {
    desired_size = 2
    max_size     = 5
    min_size     = 1
  }

  instance_types = ["t3.medium", "t3a.medium", "t2.medium"]

  labels = {
    workload-type = "non-critical"
  }

  taint {
    key    = "spot-instance"
    value  = "true"
    effect = "NO_SCHEDULE"
  }
}
```

**절감 효과**: **최대 70% 비용 절감** (가용성 trade-off)

### 4. 📦 Compute Optimizer 활용

#### Right-sizing 권장 사항 적용
```bash
# AWS Compute Optimizer 권장 사항 확인
aws compute-optimizer get-ec2-instance-recommendations \
  --region ap-northeast-2

# 예시: t3.medium → t3.small (워크로드에 따라)
# 월 $30 → $15 (50% 절감)
```

### 5. 🗄️ S3 라이프사이클 정책

```hcl
# terraform/modules/s3/lifecycle.tf
resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"  # 50% 절감
    }

    transition {
      days          = 90
      storage_class = "GLACIER"      # 85% 절감
    }

    expiration {
      days = 365  # 1년 후 삭제
    }
  }

  rule {
    id     = "delete-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}
```

**절감 효과**: S3 비용 **60-80% 절감**

### 6. 🔄 ElastiCache Reserved Nodes

#### Production Redis만 예약
```bash
# 1년 예약 (부분 선결제)
aws elasticache purchase-reserved-cache-nodes-offering \
  --reserved-cache-nodes-offering-id xxx \
  --cache-node-count 1
```

**절감 효과**: **~40% 절감**

### 7. 📊 CloudWatch Logs 최적화

#### 로그 보관 기간 최적화
```hcl
# terraform/modules/cloudwatch/main.tf
resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "/aws/eks/openmarket-${var.environment}/application"
  retention_in_days = var.environment == "prod" ? 90 : 7  # Dev는 7일

  tags = {
    Environment = var.environment
  }
}
```

**절감 효과**: Dev 환경 로그 비용 **~85% 절감**

### 8. 🌐 NAT Gateway → NAT Instance

#### Dev 환경만 적용
```hcl
# terraform/modules/vpc/nat-instance.tf (Dev only)
resource "aws_instance" "nat" {
  count = var.environment == "dev" ? 1 : 0

  ami           = "ami-0c2d3e23e757b5d84"  # NAT AMI
  instance_type = "t3.nano"

  # 월 $5 vs NAT Gateway $32
}
```

**절감 효과**: 월 **$27 절감** (Dev 환경)

### 9. 🔍 AWS Cost Explorer 활성화

#### 비용 추적 및 알림
```bash
# 예산 생성
aws budgets create-budget \
  --account-id 123456789012 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

**budget.json**:
```json
{
  "BudgetName": "OpenMarket-Dev-Monthly",
  "BudgetLimit": {
    "Amount": "400",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

### 10. 🎛️ Auto Scaling 정책 최적화

#### HPA (Horizontal Pod Autoscaler) 튜닝
```yaml
# k8s/base/backend-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 1  # Dev: 1, Prod: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70  # 더 높은 임계값으로 변경
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # 5분 대기
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
```

---

## 📈 비용 최적화 로드맵

### Phase 1: 즉시 적용 (1-2주)
- [x] Dev/Staging 스케줄링 (야간/주말 종료)
- [x] S3 라이프사이클 정책
- [x] CloudWatch 로그 보관 기간 단축
- [x] 미사용 리소스 정리

**예상 절감**: **월 $100-150**

### Phase 2: 중기 적용 (1-2개월)
- [ ] Production 예약 인스턴스 구매
- [ ] ElastiCache 예약 노드
- [ ] Compute Optimizer 권장 사항 적용
- [ ] NAT Instance로 전환 (Dev)

**예상 절감**: **월 $80-120**

### Phase 3: 장기 최적화 (3-6개월)
- [ ] Spot Instances 도입
- [ ] Database 쿼리 최적화 (인스턴스 다운사이징)
- [ ] Lambda 함수 메모리 최적화
- [ ] CDN 캐싱 전략 개선

**예상 절감**: **월 $50-100**

---

## 💡 비용 모니터링 도구

### 1. AWS Cost Explorer
- **URL**: https://console.aws.amazon.com/cost-management/home
- **주요 기능**:
  - 서비스별 비용 분석
  - 월별 트렌드 추적
  - 예측 비용 확인

### 2. AWS Budgets
```bash
# 예산 초과 알림 설정
aws budgets create-budget \
  --account-id $ACCOUNT_ID \
  --budget BudgetName=OpenMarket-Dev,BudgetLimit={Amount=400,Unit=USD}
```

### 3. Kubecost (Kubernetes 비용 분석)
```bash
# Kubecost 설치
helm install kubecost kubecost/cost-analyzer \
  --namespace kubecost \
  --create-namespace
```

### 4. Infracost (Terraform 비용 추정)
```bash
# Terraform 변경 시 비용 영향 분석
infracost breakdown --path infrastructure/terraform/environments/dev
```

---

## 🎯 환경별 최적화 전략

### Development 환경
1. **EC2**: Spot Instances 사용
2. **RDS**: 야간/주말 자동 정지
3. **NAT**: NAT Instance 사용
4. **로그**: 7일 보관
5. **스케일**: 최소 리소스

**목표**: **월 $200-250**

### Production 환경
1. **EC2**: Reserved Instances (1년)
2. **RDS**: Reserved Instances (1년)
3. **ElastiCache**: Reserved Nodes (1년)
4. **로그**: 90일 보관
5. **스케일**: Auto Scaling 최적화

**목표**: **월 $800-1,000** (24/7 운영)

---

## 📝 체크리스트

### 월간 비용 검토
- [ ] AWS Cost Explorer 확인
- [ ] 예산 초과 여부 체크
- [ ] 미사용 리소스 확인 및 정리
- [ ] CloudWatch Logs 용량 확인
- [ ] S3 버킷 크기 확인

### 분기별 최적화
- [ ] Reserved Instances 갱신 검토
- [ ] Compute Optimizer 권장 사항 적용
- [ ] Auto Scaling 정책 튜닝
- [ ] 데이터베이스 성능 분석 및 Right-sizing

### 연간 리뷰
- [ ] 전체 아키텍처 비용 효율성 검토
- [ ] Savings Plans 고려
- [ ] 서비스 통합 및 간소화
- [ ] 신규 AWS 서비스 평가

---

## 🔗 참고 자료

- [AWS 비용 최적화 모범 사례](https://aws.amazon.com/ko/pricing/cost-optimization/)
- [AWS Well-Architected Framework - Cost Optimization](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html)
- [Kubernetes 비용 최적화 가이드](https://kubernetes.io/docs/concepts/cluster-administration/cost-optimization/)
- [AWS Pricing Calculator](https://calculator.aws/)

---

**최종 업데이트**: 2025-01-15
