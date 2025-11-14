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

import { getPartnerCancellations } from "src/services/partner-api";
import { getSellerSession } from "src/actions/seller";

export default function PartnerCancelTab() {
  const [loading, setLoading] = useState(true);
  const [cancellations, setCancellations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // 필터 상태
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });

  useEffect(() => {
    fetchCancellations();
  }, [page, filters]);

  const fetchCancellations = async () => {
    try {
      setLoading(true);

      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        setCancellations([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const response = await getPartnerCancellations({
        sellerId: seller.id.toString(),
        page,
        limit,
        ...filters,
      });

      setCancellations(response.cancellations || []);
      setTotalCount(response.total || 0);
    } catch (error) {
      console.error("취소 목록 로딩 오류:", error);

      // 500 에러 등 실제 서버 오류인 경우만 에러 메시지 표시
      if (error.response?.status >= 500) {
        toast.error("취소 목록을 불러오는 중 오류가 발생했습니다.");
      }

      setCancellations([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getCancelStatusColor = (status) => {
    const colors = {
      REQUESTED: "warning",
      APPROVED: "info",
      PROCESSING: "info",
      COMPLETED: "success",
      REJECTED: "error",
    };
    return colors[status] || "default";
  };

  const getCancelStatusLabel = (status) => {
    const labels = {
      REQUESTED: "취소요청",
      APPROVED: "취소승인",
      PROCESSING: "처리중",
      COMPLETED: "취소완료",
      REJECTED: "취소거부",
    };
    return labels[status] || status;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 검색 필터 */}
      <Card sx={{ mb: 3, border: 'none', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <CardHeader title="취소 검색" />
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="주문번호, 고객명"
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
              <InputLabel>취소상태</InputLabel>
              <Select
                value={filters.status}
                label="취소상태"
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="REQUESTED">취소요청</MenuItem>
                <MenuItem value="APPROVED">취소승인</MenuItem>
                <MenuItem value="PROCESSING">처리중</MenuItem>
                <MenuItem value="COMPLETED">취소완료</MenuItem>
                <MenuItem value="REJECTED">취소거부</MenuItem>
              </Select>
            </FormControl>

            <Button variant="contained" onClick={() => fetchCancellations()}>
              검색
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 취소 목록 */}
      <Card sx={{ border: 'none', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <CardHeader title={`취소 목록 (총 ${totalCount}건)`} />
        <CardContent>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #E0E0E0' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>주문번호</TableCell>
                  <TableCell>고객정보</TableCell>
                  <TableCell>취소사유</TableCell>
                  <TableCell>취소금액</TableCell>
                  <TableCell>취소상태</TableCell>
                  <TableCell>요청일시</TableCell>
                  <TableCell>관리</TableCell>
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
                ) : cancellations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        취소 내역이 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  cancellations.map((cancellation) => (
                    <TableRow key={cancellation.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {cancellation.orderNumber || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {cancellation.customerName || '고객명 없음'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cancellation.customerEmail || '이메일 없음'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {cancellation.reason || '사유 없음'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {cancellation.amount ? `${cancellation.amount.toLocaleString()}원` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getCancelStatusLabel(cancellation.status)}
                          color={getCancelStatusColor(cancellation.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {cancellation.requestedAt ? new Date(cancellation.requestedAt).toLocaleDateString() : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {cancellation.status === 'REQUESTED' && (
                          <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              disabled
                            >
                              승인
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              disabled
                            >
                              거부
                            </Button>
                          </Box>
                        )}
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