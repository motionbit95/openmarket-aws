/**
 * 판매자(Partner) API 서비스
 */

import { transformApiResponse } from "../utils/product-data-transformer.js";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const USE_MOCK_DATA = false; // 목업 데이터 완전 비활성화

// Mock 데이터 생성기
const generateMockData = (endpoint) => {
  if (endpoint.includes("/partner/orders/counts")) {
    return {
      success: true,
      counts: {
        total: 150,
        paid: 25,
        pending: 8,
        confirmed: 12,
        shipped: 18,
        delivered: 85,
        cancelled: 2,
      },
    };
  }

  if (endpoint.includes("/partner/deliveries/counts")) {
    return {
      success: true,
      counts: {
        preparing: 15,
        delayed: 2,
        shipped: 18,
        delivered: 85,
        failed: 0,
      },
    };
  }

  if (endpoint.includes("/partner/cancellations/counts")) {
    return {
      success: true,
      counts: {
        requested: 3,
        approved: 2,
        processing: 1,
        completed: 8,
        rejected: 0,
      },
    };
  }

  if (endpoint.includes("/partner/returns/counts")) {
    return {
      success: true,
      counts: {
        requested: 5,
        approved: 3,
        pickupScheduled: 2,
        processing: 1,
        completed: 12,
        rejected: 1,
      },
    };
  }

  if (endpoint.includes("/partner/orders") && !endpoint.includes("/counts")) {
    const mockData = {
      success: true,
      orders: [
        {
          id: "ORD-001",
          orderNumber: "ORD-2024-001",
          customer: { name: "김고객", email: "kim@example.com" },
          totalAmount: 89000,
          status: "delivered",
          createdAt: "2024-01-15T10:30:00Z",
        },
        {
          id: "ORD-002",
          orderNumber: "ORD-2024-002",
          customer: { name: "이고객", email: "lee@example.com" },
          totalAmount: 156000,
          status: "shipped",
          createdAt: "2024-01-15T09:15:00Z",
        },
        {
          id: "ORD-003",
          orderNumber: "ORD-2024-003",
          customer: { name: "박고객", email: "park@example.com" },
          totalAmount: 234000,
          status: "preparing",
          createdAt: "2024-01-15T08:45:00Z",
        },
      ],
    };
    return transformApiResponse(mockData);
  }

  if (endpoint.includes("/partner/settlements")) {
    const mockData = {
      success: true,
      settlements: [
        {
          id: "SETTLE-001",
          settlementNumber: "ST-2024-001",
          period: { startDate: "2024-01-01", endDate: "2024-01-31" },
          salesAmount: 5035000,
          commissionRate: 5,
          commissionAmount: 251750,
          settlementAmount: 4783250,
          orderCount: 45,
          status: "COMPLETED",
          processedAt: "2024-02-01T09:00:00Z",
        },
        {
          id: "SETTLE-002",
          settlementNumber: "ST-2024-002",
          period: { startDate: "2024-02-01", endDate: "2024-02-29" },
          salesAmount: 3200000,
          commissionRate: 5,
          commissionAmount: 160000,
          settlementAmount: 3040000,
          orderCount: 28,
          status: "PENDING",
        },
        {
          id: "SETTLE-003",
          settlementNumber: "ST-2024-003",
          period: { startDate: "2024-03-01", endDate: "2024-03-31" },
          salesAmount: 2800000,
          commissionRate: 5,
          commissionAmount: 140000,
          settlementAmount: 2660000,
          orderCount: 32,
          status: "COMPLETED",
          processedAt: "2024-04-01T09:00:00Z",
        },
      ],
      total: 3,
    };
    return transformApiResponse(mockData);
  }

  // 기본 성공 응답
  return { success: true, data: [] };
};

