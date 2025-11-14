import axiosInstance, { endpoints } from "src/lib/axios";

// 모든 오류 제보 조회 (필터 가능)
export async function getAllErrorReports(params = {}) {
  try {
    const res = await axiosInstance.get(endpoints.errorReport.list, {
      params,
    });
    return res.data;
  } catch (error) {
    console.error("오류 제보 전체 조회 실패", error);
    throw error;
  }
}

// 단일 오류 제보 조회
export async function getErrorReportById(id) {
  try {
    if (!id) throw new Error("id is required");
    const url = endpoints.errorReport.detail.replace(":id", id);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("오류 제보 단건 조회 실패", error);
    throw error;
  }
}

// 예시: 상태(status)별 오류제보 조회
export async function getErrorReportsByStatus(status) {
  try {
    if (!status) throw new Error("status is required");
    const url = endpoints.errorReport.byStatus.replace(":status", status);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("상태별 오류제보 조회 실패", error);
    throw error;
  }
}

// 타입(type)별 오류제보 조회
export async function getErrorReportsByType(type) {
  try {
    if (!type) throw new Error("type is required");
    const url = endpoints.errorReport.byType.replace(":type", type);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("타입별 오류제보 조회 실패", error);
    throw error;
  }
}

// 또는 카테고리(category)별 조회
export async function getErrorReportsByCategory(category) {
  console.log(category);
  try {
    if (!category) throw new Error("category is required");
    const url = endpoints.errorReport.byCategory.replace(":category", category);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("카테고리별 오류제보 조회 실패", error);
    throw error;
  }
}

// 오류 제보 생성
export async function createErrorReport({
  reporter_id,
  reporter_type,
  category,
  title,
  content,
}) {
  try {
    const res = await axiosInstance.post(endpoints.errorReport.create, {
      reporter_id,
      reporter_type,
      category,
      title,
      content,
    });
    return res.data;
  } catch (error) {
    console.error("오류 제보 생성 실패", error);
    throw error;
  }
}

// 오류 제보 수정 (관리자 처리용)
export async function updateErrorReport(data) {
  try {
    const url = endpoints.errorReport.update.replace(":id", data.id);
    const res = await axiosInstance.put(url, data);
    return res.data;
  } catch (error) {
    console.error("오류 제보 수정 실패", error);
    throw error;
  }
}

// 오류 제보 삭제
export async function deleteErrorReport(id) {
  try {
    const url = endpoints.errorReport.delete.replace(":id", id);
    const res = await axiosInstance.delete(url);
    return res.data;
  } catch (error) {
    console.error("오류 제보 삭제 실패", error);
    throw error;
  }
}

export async function uploadFiles({ reportId, files }) {
  if (!reportId || !files?.length) {
    throw new Error("reportId, files는 필수입니다.");
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const url = endpoints.errorReport.upload
    .replace(":type", "error_report")
    .replace(":id", reportId);

  const res = await axiosInstance.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

export async function getErrorReportAttachments(inquiryId) {
  try {
    if (!inquiryId) throw new Error("문의 ID가 필요합니다.");
    const res = await axiosInstance.get(
      `/errorReport/${inquiryId}/attachments`
    );
    return res.data;
  } catch (error) {
    console.error("1:1 문의 첨부파일 조회 실패", error);
    throw error;
  }
}

// 문의 답변 등록
export async function answerErrorReport({ id, answer }) {
  try {
    if (!id) throw new Error("문의 ID가 필요합니다.");
    if (!answer) throw new Error("답변 내용이 필요합니다.");
    const res = await axiosInstance.post(`/errorReport/${id}/answer`, {
      answer,
    });
    return res.data;
  } catch (error) {
    console.error("1:1 문의 답변 등록 실패", error);
    throw error;
  }
}

export async function getErrorReportBySeller(sellerId, type) {
  try {
    if (!sellerId) throw new Error("sellerId is required");
    const url = endpoints.errorReport.bySeller
      .replace(":sellerId", sellerId)
      .replace(":type", type);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("판매자 제보/제안 내역 조회 실패", error);
    throw error;
  }
}
