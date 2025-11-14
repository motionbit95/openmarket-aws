import axios from "axios";

import { CONFIG } from "src/global-config";

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.apiUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - 인증 토큰 자동 첨부
axiosInstance.interceptors.request.use(
  (config) => {
    // localStorage에서 토큰 가져오기 (브라우저에서만)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 에러 처리 및 토큰 갱신
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 네트워크 에러
    if (!error.response) {
      console.error("Network Error:", error.message);
      return Promise.reject({
        message: "네트워크 연결을 확인해주세요.",
        type: "NETWORK_ERROR",
        originalError: error,
      });
    }

    const { status, data } = error.response;

    // 401 Unauthorized - 토큰 만료 또는 인증 실패
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window !== "undefined") {
        // 토큰 제거 및 로그인 페이지로 리다이렉트
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // Next.js에서 페이지 이동
        if (window.location.pathname !== "/auth/sign-in") {
          window.location.href = "/auth/sign-in";
        }
      }

      return Promise.reject({
        message: "인증이 만료되었습니다. 다시 로그인해주세요.",
        type: "AUTH_ERROR",
        status,
        originalError: error,
      });
    }

    // 403 Forbidden - 권한 없음
    if (status === 403) {
      return Promise.reject({
        message: "접근 권한이 없습니다.",
        type: "PERMISSION_ERROR",
        status,
        data: data || {},
        originalError: error,
      });
    }

    // 422 Validation Error
    if (status === 422) {
      return Promise.reject({
        message: "입력값을 확인해주세요.",
        type: "VALIDATION_ERROR",
        status,
        data: data || {},
        originalError: error,
      });
    }

    // 500 Internal Server Error
    if (status >= 500) {
      return Promise.reject({
        message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        type: "SERVER_ERROR",
        status,
        originalError: error,
      });
    }

    // 기타 에러
    return Promise.reject({
      message: data?.message || `오류가 발생했습니다. (${status})`,
      type: "API_ERROR",
      status,
      data: data || {},
      originalError: error,
    });
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error("Failed to fetch:", error);
    throw error;
  }
};

// ----------------------------------------------------------------------

// 에러 타입별 처리를 위한 유틸리티 함수들
export const handleApiError = (error, showToast = true) => {
  if (showToast && typeof window !== "undefined") {
    // 토스트 라이브러리가 있다면 사용 (sonner 등)
    const message = error?.message || "알 수 없는 오류가 발생했습니다.";
    console.error("API Error:", message, error);

    // 추후 토스트 알림을 위한 이벤트 발생
    window.dispatchEvent(
      new CustomEvent("api-error", {
        detail: { message, type: error?.type },
      })
    );
  }
  return error;
};

// URL 파라미터 치환 헬퍼 함수
export const replaceUrlParams = (url, params) => {
  let replacedUrl = url;
  Object.keys(params).forEach((key) => {
    replacedUrl = replacedUrl.replace(`:${key}`, params[key]);
  });
  return replacedUrl;
};

// API 호출을 위한 고차 함수
export const apiCall = async (method, url, data = null, config = {}) => {
  try {
    const response = await axiosInstance({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  admin: {
    signIn: "/admin/sign-in",
    me: "/admin/me",
  },
  auth: {
    sendVerification: "/auth/send-verification",
    me: "/sellers/me",
    signIn: "/sellers/sign-in",
    signUp: "/sellers/sign-up",
    upload: "/attachments/upload/:type/:id",
  },
  user: {
    getAll: "/users",
    getById: "/users/:id",
    create: "/users",
    update: "/users/:id",
    delete: "/users/:id",
  },
  seller: {
    list: "/sellers",
    detail: "/sellers/:id",
    create: "/sellers",
    update: "/sellers/:id",
    delete: "/sellers/:id",
    upload: "/attachments/upload/:type/:id",
    attachmentDelete: "/attachments/delete/:type",
  },
  banner: {
    getAll: "/banners",
    getById: "/banners/:id",
    create: "/banners",
    update: "/banners/:id",
    delete: "/banners/:id",
  },
  coupon: {
    getAll: "/coupons",
    detail: "/coupons/:id",
    create: "/coupons",
    update: "/coupons/:id",
    delete: "/coupons/:id",
    bySeller: "/coupons/seller/:sellerId",
  },
  terms: {
    create: "/terms",
    list: "/terms",
    update: "/terms/:id",
    latestByType: "/terms/latest/:type",
  },
  notice: {
    list: "/notices",
    byType: "/notices/type/:type",
    detail: "/notices/:id",
    create: "/notices",
    update: "/notices/:id",
    delete: "/notices/:id",
    upload: "/attachments/upload/:type/:id",
    download: "/attachments/download-url/:key",
  },
  guide: {
    list: "/guides",
    byType: "/guides/type/:type",
    detail: "/guides/:id",
    create: "/guides",
    update: "/guides/:id",
    delete: "/guides/:id",
    upload: "/attachments/upload/:type/:id",
    download: "/attachments/download-url/:key",
  },
  inquiry: {
    list: "/inquiries",
    byType: "/inquiries/type/:type",
    detail: "/inquiries/:id",
    create: "/inquiries",
    update: "/inquiries/:id",
    delete: "/inquiries/:id",
    upload: "/attachments/upload/:type/:id",
    download: "/attachments/download-url/:key",
    bySeller: "/inquiries/seller/:sellerId",
    bySellerToAdmin: "/inquiries/seller-to-admin/:sellerId",
  },
  errorReport: {
    list: "/errorReport",
    detail: "/errorReport/:id",
    create: "/errorReport",
    update: "/errorReport/:id",
    delete: "/errorReport/:id",
    upload: "/attachments/upload/:type/:id",
    download: "/attachments/download-url/:key",
    byStatus: "/errorReport/status/:status",
    byCategory: "/errorReport/category/:category",
    byType: "/errorReport/type/:type",
    bySeller: "/errorReport/seller/:sellerId/:type",
  },
  product: {
    list: "/products",
    detail: "/products/:id",
    create: "/products",
    update: "/products/:id",
    delete: "/products/:id",
  },
  review: {
    create: "/reviews",
    byProduct: "/reviews/products/:productId",
    detail: "/reviews/:id",
    update: "/reviews/:id",
    delete: "/reviews/:id",
    bySeller: "/reviews/seller/:sellerId",
    upload: "/attachments/upload/review/:id",
    attachmentDelete: "/attachments/delete/:type",
  },
  settlement: {
    list: "/settlements",
    detail: "/settlements/:id",
    process: "/settlements/process",
    complete: "/settlements/complete",
    hold: "/settlements/hold",
    unhold: "/settlements/unhold",
    cancel: "/settlements/cancel",
    stats: "/settlements/stats",
    schedule: "/settlements/schedule",
  },
};