// 공통 API 호출 함수
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // 개발 환경에서 Mock 데이터 사용
  if (USE_MOCK_DATA) {
    console.log(`🎭 Mock API: ${options?.method || "GET"} ${endpoint}`);
    await new Promise((resolve) => setTimeout(resolve, 500)); // 네트워크 지연 시뮬레이션

    const mockData = generateMockData(endpoint);

    // 상품 관련 API인 경우 데이터 변환
    if (endpoint.includes("/products") || endpoint.includes("/seller")) {
      return transformApiResponse(mockData);
    }

    return mockData;
  }

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  // 인증 토큰이 있으면 헤더에 추가
  const token = localStorage.getItem("accessToken");
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(
        `API 호출 실패: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // 상품 관련 API인 경우 데이터 변환
    if (endpoint.includes("/products") || endpoint.includes("/seller")) {
      return transformApiResponse(data);
    }

    return data;
  } catch (error) {
    console.error("API 호출 오류:", error);
    throw error;
  }
};

// ==================== 주문 관리 ====================

/**
 * 판매자 주문 목록 조회
 */
export const getPartnerOrders = async (params = {}) => {
  console.log("🔍 [getPartnerOrders] params:", params);
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });

  const url = `/partner/orders?${queryParams.toString()}`;
  console.log("🔍 [getPartnerOrders] 요청 URL:", url);
  const result = await apiCall(url);
  console.log("🔍 [getPartnerOrders] 응답 데이터 수:", result?.orders?.length || 0);
  return result;
};

/**
 * 주문 상태별 개수 조회
 */
export const getPartnerOrderCounts = async (sellerId) => {
  console.log("🔍 [getPartnerOrderCounts] sellerId:", sellerId);
  const result = await apiCall(`/partner/orders/counts?sellerId=${sellerId}`);
  console.log("🔍 [getPartnerOrderCounts] result:", result);
  return result;
};

/**
 * 주문 상태 변경
 */
export const updateOrderStatus = async (orderId, statusData) => {
  return apiCall(`/partner/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(statusData),
  });
};

// ==================== 배송 관리 ====================

/**
 * 판매자 배송 목록 조회
 */
export const getPartnerDeliveries = async (params = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });

  return apiCall(`/partner/deliveries?${queryParams.toString()}`);
};

/**
 * 배송 상태별 개수 조회
 */
export const getPartnerDeliveryCounts = async (sellerId) => {
  console.log("🔍 [getPartnerDeliveryCounts] sellerId:", sellerId);
  const result = await apiCall(`/partner/deliveries/counts?sellerId=${sellerId}`);
  console.log("🔍 [getPartnerDeliveryCounts] result:", result);
  return result;
};

/**
 * 배송 시작
 */
export const startDelivery = async (orderId, deliveryData) => {
  return apiCall(`/partner/deliveries/${orderId}/start`, {
    method: "PATCH",
    body: JSON.stringify(deliveryData),
  });
};

/**
 * 운송장 번호 업데이트
 */
export const updateTracking = async (orderId, trackingData) => {
  return apiCall(`/partner/deliveries/${orderId}/tracking`, {
    method: "PATCH",
    body: JSON.stringify(trackingData),
  });
};

// ==================== 취소 관리 ====================

/**
 * 판매자 취소 요청 목록 조회
 */
export const getPartnerCancellations = async (params = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });

  return apiCall(`/partner/cancellations?${queryParams.toString()}`);
};

/**
 * 취소 상태별 개수 조회
 */
export const getPartnerCancellationCounts = async (sellerId) => {
  console.log("🔍 [getPartnerCancellationCounts] sellerId:", sellerId);
  const result = await apiCall(`/partner/cancellations/counts?sellerId=${sellerId}`);
  console.log("🔍 [getPartnerCancellationCounts] result:", result);
  return result;
};

/**
 * 취소 요청 처리
 */
export const processCancellation = async (orderId, actionData) => {
  return apiCall(`/partner/cancellations/${orderId}/process`, {
    method: "PATCH",
    body: JSON.stringify(actionData),
  });
};

// ==================== 반품 관리 ====================

/**
 * 판매자 반품 요청 목록 조회
 */
export const getPartnerReturns = async (params = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });

  return apiCall(`/partner/returns?${queryParams.toString()}`);
};

/**
 * 반품 상태별 개수 조회
 */
export const getPartnerReturnCounts = async (sellerId) => {
  console.log("🔍 [getPartnerReturnCounts] sellerId:", sellerId);
  const result = await apiCall(`/partner/returns/counts?sellerId=${sellerId}`);
  console.log("🔍 [getPartnerReturnCounts] result:", result);
  return result;
};

/**
 * 반품 요청 처리
 */
export const processReturn = async (returnId, actionData) => {
  return apiCall(`/partner/returns/${returnId}/process`, {
    method: "PATCH",
    body: JSON.stringify(actionData),
  });
};

