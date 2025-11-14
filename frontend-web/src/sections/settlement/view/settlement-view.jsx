"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  Stack,
  Button,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  IconButton,
} from "@mui/material";
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { ko } from 'date-fns/locale';

import { Iconify } from "src/components/iconify";
import { Scrollbar } from "src/components/scrollbar";
import { fCurrency } from "src/utils/format-number";
import { fDate } from "src/utils/format-time";
import {
  getSettlements,
  processSettlements,
  completeSettlements,
  holdSettlements,
  unholdSettlements,
  deleteSettlements,
  cancelSettlements,
} from "src/actions/settlement";
import { toast } from "sonner";

// ----------------------------------------------------------------------

const SETTLEMENT_STATUS = {
  PENDING: { label: "정산 대기", color: "warning" },
  CALCULATING: { label: "정산 처리중", color: "info" },
  COMPLETED: { label: "정산 완료", color: "success" },
  CANCELLED: { label: "정산 취소", color: "error" },
  ON_HOLD: { label: "정산 보류", color: "default" },
};

const BANK_NAMES = {
  KB: "KB국민은행",
  SH: "신한은행",
  WR: "우리은행",
  HN: "하나은행",
  NH: "NH농협은행",
  IBK: "IBK기업은행",
  KEB: "KEB하나은행",
  SC: "SC제일은행",
  CT: "씨티은행",
  KK: "케이뱅크",
  KA: "카카오뱅크",
  TO: "토스뱅크",
  BNK: "부산은행",
  DGB: "대구은행",
  KJ: "광주은행",
  JB: "전북은행",
  KN: "경남은행",
  SB: "새마을금고",
  CU: "신협",
  PC: "우체국",
  IB: "산업은행",
  SJ: "수협",
};

