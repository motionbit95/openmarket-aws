import axiosInstance, { endpoints } from "src/lib/axios";

export async function getTerms({ type = "" } = {}) {
  try {
    const query = new URLSearchParams(type ? { type } : {}).toString();
    const url = `${endpoints.terms.list}${query ? `?${query}` : ""}`;
    const res = await axiosInstance.get(url);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch terms", error);
    throw error; // 필요시 빈 배열 return 가능: return [];
  }
}

// 특정 타입의 최신 약관만 가져오는 함수
export async function getLatestTermByType(type) {
  if (!type) throw new Error("type is required");
  const url = `${endpoints.terms.latestByType.replace(":type", type.toUpperCase())}`;
  const res = await axiosInstance.get(url);
  return res.data;
}

// 약관 생성
export async function createTerms({ type, title, content, effective_date }) {
  try {
    const res = await axiosInstance.post(endpoints.terms.create, {
      type,
      title,
      content,
      effective_date,
    });
    return res.data;
  } catch (error) {
    console.error("약관 생성 실패", error);
    throw error;
  }
}

export async function getAllTerms() {
  const res = await axiosInstance.get(endpoints.terms.list);
  return res.data;
}

export async function updateTerms(data) {
  const res = await axiosInstance.put(
    `${endpoints.terms.update}/${data.id}`,
    data
  );
  return res.data;
}
