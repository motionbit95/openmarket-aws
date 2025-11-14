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
  Paper,
  Grid,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";

import { Iconify } from "src/components/iconify";
import { Scrollbar } from "src/components/scrollbar";
import { fCurrency } from "src/utils/format-number";
import { fDate, fDateTime } from "src/utils/format-time";
import { exportToExcel, formatSettlementsForExcel } from "src/utils/excel-export";
import { toast } from "src/components/snackbar";
import { getSellerSession } from "src/actions/seller";

// ----------------------------------------------------------------------

const SETTLEMENT_STATUS = {
  PENDING: { label: "정산 대기", color: "warning" },
  CALCULATING: { label: "정산 계산중", color: "info" },
  COMPLETED: { label: "정산 완료", color: "success" },
  CANCELLED: { label: "정산 취소", color: "error" },
  ON_HOLD: { label: "정산 보류", color: "default" },
};

export function PartnerSettlementListView() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentTab, setCurrentTab] = useState("all"); // 탭 상태 추가
  const [summary, setSummary] = useState({
    totalSettlement: 0,
    totalCommission: 0,
    totalSales: 0,
    pendingCount: 0,
  });

  const fetchSettlements = useCallback(async () => {
    try {
      setLoading(true);

      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        setSettlements([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        sellerId: seller.id.toString(),
        page: page + 1,
        limit: rowsPerPage,
        ...(searchQuery && { search: searchQuery }),
        ...(startDate && { startDate: startDate.toISOString().split("T")[0] }),
        ...(endDate && { endDate: endDate.toISOString().split("T")[0] }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/settlements/seller/${seller.id}?${params}`
      );
      const data = await response.json();

      if (data.settlements) {
        setSettlements(data.settlements || []);

        // 요약 정보 계산
        const summaryData = {
          totalSettlement: data.settlements
            .filter((s) => s.status === "COMPLETED")
            .reduce((sum, s) => sum + s.finalSettlementAmount, 0),
          totalCommission: data.settlements.reduce(
            (sum, s) => sum + s.totalCommission,
            0
          ),
          totalSales: data.settlements.reduce(
            (sum, s) => sum + s.totalOrderAmount,
            0
          ),
          pendingCount: data.settlements.filter((s) => s.status === "PENDING")
            .length,
        };
        setSummary(summaryData);
      } else {
        console.error("API Error:", data.message || "No settlements data");
        setSettlements([]);
        setSummary({
          totalSettlement: 0,
          totalCommission: 0,
          totalSales: 0,
          pendingCount: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch settlements:", error);
      setSettlements([]);
      setSummary({
        totalSettlement: 0,
        totalCommission: 0,
        totalSales: 0,
        pendingCount: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchQuery, startDate, endDate]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleSearch = () => {
    setPage(0);
    fetchSettlements();
  };

  const handleReset = () => {
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setPage(0);
  };

  const handleExcelDownload = () => {
    try {
      const formattedData = formatSettlementsForExcel(settlements);
      exportToExcel(formattedData, "정산관리");
      toast.success("엑셀 다운로드가 완료되었습니다.");
    } catch (error) {
      console.error("Excel download failed:", error);
      toast.error("엑셀 다운로드에 실패했습니다.");
    }
  };

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

  // Get current settlement period info
  const getCurrentPeriodInfo = () => {
    if (settlements.length === 0) return null;
    const currentSettlement =
      settlements.find((s) => s.status === "PENDING") || settlements[0];
    if (!currentSettlement || !currentSettlement.SettlementPeriod) return null;

    const period = currentSettlement.SettlementPeriod;
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    const settlementDate = new Date(period.settlementDate);

    const month = startDate.getMonth() + 1;
    const periodNumber = Math.ceil(startDate.getDate() / 7); // Rough calculation for weekly periods

    return {
      title:
        period.periodType === "MONTHLY"
          ? `${month}월 정산`
          : `${month}월 ${periodNumber}차 정산`,
      period: `${fDate(period.startDate)} ~ ${fDate(period.endDate)}`,
      settlementDate: fDate(settlementDate),
      account:
        currentSettlement.sellers?.bankType &&
        currentSettlement.sellers?.bankAccount
          ? `${currentSettlement.sellers.bankType} ${currentSettlement.sellers.bankAccount}`
          : "계좌 정보 없음",
      amount: currentSettlement.finalSettlementAmount,
    };
  };

  const periodInfo = getCurrentPeriodInfo();

  // 탭별 카운트 계산
  const getTabCounts = () => {
    const counts = {
      all: settlements.length,
      pending: 0,
      completed: 0,
      calculating: 0,
      cancelled: 0,
    };

    settlements.forEach((settlement) => {
      const status = settlement.status;
      if (status === "PENDING") counts.pending++;
      else if (status === "COMPLETED") counts.completed++;
      else if (status === "CALCULATING") counts.calculating++;
      else if (status === "CANCELLED") counts.cancelled++;
    });

    return counts;
  };

  const tabCounts = getTabCounts();

  // 탭에 따라 필터링된 정산 목록
  const filteredSettlements = settlements.filter((settlement) => {
    if (currentTab === "all") return true;
    if (currentTab === "pending") return settlement.status === "PENDING";
    if (currentTab === "completed") return settlement.status === "COMPLETED";
    if (currentTab === "calculating")
      return settlement.status === "CALCULATING";
    if (currentTab === "cancelled") return settlement.status === "CANCELLED";
    return true;
  });

  return (
    <Box>
      {/* 정산 기간 정보 */}
      {periodInfo && (
        <Card sx={{ mb: 3, p: 3 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
            {periodInfo.title} 요약
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                정산 기준일
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {periodInfo.period}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                정산 지급 예정일
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {periodInfo.settlementDate}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                입금계좌
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {periodInfo.account}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                정산예정금액
              </Typography>
              <Typography
                variant="h6"
                color="primary.main"
                sx={{ fontWeight: "bold" }}
              >
                {fCurrency(periodInfo.amount)}
              </Typography>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* 정산 요약 정보 - 1:1:1:1 균등 레이아웃 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: "center", height: "100%" }}>
            <Typography
              variant="h4"
              color="primary.main"
              sx={{ fontWeight: 700 }}
            >
              {fCurrency(summary.totalSettlement)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              총 정산 완료 금액
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: "center", height: "100%" }}>
            <Typography
              variant="h4"
              color="success.main"
              sx={{ fontWeight: 700 }}
            >
              {fCurrency(summary.totalSales)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              총 매출액
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: "center", height: "100%" }}>
            <Typography
              variant="h4"
              color="warning.main"
              sx={{ fontWeight: 700 }}
            >
              {fCurrency(summary.totalCommission)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              총 수수료
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: "center", height: "100%" }}>
            <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
              {summary.pendingCount}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              정산 대기 건수
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Card>
        {/* 정산 상태 탭 */}
        <Tabs
          value={currentTab}
          onChange={(event, newValue) => {
            setCurrentTab(newValue);
            setPage(0);
          }}
          sx={{
            px: 2.5,
            boxShadow: (theme) =>
              `inset 0 -2px 0 0 ${theme.vars.palette.divider}`,
          }}
        >
          <Tab
            value="all"
            label="전체"
            icon={
              <Chip
                label={tabCounts.all}
                size="small"
                variant="soft"
                color="default"
              />
            }
            iconPosition="end"
          />
          <Tab
            value="pending"
            label="정산 대기"
            icon={
              <Chip
                label={tabCounts.pending}
                size="small"
                variant="soft"
                color="warning"
              />
            }
            iconPosition="end"
          />
          <Tab
            value="calculating"
            label="계산중"
            icon={
              <Chip
                label={tabCounts.calculating}
                size="small"
                variant="soft"
                color="info"
              />
            }
            iconPosition="end"
          />
          <Tab
            value="completed"
            label="정산 완료"
            icon={
              <Chip
                label={tabCounts.completed}
                size="small"
                variant="soft"
                color="success"
              />
            }
            iconPosition="end"
          />
          <Tab
            value="cancelled"
            label="정산 취소"
            icon={
              <Chip
                label={tabCounts.cancelled}
                size="small"
                variant="soft"
                color="error"
              />
            }
            iconPosition="end"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h6">
              정산 내역
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:download-fill" />}
              onClick={handleExcelDownload}
              disabled={settlements.length === 0}
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
              placeholder="정산번호 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
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
              sx={{ minWidth: 160 }}
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
              sx={{ minWidth: 160 }}
            />

            <Button
              variant="contained"
              onClick={handleSearch}
              sx={{ minWidth: 80 }}
            >
              검색
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              sx={{ minWidth: 80 }}
            >
              초기화
            </Button>
          </Stack>

          {/* 정산 테이블 */}
          <TableContainer component={Paper} variant="outlined">
            <Scrollbar>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>정산번호</TableCell>
                    <TableCell>정산기간</TableCell>
                    <TableCell>매출정보</TableCell>
                    <TableCell>수수료</TableCell>
                    <TableCell>정산금액</TableCell>
                    <TableCell>입금계좌</TableCell>
                    <TableCell>처리일시</TableCell>
                    <TableCell align="center">관리</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredSettlements
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((settlement) => (
                      <TableRow key={settlement.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            S{settlement.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            생성: {fDate(settlement.createdAt)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {fDate(settlement.SettlementPeriod.startDate)} ~{" "}
                            {fDate(settlement.SettlementPeriod.endDate)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({settlement.SettlementPeriod.periodType})
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {fCurrency(settlement.totalOrderAmount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            매출액
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {fCurrency(settlement.totalCommission)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (수수료)
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "primary.main" }}
                          >
                            {fCurrency(settlement.finalSettlementAmount)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Stack>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {settlement.sellers?.bankType || "은행 정보 없음"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {settlement.sellers?.bankAccount || ""}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {settlement.sellers?.depositorName || ""}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          {settlement.settledAt ? (
                            <Typography variant="body2">
                              {fDateTime(settlement.settledAt)}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              처리 대기중
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() =>
                              window.open(
                                `/dashboard/partner/settlement/list/${settlement.id}`,
                                "_blank"
                              )
                            }
                          >
                            <Iconify icon="eva:eye-fill" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredSettlements.length}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="페이지당 행 수:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} / 전체 ${count !== -1 ? count : `${to} 이상`}`
            }
          />
        </Box>
      </Card>
    </Box>
  );
}
