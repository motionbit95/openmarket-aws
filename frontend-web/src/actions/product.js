import { useMemo } from "react";
import axiosInstance, { endpoints } from "src/lib/axios";
import useSWR from "swr";

export const PRODUCT_GENDER_OPTIONS = [
  { label: "Men", value: "Men" },
  { label: "Women", value: "Women" },
  { label: "Kids", value: "Kids" },
];

export const PRODUCT_CATEGORY_OPTIONS = ["Shose", "Apparel", "Accessories"];

export const PRODUCT_RATING_OPTIONS = [
  "up4Star",
  "up3Star",
  "up2Star",
  "up1Star",
];

export const PRODUCT_COLOR_OPTIONS = [
  "#FF4842",
  "#1890FF",
  "#FFC0CB",
  "#00AB55",
  "#FFC107",
  "#7F00FF",
  "#000000",
  "#FFFFFF",
];

export const PRODUCT_COLOR_NAME_OPTIONS = [
  { value: "#FF4842", label: "Red" },
  { value: "#1890FF", label: "Blue" },
  { value: "#FFC0CB", label: "Pink" },
  { value: "#00AB55", label: "Green" },
  { value: "#FFC107", label: "Yellow" },
  { value: "#7F00FF", label: "Violet" },
  { value: "#000000", label: "Black" },
  { value: "#FFFFFF", label: "White" },
];

export const PRODUCT_SIZE_OPTIONS = [
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "8.5", label: "8.5" },
  { value: "9", label: "9" },
  { value: "9.5", label: "9.5" },
  { value: "10", label: "10" },
  { value: "10.5", label: "10.5" },
  { value: "11", label: "11" },
  { value: "11.5", label: "11.5" },
  { value: "12", label: "12" },
  { value: "13", label: "13" },
];

export const PRODUCT_STOCK_OPTIONS = [
  { value: "in stock", label: "In stock" },
  { value: "low stock", label: "Low stock" },
  { value: "out of stock", label: "Out of stock" },
];

export const PRODUCT_PUBLISH_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

export const PRODUCT_SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "priceDesc", label: "Price: High - Low" },
  { value: "priceAsc", label: "Price: Low - High" },
];

export const PRODUCT_CATEGORY_GROUP_OPTIONS = [
  {
    group: "Clothing",
    classify: ["Shirts", "T-shirts", "Jeans", "Leather", "Accessories"],
  },
  {
    group: "Tailored",
    classify: ["Suits", "Blazers", "Trousers", "Waistcoats", "Apparel"],
  },
  {
    group: "Accessories",
    classify: ["Shoes", "Backpacks and bags", "Bracelets", "Face masks"],
  },
];

export const _tags = [
  `Technology`,
  `Health and Wellness`,
  `Travel`,
  `Finance`,
  `Education`,
  `Food and Beverage`,
  `Fashion`,
  `Home and Garden`,
  `Sports`,
  `Entertainment`,
  `Business`,
  `Science`,
  `Automotive`,
  `Beauty`,
  `Fitness`,
  `Lifestyle`,
  `Real Estate`,
  `Parenting`,
  `Pet Care`,
  `Environmental`,
  `DIY and Crafts`,
  `Gaming`,
  `Photography`,
  `Music`,
];

export function useGetProducts(swrOptions = {}) {
  const { data, error, isLoading, isValidating } = useSWR(
    "products",
    () => getAllProducts(),
    swrOptions
  );

  const memoizedValue = useMemo(
    () => ({
      products: data || [], // data 자체가 배열
      productsLoading: isLoading,
      productsError: error,
      productsValidating: isValidating,
      productsEmpty:
        !isLoading && !isValidating && (!data || data.length === 0),
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useSearchProducts(query) {}

// 상품 전체 조회
export async function getAllProducts() {
  try {
    const url = endpoints.product.list;
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("상품 목록 조회 실패", error);
    throw error;
  }
}

// 상품 단건 조회
export async function getProductById(id) {
  try {
    if (!id) throw new Error("상품 ID가 필요합니다.");
    const url = endpoints.product.detail.replace(":id", id);
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("상품 단건 조회 실패", error);
    throw error;
  }
}

// 상품 생성
export async function createProduct(data) {
  try {
    const url = endpoints.product.create;
    const res = await axiosInstance.post(url, data);
    return res.data;
  } catch (error) {
    console.error("상품 생성 실패", error);
    throw error;
  }
}

// 상품 수정
export async function updateProduct(id, data) {
  try {
    if (!id) throw new Error("상품 ID가 필요합니다.");
    const url = endpoints.product.update.replace(":id", id);
    const res = await axiosInstance.put(url, data);
    return res.data;
  } catch (error) {
    console.error("상품 수정 실패", error);
    throw error;
  }
}

// 상품 삭제
export async function deleteProduct(id) {
  try {
    if (!id) throw new Error("상품 ID가 필요합니다.");
    const url = endpoints.product.delete.replace(":id", id);
    const res = await axiosInstance.delete(url);
    return res.data;
  } catch (error) {
    console.error("상품 삭제 실패", error);
    throw error;
  }
}

// 상품 이미지 업로드 (여러 장)
export async function uploadProductImages(productId, files) {
  if (!productId) throw new Error("productId가 필요합니다.");
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await axiosInstance.post(
    `/attachments/upload/product/${productId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data; // 서버에서 반환하는 파일 정보 배열
}

// 임시 첨부파일 업로드 (여러 장)
export async function uploadTempAttachments(files, id) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await axiosInstance.post(
    `/attachments/temp/upload/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data; // 서버에서 반환하는 파일 정보 배열
}

// 임시 첨부파일 폴더 비우기 (관리자용) - 우선 제외... 사진이 안뜸
export async function clearTempAttachmentFolder(id) {
  // const res = await axiosInstance.delete(`/attachments/temp/clear/${id}`);
  // return res.data;
}

export async function uploadEditorAttachments(files, id) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await axiosInstance.post(
    `/attachments/editor/upload/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data; // 서버에서 반환하는 파일 정보 배열
}
