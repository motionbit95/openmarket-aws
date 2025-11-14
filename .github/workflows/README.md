# GitHub Actions CI/CD Workflows

OpenMarket 프로젝트의 자동화된 CI/CD 파이프라인입니다.

## 📋 Workflows

### 1. Backend CI/CD (`backend-ci-cd.yml`)

**트리거**:
- Push: `main`, `develop` 브랜치 (`backend/**` 변경 시)
- Pull Request: `main`, `develop` 브랜치

**단계**:
1. **Test & Lint**: 코드 품질 검사 및 테스트
2. **Build**: Docker 이미지 빌드 및 ECR 푸시
3. **Deploy**: EKS에 Helm으로 배포
4. **Notify**: Slack 알림

**환경 변수**:
- `AWS_ACCESS_KEY_ID`: AWS 액세스 키
- `AWS_SECRET_ACCESS_KEY`: AWS 시크릿 키
- `SLACK_WEBHOOK_URL`: Slack 웹훅 (선택)

---

### 2. Frontend CI/CD (`frontend-ci-cd.yml`)

**트리거**:
- Push: `main`, `develop` 브랜치 (`frontend-web/**` 변경 시)
- Pull Request: `main`, `develop` 브랜치

**단계**:
1. **Test & Lint**: ESLint, TypeScript 타입 체크, 빌드 테스트
2. **Build**: Next.js 앱 빌드 및 ECR 푸시
3. **Deploy**: EKS에 배포
4. **E2E Test**: Playwright E2E 테스트 (develop만)
5. **Notify**: Slack 알림

---

### 3. Lambda Functions CI/CD (`lambda-ci-cd.yml`)

**트리거**:
- Push: `main`, `develop` 브랜치 (`lambda/**` 변경 시)
- Pull Request: `main`, `develop` 브랜치

**단계**:
1. **Detect Changes**: 변경된 Lambda Function 감지
2. **Deploy Functions**: 각 Lambda 개별 배포
   - Image Processor
   - Email Sender
   - Settlement Report
   - Webhook Handler
3. **Integration Test**: 통합 테스트
4. **Notify**: Slack 알림

**특징**:
- 변경된 Lambda만 선택적으로 배포
- 버전 관리 및 Alias 업데이트 (Production)

---

### 4. Terraform CI/CD (`terraform-ci-cd.yml`)

**트리거**:
- Push: `main` 브랜치 (`infrastructure/terraform/**` 변경 시)
- Pull Request: `main` 브랜치

**단계**:
1. **Plan**: Terraform Plan 생성 (dev, staging, prod)
2. **Security Scan**: tfsec으로 보안 스캔
3. **Cost Estimation**: Infracost로 비용 추정 (PR만)
4. **Apply**: Terraform Apply
   - Dev: 자동 배포
   - Prod: 수동 승인 후 배포
5. **Notify**: Slack 알림

---

## 🔐 Required Secrets

GitHub Repository Settings → Secrets and variables → Actions에서 설정:

### 필수 Secrets
- `AWS_ACCESS_KEY_ID`: AWS IAM 사용자 Access Key
- `AWS_SECRET_ACCESS_KEY`: AWS IAM 사용자 Secret Key

### 선택 Secrets
- `SLACK_WEBHOOK_URL`: Slack 알림용 Webhook URL
- `INFRACOST_API_KEY`: Terraform 비용 추정용 API Key

---

## 🌍 GitHub Environments

Settings → Environments에서 다음 환경 생성:

### 1. dev
- **Protection rules**: None
- **Deployment branches**: `develop`, `main`

### 2. staging (선택)
- **Protection rules**: Required reviewers (1명)
- **Deployment branches**: `main`

### 3. prod
- **Protection rules**:
  - Required reviewers (2명 이상)
  - Wait timer: 5분
- **Deployment branches**: `main` only

---

## 🚀 배포 프로세스

### 개발 배포 (Dev)

