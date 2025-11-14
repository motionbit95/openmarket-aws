"use client";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import { CONFIG } from "src/global-config";
import { DashboardContent } from "src/layouts/dashboard";

import { AnalyticsNews } from "../analytics-news";
import { AnalyticsWebsiteVisits } from "../analytics-website-visits";
import { AnalyticsWidgetSummary } from "../analytics-widget-summary";
import { EcommerceYearlySales } from "../ecommerce-yearly-sales";
import { EcommerceWidgetSummary } from "../ecommerce-widget-summary";
import { useEffect, useState } from "react";
import { getLatelyInquires } from "src/actions/dashboard";
import { getUsersStats } from "src/actions/user";
import { getSellersStats } from "src/actions/seller";

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const [inquiryPosts, setInquiryPosts] = useState();
  const [userStats, setUserStats] = useState();
  const [sellerStats, setSellerStats] = useState();

  const fetchLatelyInquires = async () => {
    let _inquiryPosts = await getLatelyInquires();
    setInquiryPosts(_inquiryPosts);
  };

  useEffect(() => {
    fetchLatelyInquires();

    const fetchStats = async () => {
      let userStats = await getUsersStats();
      let sellerStats = await getSellersStats();
      setSellerStats(sellerStats);
      setUserStats(userStats);
    };

    fetchStats();
  }, []);
  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        오픈마켓 관리자 페이지입니다. 👋
      </Typography>

      <Grid container spacing={3}>
        {userStats && (
          <Grid size={{ xs: 12, md: 6 }}>
            <EcommerceWidgetSummary
              title={userStats.title}
              percent={userStats.percent}
              total={userStats.total}
              chart={{ ...userStats.chart, colors: ["#FFE7D9", "#FF4842"] }}
            />
          </Grid>
        )}

        {sellerStats && (
          <Grid size={{ xs: 12, md: 6 }}>
            <EcommerceWidgetSummary
              title={sellerStats.title}
              percent={sellerStats.percent}
              total={sellerStats.total}
              chart={sellerStats.chart}
            />
          </Grid>
        )}

        <Grid size={12}>
          <EcommerceYearlySales
            title="연간 매출"
            subheader="작년 대비 (+43%)"
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
                  name: "2022",
                  data: [
                    {
                      name: "총 수입",
                      data: [10, 41, 35, 51, 49, 62, 69, 91, 148, 35, 51, 49],
                    },
                    {
                      name: "총 지출",
                      data: [10, 34, 13, 56, 77, 88, 99, 77, 45, 13, 56, 77],
                    },
                  ],
                },
                {
                  name: "2023",
                  data: [
                    {
                      name: "총 수입",
                      data: [51, 35, 41, 10, 91, 69, 62, 148, 91, 69, 62, 49],
                    },
                    {
                      name: "총 지출",
                      data: [56, 13, 34, 10, 77, 99, 88, 45, 77, 99, 88, 77],
                    },
                  ],
                },
              ],
            }}
          />
        </Grid>

        <Grid size={12}>
          <AnalyticsNews
            title="문의 내역"
            list={inquiryPosts}
            onAnswerSubmitted={fetchLatelyInquires}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
