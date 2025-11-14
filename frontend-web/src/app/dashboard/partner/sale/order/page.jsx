"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  Tabs,
  Tab,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Iconify } from "src/components/iconify";
import { toast } from "src/components/snackbar";

import { getPartnerOrders, updateOrderStatus } from "src/services/partner-api";
import OrderTable from "src/components/order-table";
import { exportToExcel, formatOrdersForExcel } from "src/utils/excel-export";
import { getSellerSession } from "src/actions/seller";

// 탭 정의
const ORDER_TABS = [
  { key: "", label: "전체", status: "" },
  { key: "PENDING", label: "주문접수", status: "PENDING" },
  { key: "CONFIRMED", label: "결제완료", status: "CONFIRMED" },
  { key: "PREPARING", label: "상품 준비중", status: "PREPARING" },
  { key: "SHIPPED", label: "배송중", status: "SHIPPED" },
  { key: "DELIVERED", label: "배송완료", status: "DELIVERED" },
  { key: "CANCELLED", label: "취소 접수", status: "CANCELLED" },
  { key: "CANCELLING", label: "취소 진행", status: "CANCELLING" },
  { key: "RETURNED", label: "반품접수", status: "RETURNED" },
  { key: "RETURNING", label: "반품진행", status: "RETURNING" },
  { key: "REFUNDED", label: "환불완료", status: "REFUNDED" },
];

