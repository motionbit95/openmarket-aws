# Phase 5: CI/CD 파이프라인 구축 완료 ✅

## 개요

Phase 5에서는 GitHub Actions를 사용한 완전 자동화된 CI/CD 파이프라인을 구축했습니다. 코드가 푸시되면 자동으로 테스트, 빌드, 배포가 진행됩니다.

## 🎉 구현 완료 현황

- ✅ **Backend CI/CD**: 테스트 → 빌드 → ECR 푸시 → EKS 배포
- ✅ **Frontend CI/CD**: Lint → 빌드 → ECR 푸시 → EKS 배포 → E2E 테스트
- ✅ **Lambda CI/CD**: 변경 감지 → 패키징 → Lambda 업데이트
- ✅ **Terraform CI/CD**: Plan → Security Scan → Apply (승인 기반)
- ✅ **완전 문서화**: 각 워크플로우 사용 가이드

## 생성된 파일 구조

```
.github/
└── workflows/
    ├── backend-ci-cd.yml         # Backend 자동 배포
    ├── frontend-ci-cd.yml        # Frontend 자동 배포
    ├── lambda-ci-cd.yml          # Lambda Functions 배포
    ├── terraform-ci-cd.yml       # 인프라 배포
    └── README.md                 # 워크플로우 가이드
```

## CI/CD 파이프라인 상세

### 1. Backend CI/CD Pipeline

**워크플로우**: `.github/workflows/backend-ci-cd.yml`

**트리거**:
- Push: `main`, `develop` 브랜치
- Path: `backend/**`

**파이프라인 단계**:

```
┌──────────────┐
│  Code Push   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Test & Lint  │ ──► ESLint, Unit Tests, Coverage
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Build Image  │ ──► Docker Buildx (linux/amd64)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Push to ECR │ ──► Tag: {env}-{sha}, {env}-latest
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Deploy to EKS│ ──► Helm Upgrade
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Verify Deploy│ ──► Rollout Status Check
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Slack Notify │
└──────────────┘
```

**주요 기능**:
- Docker Buildx로 멀티플랫폼 빌드
- GitHub Actions 캐시 활용 (빌드 시간 단축)
- 환경별 자동 배포 (dev, prod)
- Rollout 상태 검증
- Slack 알림

**환경 변수**:
- `AWS_ACCESS_KEY_ID`: AWS 인증
- `AWS_SECRET_ACCESS_KEY`: AWS 인증
- `SLACK_WEBHOOK_URL`: Slack 알림 (선택)

---

### 2. Frontend CI/CD Pipeline

**워크플로우**: `.github/workflows/frontend-ci-cd.yml`

**트리거**:
- Push: `main`, `develop` 브랜치
- Path: `frontend-web/**`

**파이프라인 단계**:

```
┌──────────────┐
│  Code Push   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Test & Lint  │ ──► ESLint, TypeScript Check, Build Test
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Build Image  │ ──► Next.js Standalone Build
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Push to ECR │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Deploy to EKS│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ E2E Test     │ ──► Playwright (develop only)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Slack Notify │
└──────────────┘
```

**주요 기능**:
- Next.js 빌드 최적화
- 환경별 API URL 설정
- E2E 테스트 (Playwright)
- 빌드 아티팩트 업로드

**E2E 테스트** (develop 브랜치만):
- Playwright 자동 실행
- 테스트 결과 업로드
- 스크린샷 캡처

---

### 3. Lambda Functions CI/CD Pipeline

**워크플로우**: `.github/workflows/lambda-ci-cd.yml`

**트리거**:
- Push: `main`, `develop` 브랜치
- Path: `lambda/**`

**파이프라인 단계**:

```
┌──────────────┐
│  Code Push   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Detect Changed       │ ──► Path Filter
│ Lambda Functions     │     (image-processor, email-sender, etc.)
└──────┬───────────────┘
       │
       ├─────────────┬─────────────┬─────────────┬─────────────┐
       ▼             ▼             ▼             ▼             ▼
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│   Image    │ │   Email    │ │ Settlement │ │  Webhook   │
│ Processor  │ │  Sender    │ │   Report   │ │  Handler   │
└─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
      │              │              │              │
      └──────────────┴──────────────┴──────────────┘
                     │
                     ▼
            ┌──────────────┐
            │ npm install  │
            └──────┬───────┘
                   │
                   ▼
            ┌──────────────┐
            │  zip package │
            └──────┬───────┘
                   │
                   ▼
            ┌──────────────┐
            │ Update Lambda│
            └──────┬───────┘
                   │
                   ▼
            ┌──────────────┐
            │ Publish Ver. │
            └──────┬───────┘
                   │
                   ▼
            ┌──────────────┐
            │Integration  │
            │    Test      │
            └──────────────┘
```

