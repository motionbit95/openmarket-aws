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

const RETURN_STATUS = {
  REQUESTED: { label: "반품요청", color: "warning" },
  APPROVED: { label: "반품승인", color: "info" },
  PICKUP_SCHEDULED: { label: "수거예정", color: "primary" },
  PICKED_UP: { label: "수거완료", color: "primary" },
  INSPECTING: { label: "검수중", color: "primary" },
  COMPLETED: { label: "반품완료", color: "success" },
  REJECTED: { label: "반품거부", color: "error" },
};

const RETURN_REASON = {
  DEFECTIVE: "상품 하자/불량",
  DIFFERENT_FROM_DESCRIPTION: "상품정보 상이",
  DAMAGED_DURING_DELIVERY: "배송중 파손",
  WRONG_PRODUCT: "다른 상품 배송",
  SIZE_COLOR_MISMATCH: "사이즈/색상 불일치",
  CUSTOMER_CHANGE_MIND: "단순 변심",
  OTHER: "기타",
};

export function PartnerReturnView() {
  const [currentTab, setCurrentTab] = useState("REQUESTED");
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [action, setAction] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupCourier, setPickupCourier] = useState("");
  const [pickupTrackingNumber, setPickupTrackingNumber] = useState("");
  const [pickupMemo, setPickupMemo] = useState("");
  const [statusCounts, setStatusCounts] = useState({});
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  // 로컬 상태 관리 (실제 DB 구현 전까지 사용) - localStorage에서 불러오기
  const [localReturnStatuses, setLocalReturnStatuses] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('returnStatuses');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const tabs = [
    {
      value: "REQUESTED",
      label: "반품요청",
      count: statusCounts.REQUESTED || 0,
    },
    {
      value: "APPROVED",
      label: "반품승인",
      count: statusCounts.APPROVED || 0,
    },
    {
      value: "PICKUP_SCHEDULED",
      label: "수거예정",
      count: statusCounts.PICKUP_SCHEDULED || 0,
    },
    {
      value: "INSPECTING",
      label: "검수중",
      count: statusCounts.INSPECTING || 0,
    },
    {
      value: "COMPLETED",
      label: "반품완료",
      count: statusCounts.COMPLETED || 0,
    },
    {
      value: "REJECTED",
      label: "반품거부",
      count: statusCounts.REJECTED || 0,
    },
  ];

  const fetchStatusCounts = useCallback(async () => {
    try {
      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        setStatusCounts({
          REQUESTED: 0,
          APPROVED: 0,
          PICKUP_SCHEDULED: 0,
          INSPECTING: 0,
          COMPLETED: 0,
          REJECTED: 0,
        });
        return;
      }

      // 모든 반품 가능 주문 가져오기
      const statuses = ["RETURNING", "RETURNED"];
      let allOrders = [];

      for (const status of statuses) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/partner/orders?sellerId=${seller.id}&status=${status}&page=1&limit=100`
        );
        const data = await response.json();
        if (data.success && data.orders) {
          allOrders = [...allOrders, ...data.orders];
        }
      }

      // 로컬 상태를 기반으로 카운트 계산
      const counts = {
        REQUESTED: 0,
        APPROVED: 0,
        PICKUP_SCHEDULED: 0,
        INSPECTING: 0,
        COMPLETED: 0,
        REJECTED: 0,
      };

      allOrders.forEach(order => {
        // DB 상태 우선, 없으면 로컬 상태, 그것도 없으면 기본값
        const dbStatus = order.items?.[0]?.optionSnapshot?.returnStatus;
        const localStatus = localReturnStatuses[order.id];
        const status = dbStatus || localStatus || "REQUESTED";

        if (counts[status] !== undefined) {
          counts[status]++;
        }
      });

      setStatusCounts(counts);
    } catch (error) {
      console.error("Failed to fetch status counts:", error);
    }
  }, [localReturnStatuses]);

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);

      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        setReturns([]);
        setLoading(false);
        return;
      }

      // 모든 반품 가능 상태의 주문 가져오기
      const statuses = ["RETURNING", "RETURNED"];
      let allOrders = [];

      for (const status of statuses) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/partner/orders?sellerId=${seller.id}&status=${status}&page=1&limit=100`
        );
        const data = await response.json();
        if (data.success && data.orders) {
          allOrders = [...allOrders, ...data.orders];
        }
      }

      // 주문 데이터를 반품 데이터 형태로 변환 (DB의 returnStatus 우선 사용)
      const formattedReturns = allOrders.map((order) => {
        // DB에 저장된 반품 상태를 우선 사용, 없으면 로컬 상태, 그것도 없으면 기본값
        const dbStatus = order.items?.[0]?.optionSnapshot?.returnStatus;
        const localStatus = localReturnStatuses[order.id];
        let status = dbStatus || localStatus || "REQUESTED";

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          returnNumber: `RETURN-${order.id}`,
          customer: order.customer,
          items: order.items?.map((item) => ({
            ...item,
            returnQuantity: item.quantity || 1,
          })),
          returnReason: "OTHER",
          customerMessage: order.deliveryMemo || "",
          refundAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          status: status,
          requestedAt:
            order.items?.[0]?.optionSnapshot?.returnRequestedAt ||
            order.createdAt,
          trackingNumber:
            order.items?.[0]?.optionSnapshot?.trackingNumber || null,
          pickupDate: order.items?.[0]?.optionSnapshot?.pickupDate || null,
          pickupCourier: order.items?.[0]?.optionSnapshot?.pickupCourier || null,
          pickupTrackingNumber: order.items?.[0]?.optionSnapshot?.pickupTrackingNumber || null,
          pickupAddress: order.items?.[0]?.optionSnapshot?.pickupAddress || null,
          pickupMemo: order.items?.[0]?.optionSnapshot?.pickupMemo || null,
        };
      });

      // 현재 탭에 맞는 항목만 필터링
      const filteredReturns = formattedReturns.filter(
        (returnItem) => returnItem.status === currentTab
      );

      // 검색 필터 적용
      let searchedReturns = filteredReturns;
      if (searchQuery) {
        searchedReturns = filteredReturns.filter(
          (returnItem) =>
            returnItem.orderNumber
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            returnItem.customer?.name
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())
        );
      }

      setReturns(searchedReturns);
    } catch (error) {
      console.error("Failed to fetch returns:", error);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [currentTab, page, rowsPerPage, searchQuery, localReturnStatuses]);

  useEffect(() => {
    fetchStatusCounts();
    fetchReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, page, rowsPerPage, searchQuery]);

  // localStorage에 상태 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('returnStatuses', JSON.stringify(localReturnStatuses));
    }
  }, [localReturnStatuses]);

  const handleSearch = () => {
    setPage(0);
    fetchReturns();
  };

  const getStatusChip = (status) => {
    const normalizedStatus = status.replace("_", "_");
    const statusOption =
      RETURN_STATUS[normalizedStatus] || RETURN_STATUS.REQUESTED;
    return (
      <Chip
        size="small"
        variant="soft"
        color={statusOption.color}
        label={statusOption.label}
      />
    );
  };

  const handleProcessReturn = async () => {
    try {
      if (!action) {
        toast.error("처리 방법을 선택해주세요.");
        return;
      }

      if (action === "reject" && !rejectReason) {
        toast.error("거부 사유를 입력해주세요.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/returns/${selectedReturn.id}/process`,
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
        // 로컬 상태 업데이트
        const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
        setLocalReturnStatuses(prev => ({
          ...prev,
          [selectedReturn.id]: newStatus
        }));

        setProcessDialogOpen(false);
        setSelectedReturn(null);
        setAction("");
        setRejectReason("");

        toast.success(
          `반품 요청이 ${action === "approve" ? "승인" : "거부"}되었습니다.`
        );

        // 승인 시 APPROVED 탭으로, 거부 시 REJECTED 탭으로 이동
        if (action === "approve") {
          setCurrentTab("APPROVED");
        } else if (action === "reject") {
          setCurrentTab("REJECTED");
        }

        // 목록 새로고침
        await fetchStatusCounts();
      } else {
        toast.error("반품 처리에 실패했습니다: " + data.message);
      }
    } catch (error) {
      console.error("Failed to process return:", error);
      toast.error("반품 처리 중 오류가 발생했습니다.");
    }
  };

  const handleSchedulePickup = async () => {
    try {
      if (!pickupDate) {
        toast.error("수거 예정일을 입력해주세요.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/returns/${selectedReturn.id}/pickup`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickupAddress,
            pickupDate,
            pickupCourier,
            pickupTrackingNumber,
            pickupMemo
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // 로컬 상태 업데이트: APPROVED -> PICKUP_SCHEDULED
        setLocalReturnStatuses(prev => ({
          ...prev,
          [selectedReturn.id]: "PICKUP_SCHEDULED"
        }));

        setPickupDialogOpen(false);
        setSelectedReturn(null);
        setPickupAddress("");
        setPickupDate("");
        setPickupCourier("");
        setPickupTrackingNumber("");
        setPickupMemo("");

        toast.success("수거 일정이 등록되었습니다.");

        // PICKUP_SCHEDULED 탭으로 이동
        setCurrentTab("PICKUP_SCHEDULED");

        // 목록 새로고침
        await fetchStatusCounts();
      } else {
        toast.error("수거 일정 등록에 실패했습니다: " + data.message);
      }
    } catch (error) {
      console.error("Failed to schedule pickup:", error);
      toast.error("수거 일정 등록 중 오류가 발생했습니다.");
    }
  };

  const handleStartInspection = async (returnItem) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/returns/${returnItem.id}/inspection`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (data.success) {
        // 로컬 상태 업데이트: PICKUP_SCHEDULED -> INSPECTING
        setLocalReturnStatuses(prev => ({
          ...prev,
          [returnItem.id]: "INSPECTING"
        }));

        toast.success("검수가 시작되었습니다.");

        // INSPECTING 탭으로 이동
        setCurrentTab("INSPECTING");

        // 목록 새로고침
        await fetchStatusCounts();
      } else {
        toast.error("검수 시작에 실패했습니다: " + data.message);
      }
    } catch (error) {
      console.error("Failed to start inspection:", error);
      toast.error("검수 시작 중 오류가 발생했습니다.");
    }
  };

  const handleCompleteReturn = async (returnItem) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/returns/${returnItem.id}/complete`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (data.success) {
        // 로컬 상태 업데이트: INSPECTING -> COMPLETED
        setLocalReturnStatuses(prev => ({
          ...prev,
          [returnItem.id]: "COMPLETED"
        }));

        toast.success("반품이 완료되었습니다.");

        // COMPLETED 탭으로 이동
        setCurrentTab("COMPLETED");

        // 목록 새로고침
        await fetchStatusCounts();
      } else {
        toast.error("반품 완료 처리에 실패했습니다: " + data.message);
      }
    } catch (error) {
      console.error("Failed to complete return:", error);
      toast.error("반품 완료 처리 중 오류가 발생했습니다.");
    }
  };

  const handleExcelDownload = () => {
    try {
      const formattedData = formatCancellationsForExcel(returns);
      exportToExcel(formattedData, "반품관리");
      toast.success("엑셀 다운로드가 완료되었습니다.");
    } catch (error) {
      console.error("Excel download failed:", error);
      toast.error("엑셀 다운로드에 실패했습니다.");
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(event, newValue) => setCurrentTab(newValue)}
          sx={{ px: 2, bgcolor: "background.neutral" }}
          variant="scrollable"
          scrollButtons="auto"
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
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h6">
              반품 관리
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:download-fill" />}
              onClick={handleExcelDownload}
              disabled={returns.length === 0}
            >
              엑셀 다운로드
            </Button>
          </Stack>

          {/* 검색 필터 */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <TextField
              size="small"
              placeholder="주문번호, 반품번호, 고객명 검색"
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

          {currentTab === "REQUESTED" && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              고객의 반품 요청을 검토하고 승인 또는 거부 처리를 해주세요.
            </Alert>
          )}

          {currentTab === "APPROVED" && (
            <Alert severity="info" sx={{ mb: 3 }}>
              승인된 반품의 수거 일정을 등록해주세요.
            </Alert>
          )}

          {currentTab === "PICKUP_SCHEDULED" && (
            <Alert severity="info" sx={{ mb: 3 }}>
              수거가 예정된 반품입니다. 상품이 도착하면 검수를 시작해주세요.
            </Alert>
          )}

          {currentTab === "INSPECTING" && (
            <Alert severity="info" sx={{ mb: 3 }}>
              검수 중인 반품입니다. 검수가 완료되면 반품 완료 처리를 해주세요.
            </Alert>
          )}

          {/* 반품 테이블 */}
          <TableContainer sx={{ overflow: "unset" }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>주문정보</TableCell>
                    <TableCell>고객정보</TableCell>
                    <TableCell>상품정보</TableCell>
                    <TableCell>반품사유</TableCell>
                    <TableCell>환불금액</TableCell>
                    <TableCell>요청일시</TableCell>
                    <TableCell align="center">관리</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {returns.map((returnItem) => (
                    <TableRow key={returnItem.id} hover>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {returnItem.orderNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            반품번호: {returnItem.returnNumber}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {returnItem.customer?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {returnItem.customer?.phone}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack>
                          <Typography variant="body2">
                            {returnItem.items?.[0]?.product?.name}
                          </Typography>
                          {returnItem.items?.length > 1 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              외 {returnItem.items.length - 1}개
                            </Typography>
                          )}
                          <Typography variant="caption" color="primary.main">
                            반품수량: {returnItem.items?.[0]?.returnQuantity ?? returnItem.items?.[0]?.quantity ?? 0}개
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack>
                          <Typography variant="body2">
                            {RETURN_REASON[returnItem.returnReason]}
                          </Typography>
                          {returnItem.customerMessage && (
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
                              {returnItem.customerMessage}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {fCurrency(returnItem.refundAmount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {returnItem.paymentMethod === "CARD"
                              ? "카드환불"
                              : "계좌환불"}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {fDateTime(returnItem.requestedAt)}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          {/* 반품요청 탭: 승인/거부 버튼 */}
                          {returnItem.status === "REQUESTED" && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => {
                                  setSelectedReturn(returnItem);
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
                                  setSelectedReturn(returnItem);
                                  setAction("reject");
                                  setProcessDialogOpen(true);
                                }}
                              >
                                거부
                              </Button>
                            </>
                          )}

                          {/* 반품승인 탭: 수거 일정 등록 버튼 */}
                          {returnItem.status === "APPROVED" && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => {
                                setSelectedReturn(returnItem);
                                setPickupDialogOpen(true);
                              }}
                            >
                              수거 일정 등록
                            </Button>
                          )}

                          {/* 수거예정 탭: 검수 시작 버튼 */}
                          {returnItem.status === "PICKUP_SCHEDULED" && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => handleStartInspection(returnItem)}
                            >
                              검수 시작
                            </Button>
                          )}

                          {/* 검수중 탭: 반품 완료 버튼 */}
                          {returnItem.status === "INSPECTING" && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleCompleteReturn(returnItem)}
                            >
                              반품 완료
                            </Button>
                          )}

                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              console.log('Selected return item:', returnItem);
                              setSelectedOrder(returnItem);
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
            count={returns.length}
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

      {/* 반품 처리 다이얼로그 */}
      <Dialog
        open={processDialogOpen}
        onClose={() => setProcessDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>반품 요청 처리</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              주문번호: {selectedReturn?.orderNumber}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              반품사유:{" "}
              {selectedReturn && RETURN_REASON[selectedReturn.returnReason]}
            </Typography>

            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>처리 방법</InputLabel>
                <Select
                  value={action}
                  label="처리 방법"
                  onChange={(e) => setAction(e.target.value)}
                >
                  <MenuItem value="approve">반품 승인</MenuItem>
                  <MenuItem value="reject">반품 거부</MenuItem>
                </Select>
              </FormControl>

              {action === "reject" && (
                <TextField
                  label="거부 사유"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="반품 거부 사유를 입력하세요"
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
          <Button variant="contained" onClick={handleProcessReturn}>
            처리
          </Button>
        </DialogActions>
      </Dialog>

      {/* 수거 일정 등록 다이얼로그 */}
      <Dialog
        open={pickupDialogOpen}
        onClose={() => setPickupDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>수거 일정 등록</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              반품번호: {selectedReturn?.returnNumber}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: "block" }}>
              * 수거 예정일은 필수입니다. 나머지 항목은 선택사항입니다.
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="수거 예정일"
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />

              <FormControl fullWidth>
                <InputLabel>택배사</InputLabel>
                <Select
                  value={pickupCourier}
                  label="택배사"
                  onChange={(e) => setPickupCourier(e.target.value)}
                >
                  <MenuItem value="">선택 안함</MenuItem>
                  <MenuItem value="CJ대한통운">CJ대한통운</MenuItem>
                  <MenuItem value="우체국택배">우체국택배</MenuItem>
                  <MenuItem value="로젠택배">로젠택배</MenuItem>
                  <MenuItem value="한진택배">한진택배</MenuItem>
                  <MenuItem value="롯데택배">롯데택배</MenuItem>
                  <MenuItem value="경동택배">경동택배</MenuItem>
                  <MenuItem value="GSPostbox">GSPostbox</MenuItem>
                  <MenuItem value="기타">기타</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="운송장 번호"
                value={pickupTrackingNumber}
                onChange={(e) => setPickupTrackingNumber(e.target.value)}
                placeholder="운송장 번호를 입력하세요 (선택사항)"
                fullWidth
              />

              <TextField
                label="수거 주소"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="수거할 주소를 입력하세요 (선택사항)"
                fullWidth
                multiline
                rows={2}
              />

              <TextField
                label="메모"
                value={pickupMemo}
                onChange={(e) => setPickupMemo(e.target.value)}
                placeholder="특이사항이나 전달사항을 입력하세요 (선택사항)"
                fullWidth
                multiline
                rows={3}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickupDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSchedulePickup}>
            등록
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
        <DialogTitle>반품 상세</DialogTitle>
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
                      반품번호
                    </Typography>
                    <Typography variant="body2">
                      {selectedOrder.returnNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      요청일시
                    </Typography>
                    <Typography variant="body2">
                      {fDateTime(selectedOrder.requestedAt)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      상태
                    </Typography>
                    <Box>{getStatusChip(selectedOrder.status)}</Box>
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
                    반품 상품
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>상품명</TableCell>
                          <TableCell align="right">반품수량</TableCell>
                          <TableCell align="right">금액</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product?.name}</TableCell>
                            <TableCell align="right">
                              {item.returnQuantity || item.quantity || 0}개
                            </TableCell>
                            <TableCell align="right">
                              {fCurrency(item.totalPrice || item.price * (item.returnQuantity || item.quantity || 0))}
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

              {/* 반품 사유 */}
              <Card variant="outlined">
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    반품 사유
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      {RETURN_REASON[selectedOrder.returnReason]}
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

              {/* 수거 정보 (수거 예정일이 있을 때 표시) */}
              {(selectedOrder.pickupDate ||
                selectedOrder.pickupCourier ||
                selectedOrder.pickupTrackingNumber ||
                selectedOrder.pickupAddress ||
                selectedOrder.pickupMemo) && (
                <Card variant="outlined">
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      수거 정보
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "120px 1fr",
                        gap: 1,
                        mt: 1,
                      }}
                    >
                      {selectedOrder.pickupDate && (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            수거 예정일
                          </Typography>
                          <Typography variant="body2">
                            {selectedOrder.pickupDate}
                          </Typography>
                        </>
                      )}

                      {selectedOrder.pickupCourier && (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            택배사
                          </Typography>
                          <Typography variant="body2">
                            {selectedOrder.pickupCourier}
                          </Typography>
                        </>
                      )}

                      {selectedOrder.pickupTrackingNumber && (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            운송장번호
                          </Typography>
                          <Typography variant="body2">
                            {selectedOrder.pickupTrackingNumber}
                          </Typography>
                        </>
                      )}

                      {selectedOrder.pickupAddress && (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            수거 주소
                          </Typography>
                          <Typography variant="body2">
                            {selectedOrder.pickupAddress}
                          </Typography>
                        </>
                      )}

                      {selectedOrder.pickupMemo && (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            메모
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {selectedOrder.pickupMemo}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                </Card>
              )}
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
