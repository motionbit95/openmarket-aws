'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  Grid,
  Stack,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';
import { getSalesData } from 'src/actions/sales';

// ----------------------------------------------------------------------

export function SalesView({ currentTab }) {
  const [salesData, setSalesData] = useState({
    overview: {
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      commissionAmount: 0,
    },
    list: [],
  });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1))); // 이번 달 1일
  const [endDate, setEndDate] = useState(new Date());

  const fetchSalesData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSalesData({
        type: currentTab,
        startDate,
        endDate,
      });

      setSalesData(data);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      setSalesData({
        overview: {
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          commissionAmount: 0,
        },
        list: [],
      });
    } finally {
      setLoading(false);
    }
  }, [currentTab, startDate, endDate]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const renderOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h4" color="primary">
              {fCurrency(salesData.overview.totalSales)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              총 매출액
            </Typography>
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h4" color="info.main">
              {salesData.overview.totalOrders.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              총 주문 건수
            </Typography>
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h4" color="success.main">
              {fCurrency(salesData.overview.averageOrderValue)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              평균 주문 금액
            </Typography>
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h4" color="warning.main">
              {fCurrency(salesData.overview.commissionAmount)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              수수료 총액
            </Typography>
          </Stack>
        </Card>
      </Grid>

      {/* 매출 차트 영역 */}
      <Grid item xs={12}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            매출 추이
          </Typography>
          {loading ? (
            <Box
              sx={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[salesData.overview]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => fCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                  }}
                />
                <Legend />
                <Bar dataKey="totalSales" fill="#8884d8" name="총 매출" />
                <Bar dataKey="commissionAmount" fill="#82ca9d" name="수수료" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </Grid>
    </Grid>
  );

  const renderSalesTable = () => {
    // 차트 데이터 준비
    const prepareChartData = () => {
      if (currentTab === 'daily' || currentTab === 'monthly') {
        return salesData.list.map((item) => ({
          name: currentTab === 'daily' ? fDate(item.date) : item.month,
          매출액: item.salesAmount,
          수수료: item.commissionAmount,
          정산액: item.settlementAmount,
        }));
      }
      if (currentTab === 'products') {
        return salesData.list.slice(0, 10).map((item) => ({
          name: item.productName.substring(0, 15) + '...',
          매출액: item.salesAmount,
          수수료: item.commissionAmount,
        }));
      }
      if (currentTab === 'partners') {
        return salesData.list.map((item) => ({
          name: item.partnerName,
          매출액: item.salesAmount,
          수수료: item.commissionAmount,
        }));
      }
      return [];
    };

    const getTableHeaders = () => {
      switch (currentTab) {
        case 'daily':
          return ['날짜', '매출액', '주문 건수', '수수료', '정산 예정액'];
        case 'monthly':
          return ['월', '매출액', '주문 건수', '수수료', '정산 예정액'];
        case 'products':
          return ['상품명', '판매량', '매출액', '수수료율', '수수료액'];
        case 'partners':
          return ['판매자', '상품 수', '매출액', '수수료율', '정산 예정액'];
        default:
          return [];
      }
    };

    const renderTableRow = (item, index) => {
      switch (currentTab) {
        case 'daily':
        case 'monthly':
          return (
            <TableRow key={index}>
              <TableCell>
                {currentTab === 'daily' ? fDate(item.date) : item.month}
              </TableCell>
              <TableCell>{fCurrency(item.salesAmount)}</TableCell>
              <TableCell>{item.orderCount}</TableCell>
              <TableCell>{fCurrency(item.commissionAmount)}</TableCell>
              <TableCell>{fCurrency(item.settlementAmount)}</TableCell>
            </TableRow>
          );
        case 'products':
          return (
            <TableRow key={index}>
              <TableCell>
                <Stack>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.productName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.partnerName}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{fCurrency(item.salesAmount)}</TableCell>
              <TableCell>{item.commissionRate}%</TableCell>
              <TableCell>{fCurrency(item.commissionAmount)}</TableCell>
            </TableRow>
          );
        case 'partners':
          return (
            <TableRow key={index}>
              <TableCell>
                <Stack>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.partnerName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.partnerEmail}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>{item.productCount}</TableCell>
              <TableCell>{fCurrency(item.salesAmount)}</TableCell>
              <TableCell>{item.commissionRate}%</TableCell>
              <TableCell>{fCurrency(item.settlementAmount)}</TableCell>
            </TableRow>
          );
        default:
          return null;
      }
    };

    const chartData = prepareChartData();

    return (
      <Box>
        {/* 요약 카드 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 3 }}>
              <Stack spacing={1}>
                <Typography variant="h4" color="primary">
                  {fCurrency(salesData.overview.totalSales)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  총 매출액
                </Typography>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ p: 3 }}>
              <Stack spacing={1}>
                <Typography variant="h4" color="info.main">
                  {salesData.overview.totalOrders.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  총 주문 건수
                </Typography>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ p: 3 }}>
              <Stack spacing={1}>
                <Typography variant="h4" color="success.main">
                  {fCurrency(salesData.overview.averageOrderValue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  평균 주문 금액
                </Typography>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ p: 3 }}>
              <Stack spacing={1}>
                <Typography variant="h4" color="warning.main">
                  {fCurrency(salesData.overview.commissionAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  수수료 총액
                </Typography>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* 차트 */}
        {chartData.length > 0 && (
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              매출 추이
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              {currentTab === 'daily' || currentTab === 'monthly' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => fCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="매출액" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="수수료" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="정산액" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => fCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="매출액" fill="#8884d8" />
                  <Bar dataKey="수수료" fill="#82ca9d" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Card>
        )}

        {/* 테이블 */}
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {currentTab === 'daily' && '일별 매출 현황'}
              {currentTab === 'monthly' && '월별 매출 현황'}
              {currentTab === 'products' && '상품별 매출 현황'}
              {currentTab === 'partners' && '판매자별 매출 현황'}
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : salesData.list.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  py: 5,
                }}
              >
                <Typography color="text.secondary">데이터가 없습니다.</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Scrollbar>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        {getTableHeaders().map((header) => (
                          <TableCell key={header}>{header}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesData.list.map(renderTableRow)}
                    </TableBody>
                  </Table>
                </Scrollbar>
              </TableContainer>
            )}
          </Box>
        </Card>
      </Box>
    );
  };

  return (
    <Box>
      {/* 날짜 필터 */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            매출 관리
          </Typography>

          <TextField
            type="date"
            label="시작일"
            value={startDate ? startDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            label="종료일"
            value={endDate ? endDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <Button variant="contained" onClick={fetchSalesData}>
            조회
          </Button>

          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:download-fill" />}
            onClick={() => {
              // Excel 다운로드 기능 구현
              console.log('Excel download');
            }}
          >
            Excel 다운로드
          </Button>
        </Stack>
      </Card>

      {/* 컨텐츠 렌더링 */}
      {currentTab === 'overview' ? renderOverview() : renderSalesTable()}
    </Box>
  );
}