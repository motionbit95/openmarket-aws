"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Iconify } from "src/components/iconify";
import { toast } from "src/components/snackbar";

import { getPartnerOrders, updateOrderStatus } from "src/services/partner-api";
import { exportToExcel, formatOrdersForExcel } from "src/utils/excel-export";
import { getSellerSession } from "src/actions/seller";

export default function PartnerOrderTab() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // 필터 상태
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    startDate: "",
    endDate: "",
  });

  // 주문 상태 변경 다이얼로그
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    orderId: null,
    currentStatus: "",
    newStatus: "",
    trackingNumber: "",
    deliveryCompany: "",
  });

  useEffect(() => {
    fetchOrders();
  }, [page, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        setOrders([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      // API 호출
      const response = await getPartnerOrders({
        sellerId: seller.id.toString(),
        page,
        limit,
        ...filters,
      });

      setOrders(response.orders || []);
      setTotalCount(response.total || 0);
    } catch (error) {
      console.error("주문 목록 로딩 오류:", error);

      // 500 에러 등 실제 서버 오류인 경우만 에러 메시지 표시
      if (error.response?.status >= 500) {
        toast.error("주문 목록을 불러오는 중 오류가 발생했습니다.");
      }

      // 오류 시 기본값 설정 (데이터 없음 상태)
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "warning",
      CONFIRMED: "info",
      PREPARING: "info",
      SHIPPED: "primary",
      DELIVERED: "success",
      CANCELLED: "error",
      REFUNDED: "error",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: "주문대기",
      CONFIRMED: "주문확인",
      PREPARING: "배송준비",
      SHIPPED: "배송중",
      DELIVERED: "배송완료",
      CANCELLED: "주문취소",
      REFUNDED: "환불완료",
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: "eva:clock-outline",
      CONFIRMED: "eva:checkmark-circle-2-outline",
      PREPARING: "eva:package-outline",
      SHIPPED: "eva:car-outline",
      DELIVERED: "eva:home-outline",
      CANCELLED: "eva:close-circle-outline",
      REFUNDED: "eva:refresh-outline",
    };
    return icons[status] || "eva:help-circle-outline";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const handleStatusChange = (orderId, currentStatus) => {
    setStatusDialog({
      open: true,
      orderId,
      currentStatus,
      newStatus: "",
      trackingNumber: "",
      deliveryCompany: "",
    });
  };

  const handleStatusUpdate = async () => {
    try {
      const { orderId, newStatus, trackingNumber, deliveryCompany } =
        statusDialog;

      const statusData = {
        status: newStatus,
        ...(trackingNumber && { trackingNumber }),
        ...(deliveryCompany && { deliveryCompany }),
      };

      await updateOrderStatus(orderId, statusData);

      toast.success("주문 상태가 업데이트되었습니다.");
      setStatusDialog({
        open: false,
        orderId: null,
        currentStatus: "",
        newStatus: "",
        trackingNumber: "",
        deliveryCompany: "",
      });

      // 목록 새로고침
      fetchOrders();
    } catch (error) {
      console.error("주문 상태 업데이트 오류:", error);
      toast.error("주문 상태 업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleExcelDownload = () => {
    try {
      const excelData = formatOrdersForExcel(orders);
      const success = exportToExcel(excelData, "주문목록", "주문");
      if (success) {
        toast.success("엑셀 파일이 다운로드되었습니다.");
      } else {
        toast.error("엑셀 다운로드 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Excel download error:", error);
      toast.error("엑셀 다운로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 검색 필터 */}
      <Card
        sx={{
          mb: 3,
          border: "none",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <CardHeader title="주문 검색" />
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="주문번호, 고객명"
              size="small"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>주문상태</InputLabel>
              <Select
                value={filters.status}
                label="주문상태"
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="PENDING">주문대기</MenuItem>
                <MenuItem value="CONFIRMED">주문확인</MenuItem>
                <MenuItem value="PREPARING">배송준비</MenuItem>
                <MenuItem value="SHIPPED">배송중</MenuItem>
                <MenuItem value="DELIVERED">배송완료</MenuItem>
                <MenuItem value="CANCELLED">주문취소</MenuItem>
              </Select>
            </FormControl>

            <TextField
              type="date"
              label="시작일"
              size="small"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              type="date"
              label="종료일"
              size="small"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />

            <Button variant="contained" onClick={handleSearch}>
              검색
            </Button>

            <Button
              variant="outlined"
              onClick={() =>
                setFilters({
                  status: "",
                  search: "",
                  startDate: "",
                  endDate: "",
                })
              }
            >
              초기화
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 주문 목록 */}
      <Card
        sx={{ border: "none", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}
      >
        <CardHeader
          title={`주문 목록 (총 ${totalCount}건)`}
          action={
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:download-fill" />}
              onClick={handleExcelDownload}
              disabled={orders.length === 0}
            >
              엑셀 다운로드
            </Button>
          }
        />
        <CardContent>
          <TableContainer
            component={Paper}
            sx={{ boxShadow: "none", border: "1px solid #E0E0E0" }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>주문번호</TableCell>
                  <TableCell>고객정보</TableCell>
                  <TableCell>상품정보</TableCell>
                  <TableCell>주문금액</TableCell>
                  <TableCell>주문상태</TableCell>
                  <TableCell>배송정보</TableCell>
                  <TableCell>주문일시</TableCell>
                  <TableCell>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        데이터를 불러오는 중...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        주문 내역이 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {order.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.customer?.name || "고객명 없음"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.customer?.email || "이메일 없음"}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {order.customer?.phone || "연락처 없음"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {order.items &&
                        Array.isArray(order.items) &&
                        order.items.length > 0 ? (
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
                            주문 아이템 정보 없음
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {formatCurrency(order.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Iconify
                            icon={getStatusIcon(order.status)}
                            width={16}
                            color={`${getStatusColor(order.status)}.main`}
                          />
                          <Chip
                            label={getStatusLabel(order.status)}
                            color={getStatusColor(order.status)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.trackingNumber || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatDate(order.createdAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(order.createdAt)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          {order.status !== "DELIVERED" &&
                            order.status !== "CANCELLED" && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() =>
                                  handleStatusChange(order.id, order.status)
                                }
                              >
                                상태변경
                              </Button>
                            )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalCount > 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={Math.ceil(totalCount / limit)}
                page={page}
                onChange={(event, value) => setPage(value)}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 상태 변경 다이얼로그 */}
      <Dialog
        open={statusDialog.open}
        onClose={() =>
          setStatusDialog({
            orderId: null,
            currentStatus: "",
            newStatus: "",
            trackingNumber: "",
            deliveryCompany: "",
          })
        }
      >
        <DialogTitle>주문 상태 변경</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>새로운 상태</InputLabel>
              <Select
                value={statusDialog.newStatus}
                onChange={(e) =>
                  setStatusDialog((prev) => ({
                    ...prev,
                    newStatus: e.target.value,
                  }))
                }
              >
                <MenuItem value="CONFIRMED">주문확인</MenuItem>
                <MenuItem value="PREPARING">배송준비</MenuItem>
                <MenuItem value="SHIPPED">배송중</MenuItem>
                <MenuItem value="DELIVERED">배송완료</MenuItem>
              </Select>
            </FormControl>

            {statusDialog.newStatus === "SHIPPED" && (
              <>
                <TextField
                  fullWidth
                  label="운송장 번호"
                  value={statusDialog.trackingNumber}
                  onChange={(e) =>
                    setStatusDialog((prev) => ({
                      ...prev,
                      trackingNumber: e.target.value,
                    }))
                  }
                />
                <TextField
                  fullWidth
                  label="택배사"
                  value={statusDialog.deliveryCompany}
                  onChange={(e) =>
                    setStatusDialog((prev) => ({
                      ...prev,
                      deliveryCompany: e.target.value,
                    }))
                  }
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setStatusDialog({
                open: false,
                orderId: null,
                currentStatus: "",
                newStatus: "",
                trackingNumber: "",
                deliveryCompany: "",
              })
            }
          >
            취소
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleStatusUpdate}
            disabled={!statusDialog.newStatus}
          >
            변경
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
