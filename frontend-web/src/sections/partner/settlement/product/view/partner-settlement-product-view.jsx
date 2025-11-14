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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from "@mui/material";

import { Iconify } from "src/components/iconify";
import { Scrollbar } from "src/components/scrollbar";
import { fCurrency } from "src/utils/format-number";
import { fDate } from "src/utils/format-time";
import { paths } from "src/routes/paths";
import { getProductSettlements } from "src/services/partner-api";
import { getSellerSession } from "src/actions/seller";

// ----------------------------------------------------------------------

export function PartnerSettlementProductView() {
  const [productSettlements, setProductSettlements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("salesAmount");

  const fetchProductSettlements = useCallback(async () => {
    try {
      setLoading(true);

      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        setProductSettlements([]);
        setLoading(false);
        return;
      }

      const params = {
        sellerId: seller.id.toString(),
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        ...(searchQuery && { search: searchQuery }),
        ...(startDate && { startDate: startDate.toISOString().split("T")[0] }),
        ...(endDate && { endDate: endDate.toISOString().split("T")[0] }),
        ...(categoryFilter && { category: categoryFilter }),
      };

      const response = await getProductSettlements(params);
      console.log("상품별 정산 API 응답:", response);

      if (response.success) {
        const settlements = response.productSettlements || [];
        console.log("정산 데이터:", settlements);

        // 각 정산 항목의 상품 정보 확인
        settlements.forEach((settlement, index) => {
          console.log(`정산 ${index + 1}:`, {
            product: settlement.product,
            productId: settlement.product?.id,
            productName:
              settlement.product?.name || settlement.product?.displayName,
          });
        });

        setProductSettlements(settlements);
      } else {
        throw new Error(
          response.message || "상품별 정산 데이터를 불러올 수 없습니다."
        );
      }
    } catch (error) {
      console.error("상품별 정산 데이터 조회 오류:", error);
      // 오류 시 빈 배열 설정
      setProductSettlements([]);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    sortBy,
    searchQuery,
    startDate,
    endDate,
    categoryFilter,
  ]);

  useEffect(() => {
    fetchProductSettlements();
  }, [fetchProductSettlements]);

  const handleSearch = () => {
    setPage(0);
    fetchProductSettlements();
  };

  const handleReset = () => {
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setCategoryFilter("");
    setSortBy("salesAmount");
    setPage(0);
  };

  const totalSalesAmount = productSettlements.reduce(
    (sum, item) => sum + item.salesAmount,
    0
  );
  const totalCommissionAmount = productSettlements.reduce(
    (sum, item) => sum + item.commissionAmount,
    0
  );
  const totalSettlementAmount = productSettlements.reduce(
    (sum, item) => sum + item.settlementAmount,
    0
  );
  const totalOrderCount = productSettlements.reduce(
    (sum, item) => sum + item.orderCount,
    0
  );

  return (
    <Box>
      {/* 요약 정보 */}
      {/* <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">
              {fCurrency(totalSettlementAmount)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              총 정산 금액
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {fCurrency(totalSalesAmount)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              총 매출액
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {fCurrency(totalCommissionAmount)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              총 수수료
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {totalOrderCount}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              총 주문 건수
            </Typography>
          </Card>
        </Grid>
      </Grid> */}

      <Card>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            상품별 정산 내역
          </Typography>

          {/* 검색 필터 */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <TextField
              size="small"
              placeholder="상품명, SKU 검색"
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

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>카테고리</InputLabel>
              <Select
                value={categoryFilter}
                label="카테고리"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="생활용품">생활용품</MenuItem>
                <MenuItem value="전자제품">전자제품</MenuItem>
                <MenuItem value="패션">패션</MenuItem>
                <MenuItem value="뷰티">뷰티</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>정렬기준</InputLabel>
              <Select
                value={sortBy}
                label="정렬기준"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="salesAmount">매출액순</MenuItem>
                <MenuItem value="orderCount">주문건수순</MenuItem>
                <MenuItem value="settlementAmount">정산금액순</MenuItem>
                <MenuItem value="commissionAmount">수수료순</MenuItem>
              </Select>
            </FormControl>

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

          {/* 상품별 정산 테이블 */}
          <TableContainer component={Paper} variant="outlined">
            <Scrollbar>
              <Table sx={{ minWidth: 1000 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>상품정보</TableCell>
                    <TableCell>기간</TableCell>
                    <TableCell>판매실적</TableCell>
                    <TableCell>매출액</TableCell>
                    <TableCell>수수료</TableCell>
                    <TableCell>정산금액</TableCell>
                    <TableCell>반품정보</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          데이터를 불러오는 중...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : productSettlements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          상품별 정산 내역이 없습니다.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    productSettlements.map((settlement) => (
                      <TableRow key={settlement.id} hover>
                        <TableCell>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                          >
                            <Avatar
                              src={settlement.product.image}
                              variant="rounded"
                              sx={{ width: 56, height: 56 }}
                            />
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {settlement.product.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                SKU: {settlement.product.sku}
                              </Typography>
                              <br />
                              <Chip
                                label={
                                  settlement.product.category === "ELECTRONICS"
                                    ? "전자제품"
                                    : settlement.product.category === "FASHION"
                                      ? "패션"
                                      : settlement.product.category === "HOME"
                                        ? "홈/리빙"
                                        : settlement.product.category === "FOOD"
                                          ? "식품"
                                          : settlement.product.category ===
                                              "BEAUTY"
                                            ? "뷰티"
                                            : settlement.product.category ===
                                                "SPORTS"
                                              ? "스포츠"
                                              : settlement.product.category ===
                                                  "KIDS"
                                                ? "유아동"
                                                : settlement.product
                                                      .category === "BOOKS"
                                                  ? "도서"
                                                  : settlement.product
                                                        .category === "PET"
                                                    ? "반려동물"
                                                    : settlement.product
                                                          .category === "CAR"
                                                      ? "자동차"
                                                      : settlement.product
                                                            .category === "ETC"
                                                        ? "기타"
                                                        : settlement.product
                                                            .category // 기본값, 그대로
                                }
                                size="small"
                                variant="outlined"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {fDate(settlement.period.startDate)}
                          </Typography>
                          <Typography variant="body2">
                            ~ {fDate(settlement.period.endDate)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Stack>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {settlement.orderCount}건
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              판매수량: {settlement.totalQuantity}개
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              평균 주문액: {fCurrency(settlement.avgOrderValue)}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {fCurrency(settlement.salesAmount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            단가: {fCurrency(settlement.product.price)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {fCurrency(settlement.commissionAmount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({settlement.commissionRate}%)
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "primary.main" }}
                          >
                            {fCurrency(settlement.settlementAmount)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Stack>
                            <Typography variant="body2">
                              {settlement.returnCount}건
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {fCurrency(settlement.returnAmount)}
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePagination
            component="div"
            count={productSettlements.length}
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
    </Box>
  );
}
