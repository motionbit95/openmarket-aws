import { SWRConfig } from 'swr';
import { fetcher, handleApiError } from './axios';

// SWR 전역 설정
export const swrConfig = {
  fetcher,
  
  // 캐시 설정
  revalidateOnFocus: false, // 윈도우 포커스 시 재검증 비활성화
  revalidateOnReconnect: true, // 네트워크 재연결 시 재검증
  revalidateIfStale: true, // stale 데이터에 대해 재검증
  
  // 재시도 설정
  shouldRetryOnError: (error) => {
    // 네트워크 에러나 5xx 에러만 재시도
    return error?.type === 'NETWORK_ERROR' || 
           (error?.status >= 500 && error?.status < 600);
  },
  errorRetryCount: 3, // 최대 3번 재시도
  errorRetryInterval: 1000, // 1초 간격으로 재시도
  
  // 캐시 유효 시간 설정
  dedupingInterval: 2000, // 2초 내 중복 요청 제거
  refreshInterval: 0, // 자동 새로고침 비활성화 (필요시 개별 설정)
  
  // 에러 처리
  onError: (error, key) => {
    console.error(`SWR Error for key "${key}":`, error);
    handleApiError(error, true); // 토스트 알림과 함께 에러 처리
  },
  
  // 성공 시 로그 (개발 환경에서만)
  onSuccess: (data, key) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`SWR Success for key "${key}":`, data);
    }
  },
  
  // 로딩 상태 관리를 위한 사용자 정의 옵션들
  loadingTimeout: 3000, // 3초 후 로딩 타임아웃
  
  // 백그라운드 새로고침 설정
  refreshWhenHidden: false, // 탭이 숨겨져 있을 때 새로고침 비활성화
  refreshWhenOffline: false, // 오프라인일 때 새로고침 비활성화
};

// SWR Provider 컴포넌트
export function SWRProvider({ children }) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}

// 자주 사용되는 SWR 키 패턴들
export const SWR_KEYS = {
  // 사용자 관련
  users: '/users',
  user: (id) => `/users/${id}`,
  userProfile: '/users/profile',
  
  // 판매자 관련
  sellers: '/sellers',
  seller: (id) => `/sellers/${id}`,
  sellerProfile: '/sellers/profile',
  
  // 상품 관련
  products: '/products',
  product: (id) => `/products/${id}`,
  productsBySeller: (sellerId) => `/products?seller=${sellerId}`,
  
  // 주문 관련
  orders: '/orders',
  order: (id) => `/orders/${id}`,
  ordersByUser: (userId) => `/orders?user=${userId}`,
  
  // 공지사항 관련
  notices: '/notices',
  notice: (id) => `/notices/${id}`,
  noticesByType: (type) => `/notices?type=${type}`,
  
  // 쿠폰 관련
  coupons: '/coupons',
  coupon: (id) => `/coupons/${id}`,
  couponsBySeller: (sellerId) => `/coupons?seller=${sellerId}`,
  
  // 문의 관련
  inquiries: '/inquiries',
  inquiry: (id) => `/inquiries/${id}`,
  inquiriesByUser: (userId) => `/inquiries?user=${userId}`,
  
  // 리뷰 관련
  reviews: '/reviews',
  review: (id) => `/reviews/${id}`,
  reviewsByProduct: (productId) => `/reviews?product=${productId}`,
};

// 캐시 무효화 헬퍼 함수들
export const cacheUtils = {
  // 특정 키의 캐시 무효화
  invalidate: async (mutate, key) => {
    await mutate(key);
  },
  
  // 패턴에 맞는 모든 키 무효화
  invalidatePattern: async (cache, pattern) => {
    const keys = Array.from(cache.keys()).filter(key => 
      key.toString().includes(pattern)
    );
    
    await Promise.all(keys.map(key => cache.delete(key)));
  },
  
  // 사용자 관련 모든 캐시 무효화
  invalidateUser: async (mutate, userId) => {
    const userKeys = [
      SWR_KEYS.users,
      SWR_KEYS.user(userId),
      SWR_KEYS.userProfile,
      SWR_KEYS.ordersByUser(userId),
      SWR_KEYS.inquiriesByUser(userId),
    ];
    
    await Promise.all(userKeys.map(key => mutate(key)));
  },
  
  // 상품 관련 모든 캐시 무효화
  invalidateProduct: async (mutate, productId) => {
    const productKeys = [
      SWR_KEYS.products,
      SWR_KEYS.product(productId),
      SWR_KEYS.reviewsByProduct(productId),
    ];
    
    await Promise.all(productKeys.map(key => mutate(key)));
  },
};

export default swrConfig;