**주요 기능**:
- Path-based 변경 감지
- 변경된 Lambda만 선택적 배포
- 버전 관리 및 Alias 업데이트
- Production 승인 프로세스

**최적화**:
- 병렬 배포 (변경된 Lambda 동시 배포)
- 프로덕션 환경 Alias 관리
- 통합 테스트 자동 실행

---

### 4. Terraform CI/CD Pipeline

**워크플로우**: `.github/workflows/terraform-ci-cd.yml`

**트리거**:
- Push: `main` 브랜치
- Path: `infrastructure/terraform/**`
- Pull Request: `main` 브랜치

**파이프라인 단계**:

```
┌──────────────┐
│  Code Push   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Terraform    │ ──► terraform fmt -check
│   Format     │     terraform validate
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Terraform    │ ──► terraform plan
│    Plan      │     (dev, staging, prod)
└──────┬───────┘
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌────────────┐  ┌────────────────┐ ┌──────────────┐
│  Security  │  │ Cost Estimate  │ │   PR Comment │
│   Scan     │  │  (Infracost)   │ │   (Plan)     │
│  (tfsec)   │  │                │ │              │
└────────────┘  └────────────────┘ └──────────────┘
       │
       ▼
┌──────────────┐
│ Terraform    │ ──► Dev: Auto Apply
│   Apply      │     Prod: Manual Approval
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Upload Outputs│
└──────────────┘
```

**주요 기능**:
- 환경별 Plan 생성
- Security Scan (tfsec)
- 비용 추정 (Infracost)
- PR에 Plan 결과 코멘트
- 승인 기반 배포 (Production)

**보안**:
- Dev: 자동 배포
- Staging: 1명 승인 필요
- Prod: 2명 이상 승인 + 5분 대기

---

## 브랜치 전략

### Git Flow

```
main (production)
  ├── develop (development)
  │   ├── feature/user-auth
  │   ├── feature/payment
  │   └── fix/cart-bug
  └── hotfix/critical-bug
```

### 배포 흐름

1. **Feature 개발**
   ```bash
   git checkout -b feature/new-feature
   # 개발...
   git push origin feature/new-feature
   # PR: feature/new-feature → develop
   ```

2. **Dev 배포**
   ```bash
   # develop 브랜치에 merge되면 자동 배포
   # → Dev EKS 클러스터
   ```

3. **Staging 배포** (선택)
   ```bash
   git checkout -b release/v1.0.0
   # → Staging EKS 클러스터
   ```

4. **Production 배포**
   ```bash
   # develop → main PR 생성 및 승인
   # → Prod EKS 클러스터 (수동 승인 후)
   ```

---

## 환경 구성

### GitHub Secrets

**Repository Settings → Secrets and variables → Actions**

| Secret Name | 설명 | 필수 |
|------------|------|------|
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key | ✅ |
| `SLACK_WEBHOOK_URL` | Slack 알림 Webhook | ❌ |
| `INFRACOST_API_KEY` | 비용 추정 API Key | ❌ |

### GitHub Environments

**Settings → Environments**

#### dev
- **Protection rules**: None
- **Deployment branches**: `develop`, `main`
- **Secrets**: 공통 사용

#### prod
- **Protection rules**:
  - ✅ Required reviewers: 2명
  - ✅ Wait timer: 5분
- **Deployment branches**: `main` only
- **Secrets**: Production 전용

---

## 배포 시간

| 워크플로우 | 평균 시간 | 캐시 사용 시 |
|----------|----------|------------|
| Backend CI/CD | ~8분 | ~5분 |
| Frontend CI/CD | ~10분 | ~6분 |
| Lambda CI/CD | ~3분/함수 | ~2분/함수 |
| Terraform CI/CD | ~15분 | ~12분 |

**최적화 기법**:
- Docker Layer 캐싱
- npm 의존성 캐싱
- GitHub Actions 캐시
- 병렬 Job 실행

---

## 모니터링 및 알림

### GitHub Actions

**모니터링**:
- Repository → Actions 탭
- Workflow 실행 이력
- 로그 및 아티팩트

**알림**:
- 실패 시 이메일 자동 발송
- Slack 통합 (설정 시)

### Slack 알림 설정

