# 스토리북 테스트 환경 가이드

## 개요

이 프로젝트는 Storybook을 사용하여 컴포넌트를 독립적으로 개발하고 테스트할 수 있는 환경을 구축했습니다.

## 설치된 컴포넌트 스토리

### 1. EmptyContent

- **위치**: `src/components/empty-content/empty-content.stories.jsx`
- **기능**: 데이터가 없을 때 표시하는 빈 상태 컴포넌트
- **스토리**:
  - Default: 기본 빈 상태
  - WithCustomImage: 커스텀 이미지와 함께
  - WithAction: 액션 버튼과 함께
  - Filled: 배경이 채워진 상태
  - CustomStyling: 커스텀 스타일링

### 2. LoadingScreen

- **위치**: `src/components/loading-screen/loading-screen.stories.jsx`
- **기능**: 로딩 상태를 표시하는 컴포넌트
- **스토리**:
  - Default: 기본 로딩 화면
  - WithPortal: Portal을 사용한 렌더링
  - CustomStyling: 커스텀 스타일링
  - InContainer: 컨테이너 내부에서의 표시

### 3. Label

- **위치**: `src/components/label/label.stories.jsx`
- **기능**: 다양한 스타일의 라벨 컴포넌트
- **스토리**:
  - Default: 기본 라벨
  - Soft: 부드러운 스타일
  - Filled: 채워진 스타일
  - Outlined: 테두리 스타일
  - Inverted: 반전된 스타일
  - WithColors: 다양한 색상
  - WithIcons: 아이콘과 함께
  - Disabled: 비활성화 상태
  - AllVariants: 모든 변형

### 4. Iconify

- **위치**: `src/components/iconify/iconify.stories.jsx`
- **기능**: 아이콘 표시 컴포넌트
- **스토리**:
  - Default: 기본 아이콘
  - DifferentSizes: 다양한 크기
  - CommonIcons: 일반적인 아이콘들
  - NavigationIcons: 네비게이션 아이콘들
  - ActionIcons: 액션 아이콘들
  - CustomStyling: 커스텀 스타일링

### 5. Logo

- **위치**: `src/components/logo/logo.stories.jsx`
- **기능**: 로고 표시 컴포넌트
- **스토리**:
  - Single: 단일 로고
  - Full: 전체 로고
  - Disabled: 비활성화 상태
  - CustomLink: 커스텀 링크
  - CustomStyling: 커스텀 스타일링
  - BothVariants: 두 가지 변형

## 사용 방법

### 스토리북 실행

```bash
# 개발 모드로 스토리북 실행
npm run storybook

# 스토리북 빌드
npm run build-storybook
```

### 테스트 실행

```bash
# 스토리북 테스트 실행
npm run test-storybook

# 스토리북 테스트 (감시 모드)
npm run test-storybook:watch

# CI 환경에서 스토리북 테스트
npm run test-storybook:ci
```

### Playwright 테스트 실행

```bash
# Playwright 테스트 실행
npx playwright test tests/storybook.spec.js

# Playwright UI 모드
npx playwright test --ui
```

## 스토리북 기능

### 1. 컨트롤 (Controls)

- 각 컴포넌트의 props를 실시간으로 조정할 수 있습니다
- 색상, 텍스트, 불린 값 등을 쉽게 변경할 수 있습니다

### 2. 액션 (Actions)

- 이벤트 핸들러의 호출을 모니터링할 수 있습니다
- 클릭, 변경 등의 이벤트를 추적할 수 있습니다

### 3. 뷰포트 (Viewport)

- 다양한 화면 크기에서 컴포넌트를 확인할 수 있습니다
- Mobile, Tablet, Desktop 크기를 지원합니다

### 4. 배경 (Backgrounds)

- 다양한 배경색에서 컴포넌트를 확인할 수 있습니다
- Light, Dark, Gray 테마를 지원합니다

### 5. 접근성 (Accessibility)

- a11y 애드온을 통해 접근성 문제를 자동으로 감지합니다
- 색상 대비, 키보드 네비게이션 등을 검사합니다

## 새로운 컴포넌트 스토리 추가하기

### 1. 스토리 파일 생성

```jsx
// src/components/your-component/your-component.stories.jsx
import { YourComponent } from "./your-component";

export default {
  title: "Components/YourComponent",
  component: YourComponent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    // props 정의
  },
};

export const Default = {
  args: {
    // 기본 props
  },
};
```

### 2. 스토리 추가

```jsx
export const Variant = {
  args: {
    // 변형된 props
  },
};
```

### 3. 테스트 추가

```jsx
// tests/your-component.spec.js
test("YourComponent should render correctly", async ({ page }) => {
  await page.goto(
    "http://localhost:6006/?path=/story/components-yourcomponent--default"
  );
  await expect(page.locator('[data-testid="your-component"]')).toBeVisible();
});
```

## 모범 사례

### 1. 컴포넌트 설계

- 재사용 가능한 컴포넌트로 설계
- 명확한 props 인터페이스 정의
- 적절한 기본값 설정

### 2. 스토리 작성

- 모든 주요 사용 사례를 포함
- 명확한 설명과 예시 제공
- 접근성 고려

### 3. 테스트 작성

- 렌더링 테스트
- 사용자 상호작용 테스트
- 접근성 테스트
- 반응형 디자인 테스트

## 문제 해결

### 스토리북이 시작되지 않는 경우

1. 의존성 설치 확인: `npm install`
2. 포트 충돌 확인: 다른 프로세스가 6006 포트를 사용하고 있는지 확인
3. 캐시 클리어: `npm run clean`

### 테스트가 실패하는 경우

1. 스토리북이 실행 중인지 확인
2. 컴포넌트의 data-testid 속성 확인
3. Playwright 브라우저 설치: `npx playwright install`

## 추가 리소스

- [Storybook 공식 문서](https://storybook.js.org/)
- [Storybook 테스트 가이드](https://storybook.js.org/docs/writing-tests/introduction)
- [Playwright 공식 문서](https://playwright.dev/)
- [MUI 컴포넌트 라이브러리](https://mui.com/)
