import axiosInstance, { endpoints } from "src/lib/axios";

// 정산 목록 조회
export async function getSettlements({
  status = "",
  search = "",
  startDate = null,
  endDate = null,
  page = 1,
  limit = 20,
}) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(search && { search }),
      ...(startDate && { startDate: startDate.toISOString() }),
      ...(endDate && { endDate: endDate.toISOString() }),
    });

    const res = await axiosInstance.get(
      `${endpoints.settlement.list}?${params}`
    );
    return res.data;
  } catch (error) {
    console.error("정산 목록 조회 실패", error);
    throw error;
  }
}

// 정산 단건 조회
export async function getSettlementById(id) {
  try {
    const res = await axiosInstance.get(`${endpoints.settlement.detail}/${id}`);
    return res.data;
  } catch (error) {
    console.error("정산 상세 조회 실패", error);
    throw error;
  }
}

// 정산 처리
export async function processSettlements({ settlementIds, commissionRate }) {
  try {
    const res = await axiosInstance.post(endpoints.settlement.process, {
      settlementIds,
      commissionRate,
    });
    return res.data;
  } catch (error) {
    console.error("정산 처리 실패", error);
    throw error;
  }
}

// 정산 완료 처리
export async function completeSettlements({ settlementIds }) {
  try {
    const res = await axiosInstance.post(endpoints.settlement.complete, {
      settlementIds,
    });
    return res.data;
  } catch (error) {
    console.error("정산 완료 처리 실패", error);
    throw error;
  }
}

// 정산 보류
export async function holdSettlements({ settlementIds, memo }) {
  try {
    const res = await axiosInstance.post(endpoints.settlement.hold, {
      settlementIds,
      memo,
    });
    return res.data;
  } catch (error) {
    console.error("정산 보류 실패", error);
    throw error;
  }
}

// 정산 보류 해제
export async function unholdSettlements({ settlementIds, memo }) {
  try {
    const res = await axiosInstance.post(endpoints.settlement.unhold, {
      settlementIds,
      memo,
    });
    return res.data;
  } catch (error) {
    console.error("정산 보류 해제 실패", error);
    throw error;
  }
}

// 정산 삭제
export async function deleteSettlements({ settlementIds }) {
  try {
    const res = await axiosInstance.delete(endpoints.settlement.list, {
      data: { settlementIds },
    });
    return res.data;
  } catch (error) {
    console.error("정산 삭제 실패", error);
    throw error;
  }
}

// 정산 완료 취소
export async function cancelSettlements({ settlementIds, memo }) {
  try {
    const res = await axiosInstance.post(endpoints.settlement.cancel, {
      settlementIds,
      memo,
    });
    return res.data;
  } catch (error) {
    console.error("정산 취소 실패", error);
    throw error;
  }
}

// 정산 통계
export async function getSettlementStats({ startDate, endDate }) {
  try {
    const params = new URLSearchParams({
      ...(startDate && { startDate: startDate.toISOString() }),
      ...(endDate && { endDate: endDate.toISOString() }),
    });

    const res = await axiosInstance.get(
      `${endpoints.settlement.stats}?${params}`
    );
    return res.data;
  } catch (error) {
    console.error("정산 통계 조회 실패", error);
    throw error;
  }
}

// 정산 일정 설정
export async function updateSettlementSchedule(scheduleData) {
  try {
    const res = await axiosInstance.put(
      endpoints.settlement.schedule,
      scheduleData
    );
    return res.data;
  } catch (error) {
    console.error("정산 일정 설정 실패", error);
    throw error;
  }
}

// 정산 일정 조회
export async function getSettlementSchedule() {
  try {
    const res = await axiosInstance.get(endpoints.settlement.schedule);
    return res.data;
  } catch (error) {
    console.error("정산 일정 조회 실패", error);
    throw error;
  }
}
