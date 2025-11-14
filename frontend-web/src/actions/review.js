import axiosInstance, { endpoints } from "src/lib/axios";

// 리뷰 생성
export async function createReview({
  productId,
  userId,
  rating,
  content,
  images = [],
}) {
  try {
    const res = await axiosInstance.post(endpoints.review.create, {
      productId,
      userId,
      rating,
      content,
      images,
    });
    return res.data;
  } catch (error) {
    console.error("리뷰 생성 실패", error);
    throw error;
  }
}

// 특정 상품의 리뷰 목록 조회
export async function getReviewsByProduct(productId) {
  try {
    if (!productId) throw new Error("productId is required");
    const url = endpoints.review.byProduct.replace(":productId", productId);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("상품별 리뷰 조회 실패", error);
    throw error;
  }
}

// 리뷰 단건 조회
export async function getReviewById(id) {
  try {
    if (!id) throw new Error("id is required");
    const url = endpoints.review.detail.replace(":id", id);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("리뷰 단건 조회 실패", error);
    throw error;
  }
}

// 리뷰 수정
export async function updateReview({ id, rating, content, images = [] }) {
  try {
    if (!id) throw new Error("id is required");
    const url = `${endpoints.review.update}/${id}`;
    const res = await axiosInstance.put(url, { rating, content, images });
    return res.data;
  } catch (error) {
    console.error("리뷰 수정 실패", error);
    throw error;
  }
}

// 리뷰 삭제
export async function deleteReview(id) {
  try {
    if (!id) throw new Error("id is required");
    const url = `${endpoints.review.delete}/${id}`;
    const res = await axiosInstance.delete(url);
    return res.data;
  } catch (error) {
    console.error("리뷰 삭제 실패", error);
    throw error;
  }
}

export async function getReviewAttachments(reviewId) {
  try {
    if (!reviewId) throw new Error("리뷰 ID가 필요합니다.");
    const res = await axiosInstance.get(`/reviews/${reviewId}/attachments`);
    return res.data;
  } catch (error) {
    console.error("1:1 문의 첨부파일 조회 실패", error);
    throw error;
  }
}

export async function getReviewsBySeller(sellerId) {
  try {
    if (!sellerId) throw new Error("sellerId is required");
    const url = endpoints.review.bySeller.replace(":sellerId", sellerId);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("판매자 리뷰 조회 실패", error);
    throw error;
  }
}

// 리뷰 이미지 업로드
export async function uploadReviewImages({ reviewId, files }) {
  if (!reviewId || !files?.length) {
    throw new Error("reviewId와 files는 필수입니다.");
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const url = endpoints.review.upload.replace(":id", reviewId);

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
  const url = endpoints.review.attatchment_delete.replace(":type", "review");

  const res = await axiosInstance.post(
    url,
    { ids } // fileIds로 id 배열만 넘김
  );

  return res.data;
}
