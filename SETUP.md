# 🚀 OpenMarket AWS - 개발 환경 설정 가이드

## 📋 사전 요구사항

### 필수 설치 프로그램
- **Docker Desktop**: v20.10 이상
- **Docker Compose**: v2.0 이상
- **Node.js**: v20 이상 (로컬 개발 시)
- **Git**: 최신 버전

### 확인 방법
```bash
docker --version
docker compose version
node --version
git --version
```

## 🏗️ 프로젝트 구조

```
openmarket-aws/
├── backend/              # Node.js + Express + Prisma
├── frontend-web/         # Next.js (Admin, Seller, User)
├── mobile-app/           # Flutter (User App)
├── infrastructure/       # Terraform + Kubernetes
├── lambda/              # AWS Lambda Functions
├── nginx/               # Nginx 설정
├── docker-compose.yml   # 개발 환경
└── .env.example         # 환경 변수 템플릿
```

## 🎯 Phase 1: 로컬 컨테이너화 (현재 단계)

### Step 1: 프로젝트 클론 및 설정

```bash
# 프로젝트 디렉토리로 이동
cd /Users/krystal/project/openmarket-aws

# 환경 변수 파일 생성
cp .env.example .env

# .env 파일 편집 (필요시)
vim .env  # 또는 원하는 에디터 사용
```

### Step 2: 기존 프로젝트 코드 복사

현재는 Docker 구성만 완료된 상태입니다. 실제 코드는 기존 프로젝트에서 복사해야 합니다:

```bash
# Backend 코드 복사
cp -r ../openmarket-backend/* ./backend/
# (node_modules 제외)
rm -rf ./backend/node_modules

# Frontend 코드 복사
cp -r ../openmarket-client/* ./frontend-web/
rm -rf ./frontend-web/node_modules

# Mobile App 코드 복사 (선택사항)
cp -r ../openmarket_user_app/* ./mobile-app/
```

### Step 3: Docker 컨테이너 실행

#### 전체 스택 실행
```bash
# 모든 서비스 시작
docker compose up -d

# 로그 확인
docker compose logs -f

# 특정 서비스 로그만 보기
docker compose logs -f backend
docker compose logs -f frontend-web
```

#### 개별 서비스 실행
```bash
# Backend만 실행
docker compose up -d mysql redis backend

# Frontend만 실행
docker compose up -d frontend-web
```

### Step 4: 데이터베이스 초기화

```bash
# Backend 컨테이너 접속
docker compose exec backend sh

# Prisma 마이그레이션 실행
npx prisma migrate dev

# 시드 데이터 생성 (옵션)
npm run seed:all

# 컨테이너에서 나가기
exit
```

### Step 5: 서비스 접속

| 서비스 | URL | 설명 |
|--------|-----|------|
| **사용자 웹** | http://localhost:3000 | 일반 사용자 쇼핑몰 |
| **관리자 대시보드** | http://localhost:3000/admin | 관리자 페이지 |
| **판매자 대시보드** | http://localhost:3000/seller | 판매자 페이지 |
| **Backend API** | http://localhost:3001/api | REST API |
| **API 문서** | http://localhost:3001/api-docs | Swagger UI |
| **Adminer (DB)** | http://localhost:8080 | MySQL 관리 도구 |
| **Redis Commander** | http://localhost:8081 | Redis 관리 도구 |

### Step 6: 개발 모드

코드 변경 시 자동으로 재시작되도록 설정되어 있습니다:

```bash
# Backend 개발 모드 (Nodemon 사용)
docker compose up backend

# Frontend 개발 모드 (Next.js Fast Refresh)
docker compose up frontend-web
```

## 🛠️ 유용한 명령어

### Docker Compose 관리

```bash
# 모든 서비스 중지
docker compose down

# 볼륨까지 완전 삭제
docker compose down -v

# 서비스 재시작
docker compose restart backend

# 서비스 재빌드
docker compose up -d --build backend

# 실행 중인 서비스 확인
docker compose ps

# 리소스 사용량 확인
docker compose stats
```

