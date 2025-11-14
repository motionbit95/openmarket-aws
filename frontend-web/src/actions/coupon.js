import axiosInstance, { endpoints } from "src/lib/axios";

// ✅ 쿠폰 생성
export async function createCoupon(couponData) {
  try {
    const res = await axiosInstance.post(endpoints.coupon.create, couponData);
    return res.data;
  } catch (error) {
    console.error("Failed to create coupon", error);
    throw error;
  }
}

// ✅ 쿠폰 전체 조회
export async function getAllCoupons({ search = "", issued_by = "" }) {
  try {
    const query = new URLSearchParams({
      ...(search && { search }),
      ...(issued_by && { issued_by }), // issued_by로 변경
    }).toString();

    const url = `${endpoints.coupon.getAll}${query ? `?${query}` : ""}`;

    console.log(url);
    const res = await axiosInstance.get(url);

    console.log(res.data);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch coupons", error);
    throw error;
  }
}

export async function getCouponsBySeller(sellerId) {
  try {
    if (!sellerId) throw new Error("sellerId is required");
    const url = endpoints.coupon.bySeller.replace(":sellerId", sellerId);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("판매자 리뷰 조회 실패", error);
    throw error;
  }
}

// ✅ 단일 쿠폰 조회
export async function getCouponById(id) {
  try {
    const url = endpoints.coupon.detail.replace(":id", id);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch coupon", error);
    throw error;
  }
}

// ✅ 쿠폰 수정
export async function updateCoupon(id, couponData) {
  try {
    console.log("쿠폰 수정 요청 - ID:", id, "데이터:", couponData);
    const url = endpoints.coupon.update.replace(":id", id);
    const res = await axiosInstance.put(url, couponData);
    console.log("쿠폰 수정 응답:", res.data);
    return res.data;
  } catch (error) {
    console.error("쿠폰 수정 실패:", error);
    console.error("에러 상세:", error.response?.data);
    throw error;
  }
}

// ✅ 쿠폰 삭제
export async function deleteCoupon(id) {
  try {
    const url = endpoints.coupon.delete.replace(":id", id);
    await axiosInstance.delete(url);
    return;
  } catch (error) {
    console.error("Failed to delete coupon", error);
    throw error;
  }
}
