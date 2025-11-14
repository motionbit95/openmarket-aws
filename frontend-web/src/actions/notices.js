import axiosInstance, { endpoints } from "src/lib/axios";

// 공지사항 전체 조회
export async function getAllNotices({ search = "", type = "" }) {
  try {
    const query = new URLSearchParams({
      ...(search && { search }),
      ...(type && { noticeType: type }), // 백엔드에서 couponType으로 받음
    }).toString();

    const url = `${endpoints.notice.list}${query ? `?${query}` : ""}`;

    console.log(url);
    const res = await axiosInstance.get(url);

    console.log(res.data);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch coupons", error);
    throw error;
  }
}

// 타입별 공지사항 조회
export async function getNoticesByType(type) {
  try {
    if (!type) throw new Error("type is required");
    const url = endpoints.notice.byType.replace(":type", type);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("타입별 공지사항 조회 실패", error);
    throw error;
  }
}

// 공지사항 단건 조회 (조회수 증가 포함)
export async function getNoticeById(id) {
  try {
    if (!id) throw new Error("id is required");
    const url = `${endpoints.notice.detail.replace(":id", id)}`;
    const res = await axiosInstance.get(url);

    return res.data;
  } catch (error) {
    console.error("공지사항 조회 실패", error);
    throw error;
  }
}

// 공지사항 생성
export async function createNotice({
  type,
  title,
  content,
  is_pinned = false,
}) {
  try {
    const res = await axiosInstance.post(endpoints.notice.create, {
      type,
      title,
      content,
      is_pinned,
    });
    return res.data;
  } catch (error) {
    console.error("공지사항 생성 실패", error);
    throw error;
  }
}

// 공지사항 수정
export async function updateNotice(data) {
  try {
    const url = `${endpoints.notice.update}/${data.id}`;
    const res = await axiosInstance.put(url, data);
    return res.data;
  } catch (error) {
    console.error("공지사항 수정 실패", error);
    throw error;
  }
}

// 공지사항 삭제
export async function deleteNotice(id) {
  try {
    const url = `${endpoints.notice.delete}/${id}`;
    const res = await axiosInstance.delete(url);
    return res.data;
  } catch (error) {
    console.error("공지사항 삭제 실패", error);
    throw error;
  }
}

export async function uploadFiles({ noticeId, files }) {
  if (!noticeId || !files?.length) {
    throw new Error("id, files는 필수입니다.");
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const url = endpoints.notice.upload
    .replace(":type", "notice")
    .replace(":id", noticeId);

  const res = await axiosInstance.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

export async function getNoticeAttachments(noticeId) {
  try {
    if (!noticeId) throw new Error("ID가 필요합니다.");
    const res = await axiosInstance.get(`/notices/${noticeId}/attachments`);
    return res.data;
  } catch (error) {
    console.error("가이드 첨부파일 조회 실패", error);
    throw error;
  }
}
