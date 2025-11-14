import axiosInstance from "src/lib/axios";

// 전체 FAQ 목록 조회
export async function getAllFAQs() {
  try {
    const res = await axiosInstance.get("/faq");
    return res.data;
  } catch (error) {
    console.error("FAQ 전체 조회 실패", error);
    throw error;
  }
}

// 단일 FAQ 조회
export async function getFAQById(id) {
  try {
    if (!id) throw new Error("FAQ ID가 필요합니다.");
    const res = await axiosInstance.get(`/faq/${id}`);
    return res.data;
  } catch (error) {
    console.error("FAQ 단건 조회 실패", error);
    throw error;
  }
}

// FAQ 생성
export async function createFAQ({ title, content, type }) {
  try {
    const res = await axiosInstance.post("/faq", {
      title,
      content,
      type,
    });
    return res.data;
  } catch (error) {
    console.error("FAQ 생성 실패", error);
    throw error;
  }
}

// FAQ 수정
export async function updateFAQ({ id, title, content, type }) {
  try {
    if (!id) throw new Error("FAQ ID가 필요합니다.");
    const res = await axiosInstance.put(`/faq/${id}`, {
      title,
      content,
      type,
    });
    return res.data;
  } catch (error) {
    console.error("FAQ 수정 실패", error);
    throw error;
  }
}

// FAQ 삭제
export async function deleteFAQ(id) {
  try {
    if (!id) throw new Error("FAQ ID가 필요합니다.");
    const res = await axiosInstance.delete(`/faq/${id}`);
    return res.data;
  } catch (error) {
    console.error("FAQ 삭제 실패", error);
    throw error;
  }
}
