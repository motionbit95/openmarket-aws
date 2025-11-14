"use client";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import CardHeader from "@mui/material/CardHeader";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";

import { DashboardContent } from "src/layouts/dashboard";
import { useEffect, useState } from "react";
import adminApiService from "src/services/admin-api";
import { AnalyticsNews } from "../../analytics/analytics-news";
import { EcommerceWidgetSummary } from "../../analytics/ecommerce-widget-summary";
import { EcommerceYearlySales } from "../../analytics/ecommerce-yearly-sales";
import { Iconify } from "src/components/iconify";
import { fToNow } from "src/utils/format-time";
import { useBoolean } from "minimal-shared/hooks";
import { InquiryDetailView } from "../../inquiry/inquiry-detail-view";

// ----------------------------------------------------------------------

export default function AdminDashboardView() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const detailDialog = useBoolean();

  const fetchDashboardData = async (date = null, period = "monthly") => {
    try {
      const isInitialLoad = !dashboardData;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setChartLoading(true);
      }

      const token = localStorage.getItem("adminToken") || "dummy-token";

      console.log("Fetching dashboard data with:", { date, period });
      const data = await adminApiService.getDashboardData(token, date, period);
      console.log("Dashboard data received:", data);
      setDashboardData(data);
    } catch (error) {
      console.error("대시보드 데이터 조회 실패:", error);
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  };

  const handleDateChange = async (date, period) => {
    setCurrentDate(date);
    setCurrentPeriod(period);
    await fetchDashboardData(date, period);
  };

  const handleInquiryClick = (inquiry) => {
    // senderName과 senderEmail 속성 추가
    const formattedInquiry = {
      ...inquiry,
      senderName:
        inquiry.senderType === "seller"
          ? inquiry.senderInfo?.name
          : inquiry.senderInfo?.user_name || "",
      senderEmail: inquiry.senderInfo?.email || "",
    };
    setSelectedInquiry(formattedInquiry);
    detailDialog.onTrue();
  };

  const handleAnswerSubmitted = () => {
    detailDialog.onFalse();
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !dashboardData) {
    return (
      <DashboardContent maxWidth="xl">
        <Typography>로딩 중...</Typography>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth={false} sx={{ maxWidth: 1600, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        관리자 대시보드 👨‍💼
      </Typography>

      <Grid container spacing={3}>
        {/* stat 카드 4개 - 2x2 배치 (좌측) */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Grid container spacing={3} sx={{ height: "100%" }}>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
              <EcommerceWidgetSummary
                sx={{ height: "100%", width: "100%" }}
                title="총 사용자 수"
                total={dashboardData?.totalUsers || 0}
                percent={
                  dashboardData?.trends?.users?.length >= 2
                    ? ((dashboardData.trends.users[5] -
                        dashboardData.trends.users[4]) /
                        (dashboardData.trends.users[4] || 1)) *
                      100
                    : 0
                }
                chart={{
                  categories: ["1월", "2월", "3월", "4월", "5월", "6월"],
                  series: dashboardData?.trends?.users || [0, 0, 0, 0, 0, 0],
                  colors: ["#FFE7D9", "#FF4842"],
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
              <EcommerceWidgetSummary
                sx={{ height: "100%", width: "100%" }}
                title="총 판매자 수"
                total={dashboardData?.totalSellers || 0}
                percent={
                  dashboardData?.trends?.sellers?.length >= 2
                    ? ((dashboardData.trends.sellers[5] -
                        dashboardData.trends.sellers[4]) /
                        (dashboardData.trends.sellers[4] || 1)) *
                      100
                    : 0
                }
                chart={{
                  categories: ["1월", "2월", "3월", "4월", "5월", "6월"],
                  series: dashboardData?.trends?.sellers || [0, 0, 0, 0, 0, 0],
                  colors: ["#D0F2FF", "#0080FF"],
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
              <EcommerceWidgetSummary
                sx={{ height: "100%", width: "100%" }}
                title="총 주문 수"
                total={dashboardData?.totalOrders || 0}
                percent={
                  dashboardData?.trends?.orders?.length >= 2
                    ? ((dashboardData.trends.orders[5] -
                        dashboardData.trends.orders[4]) /
                        (dashboardData.trends.orders[4] || 1)) *
                      100
                    : 0
                }
                chart={{
                  categories: ["1월", "2월", "3월", "4월", "5월", "6월"],
                  series: dashboardData?.trends?.orders || [0, 0, 0, 0, 0, 0],
                  colors: ["#FFF7CD", "#FFD700"],
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
              <EcommerceWidgetSummary
                sx={{ height: "100%", width: "100%" }}
                title="총 매출"
                total={dashboardData?.totalSales || 0}
                percent={
                  dashboardData?.trends?.revenue?.length >= 2
                    ? ((dashboardData.trends.revenue[5] -
                        dashboardData.trends.revenue[4]) /
                        (dashboardData.trends.revenue[4] || 1)) *
                      100
                    : 0
                }
                chart={{
                  categories: ["1월", "2월", "3월", "4월", "5월", "6월"],
                  series: dashboardData?.trends?.revenue || [0, 0, 0, 0, 0, 0],
                  colors: ["#D4F4DD", "#00AB55"],
                }}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* 최근 문의 내역 - 우측 */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  최근 문의 내역
                  <Tooltip
                    title={
                      <Box sx={{ p: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          답변 현황
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block" }}>
                          • 답변 대기:{" "}
                          {(() => {
                            const pending =
                              dashboardData?.recentInquiries?.filter(
                                (item) => !item.answer || item.answer === ""
                              ).length || 0;
                            return pending;
                          })()}
                          건
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ color: "text.secondary", ml: 0.5 }}
                          >
                            (답변이 없는 문의)
                          </Typography>
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block" }}>
                          • 답변 지연:{" "}
                          {(() => {
                            const delayed =
                              dashboardData?.recentInquiries?.filter((item) => {
                                if (item.answer) return false;
                                const createdDate = new Date(item.createdAt);
                                const now = new Date();
                                const hoursDiff =
                                  (now - createdDate) / (1000 * 60 * 60);
                                return hoursDiff >= 24;
                              }).length || 0;
                            return delayed;
                          })()}
                          건
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ color: "text.secondary", ml: 0.5 }}
                          >
                            (24시간 이상 미답변)
                          </Typography>
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement="top"
                  >
                    <IconButton size="small" sx={{ ml: -0.5 }}>
                      <Iconify icon="eva:info-outline" width={20} />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              sx={{ mb: 1 }}
              action={
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => {
                    // inquiry 리스트 페이지로 이동
                    window.location.href = "/dashboard/partner/inquiry/center";
                  }}
                  endIcon={
                    <Iconify
                      icon="eva:arrow-ios-forward-fill"
                      width={18}
                      sx={{ ml: -0.5 }}
                    />
                  }
                >
                  전체보기
                </Button>
              }
            />

            <Box sx={{ overflow: "auto" }}>
              {(dashboardData?.recentInquiries || [])
                .slice(0, 4)
                .map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      py: 2,
                      px: 3,
                      gap: 2,
                      display: "flex",
                      alignItems: "center",
                      borderBottom: "dashed 1px",
                      borderColor: "divider",
                    }}
                  >
                    <ListItemText
                      primary={
                        <Link
                          color="inherit"
                          component="button"
                          underline="hover"
                          sx={{ cursor: "pointer" }}
                          onClick={() => handleInquiryClick(item)}
                        >
                          {item.senderType === "seller"
                            ? item.senderInfo?.name
                            : item.senderInfo?.user_name}
                          {" / "}
                          {item.title}
                        </Link>
                      }
                      secondary={
                        item.content
                          ? item.content
                              .replace(/<[^>]+>/g, "")
                              .replace(/\r?\n|\r/g, " ")
                              .trim()
                          : ""
                      }
                      slotProps={{
                        primary: {
                          noWrap: true,
                          sx: {
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        },
                        secondary: {
                          noWrap: true,
                          sx: {
                            mt: 0.5,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        },
                      }}
                    />
                    <Box
                      sx={{
                        flexShrink: 0,
                        typography: "caption",
                        color: "text.disabled",
                      }}
                    >
                      {(() => {
                        const createdDate = new Date(item.createdAt);
                        const now = new Date();
                        const hoursDiff = Math.floor(
                          (now - createdDate) / (1000 * 60 * 60)
                        );
                        return `${hoursDiff}시간 전`;
                      })()}
                    </Box>
                  </Box>
                ))}
            </Box>

            <Box
              sx={{
                p: 2,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "text.disabled",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Iconify icon="eva:info-outline" width={16} />
                고객 문의는 최대 1 영업일 이내에 모두 답변 부탁드립니다.
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* 문의 답변 Dialog */}
        {selectedInquiry && (
          <Dialog
            open={detailDialog.value}
            onClose={detailDialog.onFalse}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>문의 답변</DialogTitle>
            <DialogContent dividers>
              <Box sx={{ width: "100%", p: 1 }}>
                <InquiryDetailView
                  currentInquiry={selectedInquiry}
                  onClose={detailDialog.onFalse}
                  onAnswerSubmitted={handleAnswerSubmitted}
                />
              </Box>
            </DialogContent>
          </Dialog>
        )}

        {/* 네 번째 행: 연간 매출 */}
        <Grid size={12}>
          <EcommerceYearlySales
            key={JSON.stringify({
              weekly: dashboardData?.weeklyRevenue,
              daily: dashboardData?.dailyRevenue,
            })}
            title={
              currentPeriod === "monthly"
                ? "연간 매출"
                : currentPeriod === "weekly"
                  ? "주간 매출"
                  : "일일 매출"
            }
            subheader={
              currentPeriod === "monthly"
                ? "월별 매출 및 주문 추이 (매출 단위: 백만원)"
                : currentPeriod === "weekly"
                  ? "주별 매출 및 주문 추이 (매출 단위: 만원)"
                  : "시간별 매출 및 주문 추이 (매출 단위: 만원)"
            }
            loading={chartLoading}
            initialPeriod={currentPeriod}
            initialDate={currentDate}
            chart={{
              categories: [
                "1월",
                "2월",
                "3월",
                "4월",
                "5월",
                "6월",
                "7월",
                "8월",
                "9월",
                "10월",
                "11월",
                "12월",
              ],
              series: [
                {
                  name: `${dashboardData?.yearlyRevenue?.currentYear || new Date().getFullYear()}`,
                  data: [
                    {
                      name: "매출",
                      data: dashboardData?.yearlyRevenue?.thisYearData?.map(
                        (item) => Math.round((item.revenue || 0) / 1000000)
                      ) || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    },
                    {
                      name: "주문 수",
                      data: dashboardData?.yearlyRevenue?.thisYearData?.map(
                        (item) => item.orders || 0
                      ) || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    },
                  ],
                },
                {
                  name: `${dashboardData?.yearlyRevenue?.lastYear || new Date().getFullYear() - 1}`,
                  data: [
                    {
                      name: "매출",
                      data: dashboardData?.yearlyRevenue?.lastYearData?.map(
                        (item) => Math.round((item.revenue || 0) / 1000000)
                      ) || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    },
                    {
                      name: "주문 수",
                      data: dashboardData?.yearlyRevenue?.lastYearData?.map(
                        (item) => item.orders || 0
                      ) || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    },
                  ],
                },
              ],
            }}
            periodData={{
              weeklyRevenue: dashboardData?.weeklyRevenue || [],
              dailyRevenue: dashboardData?.dailyRevenue || [],
            }}
            onDateChange={handleDateChange}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
