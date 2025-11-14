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
  TextField,
  InputAdornment,
  IconButton,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Grid,
} from "@mui/material";

import { Iconify } from "src/components/iconify";
import { Scrollbar } from "src/components/scrollbar";
import { fCurrency } from "src/utils/format-number";
import { fDateTime } from "src/utils/format-time";
import { getSellerSession } from "src/actions/seller";

// ----------------------------------------------------------------------

const ORDER_STATUS_OPTIONS = {
  PENDING: { label: "주문 접수", color: "warning" },
  PAID: { label: "결제완료", color: "info" },
  PREPARING: { label: "상품준비중", color: "primary" },
  SHIPPED: { label: "배송시작", color: "primary" },
  SHIPPING: { label: "배송중", color: "primary" },
  DELIVERED: { label: "배송완료", color: "success" },
  CANCELED: { label: "주문취소", color: "error" },
  CANCELLED: { label: "주문취소", color: "error" },
  RETURNED: { label: "반품완료", color: "default" },
  CONFIRMED: { label: "주문확인", color: "info" },
  REFUNDED: { label: "환불완료", color: "error" },
};

const getStatusIcon = (status) => {
  const icons = {
    PENDING: "eva:clock-outline",
    PAID: "eva:checkmark-circle-2-outline",
    PREPARING: "eva:package-outline",
    SHIPPED: "eva:car-outline",
    SHIPPING: "eva:car-outline",
    DELIVERED: "eva:home-outline",
    CANCELED: "eva:close-circle-outline",
    CANCELLED: "eva:close-circle-outline",
    RETURNED: "eva:refresh-outline",
    CONFIRMED: "eva:checkmark-circle-2-outline",
    REFUNDED: "eva:refresh-outline",
  };
  return icons[status] || "eva:help-circle-outline";
};

const getStatusDescription = (status) => {
  const descriptions = {
    PENDING: "고객의 주문이 접수되었습니다.",
    PAID: "결제가 완료되었습니다.",
    PREPARING: "상품을 준비하고 있습니다.",
    SHIPPED: "상품이 배송 시작되었습니다.",
    SHIPPING: "상품이 배송 중입니다.",
    DELIVERED: "상품이 배송 완료되었습니다.",
    CANCELED: "주문이 취소되었습니다.",
    CANCELLED: "주문이 취소되었습니다.",
    RETURNED: "반품이 완료되었습니다.",
    CONFIRMED: "주문이 확인되었습니다.",
    REFUNDED: "환불이 완료되었습니다.",
  };
  return descriptions[status] || "";
};

const STATUS_TABS = [
  { key: "", label: "전체", count: 0 },
  { key: "PENDING", label: "결제대기", count: 0 },
  { key: "CONFIRMED", label: "주문확인", count: 0 },
  { key: "PREPARING", label: "배송준비", count: 0 },
  { key: "SHIPPED", label: "배송중", count: 0 },
  { key: "DELIVERED", label: "배송완료", count: 0 },
  { key: "CANCELLED", label: "주문취소", count: 0 },
  { key: "REFUNDED", label: "환불완료", count: 0 },
];

