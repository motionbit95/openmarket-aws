import axiosInstance, { endpoints } from "src/lib/axios";

// 전체 가이드 목록 조회
export async function getAllGuides() {
  try {
    const res = await axiosInstance.get(endpoints.guide.list);
    return res.data;
  } catch (error) {
    console.error("가이드 전체 조회 실패", error);
    throw error;
  }
}

// 특정 가이드 단건 조회
export async function getGuideById(id) {
  try {
    if (!id) throw new Error("가이드 ID가 필요합니다.");
    const res = await axiosInstance.get(`/guides/${id}`);
    return res.data;
  } catch (error) {
    console.error("가이드 단건 조회 실패", error);
    throw error;
  }
}

// 가이드 생성
export async function createGuide({ title, content, type }) {
  try {
    const res = await axiosInstance.post("/guides", {
      title,
      content,
      type,
    });
    return res.data;
  } catch (error) {
    console.error("가이드 생성 실패", error);
    throw error;
  }
}

// 가이드 수정
export async function updateGuide({ id, title, content, type }) {
  try {
    if (!id) throw new Error("가이드 ID가 필요합니다.");
    const res = await axiosInstance.put(`/guides/${id}`, {
      title,
      content,
      type,
    });
    return res.data;
  } catch (error) {
    console.error("가이드 수정 실패", error);
    throw error;
  }
}

// 가이드 삭제
export async function deleteGuide(id) {
  try {
    if (!id) throw new Error("가이드 ID가 필요합니다.");
    const res = await axiosInstance.delete(`/guides/${id}`);
    return res.data;
  } catch (error) {
    console.error("가이드 삭제 실패", error);
    throw error;
  }
}

// 첨부파일 업로드 (targetType = 'userGuide')
export async function uploadFiles({ guideId, files }) {
  if (!guideId || !files?.length) {
    throw new Error("guideId와 files는 필수입니다.");
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const url = endpoints.guide.upload
    .replace(":type", "guide")
    .replace(":id", guideId);

  const res = await axiosInstance.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

// 특정 가이드 첨부파일 목록 조회
export async function getGuideAttachments(guideId) {
  try {
    if (!guideId) throw new Error("가이드 ID가 필요합니다.");
    const res = await axiosInstance.get(`/guides/${guideId}/attachments`);
    return res.data;
  } catch (error) {
    console.error("가이드 첨부파일 조회 실패", error);
    throw error;
  }
}