/**
 * 수거 일정 등록
 */
export const schedulePickup = async (returnId, pickupData) => {
  return apiCall(`/partner/returns/${returnId}/pickup`, {
    method: "PATCH",
    body: JSON.stringify(pickupData),
  });
};

/**
 * 반품 상세 정보 조회
 */
export const getReturnDetail = async (returnId) => {
  return apiCall(`/partner/returns/${returnId}`);
};

// ==================== 정산 관리 ====================

/**
 * 판매자 정산 목록 조회
 */
export const getPartnerSettlements = async (params = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });

  return apiCall(`/partner/settlements?${queryParams.toString()}`);
};

/**
 * 상품별 정산 내역 조회
 */
export const getProductSettlements = async (params = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });

  return apiCall(`/partner/settlements/products?${queryParams.toString()}`);
};

export const getProductSettlementDetail = async (productId, sellerId) => {
  const queryParams = new URLSearchParams();
  if (sellerId) {
    queryParams.append("sellerId", sellerId);
  }

  return apiCall(
    `/partner/settlements/products/${productId}?${queryParams.toString()}`
  );
};

/**
 * 정산 상세 정보 조회
 */
export const getSettlementDetail = async (settlementId) => {
  return apiCall(`/partner/settlements/${settlementId}`);
};

// ==================== 대시보드 통계 ====================

/**
 * 판매자 대시보드 통계 조회
 */
export const getPartnerDashboardStats = async (sellerId) => {
  try {
    console.log("🔍 [getPartnerDashboardStats] sellerId:", sellerId);
    const [orderCounts, deliveryCounts, cancellationCounts, returnCounts] =
      await Promise.all([
        getPartnerOrderCounts(sellerId),
        getPartnerDeliveryCounts(sellerId),
        getPartnerCancellationCounts(sellerId),
        getPartnerReturnCounts(sellerId),
      ]);

    console.log("🔍 [getPartnerDashboardStats] orderCounts:", orderCounts);
    console.log("🔍 [getPartnerDashboardStats] deliveryCounts:", deliveryCounts);
    console.log("🔍 [getPartnerDashboardStats] cancellationCounts:", cancellationCounts);
    console.log("🔍 [getPartnerDashboardStats] returnCounts:", returnCounts);

    const result = {
      orders: orderCounts.counts,
      deliveries: deliveryCounts.counts,
      cancellations: cancellationCounts.counts,
      returns: returnCounts.counts,
    };

    console.log("🔍 [getPartnerDashboardStats] 최종 결과:", result);
    return result;
  } catch (error) {
    console.error("대시보드 통계 조회 오류:", error);
    throw error;
  }
};

/**
 * 최근 주문 조회
 */
export const getRecentOrders = async (sellerId, limit = 5) => {
  return getPartnerOrders({
    sellerId,
    limit,
    page: 1,
  });
};

/**
 * 정산 요약 조회
 */
export const getSettlementSummary = async (sellerId) => {
  try {
    const response = await getPartnerSettlements({
      sellerId,
      limit: 100, // 최근 100건 조회
    });

    console.log("Settlement response for summary:", response); // 디버깅용

    // 응답 구조에 따라 안전하게 접근
    let settlementsList = [];

    if (response && response.success && Array.isArray(response.settlements)) {
      settlementsList = response.settlements;
    } else if (response && Array.isArray(response.settlements)) {
      settlementsList = response.settlements;
    } else if (Array.isArray(response)) {
      settlementsList = response;
    } else {
      console.warn("Unexpected settlement response structure:", response);
      settlementsList = [];
    }

    const summary = {
      pending: settlementsList.filter((s) => s && s.status === "PENDING")
        .length,
      completed: settlementsList.filter((s) => s && s.status === "COMPLETED")
        .length,
      totalAmount: settlementsList.reduce(
        (sum, s) => sum + (s?.settlementAmount || 0),
        0
      ),
    };

    console.log("Settlement summary calculated:", summary); // 디버깅용

    return summary;
  } catch (error) {
    console.error("정산 요약 조회 오류:", error);

    // 오류 시 기본값 반환
    return {
      pending: 0,
      completed: 0,
      totalAmount: 0,
    };
  }
};
