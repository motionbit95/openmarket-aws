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
  Alert,
  Tabs,
  Tab,
} from "@mui/material";

import { Iconify } from "src/components/iconify";
import { Scrollbar } from "src/components/scrollbar";
import { fCurrency } from "src/utils/format-number";
import { fDateTime } from "src/utils/format-time";
import { exportToExcel, formatCancellationsForExcel } from "src/utils/excel-export";
import { toast } from "src/components/snackbar";
import { getSellerSession } from "src/actions/seller";

// ----------------------------------------------------------------------

const CANCEL_STATUS = {
  CANCELLING: { label: "취소 진행", color: "warning" },
  CANCELLED: { label: "취소 완료", color: "success" },
  RETURNING: { label: "반품 진행", color: "primary" },
  RETURNED: { label: "반품 완료", color: "info" },
  REFUNDED: { label: "환불 완료", color: "error" },
};

const CANCEL_REASON = {
  CUSTOMER_CHANGE_MIND: "고객 단순변심",
  DEFECTIVE_PRODUCT: "상품 하자",
  WRONG_PRODUCT: "상품 오배송",
  LATE_DELIVERY: "배송 지연",
  OUT_OF_STOCK: "재고 부족",
  OTHER: "기타",
};

export function PartnerCancelView() {
  const [currentTab, setCurrentTab] = useState("CANCELLING");
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [selectedCancel, setSelectedCancel] = useState(null);
  const [action, setAction] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [statusCounts, setStatusCounts] = useState({});
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const tabs = [
    {
      value: "CANCELLING",
      label: "취소 진행",
      count: statusCounts.CANCELLING || 0,
    },
    {
      value: "CANCELLED",
      label: "취소 완료",
      count: statusCounts.CANCELLED || 0,
    },
    {
      value: "RETURNING",
      label: "반품 진행",
      count: statusCounts.RETURNING || 0,
    },
    {
      value: "RETURNED",
      label: "반품 완료",
      count: statusCounts.RETURNED || 0,
    },
    {
      value: "REFUNDED",
      label: "환불 완료",
      count: statusCounts.REFUNDED || 0,
    },
  ];

  const fetchStatusCounts = useCallback(async () => {
    try {
      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        return;
      }

      // 각 상태별로 주문 개수 조회
      const statuses = [
        "CANCELLING",
        "CANCELLED",
        "RETURNING",
        "RETURNED",
        "REFUNDED",
      ];
      const counts = {};

      for (const status of statuses) {
        const params = new URLSearchParams({
          sellerId: seller.id.toString(),
          status: status,
          page: 1,
          limit: 1,
        });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/partner/orders?${params}`
        );
        const data = await response.json();

        if (data.success) {
          counts[status] = data.total || 0;
        }
      }

      setStatusCounts(counts);
    } catch (error) {
      console.error("Failed to fetch status counts:", error);
    }
  }, []);

  const fetchCancellations = useCallback(async () => {
    try {
      setLoading(true);

      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        setCancellations([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        sellerId: seller.id.toString(),
        status: currentTab, // 현재 탭의 상태로 필터링
        page: page + 1,
        limit: rowsPerPage,
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/orders?${params}`
      );
      const data = await response.json();

      if (data.success) {
        // 주문 데이터를 취소 데이터 형태로 변환
        const formattedCancellations = (data.orders || []).map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          cancelNumber: `CANCEL-${order.id}`,
          customer: order.customer,
          items: order.items,
          cancelReason:
            order.items?.[0]?.optionSnapshot?.cancelReason || "OTHER",
          customerMessage: order.deliveryMemo || "",
          refundAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          status: "COMPLETED", // 실제 데이터는 모두 취소완료 상태
          requestedAt:
            order.items?.[0]?.optionSnapshot?.cancelRequestedAt ||
            order.createdAt,
        }));
        setCancellations(formattedCancellations);
      } else {
        console.error("API Error:", data.message);
        setCancellations([]);
      }
    } catch (error) {
      console.error("Failed to fetch cancellations:", error);
      setCancellations([]);
    } finally {
      setLoading(false);
    }
  }, [currentTab, page, rowsPerPage, searchQuery]);

  useEffect(() => {
    fetchStatusCounts();
    fetchCancellations();
  }, [fetchStatusCounts, fetchCancellations]);

  useEffect(() => {
    fetchStatusCounts();
  }, [currentTab, fetchStatusCounts]);

  const handleSearch = () => {
    setPage(0);
    fetchCancellations();
  };

  const getStatusChip = (status) => {
    const statusOption = CANCEL_STATUS[status] || {
      label: status,
      color: "default",
    };
    return (
      <Chip
        size="small"
        variant="outlined"
        color={statusOption.color}
        label={statusOption.label}
      />
    );
  };

  const handleProcessCancel = async () => {
    try {
      if (!action) {
        alert("처리 방법을 선택해주세요.");
        return;
      }

      if (action === "reject" && !rejectReason) {
        alert("거부 사유를 입력해주세요.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/cancellations/${selectedCancel.id}/process`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            reason: action === "reject" ? rejectReason : undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const newStatus = action === "approve" ? "CANCELLED" : "CANCELLING";

        // 승인된 경우 목록에서 제거하거나 상태 업데이트
        if (action === "approve") {
          // 승인된 항목은 CANCELLED 탭으로 이동
          setCancellations(
            cancellations.filter((cancel) => cancel.id !== selectedCancel.id)
          );
        } else {
          // 거부된 경우 상태 유지 (또는 거부 사유 추가)
          setCancellations(
            cancellations.map((cancel) =>
              cancel.id === selectedCancel.id
                ? { ...cancel, rejectReason, rejectedAt: new Date().toISOString() }
                : cancel
            )
          );
        }

        setProcessDialogOpen(false);
        setSelectedCancel(null);
        setAction("");
        setRejectReason("");

        // Toast로 변경
        toast.success(
          `취소 요청이 ${action === "approve" ? "승인" : "거부"}되었습니다.`
        );

        // 목록 새로고침
        fetchCancellations();
        fetchStatusCounts();
      } else {
        toast.error("취소 처리에 실패했습니다: " + data.message);
      }
    } catch (error) {
      console.error("Failed to process cancellation:", error);
      alert("취소 처리 중 오류가 발생했습니다.");
    }
  };

  const handleExcelDownload = () => {
    try {
      const excelData = formatCancellationsForExcel(cancellations);
      const success = exportToExcel(excelData, "취소관리", "취소");
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
    <Box>
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(event, newValue) => setCurrentTab(newValue)}
          sx={{ px: 2, bgcolor: "background.neutral" }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>{tab.label}</span>
                  <Chip size="small" label={tab.count} />
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Card>

      <Card>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6">
              취소 관리
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:download-fill" />}
              onClick={handleExcelDownload}
              disabled={cancellations.length === 0}
            >
              엑셀 다운로드
            </Button>
          </Box>

          {/* 검색 필터 */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <TextField
              size="small"
              placeholder="주문번호, 취소번호, 고객명 검색"
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
            <Button variant="contained" onClick={handleSearch}>
              검색
            </Button>
          </Stack>

          {currentTab === "requested" && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              고객의 취소 요청을 검토하고 승인 또는 거부 처리를 해주세요.
            </Alert>
          )}

          {/* 취소 테이블 */}
          <TableContainer sx={{ overflow: "unset" }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>주문정보</TableCell>
                    <TableCell>고객정보</TableCell>
                    <TableCell>상품정보</TableCell>
                    <TableCell>취소사유</TableCell>
                    <TableCell>환불금액</TableCell>
                    <TableCell>요청일시</TableCell>
                    <TableCell align="center">관리</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {cancellations.map((cancel) => (
                    <TableRow key={cancel.id} hover>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {cancel.orderNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            취소번호: {cancel.cancelNumber}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {cancel.customer?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cancel.customer?.phone}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack>
                          <Typography variant="body2">
                            {cancel.items?.[0]?.product?.name}
                          </Typography>
                          {cancel.items?.length > 1 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              외 {cancel.items.length - 1}개
                            </Typography>
                          )}
                          <Typography variant="caption" color="primary.main">
                            수량: {cancel.items?.[0]?.quantity}개
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack>
                          <Typography variant="body2">
                            {CANCEL_REASON[cancel.cancelReason]}
                          </Typography>
                          {cancel.customerMessage && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                maxWidth: 200,
                              }}
                            >
                              {cancel.customerMessage}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {fCurrency(cancel.refundAmount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cancel.paymentMethod === "CARD"
                              ? "카드결제"
                              : cancel.paymentMethod}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {fDateTime(cancel.requestedAt)}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          {cancel.status === "CANCELLING" && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => {
                                  setSelectedCancel(cancel);
                                  setAction("approve");
                                  setProcessDialogOpen(true);
                                }}
                              >
                                승인
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={() => {
                                  setSelectedCancel(cancel);
                                  setAction("reject");
                                  setProcessDialogOpen(true);
                                }}
                              >
                                거부
                              </Button>
                            </>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSelectedOrder(cancel);
                              setDetailDialogOpen(true);
                            }}
                          >
                            상세
                          </Button>
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
            count={cancellations.length}
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
      </Card>

      {/* 취소 처리 다이얼로그 */}
      <Dialog
        open={processDialogOpen}
        onClose={() => setProcessDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>취소 요청 처리</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              주문번호: {selectedCancel?.orderNumber}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              취소사유:{" "}
              {selectedCancel && CANCEL_REASON[selectedCancel.cancelReason]}
            </Typography>

            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>처리 방법</InputLabel>
                <Select
                  value={action}
                  label="처리 방법"
                  onChange={(e) => setAction(e.target.value)}
                >
                  <MenuItem value="approve">취소 승인</MenuItem>
                  <MenuItem value="reject">취소 거부</MenuItem>
                </Select>
              </FormControl>

              {action === "reject" && (
                <TextField
                  label="거부 사유"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="취소 거부 사유를 입력하세요"
                  multiline
                  rows={3}
                  fullWidth
                />
              )}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleProcessCancel}>
            처리
          </Button>
        </DialogActions>
      </Dialog>

      {/* 주문 상세 Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>주문 상세</DialogTitle>
        <DialogContent>
          {selectedOrder && (
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
                      {selectedOrder.orderNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      주문일시
                    </Typography>
                    <Typography variant="body2">
                      {fDateTime(selectedOrder.createdAt)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      취소일시
                    </Typography>
                    <Typography variant="body2">
                      {fDateTime(selectedOrder.requestedAt)}
                    </Typography>
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
                      {selectedOrder.customer?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      전화번호
                    </Typography>
                    <Typography variant="body2">
                      {selectedOrder.customer?.phone}
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
                          <TableCell align="right">금액</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product?.name}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">
                              {fCurrency(item.totalPrice)}
                            </TableCell>
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
                      <Typography variant="subtitle2">환불 금액</Typography>
                      <Typography variant="subtitle2">
                        {fCurrency(selectedOrder.refundAmount)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Card>

              {/* 취소 사유 */}
              <Card variant="outlined">
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    취소 사유
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      {CANCEL_REASON[selectedOrder.cancelReason]}
                    </Typography>
                    {selectedOrder.customerMessage && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {selectedOrder.customerMessage}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
