import axiosInstance, { endpoints } from "src/lib/axios";

// ✅ 쿠폰 생성
export async function getLatelyInquires() {
  try {
    const res = await axiosInstance.get("/admin/dashboard");
    return res.data;
  } catch (error) {
    console.error("Failed to create coupon", error);
    throw error;
  }
}
