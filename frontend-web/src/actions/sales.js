import axiosInstance from 'src/lib/axios';

/**
 * 매출 데이터 조회
 * @param {string} type - 조회 타입 (overview, daily, monthly, products, partners)
 * @param {Date} startDate - 시작일
 * @param {Date} endDate - 종료일
 */
export async function getSalesData({ type = 'overview', startDate, endDate }) {
  try {
    const params = new URLSearchParams({
      type,
      ...(startDate && { startDate: startDate.toISOString() }),
      ...(endDate && { endDate: endDate.toISOString() }),
    });

    const res = await axiosInstance.get(`/sales?${params}`);
    return res.data;
  } catch (error) {
    console.error('Failed to fetch sales data', error);
    throw error;
  }
}

/**
 * 매출 통계 조회
 */
export async function getSalesStats() {
  try {
    const res = await axiosInstance.get('/sales/stats');
    return res.data;
  } catch (error) {
    console.error('Failed to fetch sales stats', error);
    throw error;
  }
}
