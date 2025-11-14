"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  Container,
  Typography,
  Divider,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import { DashboardContent } from "src/layouts/dashboard";
import { Iconify } from "src/components/iconify";
import { fCurrency } from "src/utils/format-number";
import { fDateTime } from "src/utils/format-time";

// ----------------------------------------------------------------------

const ORDER_STATUS_OPTIONS = {
  PENDING: { label: "주문 접수", color: "warning" },
  PAID: { label: "결제완료", color: "info" },
  SHIPPING: { label: "배송중", color: "primary" },
  DELIVERED: { label: "배송완료", color: "success" },
  CANCELED: { label: "주문취소", color: "error" },
  REFUNDED: { label: "환불완료", color: "default" },
};

export function OrderDetailView({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();
        setOrder(data);
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getStatusChip = (status) => {
    const statusOption =
      ORDER_STATUS_OPTIONS[status] || ORDER_STATUS_OPTIONS.PENDING;
    return (
      <Chip
        size="small"
        variant="soft"
        color={statusOption.color}
        label={statusOption.label}
      />
    );
  };

  if (loading) {
    return (
      <DashboardContent>
        <Container maxWidth="lg">
          <Typography>로딩 중...</Typography>
        </Container>
      </DashboardContent>
    );
  }

  if (!order) {
    return (
      <DashboardContent>
        <Container maxWidth="lg">
          <Typography>주문을 찾을 수 없습니다.</Typography>
        </Container>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Container maxWidth="lg">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Stack>
            <Typography variant="h4">주문 상세</Typography>
            <Typography variant="body2" color="text.secondary">
              주문번호: {order.orderNumber}
            </Typography>
          </Stack>

          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
            onClick={() => window.history.back()}
          >
            목록으로
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {/* 주문 정보 */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                주문 정보
              </Typography>

              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    주문일시
                  </Typography>
                  <Typography variant="body2">
                    {fDateTime(order.createdAt)}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    주문상태
                  </Typography>
                  {getStatusChip(order.status)}
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    결제방법
                  </Typography>
                  <Typography variant="body2">
                    {order.paymentMethod === "CARD"
                      ? "카드결제"
                      : order.paymentMethod}
                  </Typography>
                </Stack>

                {order.payment && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      결제승인번호
                    </Typography>
                    <Typography variant="body2">
                      {order.payment.approvalNumber}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Card>

            {/* 주문 상품 */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                주문 상품
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>상품명</TableCell>
                      <TableCell align="center">수량</TableCell>
                      <TableCell align="right">단가</TableCell>
                      <TableCell align="right">합계</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Stack>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {item.product?.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.product?.description}
                            </Typography>
                            {item?.optionSnapshot &&
                              Object.keys(item.optionSnapshot).length > 0 && (
                                <Typography
                                  variant="caption"
                                  color="primary.main"
                                >
                                  옵션:{" "}
                                  {Object.entries(item.optionSnapshot)
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(", ")}
                                </Typography>
                              )}
                          </Stack>
                        </TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">
                          {fCurrency(item.price)}
                        </TableCell>
                        <TableCell align="right">
                          {fCurrency(item.price * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          {/* 고객 정보 & 결제 정보 */}
          <Grid item xs={12} md={4}>
            {/* 고객 정보 */}
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                고객 정보
              </Typography>

              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    이름
                  </Typography>
                  <Typography variant="body2">{order.user?.name}</Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    이메일
                  </Typography>
                  <Typography variant="body2">{order.user?.email}</Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    연락처
                  </Typography>
                  <Typography variant="body2">
                    {order.user?.phoneNumber}
                  </Typography>
                </Stack>
              </Stack>
            </Card>

            {/* 배송지 정보 */}
            {order.shippingAddress && (
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  배송지 정보
                </Typography>

                <Stack spacing={1}>
                  <Typography variant="body2">
                    {order.shippingAddress.recipientName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.shippingAddress.zipCode}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.shippingAddress.address}{" "}
                    {order.shippingAddress.detailAddress}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.shippingAddress.phoneNumber}
                  </Typography>
                  {order.deliveryMemo && (
                    <Typography variant="body2" color="text.secondary">
                      배송메모: {order.deliveryMemo}
                    </Typography>
                  )}
                </Stack>
              </Card>
            )}

            {/* 결제 정보 */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                결제 정보
              </Typography>

              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    상품금액
                  </Typography>
                  <Typography variant="body2">
                    {fCurrency(order.subtotalAmount)}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    배송비
                  </Typography>
                  <Typography variant="body2">
                    {fCurrency(order.shippingAmount)}
                  </Typography>
                </Stack>

                {order.discountAmount > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      할인금액
                    </Typography>
                    <Typography variant="body2" color="error">
                      -{fCurrency(order.discountAmount)}
                    </Typography>
                  </Stack>
                )}

                <Divider />

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6">총 결제금액</Typography>
                  <Typography variant="h6" color="primary">
                    {fCurrency(order.totalAmount)}
                  </Typography>
                </Stack>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </DashboardContent>
  );
}
