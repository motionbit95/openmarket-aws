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
} from "@mui/material";
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { ko } from 'date-fns/locale';

import { Iconify } from "src/components/iconify";
import { Scrollbar } from "src/components/scrollbar";
import { fCurrency } from "src/utils/format-number";
import { fDateTime } from "src/utils/format-time";
import { getAllOrders } from "src/actions/order";

// ----------------------------------------------------------------------

const ORDER_STATUS_OPTIONS = {
  PENDING: { label: "주문 접수", color: "warning" },
  CONFIRMED: { label: "주문 확인", color: "info" },
  PREPARING: { label: "준비중", color: "info" },
  SHIPPED: { label: "배송중", color: "primary" },
  DELIVERED: { label: "배송완료", color: "success" },
  CANCELLED: { label: "취소", color: "error" },
  REFUNDED: { label: "환불", color: "default" },
};

export function OrdersView({ currentTab }) {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getAllOrders({
        page: page + 1,
        limit: rowsPerPage,
        status: currentTab,
        search: searchQuery,
        startDate,
        endDate,
      });

      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, [currentTab, page, rowsPerPage, searchQuery, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = () => {
    setPage(0);
    fetchOrders();
  };

  const handleReset = () => {
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setPage(0);
  };

  const getStatusChip = (status) => {
    const statusOption =
      ORDER_STATUS_OPTIONS[status] || ORDER_STATUS_OPTIONS.PENDING;
    return (
      <Chip
        size="small"
        variant="soft"
        color={statusOption.color}
        label={statusOption.label}
      />
    );
  };

  return (
    <Card>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          주문 관리
        </Typography>

        {/* 검색 필터 */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <TextField
            size="small"
            placeholder="주문번호, 고객명, 상품명 검색"
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

        {/* 주문 테이블 */}
        <TableContainer sx={{ overflow: "unset" }}>
          <Scrollbar>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>주문번호</TableCell>
                  <TableCell>주문일시</TableCell>
                  <TableCell>고객정보</TableCell>
                  <TableCell>상품정보</TableCell>
                  <TableCell>결제금액</TableCell>
                  <TableCell>결제방법</TableCell>
                  <TableCell>주문상태</TableCell>
                  <TableCell align="center">관리</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {order.orderNumber}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {fDateTime(order.createdAt)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Stack>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {order.users?.user_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.users?.email}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.5}>
                        {order.OrderItem && order.OrderItem.length > 0 ? (
                          order.OrderItem.map((item, index) => (
                            <Box key={index}>
                              <Typography variant="body2">
                                {item?.Product?.displayName || "상품명 없음"} ×{" "}
                                {item?.quantity || 0}
                              </Typography>
                              {item?.optionSnapshot &&
                                Object.keys(item.optionSnapshot).length > 0 && (
                                  <Typography
                                    variant="caption"
                                    color="primary.main"
                                  >
                                    {Object.entries(item.optionSnapshot)
                                      .map(([key, value]) => `${key}: ${value}`)
                                      .join(", ")}
                                  </Typography>
                                )}
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            상품 정보 없음
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {fCurrency(order.finalAmount)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {order.paymentMethod === "CARD"
                          ? "카드결제"
                          : order.paymentMethod}
                      </Typography>
                    </TableCell>

                    <TableCell>{getStatusChip(order.orderStatus)}</TableCell>

                    <TableCell align="center">
                      <IconButton
                        onClick={() =>
                          window.open(`/dashboard/orders/${order.id}`, "_blank")
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
          count={total}
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
  );
}