```bash
# 1. 기능 브랜치 생성
git checkout -b feature/new-feature

# 2. 코드 작성 및 커밋
git add .
git commit -m "feat: add new feature"

# 3. develop 브랜치에 Push
git push origin feature/new-feature

# 4. Pull Request 생성
# GitHub에서 feature/new-feature → develop PR 생성

# 5. CI 통과 확인 및 병합
# PR이 병합되면 자동으로 dev 환경에 배포
```

### 프로덕션 배포 (Prod)

```bash
# 1. develop → main PR 생성
git checkout main
git pull origin main
git merge develop

# 2. 버전 태그 생성
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 3. main 브랜치에 Push
git push origin main

# 4. GitHub Actions에서 승인 대기
# Settings → Environments → prod에서 승인자가 승인

# 5. 자동 배포 진행
```

---

## 🧪 로컬 테스트

### Act로 로컬에서 GitHub Actions 테스트

```bash
# Act 설치 (macOS)
brew install act

# Workflow 테스트
act -j test -s AWS_ACCESS_KEY_ID=xxx -s AWS_SECRET_ACCESS_KEY=yyy

# 특정 workflow 실행
act push -W .github/workflows/backend-ci-cd.yml
```

---

## 📊 Workflow 상태 확인

### GitHub Actions 페이지
- Repository → Actions 탭
- 각 workflow별 실행 이력 확인
- 실패 시 로그 확인 및 재실행

### Badges

README.md에 추가할 수 있는 배지:

```markdown
![Backend CI/CD](https://github.com/username/openmarket-aws/workflows/Backend%20CI%2FCD/badge.svg)
![Frontend CI/CD](https://github.com/username/openmarket-aws/workflows/Frontend%20CI%2FCD/badge.svg)
![Lambda CI/CD](https://github.com/username/openmarket-aws/workflows/Lambda%20Functions%20CI%2FCD/badge.svg)
![Terraform CI/CD](https://github.com/username/openmarket-aws/workflows/Terraform%20CI%2FCD/badge.svg)
```

---

## 🔧 트러블슈팅

### 1. ECR 로그인 실패

**증상**: `Error: Cannot perform an interactive login from a non TTY device`

**해결**:
```yaml
- name: Login to Amazon ECR
  uses: aws-actions/amazon-ecr-login@v2  # v1 → v2 업그레이드
```

### 2. kubectl 연결 실패

**증상**: `The connection to the server ... was refused`

**해결**:
```bash
# IAM 사용자에 EKS 접근 권한 추가
aws eks update-kubeconfig --name openmarket-dev-eks --region ap-northeast-2
```

### 3. Helm 배포 타임아웃

**증상**: `Error: timed out waiting for the condition`

**해결**:
```yaml
# Timeout 증가
--timeout 10m  # 기본 5m → 10m
```

### 4. 비용 과다 청구

**증상**: GitHub Actions 실행 시간 초과

**해결**:
- 캐시 활용 (`actions/cache@v3`)
- Self-hosted runners 사용 고려
- Workflow 트리거 조건 최적화

---

## 💰 비용 최적화

### GitHub Actions 무료 할당량
- Public Repository: 무제한
- Private Repository: 2,000분/월 (Free plan)

### 최적화 팁

1. **캐시 활용**
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

2. **조건부 실행**
```yaml
if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

3. **병렬 실행 제한**
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

---

## 📝 모범 사례

1. **Secrets 관리**
   - 절대 코드에 하드코딩하지 않기
   - GitHub Secrets 사용
   - 정기적으로 로테이션

2. **브랜치 전략**
   - `main`: Production
   - `develop`: Development
   - `feature/*`: 기능 개발

3. **커밋 메시지**
   - Conventional Commits 사용
   - `feat:`, `fix:`, `docs:`, `refactor:` 등

4. **PR 리뷰**
   - 최소 1명 이상 리뷰
   - CI 통과 후 병합
   - Squash merge 권장

---

## 🔗 참고 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [AWS Actions](https://github.com/aws-actions)
- [Helm Chart Testing](https://github.com/helm/chart-testing-action)
- [Docker Buildx](https://github.com/docker/build-push-action)
