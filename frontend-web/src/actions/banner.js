import axiosInstance, { endpoints } from "src/lib/axios";

// ✅ 목록 조회
export async function getBanners({ type } = {}) {
  try {
    const query = type ? `?ownerType=${encodeURIComponent(type)}` : "";

    console.log(`${endpoints.banner.getAll}${query}`);
    const res = await axiosInstance.get(`${endpoints.banner.getAll}${query}`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch banners", error);
    throw error;
  }
}
// ✅ 단건 조회
export async function getBannerById(id) {
  try {
    const url = endpoints.banner.getById.replace(":id", id);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch banner", error);
    throw error;
  }
}

// ✅ 생성
export async function createBanner(bannerData) {
  try {
    const res = await axiosInstance.post(endpoints.banner.create, bannerData);
    return res.data;
  } catch (error) {
    console.error("Failed to create banner", error);
    throw error;
  }
}

// ✅ 수정
export async function updateBanner(id, bannerData) {
  try {
    const url = endpoints.banner.update.replace(":id", id);
    const res = await axiosInstance.put(url, bannerData);
    return res.data;
  } catch (error) {
    console.error("Failed to update banner", error);
    throw error;
  }
}

// ✅ 삭제
export async function deleteBanner(id) {
  try {
    const url = endpoints.banner.delete.replace(":id", id);
    await axiosInstance.delete(url);
    return;
  } catch (error) {
    console.error("Failed to delete banner", error);
    throw error;
  }
}

export async function createBannerWithUpload(bannerData, file) {
  try {
    // 1. 배너 생성
    const bannerRes = await axiosInstance.post("/banners", {
      ...bannerData,
      attachmentId: "0",
    });
    const banner = bannerRes.data;
    const bannerId = banner.id;

    // 2. 첨부파일 업로드
    const formData = new FormData();
    formData.append("files", file);

    const uploadRes = await axiosInstance.post(
      `/attachments/upload/banner/${bannerId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    console.log("uploadRes.data:", uploadRes.data); // 디버그용

    const files = uploadRes.data.files;
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error("첨부파일 업로드 실패");
    }

    const attachment = files[0];

    // 3. 배너 attachmentId 업데이트
    const updateRes = await axiosInstance.put(`/banners/${bannerId}`, {
      attachmentId: attachment.id.toString(),
    });

    return updateRes.data;
  } catch (error) {
    console.error("배너 생성 및 이미지 업로드 실패", error);
    throw error;
  }
}