```yaml
- name: Send Slack notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: |
      Deployment ${{ job.status }}
      Branch: ${{ github.ref }}
      Commit: ${{ github.sha }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**알림 내용**:
- 배포 성공/실패
- 브랜치 및 커밋 정보
- 배포 시간

---

## 비용 최적화

### GitHub Actions 무료 할당량

| Plan | 월간 무료 시간 |
|------|--------------|
| Public Repository | ∞ 무제한 |
| Private (Free) | 2,000분 |
| Private (Pro) | 3,000분 |

### 예상 사용량

**월간 배포 횟수** (가정):
- Backend: 100회 × 5분 = 500분
- Frontend: 100회 × 6분 = 600분
- Lambda: 50회 × 2분 = 100분
- Terraform: 20회 × 12분 = 240분
- **총**: 1,440분/월

**비용**: $0 (2,000분 무료 내)

### 추가 최적화

1. **캐시 활용**
   ```yaml
   - uses: actions/cache@v3
     with:
       path: ~/.npm
       key: ${{ hashFiles('package-lock.json') }}
   ```

2. **조건부 실행**
   ```yaml
   if: github.event_name == 'push' && github.ref == 'refs/heads/main'
   ```

3. **Self-hosted Runners** (대규모 프로젝트)
   - 비용 절감
   - 더 빠른 실행
   - 완전한 제어

---

## 보안

### 1. Secrets 관리

- ✅ GitHub Secrets 사용
- ✅ 코드에 하드코딩 금지
- ✅ 정기적 로테이션

### 2. IAM 최소 권한

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:PublishVersion",
        "lambda:UpdateAlias"
      ],
      "Resource": "arn:aws:lambda:*:*:function:openmarket-*"
    }
  ]
}
```

### 3. Code Scanning

```yaml
# CodeQL Analysis
- name: Initialize CodeQL
  uses: github/codeql-action/init@v2
  with:
    languages: javascript, typescript

- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v2
```

### 4. Dependency Scanning

```yaml
# Dependabot 자동 업데이트
dependabot:
  version: 2
  updates:
    - package-ecosystem: "npm"
      directory: "/backend"
      schedule:
        interval: "weekly"
```

---

## 트러블슈팅

### 1. ECR 푸시 실패

**증상**: `denied: Your authorization token has expired`

**해결**:
```yaml
- name: Login to Amazon ECR
  uses: aws-actions/amazon-ecr-login@v2  # v1 → v2
```

### 2. EKS 배포 타임아웃

**증상**: `Error: timed out waiting for the condition`

**해결**:
```yaml
# 타임아웃 증가
helm upgrade --timeout 10m
```

### 3. Lambda 업데이트 실패

**증상**: `ResourceConflictException`

**해결**:
```yaml
# Wait for function update
aws lambda wait function-updated \
  --function-name $FUNCTION_NAME
```

---

## 다음 단계 (Phase 6)

1. ⏭️ **모니터링 강화**
   - Prometheus + Grafana
   - CloudWatch Dashboards
   - X-Ray Tracing

2. ⏭️ **성능 최적화**
   - Lambda Power Tuning
   - EKS Node Autoscaling
   - CDN 캐싱 전략

3. ⏭️ **보안 강화**
   - WAF 규칙 추가
   - OWASP Top 10 대응
   - Penetration Testing

---

## 참고 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [AWS Actions](https://github.com/aws-actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Helm Chart Testing](https://github.com/helm/chart-testing-action)
- [tfsec](https://github.com/aquasecurity/tfsec)
- [Infracost](https://www.infracost.io/)

---

## 요약

Phase 5에서 완성한 것:
- ✅ **4개 GitHub Actions Workflows**
  1. Backend CI/CD (테스트 → 빌드 → 배포)
  2. Frontend CI/CD (테스트 → 빌드 → 배포 → E2E)
  3. Lambda CI/CD (변경 감지 → 선택적 배포)
  4. Terraform CI/CD (Plan → Scan → Apply)
- ✅ **완전 자동화된 배포 파이프라인**
  - Push 시 자동 배포
  - 환경별 분리 (dev, prod)
  - 승인 기반 프로덕션 배포
- ✅ **보안 및 비용 최적화**
  - Secrets 관리
  - 캐시 활용
  - 조건부 실행
- ✅ **완전한 문서화**
  - 워크플로우 가이드
  - 트러블슈팅 가이드
  - 모범 사례

**Phase 5 완료!** 🎉

이제 코드 푸시 한 번으로 프로덕션까지 자동 배포됩니다!
