"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  TablePagination,
  Tabs,
  Tab,
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

import { CONFIG } from "src/global-config";
import {
  getPartnerDeliveries,
  startDelivery,
  updateTracking,
} from "src/services/partner-api";
import { getSellerSession } from "src/actions/seller";

const DELIVERY_TABS = [
  { key: "all", label: "전체", status: null },
  { key: "ready", label: "배송준비", status: "PREPARING" },
  { key: "shipped", label: "배송중", status: "IN_TRANSIT" },
  { key: "delivered", label: "배송완료", status: "DELIVERED" },
  { key: "failed", label: "반품", status: "RETURNED" },
];

export default function PartnerDeliveryPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0); // TablePagination은 0부터 시작
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState(0);

  // 필터 상태
  const [filters, setFilters] = useState({
    search: "",
  });

  // 배송 시작 다이얼로그
  const [startDeliveryDialog, setStartDeliveryDialog] = useState({
    open: false,
    orderId: null,
    trackingNumber: "",
    deliveryCompany: "",
  });

  // 운송장 번호 업데이트 다이얼로그
  const [updateTrackingDialog, setUpdateTrackingDialog] = useState({
    open: false,
    orderId: null,
    trackingNumber: "",
  });

  // 주문 상세 다이얼로그
  const [orderDetailDialog, setOrderDetailDialog] = useState({
    open: false,
    order: null,
  });

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);

      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        setDeliveries([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      // API 호출 - 모든 배송 데이터 가져오기
      const response = await getPartnerDeliveries({
        sellerId: seller.id.toString(),
        page: 1,
        limit: 1000, // 모든 데이터 가져오기
      });

      setDeliveries(response.deliveries || []);
      setTotalCount(response.total || 0);
    } catch (error) {
      console.error("배송 목록 로딩 오류:", error);
      toast.error("배송 목록을 불러오는 중 오류가 발생했습니다.");

      // 오류 시 기본값 설정
      setDeliveries([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // 클라이언트 사이드 필터링
  const filteredDeliveries = deliveries.filter((delivery) => {
    // 탭 필터
    const selectedTab = DELIVERY_TABS[activeTab];

    if (selectedTab.status && delivery.deliveryStatus !== selectedTab.status) {
      return false;
    }

    // 검색 필터
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const orderNumber = delivery.orderNumber?.toLowerCase() || "";
      const customerName = delivery.customer?.name?.toLowerCase() || "";
      const trackingNumber = delivery.trackingNumber?.toLowerCase() || "";

      return (
        orderNumber.includes(searchLower) ||
        customerName.includes(searchLower) ||
        trackingNumber.includes(searchLower)
      );
    }

    return true;
  });

  // 페이지네이션된 배송 목록
  const paginatedDeliveries = filteredDeliveries.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status) => {
    const colors = {
      PREPARING: "warning",
      SHIPPED: "primary",
      IN_TRANSIT: "info",
      DELIVERED: "success",
      FAILED: "error",
      RETURNED: "error",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status) => {
    const labels = {
      PREPARING: "배송준비",
      SHIPPED: "배송중",
      IN_TRANSIT: "배송중",
      DELIVERED: "배송완료",
      FAILED: "배송실패",
      RETURNED: "반품",
    };
    return labels[status] || status || "-";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStartDelivery = (orderId) => {
    setStartDeliveryDialog({
      open: true,
      orderId,
      trackingNumber: "",
      deliveryCompany: "",
    });
  };

  const handleStartDeliverySubmit = async () => {
    try {
      const { orderId, trackingNumber, deliveryCompany } = startDeliveryDialog;

      // API 호출
      await startDelivery(orderId, {
        trackingNumber,
        deliveryCompany,
      });

      toast.success("배송이 시작되었습니다.");
      setStartDeliveryDialog({
        open: false,
        orderId: null,
        trackingNumber: "",
        deliveryCompany: "",
      });
      fetchDeliveries();
    } catch (error) {
      console.error("배송 시작 오류:", error);
      toast.error("배송 시작 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateTracking = (orderId, currentTrackingNumber) => {
    setUpdateTrackingDialog({
      open: true,
      orderId,
      trackingNumber: currentTrackingNumber || "",
    });
  };

  const handleUpdateTrackingSubmit = async () => {
    try {
      const { orderId, trackingNumber } = updateTrackingDialog;

      // API 호출
      await updateTracking(orderId, {
        trackingNumber,
      });

      toast.success("운송장 번호가 업데이트되었습니다.");
      setUpdateTrackingDialog({
        open: false,
        orderId: null,
        trackingNumber: "",
      });
      fetchDeliveries();
    } catch (error) {
      console.error("운송장 번호 업데이트 오류:", error);
      toast.error("운송장 번호 업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleOrderDetail = (delivery) => {
    setOrderDetailDialog({
      open: true,
      order: delivery,
    });
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <LoadingButton loading />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        배송 관리
      </Typography>

      {/* 통합 카드 */}
      <Card>
        {/* 탭 */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => {
            setActiveTab(newValue);
            setPage(0); // 탭 변경 시 첫 페이지로
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              minHeight: 48,
              textTransform: "none",
              fontWeight: 600,
            },
          }}
        >
          {DELIVERY_TABS.map((tab, index) => (
            <Tab key={tab.key} value={index} label={tab.label} />
          ))}
        </Tabs>

        {/* 검색 */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
          <TextField
            placeholder="주문번호, 고객명, 운송장번호 검색"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            sx={{ minWidth: 300, maxWidth: 600 }}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* 배송 목록 헤더 */}
        <CardHeader title={`배송 목록 (총 ${filteredDeliveries.length}건)`} />

        {/* 배송 목록 테이블 */}
        <CardContent sx={{ pt: 0 }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>주문번호</TableCell>
                  <TableCell>고객정보</TableCell>
                  <TableCell>상품정보</TableCell>
                  <TableCell>주문금액</TableCell>
                  <TableCell>배송주소</TableCell>
                  <TableCell>배송상태</TableCell>
                  <TableCell>운송장정보</TableCell>
                  <TableCell>예상배송일</TableCell>
                  <TableCell>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {delivery.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {delivery.customer.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {delivery.customer.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {delivery.items.map((item, index) => (
                        <Typography key={index} variant="body2">
                          {item.product.name} × {item.quantity}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {formatCurrency(delivery.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {delivery.shippingAddress}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(delivery.deliveryStatus)}
                        color={getStatusColor(delivery.deliveryStatus)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {delivery.trackingNumber ? (
                        <Box>
                          <Typography variant="body2" noWrap>
                            {delivery.deliveryCompany}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                          >
                            {delivery.trackingNumber}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          미등록
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(delivery.estimatedDelivery)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexDirection: "column",
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOrderDetail(delivery)}
                        >
                          주문상세
                        </Button>
                        {delivery.deliveryStatus === "PREPARING" && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleStartDelivery(delivery.id)}
                          >
                            배송시작
                          </Button>
                        )}
                        {delivery.deliveryStatus === "IN_TRANSIT" && (
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ whiteSpace: "nowrap" }}
                            onClick={() =>
                              handleUpdateTracking(
                                delivery.id,
                                delivery.trackingNumber
                              )
                            }
                          >
                            운송장수정
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredDeliveries.length}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="페이지당 행:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} / ${count !== -1 ? count : `${to} 이상`}`
            }
          />
        </CardContent>
      </Card>

      {/* 배송 시작 다이얼로그 */}
      <Dialog
        open={startDeliveryDialog.open}
        onClose={() =>
          setStartDeliveryDialog({
            open: false,
            orderId: null,
            trackingNumber: "",
            deliveryCompany: "",
          })
        }
      >
        <DialogTitle>배송 시작</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="운송장 번호"
              value={startDeliveryDialog.trackingNumber}
              onChange={(e) =>
                setStartDeliveryDialog((prev) => ({
                  ...prev,
                  trackingNumber: e.target.value,
                }))
              }
              required
            />
            <FormControl fullWidth>
              <InputLabel>택배사</InputLabel>
              <Select
                value={startDeliveryDialog.deliveryCompany}
                onChange={(e) =>
                  setStartDeliveryDialog((prev) => ({
                    ...prev,
                    deliveryCompany: e.target.value,
                  }))
                }
                label="택배사"
                required
              >
                <MenuItem value="CJ대한통운">CJ대한통운</MenuItem>
                <MenuItem value="한진택배">한진택배</MenuItem>
                <MenuItem value="롯데택배">롯데택배</MenuItem>
                <MenuItem value="로젠택배">로젠택배</MenuItem>
                <MenuItem value="쿠팡물류">쿠팡물류</MenuItem>
                <MenuItem value="기타">기타</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setStartDeliveryDialog({
                open: false,
                orderId: null,
                trackingNumber: "",
                deliveryCompany: "",
              })
            }
          >
            취소
          </Button>
          <Button onClick={handleStartDeliverySubmit} variant="contained">
            배송시작
          </Button>
        </DialogActions>
      </Dialog>

      {/* 운송장 번호 업데이트 다이얼로그 */}
      <Dialog
        open={updateTrackingDialog.open}
        onClose={() =>
          setUpdateTrackingDialog({
            open: false,
            orderId: null,
            trackingNumber: "",
          })
        }
      >
        <DialogTitle>운송장 번호 수정</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="새 운송장 번호"
              value={updateTrackingDialog.trackingNumber}
              onChange={(e) =>
                setUpdateTrackingDialog((prev) => ({
                  ...prev,
                  trackingNumber: e.target.value,
                }))
              }
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setUpdateTrackingDialog({
                open: false,
                orderId: null,
                trackingNumber: "",
              })
            }
          >
            취소
          </Button>
          <Button onClick={handleUpdateTrackingSubmit} variant="contained">
            수정
          </Button>
        </DialogActions>
      </Dialog>

      {/* 주문 상세 Dialog */}
      <Dialog
        open={orderDetailDialog.open}
        onClose={() => setOrderDetailDialog({ open: false, order: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>주문 상세</DialogTitle>
        <DialogContent>
          {orderDetailDialog.order && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}
            >
              {/* 주문 정보 */}
              <Card variant="outlined">
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    주문 정보
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "120px 1fr",
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      주문번호
                    </Typography>
                    <Typography variant="body2">
                      {orderDetailDialog.order.orderNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      주문일시
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(orderDetailDialog.order.createdAt)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      배송상태
                    </Typography>
                    <Box>
                      <Chip
                        label={getStatusLabel(
                          orderDetailDialog.order.deliveryStatus
                        )}
                        color={getStatusColor(
                          orderDetailDialog.order.deliveryStatus
                        )}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
              </Card>

              {/* 고객 정보 */}
              <Card variant="outlined">
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    고객 정보
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "120px 1fr",
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      이름
                    </Typography>
                    <Typography variant="body2">
                      {orderDetailDialog.order.customer?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      전화번호
                    </Typography>
                    <Typography variant="body2">
                      {orderDetailDialog.order.customer?.phone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      배송지
                    </Typography>
                    <Typography variant="body2">
                      {orderDetailDialog.order.shippingAddress}
                    </Typography>
                  </Box>
                </Box>
              </Card>

              {/* 상품 정보 */}
              <Card variant="outlined">
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    주문 상품
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>상품명</TableCell>
                          <TableCell align="right">수량</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orderDetailDialog.order.items?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product?.name}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box
                    sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}
                  >
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="subtitle2">총 금액</Typography>
                      <Typography variant="subtitle2">
                        {formatCurrency(orderDetailDialog.order.totalAmount)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Card>

              {/* 배송 정보 */}
              {orderDetailDialog.order.trackingNumber && (
                <Card variant="outlined">
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      배송 정보
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "120px 1fr",
                        gap: 1,
                        mt: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        택배사
                      </Typography>
                      <Typography variant="body2">
                        {orderDetailDialog.order.deliveryCompany}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        운송장번호
                      </Typography>
                      <Typography variant="body2">
                        {orderDetailDialog.order.trackingNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        예상 도착일
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(orderDetailDialog.order.estimatedDelivery)}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOrderDetailDialog({ open: false, order: null })}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
