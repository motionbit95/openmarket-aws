import axiosInstance, { endpoints } from "src/lib/axios";

// 관리자 세션 조회
export async function getAdminSession() {
  try {
    const res = await axiosInstance.get(endpoints.admin.me);
    return res.data;
  } catch (error) {
    console.error("관리자 세션 조회 실패", error);
    throw error;
  }
}

// 관리자 로그인
export async function signInAdmin(credentials) {
  try {
    const res = await axiosInstance.post(endpoints.admin.signIn, credentials);
    return res.data;
  } catch (error) {
    console.error("관리자 로그인 실패", error);
    throw error;
  }
}