export default function PartnerOrderPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState(0);
  const [tabPages, setTabPages] = useState({});

  // 필터 상태
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });

  // 주문 상세 다이얼로그
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    order: null,
  });

  // 상태 변경 다이얼로그
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    orderId: null,
    currentStatus: "",
    newStatus: "",
    trackingNumber: "",
    deliveryCompany: "",
    isBulk: false,
    selectedOrderIds: [],
  });

  // 전체 주문 데이터 저장 (모든 탭에서 사용)
  const [allOrders, setAllOrders] = useState([]);
  const [allOrdersTotal, setAllOrdersTotal] = useState(0);

  // 다중선택 상태
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // 주문 목록 조회
  const fetchOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        setAllOrders([]);
        setAllOrdersTotal(0);
        setLoading(false);
        return;
      }

      const response = await getPartnerOrders({
        sellerId: seller.id.toString(),
        page: 1, // 항상 첫 페이지부터 전체 데이터 가져오기
        limit: 1000, // 충분히 큰 수로 설정하여 모든 데이터 가져오기
      });

      console.log("API 응답:", response); // 디버깅용

      // 백엔드 응답 구조에 맞춰 데이터 처리
      if (response.success) {
        setAllOrders(response.orders || []);
        setAllOrdersTotal(response.total || 0);
      } else {
        console.error("API 응답 실패:", response.message);
        setAllOrders([]);
        setAllOrdersTotal(0);
      }
    } catch (error) {
      console.error("주문 목록 조회 실패:", error);

      // 500 에러 등 실제 서버 오류인 경우만 에러 메시지 표시
      if (error.response?.status >= 500) {
        toast.error("주문 목록을 불러오는 중 오류가 발생했습니다.");
      }

      setAllOrders([]);
      setAllOrdersTotal(0);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchOrders(true);
  }, []);

  const getStatusColor = useCallback((status) => {
    const colors = {
      PENDING: "warning",
      CONFIRMED: "info",
      PREPARING: "info",
      SHIPPED: "primary",
      DELIVERED: "success",
      CANCELLED: "error",
      CANCELLING: "error",
      RETURNED: "default",
      RETURNING: "default",
      REFUNDED: "error",
    };
    return colors[status] || "default";
  }, []);

  const getStatusLabel = useCallback((status) => {
    const labels = {
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
    return labels[status] || status;
  }, []);

  const getStatusIcon = useCallback((status) => {
    const icons = {
      PENDING: "eva:clock-outline",
      CONFIRMED: "eva:checkmark-circle-2-outline",
      PREPARING: "eva:package-outline",
      SHIPPED: "eva:car-outline",
      DELIVERED: "eva:home-outline",
      CANCELLED: "eva:close-circle-outline",
      CANCELLING: "eva:close-circle-outline",
      RETURNED: "eva:refresh-outline",
      RETURNING: "eva:refresh-outline",
      REFUNDED: "eva:refresh-outline",
    };
    return icons[status] || "eva:help-circle-outline";
  }, []);

  const getStatusDescription = useCallback((status) => {
    const descriptions = {
      PENDING: "고객의 주문이 접수되었습니다.",
      CONFIRMED: "결제가 완료되었습니다.",
      PREPARING: "상품을 준비하고 있습니다.",
      SHIPPED: "상품이 배송 중입니다.",
      DELIVERED: "상품이 배송 완료되었습니다.",
      CANCELLED: "주문 취소가 접수되었습니다.",
      CANCELLING: "주문 취소가 진행 중입니다.",
      RETURNED: "반품이 접수되었습니다.",
      RETURNING: "반품이 진행 중입니다.",
      REFUNDED: "환불이 완료되었습니다.",
    };
    return descriptions[status] || "";
  }, []);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  }, []);

  const handleOrderDetail = async (orderId) => {
    try {
      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        toast.error("판매자 정보를 불러올 수 없습니다.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/orders/${orderId}?sellerId=${seller.id}`
      );
      const data = await response.json();

      console.log("주문 상세 API 응답:", data); // 디버깅용

      if (data.success && data.order) {
        setDetailDialog({
          open: true,
          order: data.order,
        });
      } else {
        console.error("주문 상세 조회 실패:", data);
        toast.error("주문 상세 정보를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("Failed to fetch order detail:", error);
      toast.error("주문 상세 정보를 불러오는 중 오류가 발생했습니다.");
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const {
        orderId,
        newStatus,
        trackingNumber,
        deliveryCompany,
        isBulk,
        selectedOrderIds,
      } = statusDialog;

      const updateData = {
        status: newStatus,
        trackingNumber,
        deliveryCompany,
      };

      if (isBulk) {
        // 다중선택된 주문들의 상태 변경
        const promises = selectedOrderIds.map((id) =>
          updateOrderStatus(id, updateData)
        );
        await Promise.all(promises);
        toast.success(
          `${selectedOrderIds.length}개 주문의 상태가 변경되었습니다.`
        );
        setSelectedOrders([]);
        setSelectAll(false);
      } else {
        // 단일 주문 상태 변경
        await updateOrderStatus(orderId, updateData);
        toast.success("주문 상태가 변경되었습니다.");
      }

      // 상태 변경 후 해당 탭으로 이동
      const newTabIndex = ORDER_TABS.findIndex(
        (tab) => tab.status === newStatus
      );
      if (newTabIndex !== -1) {
        setActiveTab(newTabIndex);
        setFilters((prev) => ({ ...prev, status: newStatus }));
      }

      setStatusDialog({
        open: false,
        orderId: null,
        currentStatus: "",
        newStatus: "",
        trackingNumber: "",
        deliveryCompany: "",
        isBulk: false,
        selectedOrderIds: [],
      });
      fetchOrders();
    } catch (error) {
      console.error("주문 상태 변경 오류:", error);
      toast.error("주문 상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  // 다중선택 관련 함수들
  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) => {
      if (prev.includes(orderId)) {
        return prev.filter((id) => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map((order) => order.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkStatusChange = () => {
    if (selectedOrders.length === 0) {
      toast.error("선택된 주문이 없습니다.");
      return;
    }

    // 다이얼로그 열기
    setStatusDialog({
      open: true,
      orderId: null,
      currentStatus: "",
      newStatus: "",
      trackingNumber: "",
      deliveryCompany: "",
      isBulk: true,
      selectedOrderIds: selectedOrders,
    });
  };

  const handleTabChange = useCallback(
    (event, newValue) => {
      // 현재 탭의 페이지 상태 저장
      setTabPages((prev) => ({
        ...prev,
        [activeTab]: page,
      }));

      setActiveTab(newValue);
      const selectedTab = ORDER_TABS[newValue];
      setFilters((prev) => ({ ...prev, status: selectedTab.status }));

      // 새 탭의 페이지 상태 복원 (없으면 1)
      setPage(tabPages[newValue] || 1);
    },
    [activeTab, page, tabPages]
  );

  const filteredOrders = useMemo(() => {
    let result = allOrders;

    // 탭 필터링
    const selectedTab = ORDER_TABS[activeTab];
    if (selectedTab.status) {
      result = result.filter((order) => order.status === selectedTab.status);
    }

    // 검색 필터링
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((order) => {
        // 주문번호
        const orderNumber = order.orderNumber?.toLowerCase() || "";

        // 고객명 (order.customer.name 또는 order.users.name)
        const customerName = (
          order.customer?.name ||
          order.users?.name ||
          ""
        )?.toLowerCase();

        // 고객 이메일
        const customerEmail = (
          order.customer?.email ||
          order.users?.email ||
          ""
        )?.toLowerCase();

        // 연락처 (order.customer.phone 또는 기타)
        const customerPhone = (
          order.customer?.phone ||
          order.users?.phone ||
          ""
        )?.toLowerCase();

        // 배송 주소
        const shippingAddress = (order.shippingAddress || "")?.toLowerCase();

        // 상품명 (order.items 또는 order.OrderItem)
        const productNames = (order.items || order.OrderItem || [])
          .map((item) => {
            const productName =
              item.product?.name ||
              item.Product?.displayName ||
              item.Product?.name ||
              "";
            return productName.toLowerCase();
          })
          .join(" ");

        return (
          orderNumber.includes(searchLower) ||
          customerName.includes(searchLower) ||
          customerEmail.includes(searchLower) ||
          customerPhone.includes(searchLower) ||
          shippingAddress.includes(searchLower) ||
          productNames.includes(searchLower)
        );
      });
    }

    return result;
  }, [allOrders, activeTab, filters.search]);

  // 페이지네이션된 주문
  const paginatedOrders = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, page, rowsPerPage]);

  const getNextStatusOptions = (currentStatus) => {
    const statusFlow = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["PREPARING", "CANCELLED"],
      PREPARING: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["DELIVERED"],
      DELIVERED: ["RETURNED"],
      CANCELLED: ["CANCELLING"],
      CANCELLING: [],
      RETURNED: ["RETURNING"],
      RETURNING: [],
      REFUNDED: [],
    };
    return statusFlow[currentStatus] || [];
  };

  const handleExcelDownload = () => {
    try {
      const excelData = formatOrdersForExcel(filteredOrders);
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
        주문 관리
      </Typography>

      {/* 통합 카드 */}
      <Card>
        {/* 탭 */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
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
          {ORDER_TABS.map((tab, index) => (
            <Tab key={tab.key} value={index} label={tab.label} />
          ))}
        </Tabs>

        {/* 검색 */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
          <TextField
            placeholder="주문번호, 고객명, 이메일, 연락처, 상품명, 주소 검색"
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

        {/* 주문 목록 헤더 */}
        <CardHeader
          title={`주문 목록 (총 ${filteredOrders.length}건)`}
          action={
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:download-fill" />}
              onClick={handleExcelDownload}
              disabled={filteredOrders.length === 0}
            >
              엑셀 다운로드
            </Button>
          }
        />

        {/* 주문 목록 테이블 */}
        <CardContent sx={{ pt: 0 }}>
          <OrderTable
            orders={paginatedOrders}
            loading={loading}
            getStatusColor={getStatusColor}
            getStatusLabel={getStatusLabel}
            getStatusIcon={getStatusIcon}
            handleOrderDetail={handleOrderDetail}
            formatCurrency={formatCurrency}
            selectedOrders={selectedOrders}
            handleSelectOrder={handleSelectOrder}
            handleSelectAll={handleSelectAll}
            selectAll={selectAll}
            // 페이지네이션 관련 props
            page={page - 1} // TablePagination은 0부터 시작
            rowsPerPage={rowsPerPage}
            totalCount={filteredOrders.length}
            onPageChange={(event, newPage) => setPage(newPage + 1)} // 1부터 시작으로 변환
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(1);
            }}
            // 벌크 액션 관련 props
            onBulkStatusChange={handleBulkStatusChange}
          />
        </CardContent>
      </Card>

      {/* 주문 상세 다이얼로그 */}
      <Dialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, order: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">주문 상세</Typography>
            <IconButton
              onClick={() => setDetailDialog({ open: false, order: null })}
            >
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {detailDialog.order && (
            <Box>
              {/* 주문 정보 카드 */}
              <Card sx={{ mb: 3, p: 2, bgcolor: "grey.50" }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  주문 정보
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      주문번호
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {detailDialog.order.orderNumber}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      주문일
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {new Date(detailDialog.order.createdAt).toLocaleString(
                        "ko-KR"
                      )}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      주문 상태
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={getStatusLabel(detailDialog.order.status)}
                        color={getStatusColor(detailDialog.order.status)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      총 금액
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "primary.main" }}
                    >
                      {formatCurrency(detailDialog.order.totalAmount)}
                    </Typography>
                  </Box>
                </Box>
              </Card>

              {/* 고객 정보 카드 */}
              <Card sx={{ mb: 3, p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  고객 정보
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      이름
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {detailDialog.order.customer?.name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      전화번호
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {detailDialog.order.customer?.phone}
                    </Typography>
                  </Box>
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <Typography variant="caption" color="text.secondary">
                      이메일
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {detailDialog.order.customer?.email}
                    </Typography>
                  </Box>
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <Typography variant="caption" color="text.secondary">
                      배송 주소
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {detailDialog.order.shippingAddress || "-"}
                    </Typography>
                  </Box>
                </Box>
              </Card>

              {/* 주문 상품 */}
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                주문 상품
              </Typography>
              <Box sx={{ mb: 2 }}>
                {detailDialog.order.items?.map((item, index) => (
                  <Card
                    key={index}
                    sx={{
                      mb: 1,
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      >
                        {item.product?.name}
                      </Typography>
                      {item.options && Object.keys(item.options).length > 0 && (
                        <Typography
                          variant="caption"
                          color="primary.main"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          {Object.entries(item.options)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(", ")}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        수량: {item.quantity}개
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(item.totalPrice)}
                    </Typography>
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
          <Button
            onClick={() => setDetailDialog({ open: false, order: null })}
            variant="outlined"
          >
            닫기
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setStatusDialog({
                open: true,
                orderId: detailDialog.order.id,
                currentStatus: detailDialog.order.status,
                newStatus: "",
                trackingNumber: "",
                deliveryCompany: "",
                isBulk: false,
                selectedOrderIds: [],
              });
              setDetailDialog({ open: false, order: null });
            }}
          >
            상태 변경
          </Button>
        </DialogActions>
      </Dialog>

      {/* 상태 변경 다이얼로그 */}
      <Dialog
        open={statusDialog.open}
        onClose={() =>
          setStatusDialog({
            open: false,
            orderId: null,
            currentStatus: "",
            newStatus: "",
            trackingNumber: "",
            deliveryCompany: "",
            isBulk: false,
            selectedOrderIds: [],
          })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {statusDialog.isBulk
            ? `${statusDialog.selectedOrderIds.length}개 주문 상태 변경`
            : "주문 상태 변경"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* 선택된 주문 정보 */}
            {statusDialog.isBulk && (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>{statusDialog.selectedOrderIds.length}개 주문</strong>
                  의 상태를 변경합니다.
                </Typography>
              </Alert>
            )}

            {/* 현재 상태 표시 (단일 주문인 경우만) */}
            {!statusDialog.isBulk && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  현재 상태
                </Typography>
                <Chip
                  label={getStatusLabel(statusDialog.currentStatus)}
                  color={getStatusColor(statusDialog.currentStatus)}
                  variant="outlined"
                  sx={{ fontSize: "0.875rem" }}
                />
              </Box>
            )}

            {/* 상태 선택 드롭다운 */}
            <FormControl fullWidth>
              <InputLabel>변경할 상태</InputLabel>
              <Select
                value={statusDialog.newStatus}
                onChange={(e) =>
                  setStatusDialog((prev) => ({
                    ...prev,
                    newStatus: e.target.value,
                  }))
                }
                label="변경할 상태"
                sx={{ minHeight: 56 }}
              >
                {[
                  { value: "PENDING", label: "주문접수" },
                  { value: "CONFIRMED", label: "결제완료" },
                  { value: "PREPARING", label: "상품준비중" },
                  { value: "SHIPPED", label: "배송중" },
                  { value: "DELIVERED", label: "배송완료" },
                  { value: "CANCELLED", label: "취소접수" },
                  { value: "CANCELLING", label: "취소진행" },
                  { value: "RETURNED", label: "반품접수" },
                  { value: "RETURNING", label: "반품진행" },
                  { value: "REFUNDED", label: "환불완료" },
                ].map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 배송중 상태인 경우 추가 정보 입력 */}
            {statusDialog.newStatus === "SHIPPED" && (
              <Stack spacing={2}>
                <Alert severity="warning">
                  배송중으로 변경 시 송장번호와 택배사 정보가 필요합니다.
                </Alert>
                <TextField
                  fullWidth
                  label="송장번호"
                  value={statusDialog.trackingNumber}
                  onChange={(e) =>
                    setStatusDialog((prev) => ({
                      ...prev,
                      trackingNumber: e.target.value,
                    }))
                  }
                  placeholder="송장번호를 입력하세요"
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
                  placeholder="택배사명을 입력하세요"
                />
              </Stack>
            )}

            {/* 선택된 상태 미리보기 */}
            {statusDialog.newStatus && (
              <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  변경될 상태
                </Typography>
                <Chip
                  label={getStatusLabel(statusDialog.newStatus)}
                  color={getStatusColor(statusDialog.newStatus)}
                  sx={{ fontSize: "0.875rem" }}
                />
              </Box>
            )}
          </Stack>
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
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!statusDialog.newStatus}
          >
            상태 변경
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