export function PartnerOrderView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [currentTab, setCurrentTab] = useState("");
  const [statusCounts, setStatusCounts] = useState({});
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        setOrders([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        sellerId: seller.id.toString(),
        page: page + 1,
        limit: rowsPerPage,
        ...(currentTab && { status: currentTab }),
        ...(searchQuery && { search: searchQuery }),
        ...(startDate && { startDate: startDate.toISOString().split("T")[0] }),
        ...(endDate && { endDate: endDate.toISOString().split("T")[0] }),
      });

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/partner/orders?${params}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
      } else {
        console.error("API Error:", data.message);
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, currentTab, searchQuery, startDate, endDate]);

  const fetchStatusCounts = useCallback(async () => {
    try {
      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/orders/counts?sellerId=${seller.id}`
      );
      const data = await response.json();

      if (data.success) {
        setStatusCounts(data.counts || {});
      }
    } catch (error) {
      console.error("Failed to fetch status counts:", error);
    }
  }, []);

  const fetchOrderDetail = useCallback(async (orderId) => {
    try {
      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        alert("판매자 정보를 불러올 수 없습니다.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/orders/${orderId}?sellerId=${seller.id}`
      );
      const data = await response.json();

      if (data.success) {
        setOrderDetail(data.order);
        setDetailDialogOpen(true);
      } else {
        console.error("Failed to fetch order detail:", data.message);
        alert("주문 상세 정보를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("Failed to fetch order detail:", error);
      alert("주문 상세 정보를 불러오는 중 오류가 발생했습니다.");
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStatusCounts();
  }, [fetchOrders, fetchStatusCounts]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    fetchOrders();
  };

  const handleReset = () => {
    setSearchQuery("");
    setCurrentTab("");
    setStartDate(null);
    setEndDate(null);
    setPage(0);
  };

  const getStatusChip = (status) => {
    const statusOption =
      ORDER_STATUS_OPTIONS[status] || ORDER_STATUS_OPTIONS.PENDING;
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Iconify
          icon={getStatusIcon(status)}
          width={16}
          color={`${statusOption.color}.main`}
        />
        <Chip
          size="small"
          variant="outlined"
          color={statusOption.color}
          label={statusOption.label}
        />
      </Box>
    );
  };

  const handleStatusUpdate = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/orders/${selectedOrder.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // 로컬 상태 업데이트
        setOrders(
          orders.map((order) =>
            order.id === selectedOrder.id
              ? { ...order, status: newStatus }
              : order
          )
        );

        setUpdateDialogOpen(false);
        setSelectedOrder(null);
        setNewStatus("");

        alert("주문 상태가 변경되었습니다.");
      } else {
        alert("주문 상태 변경에 실패했습니다: " + data.message);
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("주문 상태 변경 중 오류가 발생했습니다.");
    }
  };

  return (
    <Card>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          주문내역 관리
        </Typography>

        {/* 상태별 탭 */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                minWidth: "auto",
                whiteSpace: "nowrap",
              },
            }}
          >
            {STATUS_TABS.map((tab) => (
              <Tab
                key={tab.key}
                value={tab.key}
                label={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      minWidth: "fit-content",
                    }}
                  >
                    <span>{tab.label}</span>
                    <Box
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        borderRadius: "50%",
                        minWidth: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {statusCounts[tab.key] ||
                        (tab.key === "" ? statusCounts.total : 0)}
                    </Box>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* 검색 필터 */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <TextField
            size="small"
            placeholder="주문번호, 고객명, 상품명 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />

          <TextField
            type="date"
            label="시작일"
            value={startDate ? startDate.toISOString().split("T")[0] : ""}
            onChange={(e) =>
              setStartDate(e.target.value ? new Date(e.target.value) : null)
            }
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            label="종료일"
            value={endDate ? endDate.toISOString().split("T")[0] : ""}
            onChange={(e) =>
              setEndDate(e.target.value ? new Date(e.target.value) : null)
            }
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <Button variant="contained" onClick={handleSearch}>
            검색
          </Button>
          <Button variant="outlined" onClick={handleReset}>
            초기화
          </Button>
        </Stack>

        {/* 주문 테이블 */}
        <TableContainer sx={{ overflow: "unset" }}>
          <Scrollbar>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>주문번호</TableCell>
                  <TableCell>주문일시</TableCell>
                  <TableCell>고객정보</TableCell>
                  <TableCell>상품정보</TableCell>
                  <TableCell>결제금액</TableCell>
                  <TableCell>주문상태</TableCell>
                  <TableCell>배송지</TableCell>
                  <TableCell align="center">관리</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {order.orderNumber}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {fDateTime(order.createdAt, "YYYY-MM-DD")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fDateTime(order.createdAt, "A hh:mm:ss")}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {order.customer?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.customer?.phone}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.5}>
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, index) => (
                            <Box key={index}>
                              <Typography variant="body2">
                                {item?.product?.name || "상품명 없음"} ×{" "}
                                {item?.quantity || 0}
                              </Typography>
                              {item?.options &&
                                Object.keys(item.options).length > 0 && (
                                  <Typography
                                    variant="caption"
                                    color="primary.main"
                                  >
                                    {Object.entries(item.options)
                                      .map(([key, value]) => `${key}: ${value}`)
                                      .join(", ")}
                                  </Typography>
                                )}
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            상품 정보 없음
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {fCurrency(order.totalAmount)}
                      </Typography>
                    </TableCell>

                    <TableCell>{getStatusChip(order.status)}</TableCell>

                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {order.shippingAddress}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(order.status);
                            setUpdateDialogOpen(true);
                          }}
                        >
                          <Iconify icon="eva:edit-fill" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => fetchOrderDetail(order.id)}
                        >
                          <Iconify icon="eva:eye-fill" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePagination
          component="div"
          count={orders.length}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="페이지당 행 수:"
        />
      </Box>

      {/* 주문 상태 업데이트 다이얼로그 */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>주문 상태 변경</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              주문번호: {selectedOrder?.orderNumber}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>새로운 상태</InputLabel>
              <Select
                value={newStatus}
                label="새로운 상태"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {Object.entries(ORDER_STATUS_OPTIONS).map(([key, option]) => (
                  <MenuItem key={key} value={key}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleStatusUpdate}>
            변경
          </Button>
        </DialogActions>
      </Dialog>

      {/* 주문 상세 다이얼로그 */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">주문 상세</Typography>
            {orderDetail && getStatusChip(orderDetail.status)}
          </Stack>
        </DialogTitle>
        <DialogContent>
          {orderDetail && (
            <Box sx={{ pt: 2 }}>
              {/* 주문 기본 정보 */}
              <Card sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  주문 정보
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      주문번호
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {orderDetail.orderNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      주문일시
                    </Typography>
                    <Typography variant="body2">
                      {fDateTime(orderDetail.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      결제금액
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "primary.main" }}
                    >
                      {fCurrency(orderDetail.totalAmount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      결제방법
                    </Typography>
                    <Typography variant="body2">
                      {orderDetail.paymentMethod || "카드결제"}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>

              {/* 고객 정보 */}
              <Card sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  고객 정보
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      고객명
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {orderDetail.customer?.name || "정보 없음"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      연락처
                    </Typography>
                    <Typography variant="body2">
                      {orderDetail.customer?.phone || "정보 없음"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      배송지
                    </Typography>
                    <Typography variant="body2">
                      {orderDetail.shippingAddress || "정보 없음"}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>

              {/* 주문 상품 */}
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  주문 상품
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>상품명</TableCell>
                        <TableCell align="center">수량</TableCell>
                        <TableCell align="right">단가</TableCell>
                        <TableCell align="right">합계</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderDetail.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Stack>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {item.product?.name || "상품명 없음"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.product?.description || ""}
                              </Typography>
                              {item?.options &&
                                Object.keys(item.options).length > 0 && (
                                  <Typography
                                    variant="caption"
                                    color="primary.main"
                                  >
                                    옵션:{" "}
                                    {Object.entries(item.options)
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
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
