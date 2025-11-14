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
import { exportToExcel, formatDeliveriesForExcel } from "src/utils/excel-export";
import { toast } from "src/components/snackbar";
import { getSellerSession } from "src/actions/seller";

// ----------------------------------------------------------------------

const DELIVERY_STATUS = {
  READY: { label: "배송준비중", color: "warning" },
  SHIPPED: { label: "배송시작", color: "info" },
  IN_TRANSIT: { label: "배송중", color: "primary" },
  DELIVERED: { label: "배송완료", color: "success" },
  FAILED: { label: "배송실패", color: "error" },
};

const DELIVERY_COMPANIES = [
  { code: "CJ", name: "CJ대한통운" },
  { code: "LOTTE", name: "롯데택배" },
  { code: "HANJIN", name: "한진택배" },
  { code: "KGB", name: "로젠택배" },
  { code: "POST", name: "우체국택배" },
];

export function PartnerDeliveryView() {
  const [currentTab, setCurrentTab] = useState("ready");
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [deliveryCompany, setDeliveryCompany] = useState("");
  const [statusCounts, setStatusCounts] = useState({});

  const tabs = [
    { value: "ready", label: "배송준비중", count: statusCounts.READY || 0 },
    { value: "shipped", label: "배송중", count: statusCounts.SHIPPED || 0 },
    {
      value: "delivered",
      label: "배송완료",
      count: statusCounts.DELIVERED || 0,
    },
    { value: "failed", label: "배송실패", count: statusCounts.FAILED || 0 },
  ];

  const fetchStatusCounts = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/deliveries/counts?sellerId=1`
      );
      const data = await response.json();

      if (data.success) {
        const counts = data.counts || {};
        setStatusCounts({
          READY: counts.PREPARING || 0,
          SHIPPED: counts.SHIPPED || 0,
          DELIVERED: counts.DELIVERED || 0,
          FAILED: counts.FAILED || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch status counts:", error);
    }
  }, []);

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);

      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        setDeliveries([]);
        setLoading(false);
        return;
      }

      // 탭에 따른 배송 상태 매핑 (백엔드 API와 일치)
      const statusMap = {
        ready: "READY",
        shipped: "SHIPPED",
        delivered: "DELIVERED",
        failed: "FAILED",
      };

      const params = new URLSearchParams({
        sellerId: seller.id.toString(),
        status: statusMap[currentTab] || currentTab.toUpperCase(),
        page: page + 1,
        limit: rowsPerPage,
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/deliveries?${params}`
      );
      const data = await response.json();

      if (data.success) {
        setDeliveries(data.deliveries || []);
      } else {
        console.error("API Error:", data.message);
        setDeliveries([]);
      }
    } catch (error) {
      console.error("Failed to fetch deliveries:", error);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [currentTab, page, rowsPerPage, searchQuery]);

  useEffect(() => {
    fetchStatusCounts();
    fetchDeliveries();
  }, [fetchStatusCounts, fetchDeliveries]);

  useEffect(() => {
    fetchStatusCounts();
  }, [currentTab, fetchStatusCounts]);

  const handleSearch = () => {
    setPage(0);
    fetchDeliveries();
  };

  const getStatusChip = (status) => {
    const statusOption = DELIVERY_STATUS[status] || DELIVERY_STATUS.READY;
    return (
      <Chip
        size="small"
        variant="soft"
        color={statusOption.color}
        label={statusOption.label}
      />
    );
  };

  const handleExcelDownload = () => {
    try {
      const excelData = formatDeliveriesForExcel(deliveries);
      const success = exportToExcel(excelData, "배송관리", "배송");
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

  const handleStartDelivery = async () => {
    try {
      if (!trackingNumber || !deliveryCompany) {
        alert("운송장 번호와 택배사를 선택해주세요.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/deliveries/${selectedOrder.id}/start`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackingNumber, deliveryCompany }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // 로컬 상태 업데이트
        setDeliveries(
          deliveries.map((delivery) =>
            delivery.id === selectedOrder.id
              ? {
                  ...delivery,
                  trackingNumber,
                  deliveryCompany,
                  deliveryStatus: "SHIPPED",
                }
              : delivery
          )
        );

        setTrackingDialogOpen(false);
        setSelectedOrder(null);
        setTrackingNumber("");
        setDeliveryCompany("");

        alert("배송이 시작되었습니다.");
      } else {
        alert("배송 시작에 실패했습니다: " + data.message);
      }
    } catch (error) {
      console.error("Failed to start delivery:", error);
      alert("배송 시작 처리 중 오류가 발생했습니다.");
    }
  };

  const handleTrackingUpdate = async (orderId, newTrackingNumber) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/deliveries/${orderId}/tracking`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackingNumber: newTrackingNumber }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // 로컬 상태 업데이트
        setDeliveries(
          deliveries.map((delivery) =>
            delivery.id === orderId
              ? { ...delivery, trackingNumber: newTrackingNumber }
              : delivery
          )
        );

        alert("운송장 번호가 업데이트되었습니다.");
      } else {
        alert("운송장 번호 업데이트에 실패했습니다: " + data.message);
      }
    } catch (error) {
      console.error("Failed to update tracking number:", error);
      alert("운송장 번호 업데이트 중 오류가 발생했습니다.");
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
              배송 관리
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:download-fill" />}
              onClick={handleExcelDownload}
              disabled={deliveries.length === 0}
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
              placeholder="주문번호, 고객명, 운송장번호 검색"
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

          {currentTab === "ready" && (
            <Alert severity="info" sx={{ mb: 3 }}>
              배송준비중인 주문의 운송장 정보를 입력하여 배송을 시작하세요.
            </Alert>
          )}

          {/* 배송 테이블 */}
          <TableContainer sx={{ overflow: "unset" }}>
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>주문번호</TableCell>
                    <TableCell>고객정보</TableCell>
                    <TableCell>상품정보</TableCell>
                    <TableCell>배송지</TableCell>
                    <TableCell>운송장정보</TableCell>
                    <TableCell>배송상태</TableCell>
                    <TableCell>예상배송일</TableCell>
                    <TableCell align="center">관리</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {delivery.orderNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fDateTime(delivery.createdAt)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {delivery.customer?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {delivery.customer?.phone}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack>
                          <Typography variant="body2">
                            {delivery.items?.[0]?.product?.name}
                          </Typography>
                          {delivery.items?.length > 1 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              외 {delivery.items.length - 1}개
                            </Typography>
                          )}
                          <Typography variant="caption" color="primary.main">
                            {fCurrency(delivery.totalAmount)}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {delivery.shippingAddress}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {delivery.trackingNumber ? (
                          <Stack>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {delivery.trackingNumber}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {delivery.deliveryCompany}
                            </Typography>
                          </Stack>
                        ) : (
                          <Chip size="small" label="미등록" color="default" />
                        )}
                      </TableCell>

                      <TableCell>
                        {getStatusChip(delivery.deliveryStatus)}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {delivery.estimatedDelivery
                            ? fDateTime(delivery.estimatedDelivery, "MM/dd")
                            : "미정"}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5}>
                          {delivery.deliveryStatus === "READY" ? (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => {
                                setSelectedOrder(delivery);
                                setTrackingDialogOpen(true);
                              }}
                            >
                              배송시작
                            </Button>
                          ) : (
                            <IconButton
                              size="small"
                              onClick={() => {
                                const newNumber = prompt(
                                  "새 운송장 번호:",
                                  delivery.trackingNumber
                                );
                                if (
                                  newNumber &&
                                  newNumber !== delivery.trackingNumber
                                ) {
                                  handleTrackingUpdate(delivery.id, newNumber);
                                }
                              }}
                            >
                              <Iconify icon="eva:edit-fill" />
                            </IconButton>
                          )}

                          {delivery.trackingNumber && (
                            <IconButton
                              size="small"
                              onClick={() => {
                                window.open(
                                  `https://tracking.example.com/${delivery.trackingNumber}`,
                                  "_blank"
                                );
                              }}
                            >
                              <Iconify icon="eva:external-link-fill" />
                            </IconButton>
                          )}
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
            count={deliveries.length}
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

      {/* 배송 시작 다이얼로그 */}
      <Dialog
        open={trackingDialogOpen}
        onClose={() => setTrackingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>배송 시작</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 3 }}>
              주문번호: {selectedOrder?.orderNumber}
            </Typography>

            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>택배사</InputLabel>
                <Select
                  value={deliveryCompany}
                  label="택배사"
                  onChange={(e) => setDeliveryCompany(e.target.value)}
                >
                  {DELIVERY_COMPANIES.map((company) => (
                    <MenuItem key={company.code} value={company.name}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="운송장 번호"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="운송장 번호를 입력하세요"
                fullWidth
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrackingDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleStartDelivery}>
            배송시작
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