### 컨테이너 접속

```bash
# Backend 쉘 접속
docker compose exec backend sh

# MySQL 접속
docker compose exec mysql mysql -u openmarket -p

# Redis CLI 접속
docker compose exec redis redis-cli -a redis123
```

### 로그 확인

```bash
# 모든 로그 실시간 확인
docker compose logs -f

# 마지막 100줄만 보기
docker compose logs --tail=100

# 특정 서비스만
docker compose logs -f backend frontend-web
```

## 🧪 테스트

### Backend API 테스트

```bash
# 컨테이너 내에서 테스트 실행
docker compose exec backend npm test

# 커버리지 포함
docker compose exec backend npm run test:coverage
```

### Frontend 테스트

```bash
# 컨테이너 내에서 테스트 실행
docker compose exec frontend-web npm test
```

### Health Check

```bash
# Backend 상태 확인
curl http://localhost:3001/health

# Frontend 상태 확인
curl http://localhost:3000/api/health
```

## 🐛 트러블슈팅

### 포트 충돌

```bash
# 사용 중인 포트 확인
lsof -i :3000
lsof -i :3001
lsof -i :3306

# 프로세스 종료
kill -9 <PID>
```

### 볼륨 권한 문제

```bash
# 볼륨 재생성
docker compose down -v
docker volume prune -f
docker compose up -d
```

### 이미지 빌드 실패

```bash
# Docker 캐시 없이 재빌드
docker compose build --no-cache backend

# 전체 재빌드
docker compose build --no-cache
```

### 데이터베이스 연결 실패

```bash
# MySQL 컨테이너 상태 확인
docker compose ps mysql

# MySQL 로그 확인
docker compose logs mysql

# 데이터베이스 재시작
docker compose restart mysql

# 연결 테스트
docker compose exec mysql mysqladmin ping -h localhost
```

## 📊 모니터링

### 리소스 사용량

```bash
# 실시간 모니터링
docker compose stats

# 디스크 사용량
docker system df
```

### 로그 파일

로그는 각 컨테이너 내부에 저장됩니다:
- Backend: `/app/logs/`
- Frontend: `.next/logs/`

## 🔒 보안 주의사항

### 개발 환경 전용

현재 설정은 **개발 환경 전용**입니다:
- 기본 비밀번호 사용
- CORS 설정 느슨함
- 디버그 모드 활성화

### 프로덕션 배포 전

반드시 다음을 변경하세요:
- [ ] 모든 비밀번호 변경
- [ ] JWT_SECRET 변경
- [ ] CORS 설정 강화
- [ ] HTTPS 활성화
- [ ] Rate Limiting 설정

## 📚 다음 단계

Phase 1 완료 후:
1. ✅ Phase 1: 로컬 컨테이너화 (현재)
2. ⏭️ Phase 2: AWS 인프라 구축 (Terraform)
3. ⏭️ Phase 3: EKS 배포
4. ⏭️ Phase 4: Lambda Functions
5. ⏭️ Phase 5: CI/CD 파이프라인
6. ⏭️ Phase 6: 모니터링 & 최적화

## 🆘 도움말

문제가 발생하면:
1. 로그 확인: `docker compose logs -f`
2. 컨테이너 상태: `docker compose ps`
3. 네트워크 확인: `docker network ls`
4. 볼륨 확인: `docker volume ls`

## 📝 체크리스트

개발 환경 설정 완료 확인:
- [ ] Docker 설치 완료
- [ ] .env 파일 생성
- [ ] 기존 코드 복사
- [ ] docker compose up 성공
- [ ] 데이터베이스 마이그레이션 완료
- [ ] http://localhost:3000 접속 가능
- [ ] http://localhost:3001/api 접속 가능
- [ ] Adminer 접속 가능
- [ ] Redis Commander 접속 가능

모든 항목이 체크되면 Phase 1 완료! 🎉
