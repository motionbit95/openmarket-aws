import axiosInstance, { endpoints } from "src/lib/axios";

// 전체 판매자 조회
export async function getSellers({ search = "" }) {
  try {
    const query = new URLSearchParams({ search }).toString();
    const url = `${endpoints.seller.list}${query ? `?${query}` : ""}`;
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("판매자 목록 조회 실패", error);
    throw error;
  }
}

// 단건 판매자 조회
export async function getSellerById(id) {
  try {
    const url = endpoints.seller.detail.replace(":id", id);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("판매자 조회 실패", error);
    throw error;
  }
}

// 판매자 생성
export async function createSeller(sellerData) {
  try {
    console.log(sellerData);
    const res = await axiosInstance.post(endpoints.seller.create, sellerData);
    return res.data;
  } catch (error) {
    console.error("판매자 생성 실패", error);
    throw error;
  }
}

// 판매자 삭제
export async function deleteSeller(id) {
  try {
    const url = endpoints.seller.delete.replace(":id", id);
    await axiosInstance.delete(url);
    return;
  } catch (error) {
    console.error("판매자 삭제 실패", error);
    throw error;
  }
}

// 내 판매자 정보 조회
export async function getSellerSession() {
  try {
    // 항상 판매자 엔드포인트 사용
    const res = await axiosInstance.get(endpoints.auth.me);
    return res.data;
  } catch (error) {
    console.error("판매자 세션 조회 실패", error);
    throw error;
  }
}

// 로그인
export async function signInSeller(credentials) {
  try {
    const res = await axiosInstance.post(endpoints.auth.signIn, credentials);
    return res.data;
  } catch (error) {
    console.error("판매자 로그인 실패", error);
    throw error;
  }
}

// 회원가입
export async function updateSeller(data) {
  try {
    let payload = {};

    // FormData로 온 경우 파일만 분리, 나머지는 json으로
    if (data instanceof FormData) {
      for (let [key, value] of data.entries()) {
        payload[key] = value;
      }
    } else if (data && typeof data === "object") {
      payload = { ...data };
    }

    payload.mode = "additional";

    // 파일은 파일로, 나머지는 json으로 전송
    const res = await axiosInstance.post(endpoints.auth.signUp, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (error) {
    console.error("판매자 회원가입 실패", error);
    throw error;
  }
}

export async function sendVerification() {
  try {
    let data = await getSellerSession();

    console.log({ email: data.user.email });

    await axiosInstance.post(endpoints.auth.sendVerification, {
      email: data.user.email,
    });
  } catch (error) {
    console.error("[AUTH_006] 이메일 인증 요청 실패", error);
    throw error;
  }
}

export async function uploadFiles({ sellerId, files }) {
  if (!sellerId || !files?.length) {
    throw new Error("id, files는 필수입니다.");
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const url = endpoints.seller.upload
    .replace(":type", "seller")
    .replace(":id", sellerId);

  const res = await axiosInstance.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

export async function deleteFiles({ ids }) {
  if (!ids?.length) {
    console.log(ids);
    throw new Error("ids는 필수입니다.");
  }

  // files는 file id 배열이어야 함
  const url = endpoints.seller.attatchment_delete.replace(":type", "seller");

  const res = await axiosInstance.post(
    url,
    { ids } // fileIds로 id 배열만 넘김
  );

  return res.data;
}

export async function getSellerAttachments(sellerId) {
  try {
    if (!sellerId) throw new Error("판매자 ID가 필요합니다.");
    const res = await axiosInstance.get(`/sellers/${sellerId}/attachments`);
    return res.data;
  } catch (error) {
    console.error("판매자 첨부파일 조회 실패", error);
    throw error;
  }
}

// 사용자 성장 통계 조회 예제
export async function getSellersStats() {
  try {
    const res = await axiosInstance.get("/sellers/stats");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch user stats", error);
    throw error;
  }
}
