"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  Table,
  Button,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Typography,
  Chip,
  Stack,
  Paper,
  Grid,
  Divider,
  IconButton,
  Alert,
} from "@mui/material";

import { DashboardContent } from "src/layouts/dashboard";
import { Iconify } from "src/components/iconify";
import { Scrollbar } from "src/components/scrollbar";
import { fCurrency } from "src/utils/format-number";
import { fDate, fDateTime } from "src/utils/format-time";

const SETTLEMENT_STATUS = {
  PENDING: { label: "정산 대기", color: "warning" },
  CALCULATING: { label: "정산 계산중", color: "info" },
  COMPLETED: { label: "정산 완료", color: "success" },
  CANCELLED: { label: "정산 취소", color: "error" },
  ON_HOLD: { label: "정산 보류", color: "default" },
};

const BANK_NAMES = {
  KB: "KB국민은행",
  SH: "신한은행",
  WR: "우리은행",
  HN: "하나은행",
  IBK: "IBK기업은행",
  NH: "NH농협은행",
  KEB: "KEB하나은행",
  SC: "SC제일은행",
  CT: "씨티은행",
  DG: "대구은행",
  BS: "부산은행",
  KJ: "광주은행",
  JB: "전북은행",
  KN: "경남은행",
  SB: "저축은행",
  POST: "우체국",
  KDB: "KDB산업은행",
  SH: "수협은행",
  MG: "새마을금고",
  CU: "신협",
  KAKAO: "카카오뱅크",
  K: "케이뱅크",
  TOSS: "토스뱅크",
};

