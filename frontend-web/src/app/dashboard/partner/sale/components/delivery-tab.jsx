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
} from "@mui/material";
import { Iconify } from "src/components/iconify";
import { toast } from "src/components/snackbar";

import { getPartnerDeliveries } from "src/services/partner-api";
import { getSellerSession } from "src/actions/seller";

export default function PartnerDeliveryTab() {
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // 필터 상태
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });

  useEffect(() => {
    fetchDeliveries();
  }, [page, filters]);

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

      const response = await getPartnerDeliveries({
        sellerId: seller.id.toString(),
        page,
        limit,
        ...filters,
      });

      setDeliveries(response.deliveries || []);
      setTotalCount(response.total || 0);
    } catch (error) {
      console.error("배송 목록 로딩 오류:", error);

      // 500 에러 등 실제 서버 오류인 경우만 에러 메시지 표시
      if (error.response?.status >= 500) {
        toast.error("배송 목록을 불러오는 중 오류가 발생했습니다.");
      }

      setDeliveries([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryStatusColor = (status) => {
    const colors = {
      READY: "warning",
      SHIPPED: "primary",
      IN_TRANSIT: "info",
      DELIVERED: "success",
      FAILED: "error",
    };
    return colors[status] || "default";
  };

  const getDeliveryStatusLabel = (status) => {
    const labels = {
      READY: "배송준비",
      SHIPPED: "배송중",
      IN_TRANSIT: "운송중",
      DELIVERED: "배송완료",
      FAILED: "배송실패",
    };
    return labels[status] || status;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 검색 필터 */}
      <Card sx={{ mb: 3, border: 'none', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <CardHeader title="배송 검색" />
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="주문번호, 운송장번호"
              size="small"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
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
              <InputLabel>배송상태</InputLabel>
              <Select
                value={filters.status}
                label="배송상태"
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="READY">배송준비</MenuItem>
                <MenuItem value="SHIPPED">배송중</MenuItem>
                <MenuItem value="IN_TRANSIT">운송중</MenuItem>
                <MenuItem value="DELIVERED">배송완료</MenuItem>
                <MenuItem value="FAILED">배송실패</MenuItem>
              </Select>
            </FormControl>

            <Button variant="contained" onClick={() => fetchDeliveries()}>
              검색
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 배송 목록 */}
      <Card sx={{ border: 'none', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <CardHeader title={`배송 목록 (총 ${totalCount}건)`} />
        <CardContent>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #E0E0E0' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>주문번호</TableCell>
                  <TableCell>고객정보</TableCell>
                  <TableCell>배송정보</TableCell>
                  <TableCell>배송상태</TableCell>
                  <TableCell>배송일시</TableCell>
                  <TableCell>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        데이터를 불러오는 중...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : deliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        배송 내역이 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {delivery.orderNumber || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {delivery.customerName || '고객명 없음'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {delivery.customerPhone || '연락처 없음'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {delivery.trackingNumber || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {delivery.courier || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getDeliveryStatusLabel(delivery.status)}
                          color={getDeliveryStatusColor(delivery.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {delivery.shippedAt ? new Date(delivery.shippedAt).toLocaleDateString() : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled
                        >
                          운송장 조회
                        </Button>
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
    </Box>
  );
}