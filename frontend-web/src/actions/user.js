import axiosInstance, { endpoints } from "src/lib/axios";

// ✅ 목록 조회
export async function getUsers({ search = "" }) {
  try {
    const query = new URLSearchParams({ search }).toString();

    const url = `${endpoints.user.getAll}${query ? `?${query}` : ""}`;
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch users", error);
    throw error;
  }
}

// ✅ 단건 조회
export async function getUserById(id) {
  try {
    const url = endpoints.user.getById.replace(":id", id);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch user", error);
    throw error;
  }
}

// ✅ 생성
export async function createUser(userData) {
  try {
    const res = await axiosInstance.post(endpoints.user.create, userData);
    console.log(res.data);
    return res.data;
  } catch (error) {
    console.error("Failed to create user", error);
    throw error;
  }
}

// ✅ 수정
export async function updateUser(id, userData) {
  try {
    const url = endpoints.user.update.replace(":id", id);
    const res = await axiosInstance.put(url, userData);
    return res.data;
  } catch (error) {
    console.error("Failed to update user", error);
    throw error;
  }
}

// ✅ 삭제
export async function deleteUser(id) {
  try {
    const url = endpoints.user.delete.replace(":id", id);
    await axiosInstance.delete(url);
    return;
  } catch (error) {
    console.error("Failed to delete user", error);
    throw error;
  }
}

// 사용자 성장 통계 조회 예제
export async function getUsersStats() {
  try {
    const res = await axiosInstance.get("/users/stats");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch user stats", error);
    throw error;
  }
}
