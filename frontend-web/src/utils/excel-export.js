import * as XLSX from "xlsx";

/**
 * 데이터를 엑셀 파일로 다운로드
 * @param {Array} data - 엑셀로 변환할 데이터 배열
 * @param {string} fileName - 다운로드할 파일명 (확장자 제외)
 * @param {string} sheetName - 시트 이름
 */
export const exportToExcel = (data, fileName = "data", sheetName = "Sheet1") => {
  try {
    // 워크북 생성
    const workbook = XLSX.utils.book_new();

    // 데이터를 워크시트로 변환
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 열 너비 자동 조정
    const maxWidth = 50;
    const columnWidths = {};

    // 헤더와 데이터를 기반으로 열 너비 계산
    data.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const value = row[key]?.toString() || "";
        const length = Math.min(
          Math.max(key.length, value.length) * 1.2,
          maxWidth
        );
        columnWidths[key] = Math.max(columnWidths[key] || 0, length);
      });
    });

    // 열 너비 설정
    worksheet["!cols"] = Object.values(columnWidths).map((width) => ({
      wch: width,
    }));

    // 워크북에 워크시트 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 파일 다운로드
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    XLSX.writeFile(workbook, `${fileName}_${timestamp}.xlsx`);

    return true;
  } catch (error) {
    console.error("엑셀 다운로드 오류:", error);
    return false;
  }
};

/**
 * 안전하게 날짜를 포맷
 */
const safeFormatDate = (dateValue) => {
  if (!dateValue) return "";
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "";
  }
};

/**
 * 안전하게 시간을 포맷
 */
const safeFormatTime = (dateValue) => {
  if (!dateValue) return "";
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
};

/**
 * 주문 데이터를 엑셀용으로 변환
 * @param {Array} orders - 주문 배열
 * @returns {Array} 엑셀용 데이터 배열
 */
export const formatOrdersForExcel = (orders) => {
  return orders.map((order) => ({
    주문번호: order.orderNumber || "",
    주문일자: safeFormatDate(order.createdAt),
    주문시간: safeFormatTime(order.createdAt),
    고객명: order.customer?.name || order.users?.name || "",
    연락처: order.customer?.phone || order.users?.phone || "",
    이메일: order.customer?.email || order.users?.email || "",
    상품명:
      order.items?.map((item) => item.product?.name).join(", ") ||
      order.OrderItem?.map((item) => item.Product?.displayName).join(", ") ||
      "",
    수량:
      order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ||
      order.OrderItem?.reduce((sum, item) => sum + (item.quantity || 0), 0) ||
      0,
    주문금액: order.totalAmount || 0,
    주문상태: order.status || "",
    배송주소: order.shippingAddress || "",
    송장번호: order.trackingNumber || "",
  }));
};

/**
 * 배송 데이터를 엑셀용으로 변환
 * @param {Array} deliveries - 배송 배열
 * @returns {Array} 엑셀용 데이터 배열
 */
export const formatDeliveriesForExcel = (deliveries) => {
  return deliveries.map((delivery) => ({
    주문번호: delivery.orderNumber || "",
    배송일자: safeFormatDate(delivery.createdAt),
    고객명: delivery.customer?.name || "",
    연락처: delivery.customer?.phone || "",
    상품명: delivery.items?.map((item) => item.product?.name).join(", ") || "",
    배송상태: delivery.status || "",
    배송주소: delivery.shippingAddress || "",
    송장번호: delivery.trackingNumber || "",
    택배사: delivery.deliveryCompany || "",
  }));
};

/**
 * 취소/반품 데이터를 엑셀용으로 변환
 * @param {Array} items - 취소/반품 배열
 * @returns {Array} 엑셀용 데이터 배열
 */
export const formatCancellationsForExcel = (items) => {
  return items.map((item) => ({
    주문번호: item.orderNumber || "",
    취소번호: item.cancelNumber || "",
    고객명: item.customer?.name || "",
    연락처: item.customer?.phone || "",
    상품명: item.items?.map((i) => i.product?.name).join(", ") || "",
    취소사유: item.cancelReason || item.reason || "",
    환불금액: item.refundAmount || item.totalAmount || 0,
    요청일시: safeFormatDate(item.requestedAt || item.createdAt) + " " + safeFormatTime(item.requestedAt || item.createdAt),
    상태: item.status || "",
  }));
};

/**
 * 정산 데이터를 엑셀용으로 변환
 * @param {Array} settlements - 정산 배열
 * @returns {Array} 엑셀용 데이터 배열
 */
export const formatSettlementsForExcel = (settlements) => {
  return settlements.map((settlement) => ({
    정산번호: settlement.settlementNumber || settlement.id || "",
    정산기간: `${settlement.startDate || ""} ~ ${settlement.endDate || ""}`,
    주문건수: settlement.orderCount || 0,
    매출금액: settlement.totalSales || 0,
    수수료: settlement.commission || 0,
    정산금액: settlement.settlementAmount || 0,
    상태: settlement.status || "",
    정산예정일: safeFormatDate(settlement.scheduledDate),
  }));
};

/**
 * 상품 데이터를 엑셀용으로 변환
 * @param {Array} products - 상품 배열
 * @returns {Array} 엑셀용 데이터 배열
 */
export const formatProductsForExcel = (products) => {
  return products.map((product) => ({
    상품코드: product.productCode || product.id || "",
    상품명: product.name || product.displayName || "",
    카테고리: product.category?.name || "",
    브랜드: product.brand || "",
    판매가: product.price || product.salePrice || 0,
    재고: product.stock || 0,
    판매상태: product.saleStatus || "",
    노출상태: product.displayStatus || "",
    등록일: safeFormatDate(product.createdAt),
  }));
};

/**
 * 문의 데이터를 엑셀용으로 변환
 * @param {Array} inquiries - 문의 배열
 * @returns {Array} 엑셀용 데이터 배열
 */
export const formatInquiriesForExcel = (inquiries) => {
  return inquiries.map((inquiry) => ({
    문의번호: inquiry.id || "",
    문의일자: safeFormatDate(inquiry.createdAt),
    고객명: inquiry.senderInfo?.user_name || inquiry.senderInfo?.name || "",
    연락처: inquiry.senderInfo?.phone || "",
    이메일: inquiry.senderInfo?.email || "",
    제목: inquiry.title || "",
    내용: inquiry.content || "",
    상태: inquiry.status || "",
    답변일: safeFormatDate(inquiry.answeredAt),
  }));
};

/**
 * 쿠폰 데이터를 엑셀용으로 변환
 * @param {Array} coupons - 쿠폰 배열
 * @returns {Array} 엑셀용 데이터 배열
 */
export const formatCouponsForExcel = (coupons) => {
  return coupons.map((coupon) => ({
    쿠폰코드: coupon.code || "",
    쿠폰명: coupon.name || "",
    할인타입: coupon.discountType || "",
    할인금액: coupon.discountAmount || 0,
    최소주문금액: coupon.minOrderAmount || 0,
    최대할인금액: coupon.maxDiscountAmount || 0,
    발급수량: coupon.totalQuantity || 0,
    사용수량: coupon.usedQuantity || 0,
    시작일: safeFormatDate(coupon.startDate),
    종료일: safeFormatDate(coupon.endDate),
    상태: coupon.status || "",
  }));
};
