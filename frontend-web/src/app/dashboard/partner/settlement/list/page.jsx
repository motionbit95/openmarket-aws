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
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Iconify } from "src/components/iconify";
import { toast } from "src/components/snackbar";

import { CONFIG } from "src/global-config";
import {
  getPartnerSettlements,
  getSettlementDetail,
} from "src/services/partner-api";
import { getSellerSession } from "src/actions/seller";

export default function PartnerSettlementListPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState([]);
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

  // 정산 상세 다이얼로그
  const [settlementDetailDialog, setSettlementDetailDialog] = useState({
    open: false,
    settlement: null,
  });

  useEffect(() => {
    fetchSettlements();
  }, [page, filters]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);

      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        setSettlements([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      // API 호출
      const response = await getPartnerSettlements({
        sellerId: seller.id.toString(),
        page,
        limit,
        ...filters,
      });

      if (response.success) {
        setSettlements(response.settlements || []);
        setTotalCount(response.total || 0);
      } else {
        // API 응답은 있지만 success가 false인 경우 (데이터 없음 등)
        setSettlements([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("정산 목록 로딩 오류:", error);

      // 500 에러 등 실제 서버 오류인 경우만 에러 메시지 표시
      if (error.response?.status >= 500) {
        toast.error("정산 목록을 불러오는 중 오류가 발생했습니다.");
      }

      // 오류 시 기본값 설정
      setSettlements([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "warning",
      CALCULATING: "info",
      COMPLETED: "success",
      CANCELLED: "error",
      ON_HOLD: "default",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: "정산대기",
      CALCULATING: "정산계산중",
      COMPLETED: "정산완료",
      CANCELLED: "정산취소",
      ON_HOLD: "정산보류",
    };
    return labels[status] || status;
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
    });
  };

  const handleSettlementDetail = async (settlement) => {
    try {
      // 정산 상세 정보 조회
      const response = await getSettlementDetail(settlement.id);

      if (response.success) {
        setSettlementDetailDialog({
          open: true,
          settlement: response.settlement || settlement,
        });
      } else {
        throw new Error(
          response.message || "정산 상세 정보를 불러올 수 없습니다."
        );
      }
    } catch (error) {
      console.error("정산 상세 정보 조회 오류:", error);
      toast.error(
        error.message || "정산 상세 정보를 불러오는 중 오류가 발생했습니다."
      );

      // 오류 시 기본 정보로 표시
      setSettlementDetailDialog({
        open: true,
        settlement,
      });
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
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
        정산 내역
      </Typography>

      {/* 통계 카드 */}
      {/* <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {settlements.filter((s) => s.status === "PENDING").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                정산 대기
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {settlements.filter((s) => s.status === "CALCULATING").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                정산 계산중
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {settlements.filter((s) => s.status === "COMPLETED").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                정산 완료
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {formatCurrency(
                  settlements.reduce((sum, s) => sum + s.settlementAmount, 0)
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                총 정산 금액
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}

      {/* 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>정산 상태</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                label="정산 상태"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="PENDING">정산대기</MenuItem>
                <MenuItem value="CALCULATING">정산계산중</MenuItem>
                <MenuItem value="COMPLETED">정산완료</MenuItem>
                <MenuItem value="CANCELLED">정산취소</MenuItem>
                <MenuItem value="ON_HOLD">정산보류</MenuItem>
              </Select>
            </FormControl>

            <TextField
              placeholder="정산번호 검색"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              type="date"
              label="시작일"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              type="date"
              label="종료일"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

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

      {/* 정산 목록 */}
      <Card>
        <CardHeader title={`정산 목록 (총 ${totalCount}건)`} />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>정산번호</TableCell>
                  <TableCell>정산기간</TableCell>
                  <TableCell>매출금액</TableCell>
                  <TableCell>수수료</TableCell>
                  <TableCell>정산금액</TableCell>
                  <TableCell>주문건수</TableCell>
                  <TableCell>정산상태</TableCell>
                  <TableCell>처리일시</TableCell>
                  <TableCell>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {settlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {settlement.settlementNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(settlement.period.startDate)} ~{" "}
                        {formatDate(settlement.period.endDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {formatCurrency(settlement.salesAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatCurrency(settlement.commissionAmount)} (
                        {settlement.commissionRate}%)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" color="primary">
                        {formatCurrency(settlement.settlementAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {settlement.orderCount}건
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(settlement.status)}
                        color={getStatusColor(settlement.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {settlement.processedAt
                          ? formatDate(settlement.processedAt)
                          : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleSettlementDetail(settlement)}
                      >
                        상세보기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalCount > 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={Math.ceil(totalCount / limit)}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 정산 상세 다이얼로그 */}
      <Dialog
        open={settlementDetailDialog.open}
        onClose={() =>
          setSettlementDetailDialog({ open: false, settlement: null })
        }
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>정산 상세 정보</DialogTitle>
        <DialogContent>
          {settlementDetailDialog.settlement && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}
            >
              {/* 기본 정보 섹션 */}
              <Card variant="outlined">
                <CardHeader
                  title="기본 정보"
                  sx={{ pb: 1 }}
                  titleTypographyProps={{ variant: "h6", fontSize: "1.1rem" }}
                />
                <CardContent sx={{ pt: 1 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          정산번호
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {settlementDetailDialog.settlement.settlementNumber}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          정산기간
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatDate(
                            settlementDetailDialog.settlement.period?.startDate
                          )}{" "}
                          ~{" "}
                          {formatDate(
                            settlementDetailDialog.settlement.period?.endDate
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          주문건수
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {settlementDetailDialog.settlement.orderCount}건
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          정산상태
                        </Typography>
                        <Box>
                          <Chip
                            label={getStatusLabel(
                              settlementDetailDialog.settlement.status
                            )}
                            color={getStatusColor(
                              settlementDetailDialog.settlement.status
                            )}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* 금액 정보 섹션 */}
              <Card variant="outlined">
                <CardHeader
                  title="금액 정보"
                  sx={{ pb: 1 }}
                  titleTypographyProps={{ variant: "h6", fontSize: "1.1rem" }}
                />
                <CardContent sx={{ pt: 1 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          매출금액
                        </Typography>
                        <Typography
                          variant="h6"
                          color="info.main"
                          sx={{ fontWeight: 600 }}
                        >
                          {formatCurrency(
                            settlementDetailDialog.settlement.salesAmount
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          수수료 (
                          {settlementDetailDialog.settlement.commissionRate}%)
                        </Typography>
                        <Typography
                          variant="h6"
                          color="warning.main"
                          sx={{ fontWeight: 600 }}
                        >
                          -
                          {formatCurrency(
                            settlementDetailDialog.settlement.commissionAmount
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          p: 2,
                          bgcolor: "primary.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "primary.200",
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          최종 정산금액
                        </Typography>
                        <Typography
                          variant="h5"
                          color="primary.main"
                          sx={{ fontWeight: 700 }}
                        >
                          {formatCurrency(
                            settlementDetailDialog.settlement.settlementAmount
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* 입금 계좌 정보 섹션 */}
              <Card variant="outlined">
                <CardHeader
                  title="입금 계좌 정보"
                  sx={{ pb: 1 }}
                  titleTypographyProps={{ variant: "h6", fontSize: "1.1rem" }}
                />
                <CardContent sx={{ pt: 1 }}>
                  {settlementDetailDialog.settlement.bankAccount ? (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, minWidth: 60 }}
                        >
                          은행명:
                        </Typography>
                        <Typography variant="body2">
                          {settlementDetailDialog.settlement.bankAccount.bank}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, minWidth: 60 }}
                        >
                          계좌번호:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace", fontSize: "0.95rem" }}
                        >
                          {
                            settlementDetailDialog.settlement.bankAccount
                              .accountNumber
                          }
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, minWidth: 60 }}
                        >
                          예금주:
                        </Typography>
                        <Typography variant="body2">
                          {settlementDetailDialog.settlement.bankAccount.holder}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        p: 3,
                        textAlign: "center",
                        bgcolor: "grey.50",
                        borderRadius: 1,
                        border: "1px dashed",
                        borderColor: "grey.300",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        입금 계좌 정보가 등록되지 않았습니다.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* 주문 목록 섹션 */}
              {settlementDetailDialog.settlement.orders &&
                settlementDetailDialog.settlement.orders.length > 0 && (
                  <Card variant="outlined">
                    <CardHeader
                      title={`주문 목록 (${settlementDetailDialog.settlement.orders.length}건)`}
                      sx={{ pb: 1 }}
                      titleTypographyProps={{
                        variant: "h6",
                        fontSize: "1.1rem",
                      }}
                    />
                    <CardContent sx={{ pt: 1 }}>
                      <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>
                                주문번호
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                고객명
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                상품명
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                주문금액
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                수수료
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                정산금액
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                주문일
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {settlementDetailDialog.settlement.orders.map(
                              (order) => (
                                <TableRow key={order.id} hover>
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 500 }}
                                    >
                                      {order.orderNumber}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {order.customerName}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {order.productName}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      color="info.main"
                                      sx={{ fontWeight: 500 }}
                                    >
                                      {formatCurrency(order.orderAmount)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      color="warning.main"
                                    >
                                      -{formatCurrency(order.commissionAmount)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      color="primary.main"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {formatCurrency(order.settlementAmount)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {formatDate(order.orderDate)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </Box>

                      {/* 주문 목록 요약 */}
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          총 {settlementDetailDialog.settlement.orders.length}
                          건의 주문
                        </Typography>
                        <Box sx={{ display: "flex", gap: 3 }}>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              총 주문금액
                            </Typography>
                            <Typography
                              variant="body2"
                              color="info.main"
                              sx={{ fontWeight: 600 }}
                            >
                              {formatCurrency(
                                settlementDetailDialog.settlement.orders.reduce(
                                  (sum, order) => sum + order.orderAmount,
                                  0
                                )
                              )}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              총 수수료
                            </Typography>
                            <Typography
                              variant="body2"
                              color="warning.main"
                              sx={{ fontWeight: 600 }}
                            >
                              -
                              {formatCurrency(
                                settlementDetailDialog.settlement.orders.reduce(
                                  (sum, order) => sum + order.commissionAmount,
                                  0
                                )
                              )}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              총 정산금액
                            </Typography>
                            <Typography
                              variant="body2"
                              color="primary.main"
                              sx={{ fontWeight: 700 }}
                            >
                              {formatCurrency(
                                settlementDetailDialog.settlement.orders.reduce(
                                  (sum, order) => sum + order.settlementAmount,
                                  0
                                )
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                )}

              {/* 처리 정보 섹션 */}
              {settlementDetailDialog.settlement.processedAt && (
                <Card variant="outlined">
                  <CardHeader
                    title="처리 정보"
                    sx={{ pb: 1 }}
                    titleTypographyProps={{ variant: "h6", fontSize: "1.1rem" }}
                  />
                  <CardContent sx={{ pt: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        처리일시
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(
                          settlementDetailDialog.settlement.processedAt
                        )}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setSettlementDetailDialog({ open: false, settlement: null })
            }
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
