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

import { getPartnerReturns } from "src/services/partner-api";
import { getSellerSession } from "src/actions/seller";

export default function PartnerReturnTab() {
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // 필터 상태
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });

  useEffect(() => {
    fetchReturns();
  }, [page, filters]);

  const fetchReturns = async () => {
    try {
      setLoading(true);

      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        setReturns([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const response = await getPartnerReturns({
        sellerId: seller.id.toString(),
        page,
        limit,
        ...filters,
      });

      setReturns(response.returns || []);
      setTotalCount(response.total || 0);
    } catch (error) {
      console.error("반품 목록 로딩 오류:", error);

      // 500 에러 등 실제 서버 오류인 경우만 에러 메시지 표시
      if (error.response?.status >= 500) {
        toast.error("반품 목록을 불러오는 중 오류가 발생했습니다.");
      }

      setReturns([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getReturnStatusColor = (status) => {
    const colors = {
      REQUESTED: "warning",
      APPROVED: "info",
      PICKUP_SCHEDULED: "info",
      PICKED_UP: "primary",
      INSPECTING: "primary",
      COMPLETED: "success",
      REJECTED: "error",
    };
    return colors[status] || "default";
  };

  const getReturnStatusLabel = (status) => {
    const labels = {
      REQUESTED: "반품요청",
      APPROVED: "반품승인",
      PICKUP_SCHEDULED: "수거예정",
      PICKED_UP: "수거완료",
      INSPECTING: "검수중",
      COMPLETED: "반품완료",
      REJECTED: "반품거부",
    };
    return labels[status] || status;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 검색 필터 */}
      <Card sx={{ mb: 3, border: 'none', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <CardHeader title="반품 검색" />
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="주문번호, 반품번호"
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
              <InputLabel>반품상태</InputLabel>
              <Select
                value={filters.status}
                label="반품상태"
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="REQUESTED">반품요청</MenuItem>
                <MenuItem value="APPROVED">반품승인</MenuItem>
                <MenuItem value="PICKUP_SCHEDULED">수거예정</MenuItem>
                <MenuItem value="PICKED_UP">수거완료</MenuItem>
                <MenuItem value="INSPECTING">검수중</MenuItem>
                <MenuItem value="COMPLETED">반품완료</MenuItem>
                <MenuItem value="REJECTED">반품거부</MenuItem>
              </Select>
            </FormControl>

            <Button variant="contained" onClick={() => fetchReturns()}>
              검색
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 반품 목록 */}
      <Card sx={{ border: 'none', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <CardHeader title={`반품 목록 (총 ${totalCount}건)`} />
        <CardContent>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #E0E0E0' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>반품번호</TableCell>
                  <TableCell>주문번호</TableCell>
                  <TableCell>고객정보</TableCell>
                  <TableCell>반품사유</TableCell>
                  <TableCell>반품금액</TableCell>
                  <TableCell>반품상태</TableCell>
                  <TableCell>요청일시</TableCell>
                  <TableCell>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        데이터를 불러오는 중...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : returns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        반품 내역이 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  returns.map((returnItem) => (
                    <TableRow key={returnItem.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {returnItem.returnNumber || `R-${returnItem.id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {returnItem.orderNumber || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {returnItem.customerName || '고객명 없음'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {returnItem.customerEmail || '이메일 없음'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {returnItem.reason || '사유 없음'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {returnItem.amount ? `${returnItem.amount.toLocaleString()}원` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getReturnStatusLabel(returnItem.status)}
                          color={getReturnStatusColor(returnItem.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {returnItem.requestedAt ? new Date(returnItem.requestedAt).toLocaleDateString() : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {returnItem.status === 'REQUESTED' && (
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
                        {returnItem.status === 'APPROVED' && (
                          <Button
                            size="small"
                            variant="outlined"
                            disabled
                          >
                            수거일정
                          </Button>
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