export function SettlementView({ currentTab }) {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedSettlements, setSelectedSettlements] = useState([]);
  const [page, setPage] = useState(0); // TablePagination은 0부터 시작
  const [totalCount, setTotalCount] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5); // 페이지당 항목 수
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [unholdDialogOpen, setUnholdDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [commissionRate, setCommissionRate] = useState(10);
  const [holdMemo, setHoldMemo] = useState("");
  const [unholdMemo, setUnholdMemo] = useState("");
  const [cancelMemo, setCancelMemo] = useState("");

  const fetchSettlements = useCallback(async () => {
    try {
      setLoading(true);

      // 상태 매핑
      let apiStatus = "";
      if (currentTab === "pending") apiStatus = "PENDING";
      else if (currentTab === "processing") apiStatus = "CALCULATING";
      else if (currentTab === "completed") apiStatus = "COMPLETED";
      else if (currentTab === "cancelled") apiStatus = "CANCELLED";
      else if (currentTab === "on_hold") apiStatus = "ON_HOLD";

      const data = await getSettlements({
        status: apiStatus,
        search: searchQuery,
        startDate,
        endDate,
        page: page + 1, // API는 1부터 시작하므로 +1
        limit: rowsPerPage,
      });

      console.log("Fetched settlements:", data);
      setSettlements(data.settlements || data.data || []);
      setTotalCount(data.pagination?.total || data.total || 0);
    } catch (error) {
      console.error("Failed to fetch settlements:", error);
      toast.error(
        `정산 목록을 불러오는데 실패했습니다: ${error.message || ""}`
      );
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }, [currentTab, searchQuery, startDate, endDate, page, rowsPerPage]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // 탭이 변경될 때 페이지를 0으로 리셋
  useEffect(() => {
    setPage(0);
    setSelectedSettlements([]);
  }, [currentTab]);

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

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getBankName = (bankCode) => {
    return BANK_NAMES[bankCode] || bankCode || "-";
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

  const handleProcessSettlement = async (settlementIds) => {
    try {
      await processSettlements({
        settlementIds,
        commissionRate,
      });

      setProcessDialogOpen(false);
      setSelectedSettlements([]);
      fetchSettlements();
      toast.success("정산 처리가 완료되었습니다.");
    } catch (error) {
      console.error("Settlement processing error:", error);
      toast.error("정산 처리 중 오류가 발생했습니다.");
    }
  };

  const handleCompleteSettlement = async (settlementIds) => {
    try {
      await completeSettlements({
        settlementIds,
      });

      setCompleteDialogOpen(false);
      setSelectedSettlements([]);
      fetchSettlements();
      toast.success("정산 완료 처리되었습니다.");
    } catch (error) {
      console.error("Settlement completion error:", error);
      toast.error("정산 완료 처리 중 오류가 발생했습니다.");
    }
  };

  const handleHoldSettlement = async (settlementIds, memo) => {
    try {
      await holdSettlements({
        settlementIds,
        memo,
      });

      setHoldDialogOpen(false);
      setSelectedSettlements([]);
      setHoldMemo("");
      fetchSettlements();
      toast.success("정산이 보류되었습니다.");
    } catch (error) {
      console.error("Settlement hold error:", error);
      toast.error("정산 보류 중 오류가 발생했습니다.");
    }
  };

  const handleUnholdSettlement = async (settlementIds, memo) => {
    try {
      await unholdSettlements({
        settlementIds,
        memo,
      });

      setUnholdDialogOpen(false);
      setSelectedSettlements([]);
      setUnholdMemo("");
      fetchSettlements();
      toast.success("정산 보류가 해제되었습니다.");
    } catch (error) {
      console.error("Settlement unhold error:", error);
      toast.error("정산 보류 해제 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteSettlement = async (settlementIds) => {
    try {
      await deleteSettlements({
        settlementIds,
      });

      setDeleteDialogOpen(false);
      setSelectedSettlements([]);
      fetchSettlements();
      toast.success("정산이 삭제되었습니다.");
    } catch (error) {
      console.error("Settlement delete error:", error);
      toast.error("정산 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleCancelSettlement = async (settlementIds, memo) => {
    try {
      await cancelSettlements({
        settlementIds,
        memo,
      });

      setCancelDialogOpen(false);
      setSelectedSettlements([]);
      setCancelMemo("");
      fetchSettlements();
      toast.success("정산이 취소되었습니다.");
    } catch (error) {
      console.error("Settlement cancel error:", error);
      toast.error("정산 취소 중 오류가 발생했습니다.");
    }
  };

  const renderPendingView = () => (
    <Card>
      <Box sx={{ p: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Typography variant="h6">정산 대기 목록</Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="warning"
              disabled={selectedSettlements.length === 0}
              onClick={() => setHoldDialogOpen(true)}
            >
              선택 항목 보류
            </Button>
            <Button
              variant="contained"
              disabled={selectedSettlements.length === 0}
              onClick={() => setProcessDialogOpen(true)}
            >
              선택 항목 정산 처리
            </Button>
          </Stack>
        </Stack>

        <TableContainer component={Paper} variant="outlined">
          <Scrollbar>
            <Table sx={{ minWidth: 930 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ width: 50 }}>
                    <input type="checkbox" />
                  </TableCell>
                  <TableCell sx={{ width: 200 }}>판매자</TableCell>
                  <TableCell sx={{ width: 180 }}>정산 기간</TableCell>
                  <TableCell sx={{ width: 120 }}>매출액</TableCell>
                  <TableCell sx={{ width: 140 }}>수수료</TableCell>
                  <TableCell sx={{ width: 140 }}>정산 예정액</TableCell>
                  <TableCell sx={{ width: 100 }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      <Typography variant="body2" color="text.secondary">
                        로딩 중...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : settlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      <Typography variant="body2" color="text.secondary">
                        정산 내역이 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  settlements.map((settlement) => (
                    <TableRow key={settlement.id} hover>
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedSettlements.includes(settlement.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSettlements([
                                ...selectedSettlements,
                                settlement.id,
                              ]);
                            } else {
                              setSelectedSettlements(
                                selectedSettlements.filter(
                                  (id) => id !== settlement.id
                                )
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {settlement.sellers?.name ||
                              settlement.sellerName ||
                              "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {settlement.sellers?.email ||
                              settlement.sellerEmail ||
                              "-"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fDate(
                            settlement.SettlementPeriod?.startDate ||
                              settlement.startDate
                          )}{" "}
                          ~{" "}
                          {fDate(
                            settlement.SettlementPeriod?.endDate ||
                              settlement.endDate
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {fCurrency(
                            settlement.totalOrderAmount ||
                              settlement.salesAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fCurrency(
                            settlement.totalCommission ||
                              settlement.commissionAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "primary.main" }}
                        >
                          {fCurrency(
                            settlement.finalSettlementAmount ||
                              settlement.settlementAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(settlement.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        {/* 테이블 페이지네이션 */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
          }
        />
      </Box>
    </Card>
  );

  const renderProcessingView = () => (
    <Card>
      <Box sx={{ p: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Typography variant="h6">정산 처리중 목록</Typography>
          <Button
            variant="contained"
            color="success"
            disabled={selectedSettlements.length === 0}
            onClick={() => setCompleteDialogOpen(true)}
          >
            선택 항목 정산 완료
          </Button>
        </Stack>

        <TableContainer component={Paper} variant="outlined">
          <Scrollbar>
            <Table sx={{ minWidth: 930 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ width: 50 }}>
                    <input type="checkbox" />
                  </TableCell>
                  <TableCell sx={{ width: 150 }}>판매자</TableCell>
                  <TableCell sx={{ width: 200 }}>계좌 정보</TableCell>
                  <TableCell sx={{ width: 160 }}>정산 기간</TableCell>
                  <TableCell sx={{ width: 100 }}>매출액</TableCell>
                  <TableCell sx={{ width: 120 }}>수수료</TableCell>
                  <TableCell sx={{ width: 120 }}>정산 예정액</TableCell>
                  <TableCell sx={{ width: 100 }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      로딩중...
                    </TableCell>
                  </TableRow>
                ) : settlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedSettlements.includes(settlement.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSettlements([
                                ...selectedSettlements,
                                settlement.id,
                              ]);
                            } else {
                              setSelectedSettlements(
                                selectedSettlements.filter(
                                  (id) => id !== settlement.id
                                )
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {settlement.sellers?.name ||
                              settlement.sellerName ||
                              "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {settlement.sellers?.email ||
                              settlement.sellerEmail ||
                              "-"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {getBankName(settlement.sellers?.bank_type)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {settlement.sellers?.bank_account || "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            예금주: {settlement.sellers?.depositor_name || "-"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fDate(
                            settlement.SettlementPeriod?.startDate ||
                              settlement.startDate
                          )}{" "}
                          ~{" "}
                          {fDate(
                            settlement.SettlementPeriod?.endDate ||
                              settlement.endDate
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {fCurrency(
                            settlement.totalOrderAmount ||
                              settlement.salesAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fCurrency(
                            settlement.totalCommission ||
                              settlement.commissionAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "primary.main" }}
                        >
                          {fCurrency(
                            settlement.finalSettlementAmount ||
                              settlement.settlementAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(settlement.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        {/* 테이블 페이지네이션 */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
          }
        />
      </Box>
    </Card>
  );

  const renderCompletedView = () => (
    <Card>
      <Box sx={{ p: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Typography variant="h6">정산 완료 목록</Typography>
          <Button
            variant="outlined"
            color="error"
            disabled={selectedSettlements.length === 0}
            onClick={() => setCancelDialogOpen(true)}
          >
            선택 항목 취소
          </Button>
        </Stack>

        <TableContainer component={Paper} variant="outlined">
          <Scrollbar>
            <Table sx={{ minWidth: 930 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ width: 50 }}>
                    <input type="checkbox" />
                  </TableCell>
                  <TableCell sx={{ width: 140 }}>판매자</TableCell>
                  <TableCell sx={{ width: 180 }}>계좌 정보</TableCell>
                  <TableCell sx={{ width: 150 }}>정산 기간</TableCell>
                  <TableCell sx={{ width: 100 }}>매출액</TableCell>
                  <TableCell sx={{ width: 110 }}>수수료</TableCell>
                  <TableCell sx={{ width: 110 }}>정산액</TableCell>
                  <TableCell sx={{ width: 120 }}>정산일</TableCell>
                  <TableCell sx={{ width: 100 }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      로딩중...
                    </TableCell>
                  </TableRow>
                ) : settlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedSettlements.includes(settlement.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSettlements([
                                ...selectedSettlements,
                                settlement.id,
                              ]);
                            } else {
                              setSelectedSettlements(
                                selectedSettlements.filter(
                                  (id) => id !== settlement.id
                                )
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {settlement.sellers?.name ||
                              settlement.sellerName ||
                              "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {settlement.sellers?.email ||
                              settlement.sellerEmail ||
                              "-"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2">
                            {getBankName(settlement.sellers?.bank_type)}{" "}
                            {settlement.sellers?.bank_account || "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {settlement.sellers?.depositor_name || "-"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fDate(
                            settlement.SettlementPeriod?.startDate ||
                              settlement.startDate
                          )}{" "}
                          ~{" "}
                          {fDate(
                            settlement.SettlementPeriod?.endDate ||
                              settlement.endDate
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fCurrency(
                            settlement.totalOrderAmount ||
                              settlement.salesAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fCurrency(
                            settlement.totalCommission ||
                              settlement.commissionAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "success.main" }}
                        >
                          {fCurrency(
                            settlement.finalSettlementAmount ||
                              settlement.settlementAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {settlement.settledAt
                            ? fDate(settlement.settledAt)
                            : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(settlement.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        {/* 테이블 페이지네이션 */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
          }
        />
      </Box>
    </Card>
  );

  const renderCancelledView = () => (
    <Card>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          정산 취소 목록
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Scrollbar>
            <Table sx={{ minWidth: 930 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 140 }}>판매자</TableCell>
                  <TableCell sx={{ width: 180 }}>계좌 정보</TableCell>
                  <TableCell sx={{ width: 150 }}>정산 기간</TableCell>
                  <TableCell sx={{ width: 100 }}>매출액</TableCell>
                  <TableCell sx={{ width: 110 }}>수수료</TableCell>
                  <TableCell sx={{ width: 110 }}>정산액</TableCell>
                  <TableCell sx={{ width: 120 }}>취소일</TableCell>
                  <TableCell sx={{ width: 100 }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      로딩중...
                    </TableCell>
                  </TableRow>
                ) : settlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {settlement.sellers?.name ||
                              settlement.sellerName ||
                              "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {settlement.sellers?.email ||
                              settlement.sellerEmail ||
                              "-"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2">
                            {getBankName(settlement.sellers?.bank_type)}{" "}
                            {settlement.sellers?.bank_account || "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {settlement.sellers?.depositor_name || "-"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fDate(
                            settlement.SettlementPeriod?.startDate ||
                              settlement.startDate
                          )}{" "}
                          ~{" "}
                          {fDate(
                            settlement.SettlementPeriod?.endDate ||
                              settlement.endDate
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fCurrency(
                            settlement.totalOrderAmount ||
                              settlement.salesAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fCurrency(
                            settlement.totalCommission ||
                              settlement.commissionAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "error.main" }}
                        >
                          {fCurrency(
                            settlement.finalSettlementAmount ||
                              settlement.settlementAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {settlement.updatedAt
                            ? fDate(settlement.updatedAt)
                            : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(settlement.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        {/* 테이블 페이지네이션 */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
          }
        />
      </Box>
    </Card>
  );

  const renderOnHoldView = () => (
    <Card>
      <Box sx={{ p: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Typography variant="h6">정산 보류 목록</Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="error"
              disabled={selectedSettlements.length === 0}
              onClick={() => setDeleteDialogOpen(true)}
            >
              선택 항목 삭제
            </Button>
            <Button
              variant="contained"
              color="success"
              disabled={selectedSettlements.length === 0}
              onClick={() => setUnholdDialogOpen(true)}
            >
              선택 항목 보류 해제
            </Button>
          </Stack>
        </Stack>

        <TableContainer component={Paper} variant="outlined">
          <Scrollbar>
            <Table sx={{ minWidth: 930 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ width: 50 }}>
                    <input type="checkbox" />
                  </TableCell>
                  <TableCell sx={{ width: 140 }}>판매자</TableCell>
                  <TableCell sx={{ width: 180 }}>계좌 정보</TableCell>
                  <TableCell sx={{ width: 150 }}>정산 기간</TableCell>
                  <TableCell sx={{ width: 100 }}>매출액</TableCell>
                  <TableCell sx={{ width: 110 }}>수수료</TableCell>
                  <TableCell sx={{ width: 110 }}>정산액</TableCell>
                  <TableCell sx={{ width: 120 }}>보류일</TableCell>
                  <TableCell sx={{ width: 100 }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      로딩중...
                    </TableCell>
                  </TableRow>
                ) : settlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedSettlements.includes(settlement.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSettlements([
                                ...selectedSettlements,
                                settlement.id,
                              ]);
                            } else {
                              setSelectedSettlements(
                                selectedSettlements.filter(
                                  (id) => id !== settlement.id
                                )
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {settlement.sellers?.name ||
                              settlement.sellerName ||
                              "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {settlement.sellers?.email ||
                              settlement.sellerEmail ||
                              "-"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2">
                            {getBankName(settlement.sellers?.bank_type)}{" "}
                            {settlement.sellers?.bank_account || "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {settlement.sellers?.depositor_name || "-"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fDate(
                            settlement.SettlementPeriod?.startDate ||
                              settlement.startDate
                          )}{" "}
                          ~{" "}
                          {fDate(
                            settlement.SettlementPeriod?.endDate ||
                              settlement.endDate
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fCurrency(
                            settlement.totalOrderAmount ||
                              settlement.salesAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fCurrency(
                            settlement.totalCommission ||
                              settlement.commissionAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "warning.main" }}
                        >
                          {fCurrency(
                            settlement.finalSettlementAmount ||
                              settlement.settlementAmount ||
                              0
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {settlement.updatedAt
                            ? fDate(settlement.updatedAt)
                            : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(settlement.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        {/* 테이블 페이지네이션 */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
          }
        />
      </Box>
    </Card>
  );

  const renderContent = () => {
    switch (currentTab) {
      case "pending":
        return renderPendingView();
      case "processing":
        return renderProcessingView();
      case "completed":
        return renderCompletedView();
      case "cancelled":
        return renderCancelledView();
      case "on_hold":
        return renderOnHoldView();
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* 검색 필터 */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            size="small"
            placeholder="판매자명 또는 이메일 검색"
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
      </Card>

      {/* 컨텐츠 */}
      {renderContent()}

      {/* 정산 처리 다이얼로그 */}
      <Dialog
        open={processDialogOpen}
        onClose={() => setProcessDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>정산 처리</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            선택한 {selectedSettlements.length}개 항목을 정산 처리하시겠습니까?
          </Typography>
          <TextField
            label="수수료율 (%)"
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(Number(e.target.value))}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={() => handleProcessSettlement(selectedSettlements)}
          >
            정산 처리
          </Button>
        </DialogActions>
      </Dialog>

      {/* 정산 완료 다이얼로그 */}
      <Dialog
        open={completeDialogOpen}
        onClose={() => {
          setCompleteDialogOpen(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>정산 완료</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              선택한 {selectedSettlements.length}개 항목의 정산을
              완료하시겠습니까?
            </Typography>

            {settlements
              .filter((s) => selectedSettlements.includes(s.id))
              .map((settlement) => (
                <Box
                  key={settlement.id}
                  sx={{ p: 2, bgcolor: "background.neutral", borderRadius: 1 }}
                >
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2">
                        {settlement.sellers?.name || "-"}
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {fCurrency(settlement.finalSettlementAmount || 0)}
                      </Typography>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {getBankName(settlement.sellers?.bank_type)}{" "}
                      {settlement.sellers?.bank_account || "-"} (
                      {settlement.sellers?.depositor_name || "-"})
                    </Typography>
                  </Stack>
                </Box>
              ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCompleteDialogOpen(false);
            }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleCompleteSettlement(selectedSettlements)}
          >
            정산 완료
          </Button>
        </DialogActions>
      </Dialog>

      {/* 정산 보류 다이얼로그 */}
      <Dialog
        open={holdDialogOpen}
        onClose={() => {
          setHoldDialogOpen(false);
          setHoldMemo("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>정산 보류</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              선택한 {selectedSettlements.length}개 항목의 정산을
              보류하시겠습니까?
            </Typography>

            <TextField
              label="보류 사유"
              multiline
              rows={3}
              value={holdMemo}
              onChange={(e) => setHoldMemo(e.target.value)}
              placeholder="보류 사유를 입력해주세요..."
              fullWidth
            />

            {settlements
              .filter((s) => selectedSettlements.includes(s.id))
              .map((settlement) => (
                <Box
                  key={settlement.id}
                  sx={{ p: 2, bgcolor: "background.neutral", borderRadius: 1 }}
                >
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2">
                        {settlement.sellers?.name || "-"}
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        {fCurrency(settlement.finalSettlementAmount || 0)}
                      </Typography>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {getBankName(settlement.sellers?.bank_type)}{" "}
                      {settlement.sellers?.bank_account || "-"} (
                      {settlement.sellers?.depositor_name || "-"})
                    </Typography>
                  </Stack>
                </Box>
              ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setHoldDialogOpen(false);
              setHoldMemo("");
            }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => handleHoldSettlement(selectedSettlements, holdMemo)}
          >
            정산 보류
          </Button>
        </DialogActions>
      </Dialog>

      {/* 정산 보류 해제 다이얼로그 */}
      <Dialog
        open={unholdDialogOpen}
        onClose={() => {
          setUnholdDialogOpen(false);
          setUnholdMemo("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>정산 보류 해제</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              선택한 {selectedSettlements.length}개 항목의 정산 보류를
              해제하시겠습니까?
            </Typography>

            <TextField
              label="해제 사유"
              multiline
              rows={3}
              value={unholdMemo}
              onChange={(e) => setUnholdMemo(e.target.value)}
              placeholder="해제 사유를 입력해주세요..."
              fullWidth
            />

            {settlements
              .filter((s) => selectedSettlements.includes(s.id))
              .map((settlement) => (
                <Box
                  key={settlement.id}
                  sx={{ p: 2, bgcolor: "background.neutral", borderRadius: 1 }}
                >
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2">
                        {settlement.sellers?.name || "-"}
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {fCurrency(settlement.finalSettlementAmount || 0)}
                      </Typography>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {getBankName(settlement.sellers?.bank_type)}{" "}
                      {settlement.sellers?.bank_account || "-"} (
                      {settlement.sellers?.depositor_name || "-"})
                    </Typography>
                  </Stack>
                </Box>
              ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUnholdDialogOpen(false);
              setUnholdMemo("");
            }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() =>
              handleUnholdSettlement(selectedSettlements, unholdMemo)
            }
          >
            보류 해제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 정산 삭제 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>정산 삭제</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="error.main">
              선택한 {selectedSettlements.length}개 항목의 정산을
              삭제하시겠습니까?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              이 작업은 되돌릴 수 없습니다.
            </Typography>

            {settlements
              .filter((s) => selectedSettlements.includes(s.id))
              .map((settlement) => (
                <Box
                  key={settlement.id}
                  sx={{ p: 2, bgcolor: "background.neutral", borderRadius: 1 }}
                >
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2">
                        {settlement.sellers?.name || "-"}
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {fCurrency(settlement.finalSettlementAmount || 0)}
                      </Typography>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {getBankName(settlement.sellers?.bank_type)}{" "}
                      {settlement.sellers?.bank_account || "-"} (
                      {settlement.sellers?.depositor_name || "-"})
                    </Typography>
                  </Stack>
                </Box>
              ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleDeleteSettlement(selectedSettlements)}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 정산 취소 다이얼로그 */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false);
          setCancelMemo("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>정산 취소</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="error.main">
              선택한 {selectedSettlements.length}개 항목의 정산을
              취소하시겠습니까?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              취소된 정산은 "정산 취소" 탭으로 이동됩니다.
            </Typography>

            <TextField
              label="취소 사유"
              multiline
              rows={3}
              value={cancelMemo}
              onChange={(e) => setCancelMemo(e.target.value)}
              placeholder="취소 사유를 입력해주세요..."
              fullWidth
            />

            {settlements
              .filter((s) => selectedSettlements.includes(s.id))
              .map((settlement) => (
                <Box
                  key={settlement.id}
                  sx={{ p: 2, bgcolor: "background.neutral", borderRadius: 1 }}
                >
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2">
                        {settlement.sellers?.name || "-"}
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {fCurrency(settlement.finalSettlementAmount || 0)}
                      </Typography>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {getBankName(settlement.sellers?.bank_type)}{" "}
                      {settlement.sellers?.bank_account || "-"} (
                      {settlement.sellers?.depositor_name || "-"})
                    </Typography>
                  </Stack>
                </Box>
              ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCancelDialogOpen(false);
              setCancelMemo("");
            }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              handleCancelSettlement(selectedSettlements, cancelMemo)
            }
          >
            정산 취소
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