export function PartnerSettlementDetailView({ settlementId }) {
  const [settlement, setSettlement] = useState(null);
  const [settlementItems, setSettlementItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettlementDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/settlements/${settlementId}`
      );
      const data = await response.json();

      if (response.ok && (data.settlement || data.id)) {
        const settlement = data.settlement || data;
        setSettlement(settlement);
        setSettlementItems(settlement.SettlementItem || []);
      } else {
        setError(
          data.message || data.error || "정산 정보를 불러올 수 없습니다."
        );
      }
    } catch (err) {
      console.error("Failed to fetch settlement detail:", err);
      setError("정산 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [settlementId]);

  useEffect(() => {
    fetchSettlementDetail();
  }, [fetchSettlementDetail]);

  const getStatusChip = (status) => {
    const statusOption = SETTLEMENT_STATUS[status] || SETTLEMENT_STATUS.PENDING;
    return (
      <Chip
        size="small"
        variant="soft"
        color={statusOption.color}
        label={statusOption.label}
      />
    );
  };

  const getOrderStatusLabel = (status) => {
    const statusLabels = {
      PENDING: "주문접수",
      CONFIRMED: "결제완료",
      PREPARING: "상품 준비중",
      SHIPPED: "배송중",
      DELIVERED: "배송완료",
      CANCELLED: "취소 접수",
      CANCELLING: "취소 진행",
      RETURNED: "반품완료",
      RETURNING: "반품진행",
      RETURN_APPROVED: "반품승인",
      RETURN_PICKUP_SCHEDULED: "수거예정",
      RETURN_INSPECTING: "검수중",
      RETURN_REJECTED: "반품거부",
      REFUNDED: "환불완료",
    };
    return statusLabels[status] || status;
  };

  const getOrderStatusColor = (status) => {
    const statusColors = {
      PENDING: "warning",
      CONFIRMED: "info",
      PREPARING: "info",
      SHIPPED: "primary",
      DELIVERED: "success",
      CANCELLED: "error",
      CANCELLING: "error",
      RETURNED: "default",
      RETURNING: "default",
      RETURN_APPROVED: "info",
      RETURN_PICKUP_SCHEDULED: "primary",
      RETURN_INSPECTING: "primary",
      RETURN_REJECTED: "error",
      REFUNDED: "error",
    };
    return statusColors[status] || "default";
  };

  const getPeriodInfo = () => {
    if (!settlement?.SettlementPeriod) return null;

    const period = settlement.SettlementPeriod;
    const startDate = new Date(period.startDate);
    const month = startDate.getMonth() + 1;
    const periodNumber = Math.ceil(startDate.getDate() / 7);

    return {
      title:
        period.periodType === "MONTHLY"
          ? `${month}월 정산`
          : `${month}월 ${periodNumber}차 정산`,
      period: `${fDate(period.startDate)} ~ ${fDate(period.endDate)}`,
      settlementDate: fDate(period.settlementDate),
    };
  };

  if (loading) {
    return (
      <DashboardContent>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={400}
        >
          <Typography>정산 정보를 불러오는 중...</Typography>
        </Box>
      </DashboardContent>
    );
  }

  if (error || !settlement) {
    return (
      <DashboardContent>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "정산 정보를 찾을 수 없습니다."}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => window.history.back()}
          startIcon={<Iconify icon="eva:arrow-back-fill" />}
        >
          돌아가기
        </Button>
      </DashboardContent>
    );
  }

  const periodInfo = getPeriodInfo();

  return (
    <DashboardContent>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4">정산 상세내역</Typography>
          <Typography variant="body2" color="text.secondary">
            정산번호: S{settlement.id}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => window.history.back()}
          startIcon={<Iconify icon="eva:arrow-back-fill" />}
        >
          목록으로
        </Button>
      </Stack>

      {/* 정산 기본 정보 */}
      <Card sx={{ mb: 3, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {periodInfo?.title || "정산"} 기본정보
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              정산 기간
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {periodInfo?.period || "정보 없음"}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              정산 예정일
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {periodInfo?.settlementDate || "정보 없음"}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              최종 정산 금액
            </Typography>
            <Typography
              variant="h6"
              color="primary.main"
              sx={{ fontWeight: "bold" }}
            >
              {fCurrency(settlement.finalSettlementAmount)}
            </Typography>
          </Grid>
        </Grid>
      </Card>

      {/* 입금 계좌 정보 */}
      {settlement.sellers && (
        <Card sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            입금 계좌 정보
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                예금주
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {settlement.sellers.depositor_name || "정보 없음"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                은행
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {BANK_NAMES[settlement.sellers.bank_type] ||
                  settlement.sellers.bank_type ||
                  "정보 없음"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                계좌번호
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {settlement.sellers.bank_account || "정보 없음"}
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                상호명
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {settlement.sellers.shop_name || "정보 없음"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                대표자명
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {settlement.sellers.ceo_name || "정보 없음"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                사업자등록번호
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {settlement.sellers.business_number || "정보 없음"}
              </Typography>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* 정산 요약 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h4" color="success.main">
              {fCurrency(settlement.totalOrderAmount || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              총 매출액
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              {settlementItems.length}건의 주문
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h4" color="warning.main">
              {fCurrency(settlement.totalCommission || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              총 수수료
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              {settlement.commissionRate || 10}% 적용
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h4" color="info.main">
              {fCurrency(settlement.totalDeliveryFee || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              총 배송비
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              판매자 부담
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h4" color="primary.main">
              {fCurrency(settlement.finalSettlementAmount || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              최종 정산액
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              입금 예정 금액
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 정산 상세 아이템 */}
      <Card>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            정산 상세 내역
          </Typography>

          {settlementItems.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Scrollbar>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>주문번호</TableCell>
                      <TableCell>상품명</TableCell>
                      <TableCell>옵션</TableCell>
                      <TableCell>수량</TableCell>
                      <TableCell>단가</TableCell>
                      <TableCell>총 금액</TableCell>
                      <TableCell>수수료율</TableCell>
                      <TableCell>수수료</TableCell>
                      <TableCell>정산액</TableCell>
                      <TableCell>주문상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {settlementItems.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            #{item.orderId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.productName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {item.optionSnapshot &&
                            Object.keys(item.optionSnapshot).length > 0
                              ? Object.entries(item.optionSnapshot)
                                  .map(([key, value]) => `${key}: ${value}`)
                                  .join(", ")
                              : "옵션 없음"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.quantity}개
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {fCurrency(item.unitPrice)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {fCurrency(item.totalPrice)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {(item.commissionRate * 100).toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {fCurrency(item.commissionAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="primary.main"
                            sx={{ fontWeight: 600 }}
                          >
                            {fCurrency(item.settlementAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            color={getOrderStatusColor(item.orderStatus)}
                            label={getOrderStatusLabel(item.orderStatus)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* 총계 행 */}
                    <TableRow
                      sx={{ backgroundColor: "grey.50", fontWeight: "bold" }}
                    >
                      <TableCell colSpan={5}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          총계
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {fCurrency(
                            settlementItems.reduce(
                              (sum, item) => sum + (item.totalPrice || 0),
                              0
                            )
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {settlement.commissionRate || 10}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {fCurrency(
                            settlementItems.reduce(
                              (sum, item) => sum + (item.commissionAmount || 0),
                              0
                            )
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, color: "primary.main" }}
                        >
                          {fCurrency(
                            settlementItems.reduce(
                              (sum, item) => sum + (item.settlementAmount || 0),
                              0
                            )
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" color="text.secondary">
                          {settlementItems.length}건
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          ) : (
            <Alert severity="info">이 정산에는 상세 내역이 없습니다.</Alert>
          )}
        </Box>
      </Card>
    </DashboardContent>
  );
}
