import axiosInstance, { endpoints } from "src/lib/axios";

// 전체 주문 목록 조회
export async function getAllOrders({ page = 1, limit = 10, status, search, startDate, endDate }) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && status !== 'all' && { status }),
      ...(search && { search }),
      ...(startDate && { startDate: startDate.toISOString() }),
      ...(endDate && { endDate: endDate.toISOString() }),
    });

    const res = await axiosInstance.get(`/orders?${params}`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch orders", error);
    throw error;
  }
}

// 주문 상세 조회
export async function getOrderById(id) {
  try {
    const res = await axiosInstance.get(`/orders/${id}`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch order", error);
    throw error;
  }
}

// 주문 상태 업데이트
export async function updateOrderStatus(orderId, statusData) {
  try {
    const res = await axiosInstance.patch(`/orders/${orderId}/status`, statusData);
    return res.data;
  } catch (error) {
    console.error("Failed to update order status", error);
    throw error;
  }
}

// 주문 취소
export async function cancelOrder(orderId, reason) {
  try {
    const res = await axiosInstance.patch(`/orders/${orderId}/cancel`, { reason });
    return res.data;
  } catch (error) {
    console.error("Failed to cancel order", error);
    throw error;
  }
}
