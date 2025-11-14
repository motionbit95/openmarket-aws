// src/utils/downloadFile.js
import axios from "axios";

export async function downloadFile(url, filename) {
  try {
    const res = await axios.get(url, { responseType: "blob" });
    const blob = new Blob([res.data]);
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("파일 다운로드 실패", error);
    throw error; // 호출하는 곳에서 catch 할 수 있게 던져줌
  }
}
