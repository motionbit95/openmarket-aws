"use client";

import { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
  Typography,
  Button,
  Chip,
  Checkbox,
} from "@mui/material";
import { Iconify } from "src/components/iconify";

// 테이블 툴바 컴포넌트
const OrderTableToolbar = memo(({ numSelected, onBulkStatusChange }) => {
  if (numSelected === 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.5,
        bgcolor: "primary.50",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: "primary.main",
        }}
      >
        {numSelected}개 주문 선택됨
      </Typography>
      <Button
        size="small"
        variant="contained"
        onClick={onBulkStatusChange}
        sx={{
          minWidth: 120,
          height: 32,
          fontSize: "0.875rem",
          fontWeight: 600,
        }}
      >
        상태 변경하기
      </Button>
    </Box>
  );
});

OrderTableToolbar.displayName = "OrderTableToolbar";

// 메모이제이션된 테이블 컴포넌트
const OrderTable = memo(
  ({
    orders,
    loading,
    getStatusColor,
    getStatusLabel,
    getStatusIcon,
    handleOrderDetail,
    formatCurrency,
    selectedOrders = [],
    handleSelectOrder,
    handleSelectAll,
    selectAll = false,
    // 페이지네이션 관련 props
    page = 0,
    rowsPerPage = 10,
    totalCount = 0,
    onPageChange,
    onRowsPerPageChange,
    // 벌크 액션 관련 props
    onBulkStatusChange,
  }) => {
    return (
      <Paper sx={{ width: "100%", mb: 2 }}>
        {/* 테이블 툴바 */}
        <OrderTableToolbar
          numSelected={selectedOrders.length}
          onBulkStatusChange={onBulkStatusChange}
        />

        {/* 테이블 컨테이너 */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectAll}
                    indeterminate={
                      selectedOrders.length > 0 &&
                      selectedOrders.length < orders.length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>주문번호</TableCell>
                <TableCell>고객 정보</TableCell>
                <TableCell>상품 정보</TableCell>
                <TableCell>주문 금액</TableCell>
                <TableCell>주문 상태</TableCell>
                <TableCell>주문일</TableCell>
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
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      주문 내역이 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.customer?.name || "고객명 없음"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.customer?.email || "이메일 없음"}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {order.customer?.phone || "연락처 없음"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {order.items &&
                      Array.isArray(order.items) &&
                      order.items.length > 0 ? (
                        order.items.map((item, index) => (
                          <Box key={index}>
                            <Typography variant="body2">
                              {item?.product?.name || "상품명 없음"} ×{" "}
                              {item?.quantity || 0}
                            </Typography>
                            {item?.options && (
                              <Typography
                                variant="caption"
                                color="primary.main"
                              >
                                {Object.entries(item.options)
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
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(order.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {new Date(order.createdAt).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(order.createdAt).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          })}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOrderDetail(order.id)}
                      >
                        확인
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 테이블 페이지네이션 */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
          }
        />
      </Paper>
    );
  }
);

OrderTable.displayName = "OrderTable";

export default OrderTable;
