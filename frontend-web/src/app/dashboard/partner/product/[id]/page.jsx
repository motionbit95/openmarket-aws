"use client";

import { useState, useEffect, use } from "react";
import { CONFIG } from "src/global-config";
import { DashboardContent } from "src/layouts/dashboard";
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Stack,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Iconify } from "src/components/iconify";
import { fCurrency } from "src/utils/format-number";
import { fDate } from "src/utils/format-time";
import { getProductSettlementDetail } from "src/services/partner-api";

export default function Page({ params }) {
  const { id } = use(params);
  const [settlementData, setSettlementData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductSettlement = async () => {
      try {
        setLoading(true);

        // TODO: 실제 판매자 ID 가져오기 (인증 시스템에서)
        const sellerId = "1";

        // 특정 상품의 정산 상세 데이터 조회
        const response = await getProductSettlementDetail(id, sellerId);

        if (response.success && response.productSettlement) {
          setSettlementData(response.productSettlement);
        } else {
          throw new Error(
            response.message || "상품 정산 데이터를 찾을 수 없습니다."
          );
        }
      } catch (error) {
        console.error("상품 정산 데이터 조회 오류:", error);
        // 오류 시 빈 데이터로 설정
        setSettlementData(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductSettlement();
    }
  }, [id]);

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography>정산 정보를 불러오는 중...</Typography>
        </Box>
      </DashboardContent>
    );
  }

  if (!settlementData) {
    return (
      <DashboardContent>
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography>정산 데이터를 찾을 수 없습니다.</Typography>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          상품별 정산 상세
        </Typography>

        {/* 상품 정보 */}
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            상품 정보
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              src={settlementData.product.image}
              variant="rounded"
              sx={{ width: 80, height: 80 }}
            />
            <Box>
              <Typography variant="h6">
                {settlementData.product.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SKU: {settlementData.product.sku}
              </Typography>
              <Chip
                label={
                  settlementData.product.category === "ELECTRONICS"
                    ? "전자제품"
                    : settlementData.product.category === "FASHION"
                      ? "패션"
                      : settlementData.product.category === "HOME"
                        ? "홈/리빙"
                        : settlementData.product.category === "FOOD"
                          ? "식품"
                          : settlementData.product.category === "BEAUTY"
                            ? "뷰티"
                            : settlementData.product.category === "SPORTS"
                              ? "스포츠"
                              : settlementData.product.category === "KIDS"
                                ? "유아동"
                                : settlementData.product.category === "BOOKS"
                                  ? "도서"
                                  : settlementData.product.category === "PET"
                                    ? "반려동물"
                                    : settlementData.product.category === "CAR"
                                      ? "자동차"
                                      : settlementData.product.category ===
                                          "ETC"
                                        ? "기타"
                                        : settlementData.product.category // 기본값, 그대로
                }
                size="small"
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Stack>
        </Card>

        {/* 정산 상세 정보 */}
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify
                icon="eva:bar-chart-2-fill"
                width={24}
                sx={{ color: "primary.main" }}
              />
              <Typography variant="h6">정산 상세 정보</Typography>
            </Stack>
            <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify
                  icon="eva:calendar-fill"
                  width={20}
                  sx={{ color: "primary.main" }}
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  정산 기간
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {fDate(settlementData.period.startDate)} ~{" "}
                  {fDate(settlementData.period.endDate)}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          {/* 정산 상세 정보 - 4x2 그리드 */}
          <Box>
            {/* 첫 번째 행 */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} md={3}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    height: "100%",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Iconify
                      icon="eva:credit-card-fill"
                      width={20}
                      sx={{ color: "primary.main" }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      정산 금액
                    </Typography>
                  </Stack>
                  <Typography variant="h6" color="primary.main">
                    {fCurrency(settlementData.settlementAmount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} md={3}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    height: "100%",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Iconify
                      icon="eva:trending-up-fill"
                      width={20}
                      sx={{ color: "success.main" }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      총 매출액
                    </Typography>
                  </Stack>
                  <Typography variant="h6" color="success.main">
                    {fCurrency(settlementData.salesAmount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} md={3}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    height: "100%",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Iconify
                      icon="eva:percent-fill"
                      width={20}
                      sx={{ color: "warning.main" }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      수수료 ({settlementData.commissionRate}%)
                    </Typography>
                  </Stack>
                  <Typography variant="h6" color="warning.main">
                    {fCurrency(settlementData.commissionAmount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} md={3}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    height: "100%",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Iconify
                      icon="eva:shopping-cart-fill"
                      width={20}
                      sx={{ color: "info.main" }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      주문 건수
                    </Typography>
                  </Stack>
                  <Typography variant="h6" color="info.main">
                    {settlementData.orderCount}건
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* 두 번째 행 */}
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    height: "100%",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Iconify
                      icon="eva:package-fill"
                      width={20}
                      sx={{ color: "success.main" }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      판매 수량
                    </Typography>
                  </Stack>
                  <Typography variant="h6" color="success.main">
                    {settlementData.totalQuantity}개
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} md={3}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    height: "100%",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Iconify
                      icon="eva:trending-up-fill"
                      width={20}
                      sx={{ color: "info.main" }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      평균 주문액
                    </Typography>
                  </Stack>
                  <Typography variant="h6" color="info.main">
                    {fCurrency(settlementData.avgOrderValue)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} md={3}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    height: "100%",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Iconify
                      icon="eva:undo-fill"
                      width={20}
                      sx={{ color: "error.main" }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      반품 정보
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {settlementData.returnCount}건 /{" "}
                    {fCurrency(settlementData.returnAmount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} md={3}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    height: "100%",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Iconify
                      icon="eva:checkmark-circle-2-fill"
                      width={20}
                      sx={{ color: "success.main" }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      정산 상태
                    </Typography>
                  </Stack>
                  <Chip
                    label={settlementData.status}
                    color="success"
                    size="small"
                    icon={
                      <Iconify icon="eva:checkmark-circle-2-fill" width={16} />
                    }
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* 주문 상세 내역 */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Iconify
              icon="eva:list-fill"
              width={24}
              sx={{ color: "primary.main" }}
            />
            <Typography variant="h6">주문 상세 내역</Typography>
            <Chip
              label={`${settlementData.orders?.length || 0}건`}
              color="primary"
              size="small"
              sx={{ ml: 1 }}
            />
          </Stack>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>
                    주문번호
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>
                    주문일
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>
                    고객명
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600, color: "text.primary" }}
                  >
                    수량
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 600, color: "text.primary" }}
                  >
                    단가
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 600, color: "text.primary" }}
                  >
                    주문금액
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>
                    결제방법
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>
                    상태
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(settlementData.orders || []).map((order, index) => (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{
                      "&:nth-of-type(even)": { bgcolor: "grey.25" },
                      "&:hover": { bgcolor: "primary.50" },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify
                          icon="eva:hash-fill"
                          width={16}
                          sx={{ color: "text.secondary" }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {order.id}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify
                          icon="eva:calendar-fill"
                          width={16}
                          sx={{ color: "text.secondary" }}
                        />
                        <Typography variant="body2">
                          {fDate(order.orderDate)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify
                          icon="eva:person-fill"
                          width={16}
                          sx={{ color: "text.secondary" }}
                        />
                        <Typography variant="body2">
                          {order.customerName}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${order.quantity}개`}
                        size="small"
                        variant="outlined"
                        color="info"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {fCurrency(order.unitPrice)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: "primary.main" }}
                      >
                        {fCurrency(order.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify
                          icon={
                            order.paymentMethod === "카드결제"
                              ? "eva:credit-card-fill"
                              : "eva:bank-fill"
                          }
                          width={16}
                          sx={{ color: "text.secondary" }}
                        />
                        <Typography variant="body2">
                          {order.paymentMethod}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={
                          order.status === "배송완료"
                            ? "success"
                            : order.status === "반품완료"
                              ? "error"
                              : "default"
                        }
                        size="small"
                        icon={
                          <Iconify
                            icon={
                              order.status === "배송완료"
                                ? "eva:checkmark-circle-2-fill"
                                : "eva:close-circle-fill"
                            }
                            width={16}
                          />
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </DashboardContent>
  );
}
