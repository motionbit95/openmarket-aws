# 오픈마켓 프론트엔드 개발 가이드

## 개요

이 프로젝트는 Next.js 15와 React 19를 기반으로 한 오픈마켓 관리자 및 판매자 대시보드입니다.

## 아키텍처

- **프레임워크**: Next.js 15 (App Router)
- **UI 라이브러리**: Material-UI v7
- **상태 관리**: SWR (Server State) + React Context (Client State)
- **HTTP 클라이언트**: Axios with interceptors
- **테스트**: Vitest + Testing Library
- **스타일링**: Emotion (CSS-in-JS)

## 프로젝트 구조

```
src/
├── actions/           # API 호출 함수들
├── app/              # Next.js App Router 페이지들
├── components/       # 재사용 가능한 컴포넌트들
├── hooks/           # 커스텀 React 훅들
│   ├── api/         # SWR 기반 API 훅들
├── lib/             # 유틸리티 및 설정 파일들
│   ├── axios.js     # Axios 인스턴스 및 설정
│   ├── swr-config.js # SWR 전역 설정
├── sections/        # 페이지별 섹션 컴포넌트들
├── __tests__/       # 테스트 파일들
│   ├── api/         # API 테스트
│   ├── integration/ # 통합 테스트
└── utils/           # 유틸리티 함수들
```

## 환경 설정

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# API 서버 URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# 개발 환경 설정
NODE_ENV=development

# 기타 설정
NEXT_PUBLIC_ASSETS_DIR=/assets
BUILD_STATIC_EXPORT=false
```

### 2. 백엔드 서버 설정

백엔드 서버가 `localhost:3000`에서 실행되고 있는지 확인하세요.

## 개발 실행

### 옵션 1: 통합 개발 환경

프론트엔드와 백엔드를 동시에 실행:

```bash
npm run dev:full
```

### 옵션 2: 개별 실행

**프론트엔드만 실행:**
```bash
npm run dev
```

**백엔드만 실행 (별도 터미널):**
```bash
npm run dev:backend
```

## API 연동

### Axios 설정

- **Base URL**: 환경 변수에서 자동 설정
- **인증**: JWT 토큰 자동 첨부
- **에러 처리**: 통합 에러 처리 및 재시도 로직
- **타임아웃**: 10초

### API 호출 예시

```javascript
// actions 사용
import { getUsers, createUser } from 'src/actions/user';

// 직접 호출
const users = await getUsers({ search: 'test' });

// SWR 훅 사용 (권장)
import { useUsers } from 'src/hooks/api/useUsers';

function UsersList() {
  const { users, isLoading, error, refresh } = useUsers();
  // ...
}
```

### 에러 처리

모든 API 에러는 다음 형태로 표준화되어 있습니다:

```javascript
{
  message: '사용자에게 보여질 메시지',
  type: 'NETWORK_ERROR' | 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'SERVER_ERROR' | 'API_ERROR',
  status: 404, // HTTP 상태 코드
  data: {}, // 서버에서 반환한 데이터
  originalError: Error // 원본 에러 객체
}
```

## 상태 관리

### SWR 캐시 전략

- **전역 설정**: `src/lib/swr-config.js`
- **자동 재시도**: 네트워크/서버 에러시만
- **캐시 무효화**: 뮤테이션 후 자동 처리
- **디바운스**: 검색 등에 500ms 적용

### 사용 예시

```javascript
import { useUsers, useUserMutations } from 'src/hooks/api/useUsers';

function UserManagement() {
  // 데이터 조회
  const { users, isLoading, error } = useUsers();
  
  // 뮤테이션
  const { createUser, updateUser, deleteUser } = useUserMutations();
  
  const handleCreate = async (userData) => {
    const result = await createUser(userData);
    if (result.success) {
      // 성공 처리
    } else {
      // 에러 처리
    }
  };
}
```

## 테스트

### 테스트 실행

```bash
# 모든 테스트
npm run test

# API 테스트만
npm run test:api

# 통합 테스트만
npm run test:integration

# 워치 모드
npm run test:watch

# UI 모드
npm run test:ui
```

### 테스트 작성 가이드

1. **API 테스트**: 백엔드 연동 테스트
2. **통합 테스트**: 전체 플로우 테스트
3. **단위 테스트**: 개별 함수/컴포넌트 테스트

## 코드 품질

### 린팅 및 포맷팅

```bash
# 린트 검사
npm run lint

# 린트 자동 수정
npm run lint:fix

# 포맷팅 검사
npm run fm:check

# 포맷팅 자동 수정
npm run fm:fix

# 모든 수정 적용
npm run fix:all
```

## 배포

### 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm run start
```

## API 엔드포인트

주요 API 엔드포인트들:

- `GET /users` - 사용자 목록
- `POST /users` - 사용자 생성
- `GET /users/:id` - 사용자 상세
- `PUT /users/:id` - 사용자 수정
- `DELETE /users/:id` - 사용자 삭제
- `GET /sellers` - 판매자 목록
- `POST /sellers` - 판매자 생성
- 기타 자세한 내용은 `src/lib/axios.js` 참조

## 개발 팁

### 1. 새로운 API 추가시

1. `src/actions/` 에 API 함수 추가
2. `src/lib/axios.js` 에 엔드포인트 추가
3. `src/hooks/api/` 에 SWR 훅 추가
4. `src/__tests__/api/` 에 테스트 추가

### 2. 컴포넌트 개발시

- Material-UI 컴포넌트 우선 사용
- 재사용 가능한 컴포넌트는 `src/components/` 에 배치
- 페이지별 컴포넌트는 `src/sections/` 에 배치

### 3. 상태 관리

- 서버 상태는 SWR 사용
- 클라이언트 상태는 React state/context 사용
- 전역 상태가 필요한 경우 Context API 고려

## 트러블슈팅

### 자주 발생하는 문제들

1. **백엔드 연결 실패**
   - `.env.local` 파일 확인
   - 백엔드 서버 실행 상태 확인
   - 포트 번호 확인

2. **CORS 에러**
   - 백엔드 CORS 설정 확인
   - API URL 정확성 확인

3. **토큰 관련 에러**
   - localStorage의 토큰 확인
   - 토큰 만료 여부 확인

## 기여 가이드

1. 새로운 기능 개발 전 이슈 생성
2. 코드 작성 후 테스트 실행
3. 린트 검사 통과 확인
4. Pull Request 생성

---

문의사항이 있으면 개발팀에 연락하세요.