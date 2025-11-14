// src/lib/api/inquiry.js
import axiosInstance, { endpoints } from "src/lib/axios";

// 전체 문의 목록 조회
export async function getAllInquiries() {
  try {
    const res = await axiosInstance.get(endpoints.inquiry.list);
    return res.data;
  } catch (error) {
    console.error("1:1 문의 전체 조회 실패", error);
    throw error;
  }
}

// 특정 문의 단건 조회
export async function getInquiryById(id) {
  try {
    if (!id) throw new Error("문의 ID가 필요합니다.");
    const res = await axiosInstance.get(`/inquiries/${id}`);
    return res.data;
  } catch (error) {
    console.error("1:1 문의 단건 조회 실패", error);
    throw error;
  }
}

// 문의 생성
export async function createInquiry({
  senderId,
  senderType,
  title,
  content,
  status = "접수",
}) {
  try {
    const res = await axiosInstance.post("/inquiries", {
      senderId,
      senderType,
      title,
      content,
      status,
    });
    return res.data;
  } catch (error) {
    console.error("1:1 문의 생성 실패", error);
    throw error;
  }
}

// 문의 수정
export async function updateInquiry({
  id,
  senderId,
  senderType,
  title,
  content,
  status,
}) {
  try {
    if (!id) throw new Error("문의 ID가 필요합니다.");
    const res = await axiosInstance.put(`/inquiries/${id}`, {
      senderId,
      senderType,
      title,
      content,
      status,
    });
    return res.data;
  } catch (error) {
    console.error("1:1 문의 수정 실패", error);
    throw error;
  }
}

// 문의 삭제
export async function deleteInquiry(id) {
  try {
    if (!id) throw new Error("문의 ID가 필요합니다.");
    const res = await axiosInstance.delete(`/inquiries/${id}`);
    return res.data;
  } catch (error) {
    console.error("1:1 문의 삭제 실패", error);
    throw error;
  }
}

// 첨부파일 업로드 (targetType = 'inquiry')
export async function uploadFiles({ inquiryId, files }) {
  if (!inquiryId || !files?.length) {
    throw new Error("userGuideId와 files는 필수입니다.");
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const url = endpoints.inquiry.upload
    .replace(":type", "inquiry")
    .replace(":id", inquiryId);

  const res = await axiosInstance.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

// 특정 문의 첨부파일 목록 조회
export async function getInquiryAttachments(inquiryId) {
  try {
    if (!inquiryId) throw new Error("문의 ID가 필요합니다.");
    const res = await axiosInstance.get(`/inquiries/${inquiryId}/attachments`);

    console.log(res.data);
    return res.data;
  } catch (error) {
    console.error("1:1 문의 첨부파일 조회 실패", error);
    throw error;
  }
}

// 문의 답변 등록
export async function answerInquiry({ id, answer }) {
  try {
    if (!id) throw new Error("문의 ID가 필요합니다.");
    if (!answer) throw new Error("답변 내용이 필요합니다.");
    const res = await axiosInstance.post(`/inquiries/${id}/answer`, { answer });
    return res.data;
  } catch (error) {
    console.error("1:1 문의 답변 등록 실패", error);
    throw error;
  }
}

export async function getInquiriesBySeller(sellerId) {
  try {
    if (!sellerId) throw new Error("sellerId is required");
    const url = endpoints.inquiry.bySeller.replace(":sellerId", sellerId);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("사용자 문의 조회 실패", error);
    throw error;
  }
}

export async function getAllInquiryBySellerToAdmin(sellerId) {
  try {
    if (!sellerId) throw new Error("sellerId is required");
    const url = endpoints.inquiry.bySellerToAdmin.replace(
      ":sellerId",
      sellerId
    );
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("사용자 문의 조회 실패", error);
    throw error;
  }
}
