"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, Divider } from "@mui/material";
import {
  Grid,
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Iconify } from "src/components/iconify";
import { toast } from "src/components/snackbar";

import { CONFIG } from "src/global-config";
import {
  getPartnerDashboardStats,
  getRecentOrders,
  getSettlementSummary,
  getPartnerOrders,
} from "src/services/partner-api";
import { getNoticesByType, getNoticeById } from "src/actions/notices";
import { getBanners } from "src/actions/banner";
import { getInquiriesBySeller } from "src/actions/inquiry";
import { getSellerSession } from "src/actions/seller";

export default function PartnerDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    orders: {
      total: 0,
      paid: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    },
    deliveries: {
      preparing: 0,
      delayed: 0,
      shipped: 0,
      delivered: 0,
      failed: 0,
    },
    cancellations: {
      requested: 0,
      approved: 0,
      processing: 0,
      completed: 0,
      rejected: 0,
    },
    returns: {
      requested: 0,
      approved: 0,
      pickupScheduled: 0,
      processing: 0,
      completed: 0,
      rejected: 0,
    },
    settlements: {
      pending: 0,
      processing: 0,
      completed: 0,
      totalAmount: 0,
    },
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingInquiries, setPendingInquiries] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("day");
  const [notices, setNotices] = useState([]);
  const [noticeDetailOpen, setNoticeDetailOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  // 매출 데이터 state 추가
  const [salesData, setSalesData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    yearly: []
  });

  // 문의 관련 상태
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryDetailOpen, setInquiryDetailOpen] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  // 주문 상세 관련 상태
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 배너 슬라이더 상태
  const [currentBanner, setCurrentBanner] = useState(0);

  // 배너 데이터 상태
  const [banners, setBanners] = useState([]);

  // 배너 데이터 가져오기 - 현재 로그인한 판매자의 배너만
  const fetchBanners = async () => {
    try {
      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없어 배너를 가져올 수 없습니다.");
        setBanners([]);
        return;
      }

      // SELLER 타입의 모든 배너 가져오기 (로그인한 판매자의 배너만)
      const bannersData = await getBanners({ type: "SELLER" });
      console.log("배너 데이터:", bannersData);

      if (bannersData && bannersData.length > 0) {
        // 현재 로그인한 판매자의 배너만 필터링
        const sellerBanners = bannersData.filter(
          (banner) => banner.ownerId === seller.id.toString()
        );

        if (sellerBanners.length > 0) {
          // 실제 배너 데이터 변환
          const convertedBanners = sellerBanners
            .slice(0, 3)
            .map((banner, index) => ({
              id: banner.id,
              title: `이벤트 ${index + 1}`,
              subtitle: "판매자 이벤트",
              description: "자세한 내용은 클릭해주세요",
              buttonText: "자세히 보기",
              gradient:
                [
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                ][index] || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              icon:
                ["eva:gift-fill", "eva:trending-up-fill", "eva:star-fill"][
                  index
                ] || "eva:star-fill",
              imageUrl: banner.attachmentUrl,
              linkUrl: banner.url,
              action: () => {
                console.log(`Banner ${banner.id} clicked - URL: ${banner.url}`);
                if (banner.url) {
                  window.open(banner.url, "_blank");
                } else {
                  toast.info("배너 페이지로 이동합니다!");
                }
              },
            }));
          setBanners(convertedBanners);
          console.log("실제 배너 데이터 설정:", convertedBanners);
        } else {
          console.log("현재 판매자의 배너가 없습니다.");
          setBanners([]);
        }
      } else {
        // 배너가 없을 때 빈 배열로 설정
        setBanners([]);
      }
    } catch (error) {
      console.error("배너 데이터 로딩 실패:", error);
      // 배너 로딩 실패 시 빈 배열로 설정
      setBanners([]);
    }
  };

  // 자동 슬라이드
  useEffect(() => {
    if (banners.length > 0) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  // 차트 데이터 - salesData state에서 가져옴
  const dailyData = salesData.daily;
  const weeklyData = salesData.weekly;
  const monthlyData = salesData.monthly;
  const yearlyData = salesData.yearly;

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      console.log("🔍 getSellerSession 응답:", sellerData);
      const seller = sellerData?.user || sellerData?.seller;
      console.log("🔍 추출된 seller 정보:", seller);

      if (!seller || !seller.id) {
        console.warn("판매자 정보가 없습니다.");
        setLoading(false);
        return;
      }

      const sellerId = seller.id.toString();
      console.log("🔍 사용할 sellerId:", sellerId);

      // 대시보드 데이터 병렬 조회
      const [dashboardStats, recentOrdersData, settlementSummary] =
        await Promise.allSettled([
          getPartnerDashboardStats(sellerId),
          getRecentOrders(sellerId, 5),
          getSettlementSummary(sellerId),
        ]);

      // 대시보드 통계 데이터 설정 (기본값 포함)
      let dashboardData = {
        orders: {
          total: 0,
          paid: 0,
          pending: 0,
          confirmed: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
        },
        deliveries: {
          preparing: 0,
          delayed: 0,
          shipped: 0,
          delivered: 0,
          failed: 0,
        },
        cancellations: {
          requested: 0,
          approved: 0,
          processing: 0,
          completed: 0,
          rejected: 0,
        },
        returns: {
          requested: 0,
          approved: 0,
          pickupScheduled: 0,
          processing: 0,
          completed: 0,
          rejected: 0,
        },
        settlements: {
          pending: 0,
          processing: 0,
          completed: 0,
          totalAmount: 0,
        },
      };

      // API 성공 시 실제 데이터로 업데이트
      if (dashboardStats.status === "fulfilled") {
        const stats = dashboardStats.value;
        console.log("대시보드 통계 데이터:", stats); // 디버깅용 로그

        dashboardData = {
          orders: { ...dashboardData.orders, ...stats.orders },
          deliveries: { ...dashboardData.deliveries, ...stats.deliveries },
          cancellations: {
            ...dashboardData.cancellations,
            ...stats.cancellations,
          },
          returns: { ...dashboardData.returns, ...stats.returns },
          settlements:
            settlementSummary.status === "fulfilled"
              ? { ...dashboardData.settlements, ...settlementSummary.value }
              : dashboardData.settlements,
        };
      } else {
        console.warn("대시보드 통계 API 실패:", dashboardStats.reason);
        // API 실패 시 기본값(0) 유지
      }

      // 최근 주문 데이터 설정 - 미확인 주문만
      let recentOrdersArray = [];
      if (
        recentOrdersData.status === "fulfilled" &&
        recentOrdersData.value.success
      ) {
        // 미확인 주문만 필터링 (PENDING, CONFIRMED 상태)
        recentOrdersArray = (recentOrdersData.value.orders || [])
          .filter((order) => order.status === "PENDING" || order.status === "CONFIRMED")
          .slice(0, 5); // 최대 5개
        console.log("미확인 주문 데이터:", recentOrdersArray); // 디버깅용 로그
      } else {
        console.warn("최근 주문 API 실패:", recentOrdersData.reason);
        // API 실패 시 빈 배열 유지
        recentOrdersArray = [];
      }

      // 실제 API를 통해 미완료 문의사항 조회
      let pendingInquiriesArray = [];
      try {
        const sellerData = await getSellerSession();
        const seller = sellerData?.user || sellerData?.seller;

        if (seller && seller.id) {
          const inquiriesData = await getInquiriesBySeller(seller.id);

          // 미완료 문의만 필터링 (답변이 없는 것)
          pendingInquiriesArray = inquiriesData
            .filter((inquiry) => !inquiry.answer || inquiry.status === "접수" || inquiry.status === "처리중")
            .map((inquiry) => ({
              id: inquiry.id,
              title: inquiry.title,
              content: inquiry.content,
              customerName: inquiry.senderInfo?.user_name || inquiry.senderInfo?.name || "알 수 없음",
              createdAt: new Date(inquiry.createdAt).toLocaleDateString("ko-KR"),
              category: inquiry.Product?.displayName || "일반 문의",
              priority: inquiry.status === "처리중" ? "high" : "normal",
              status: inquiry.status,
            }))
            .slice(0, 5); // 최대 5개만 표시

          console.log("미완료 문의사항:", pendingInquiriesArray);
        }
      } catch (error) {
        console.error("미완료 문의사항 조회 실패:", error);
        pendingInquiriesArray = [];
      }

      // 실제 API를 통해 공지사항 조회
      let noticesArray = [];
      try {
        const noticesData = await getNoticesByType("SELLER");
        noticesArray = noticesData || [];
        console.log("공지사항 데이터:", noticesArray);
        if (noticesArray.length > 0) {
          console.log(
            "첫 번째 공지사항 ID:",
            noticesArray[0].id,
            "타입:",
            typeof noticesArray[0].id
          );
        }
      } catch (error) {
        console.error("공지사항 조회 실패:", error);
        // API 실패 시 빈 배열 유지
        noticesArray = [];
      }

      // 배너 데이터 가져오기
      await fetchBanners();

      // 매출 데이터 계산
      await calculateSalesData(sellerId);

      setDashboardData(dashboardData);
      setRecentOrders(recentOrdersArray);
      setPendingInquiries(pendingInquiriesArray);
      setNotices(noticesArray);
    } catch (error) {
      console.error("대시보드 데이터 로딩 실패:", error);

      // 500 에러 등 실제 서버 오류인 경우만 에러 메시지 표시
      if (error.response?.status >= 500) {
        toast.error("데이터를 불러오는 중 오류가 발생했습니다.");
      }

      // 오류 시 기본값 설정 (최소한의 데이터 표시)
      setDashboardData({
        orders: {
          total: 0,
          paid: 0,
          pending: 0,
          confirmed: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
        },
        deliveries: {
          preparing: 0,
          delayed: 0,
          shipped: 0,
          delivered: 0,
          failed: 0,
        },
        cancellations: {
          requested: 0,
          approved: 0,
          processing: 0,
          completed: 0,
          rejected: 0,
        },
        returns: {
          requested: 0,
          approved: 0,
          pickupScheduled: 0,
          processing: 0,
          completed: 0,
          rejected: 0,
        },
        settlements: {
          pending: 0,
          processing: 0,
          completed: 0,
          totalAmount: 0,
        },
      });
      setRecentOrders([]);
      setPendingInquiries([]);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  // 매출 데이터 계산 함수
  const calculateSalesData = async (sellerId) => {
    try {
      console.log('🔍 [calculateSalesData] sellerId:', sellerId);

      // 최근 30일 주문 데이터 가져오기
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const ordersResponse = await getPartnerOrders({
        sellerId,
        limit: 1000, // 충분한 수량
      });

      console.log('🔍 [calculateSalesData] ordersResponse:', ordersResponse);

      const orders = ordersResponse?.orders || [];
      console.log('🔍 [calculateSalesData] orders count:', orders.length);

      if (orders.length > 0) {
        console.log('🔍 [calculateSalesData] 첫 번째 주문 상태:', orders[0].orderStatus);
        console.log('🔍 [calculateSalesData] 첫 번째 주문 전체:', orders[0]);
      }

      // 배송 완료된 주문만 매출로 계산
      const completedOrders = orders.filter(
        order => order.status === 'DELIVERED' || order.orderStatus === 'DELIVERED'
      );

      console.log('🔍 [calculateSalesData] completedOrders count:', completedOrders.length);

      if (orders.length > 0 && completedOrders.length === 0) {
        console.log('🔍 [calculateSalesData] 첫 번째 주문 status 필드:', orders[0].status);
        console.log('🔍 [calculateSalesData] 첫 번째 주문 orderStatus 필드:', orders[0].orderStatus);
      }

      // 일별 데이터 (최근 7일)
      const dailyMap = new Map();
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        dailyMap.set(dateStr, { date: dateStr, amount: 0 });
      }

      completedOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const dateStr = `${orderDate.getMonth() + 1}/${orderDate.getDate()}`;
        if (dailyMap.has(dateStr)) {
          dailyMap.get(dateStr).amount += order.totalAmount || 0;
        }
      });

      // 주별 데이터 (최근 4주)
      const weeklyMap = new Map();
      for (let i = 3; i >= 0; i--) {
        const weekLabel = `${i + 1}주전`;
        weeklyMap.set(weekLabel, { date: weekLabel, amount: 0 });
      }

      completedOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const today = new Date();
        const diffDays = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(diffDays / 7);

        if (weekIndex < 4) {
          const weekLabel = `${weekIndex + 1}주전`;
          if (weeklyMap.has(weekLabel)) {
            weeklyMap.get(weekLabel).amount += order.totalAmount || 0;
          }
        }
      });

      // 월별 데이터 (최근 6개월)
      const monthlyMap = new Map();
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = `${date.getMonth() + 1}월`;
        monthlyMap.set(monthStr, { date: monthStr, amount: 0 });
      }

      completedOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const monthStr = `${orderDate.getMonth() + 1}월`;
        if (monthlyMap.has(monthStr)) {
          monthlyMap.get(monthStr).amount += order.totalAmount || 0;
        }
      });

      // 연도별 데이터 (최근 3년)
      const currentYear = new Date().getFullYear();
      const yearlyMap = new Map();
      for (let i = 2; i >= 0; i--) {
        const year = `${currentYear - i}년`;
        yearlyMap.set(year, { date: year, amount: 0 });
      }

      completedOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const year = `${orderDate.getFullYear()}년`;
        if (yearlyMap.has(year)) {
          yearlyMap.get(year).amount += order.totalAmount || 0;
        }
      });

      const newSalesData = {
        daily: Array.from(dailyMap.values()),
        weekly: Array.from(weeklyMap.values()),
        monthly: Array.from(monthlyMap.values()),
        yearly: Array.from(yearlyMap.values()),
      };

      console.log('🔍 [calculateSalesData] 계산된 매출 데이터:', newSalesData);
      console.log('🔍 [calculateSalesData] daily 데이터 개수:', newSalesData.daily.length);

      // 배송 완료된 주문이 없으면 빈 데이터 표시
      if (completedOrders.length === 0) {
        console.warn('⚠️ 배송 완료된 주문이 없습니다.');
      }

      setSalesData(newSalesData);

    } catch (error) {
      console.error("❌ 매출 데이터 계산 실패:", error);
      // 실패 시 빈 데이터 유지
      setSalesData({
        daily: [],
        weekly: [],
        monthly: [],
        yearly: []
      });
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      pending: "대기중",
      paid: "결제완료",
      preparing: "상품준비중",
      shipped: "배송중",
      delivered: "배송완료",
      cancelled: "취소됨",
    };
    return statusLabels[status] || status;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "warning",
      paid: "success",
      preparing: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "error",
    };
    return statusColors[status] || "default";
  };

  // 문의 관련 핸들러
  const handleViewInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setInquiryDetailOpen(true);
  };

  const handleReplyInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setReplyText("");
    setReplyModalOpen(true);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      toast.error("답변 내용을 입력해주세요.");
      return;
    }

    try {
      // 실제로는 API 호출
      console.log("Submit reply:", {
        inquiryId: selectedInquiry.id,
        reply: replyText,
      });

      // 문의사항 목록에서 해당 문의 제거 (답변 완료)
      setPendingInquiries((prev) =>
        prev.filter((inquiry) => inquiry.id !== selectedInquiry.id)
      );

      toast.success("답변이 성공적으로 전송되었습니다.");
      setReplyModalOpen(false);
      setSelectedInquiry(null);
      setReplyText("");
    } catch (error) {
      console.error("답변 전송 실패:", error);
      toast.error("답변 전송 중 오류가 발생했습니다.");
    }
  };

  const handleNoticeClick = async (noticeId) => {
    try {
      console.log("공지사항 ID:", noticeId, "타입:", typeof noticeId);
      const noticeData = await getNoticeById(noticeId);
      setSelectedNotice(noticeData);
      setNoticeDetailOpen(true);
    } catch (error) {
      console.error("공지사항 조회 실패:", error);
      toast.error("공지사항을 불러올 수 없습니다.");
    }
  };

  // 주문 상세 보기
  const handleViewOrder = async (orderId) => {
    try {
      // 현재 로그인한 판매자 정보 가져오기
      const sellerData = await getSellerSession();
      const seller = sellerData?.user || sellerData?.seller;

      if (!seller || !seller.id) {
        toast.error("판매자 정보를 불러올 수 없습니다.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/orders/${orderId}?sellerId=${seller.id}`
      );
      const data = await response.json();

      if (data.success) {
        setSelectedOrder(data.order);
        setOrderDetailOpen(true);
      } else {
        console.error("주문 상세 조회 실패:", data.message);
        toast.error("주문 상세 정보를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("주문 상세 조회 오류:", error);
      toast.error("주문 상세 정보를 불러오는 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <LoadingButton loading />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 대시보드 제목 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          판매자 대시보드
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          판매 현황과 주요 지표를 한눈에 확인하세요
        </Typography>
      </Box>

      {/* 광고 배너 슬라이더 - 배너가 있을 때만 표시 */}
      {banners.length > 0 && (
        <Box sx={{ mb: 3, position: "relative" }}>
          <Card
            sx={{
              background: banners[currentBanner].gradient,
              color: "white",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 4,
              },
              transition: "all 0.3s ease-in-out",
            }}
            onClick={banners[currentBanner].action}
          >
            <CardContent sx={{ position: "relative", zIndex: 2, py: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                    {banners[currentBanner].title}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                    {banners[currentBanner].subtitle}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {banners[currentBanner].description}
                  </Typography>
                </Box>
                <Box sx={{ flexShrink: 0 }}>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      fontWeight: "bold",
                      px: 3,
                      py: 1.5,
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.3)",
                      },
                    }}
                    startIcon={<Iconify icon={banners[currentBanner].icon} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      banners[currentBanner].action();
                    }}
                  >
                    {banners[currentBanner].buttonText}
                  </Button>
                </Box>
              </Box>
            </CardContent>

            {/* 배경 장식 */}
            <Box
              sx={{
                position: "absolute",
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.1)",
                zIndex: 1,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: -30,
                left: -30,
                width: 150,
                height: 150,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.05)",
                zIndex: 1,
              }}
            />
          </Card>

          {/* 배너 인디케이터 */}
          <Box
            sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 2 }}
          >
            {banners.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor:
                    index === currentBanner ? "primary.main" : "grey.300",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor:
                      index === currentBanner ? "primary.main" : "grey.400",
                  },
                }}
                onClick={() => setCurrentBanner(index)}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* 첫 번째 row: 판매현황(2) | 취소/반품현황+고객문의통계(2) */}
      <Box
        sx={{ display: "flex", gap: 3, mb: 3, width: "100%", flexWrap: "wrap" }}
      >
        <Box sx={{ flex: "2 1 500px", minHeight: 300, minWidth: 0 }}>
          <Card sx={{ height: "100%", width: "100%" }}>
            <CardHeader
              title="판매현황"
              action={
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  sx={{ minWidth: "auto", p: 1 }}
                >
                  <Iconify icon="eva:refresh-fill" />
                </Button>
              }
            />
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: { xs: "center", sm: "space-between" },
                  gap: { xs: 1, sm: 1 },
                  p: { xs: 1, sm: 1 },
                  borderRadius: 2,
                  minHeight: { xs: "auto", sm: 100 },
                  width: "100%",
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                {/* 결제완료 */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: { xs: "100%", sm: 60 },
                    p: { xs: 1, sm: 1 },
                    bgcolor: "success.50",
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor: "success.main",
                    flex: { xs: "0 0 auto", sm: "1 1 0" },
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h4"
                    color="success.main"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    {dashboardData.orders.paid}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="success.dark"
                    sx={{ textAlign: "center", fontWeight: 600 }}
                  >
                    결제완료
                  </Typography>
                </Box>

                <Iconify
                  icon="eva:arrow-right-fill"
                  width={20}
                  sx={{
                    color: "primary.main",
                    flex: "0 0 auto",
                    transform: { xs: "rotate(90deg)", sm: "rotate(0deg)" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: { xs: "auto", sm: 0 },
                  }}
                />

                {/* 상품준비중 */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: { xs: "100%", sm: 60 },
                    p: { xs: 1, sm: 1 },
                    bgcolor: "warning.50",
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor: "warning.main",
                    flex: { xs: "0 0 auto", sm: "1 1 0" },
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h4"
                    color="warning.main"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    {dashboardData.deliveries.preparing}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="warning.dark"
                    sx={{ textAlign: "center", fontWeight: 600 }}
                  >
                    상품준비중
                  </Typography>
                </Box>

                <Iconify
                  icon="eva:arrow-right-fill"
                  width={20}
                  sx={{
                    color: "primary.main",
                    flex: "0 0 auto",
                    transform: { xs: "rotate(90deg)", sm: "rotate(0deg)" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: { xs: "auto", sm: 0 },
                  }}
                />

                {/* 배송지연 */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: { xs: "100%", sm: 60 },
                    p: { xs: 1, sm: 1 },
                    bgcolor: "error.50",
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor: "error.main",
                    flex: { xs: "0 0 auto", sm: "1 1 0" },
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h4"
                    color="error.main"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    {dashboardData.deliveries.delayed}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="error.dark"
                    sx={{ textAlign: "center", fontWeight: 600 }}
                  >
                    배송지연
                  </Typography>
                </Box>

                <Iconify
                  icon="eva:arrow-right-fill"
                  width={20}
                  sx={{
                    color: "primary.main",
                    flex: "0 0 auto",
                    transform: { xs: "rotate(90deg)", sm: "rotate(0deg)" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: { xs: "auto", sm: 0 },
                  }}
                />

                {/* 배송중 */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: { xs: "100%", sm: 60 },
                    p: { xs: 1, sm: 1 },
                    bgcolor: "info.50",
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor: "info.main",
                    flex: { xs: "0 0 auto", sm: "1 1 0" },
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h4"
                    color="info.main"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    {dashboardData.deliveries.shipped}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="info.dark"
                    sx={{ textAlign: "center", fontWeight: 600 }}
                  >
                    배송중
                  </Typography>
                </Box>

                <Iconify
                  icon="eva:arrow-right-fill"
                  width={20}
                  sx={{
                    color: "primary.main",
                    flex: "0 0 auto",
                    transform: { xs: "rotate(90deg)", sm: "rotate(0deg)" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: { xs: "auto", sm: 0 },
                  }}
                />

                {/* 배송완료 */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: { xs: "100%", sm: 60 },
                    p: { xs: 1, sm: 1 },
                    bgcolor: "success.50",
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor: "success.main",
                    flex: { xs: "0 0 auto", sm: "1 1 0" },
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h4"
                    color="success.main"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    {dashboardData.deliveries.delivered}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="success.dark"
                    sx={{ textAlign: "center", fontWeight: 600 }}
                  >
                    배송완료
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box
          sx={{
            flex: "1 1 400px",
            minHeight: 300,
            minWidth: 0,
            display: "flex",
            flexDirection: "row",
            gap: 2,
          }}
        >
          <Card sx={{ flex: 1, width: "100%" }}>
            <CardHeader
              title="취소/반품현황"
              action={
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  sx={{ minWidth: "auto", p: 1 }}
                >
                  <Iconify icon="eva:refresh-fill" />
                </Button>
              }
            />
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">취소 요청</Typography>
                  <Chip
                    label={dashboardData.cancellations.requested}
                    color="warning"
                    size="small"
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">반품 요청</Typography>
                  <Chip
                    label={dashboardData.returns.requested}
                    color="warning"
                    size="small"
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">취소 완료</Typography>
                  <Chip
                    label={dashboardData.cancellations.completed}
                    color="success"
                    size="small"
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">반품 완료</Typography>
                  <Chip
                    label={dashboardData.returns.completed}
                    color="success"
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, width: "100%" }}>
            <CardHeader
              title="고객문의 통계"
              action={
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  sx={{ minWidth: "auto", p: 1 }}
                >
                  <Iconify icon="eva:refresh-fill" />
                </Button>
              }
            />
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">미답변 문의</Typography>
                  <Chip label={pendingInquiries.filter(inq => inq.status === "접수").length} color="warning" size="small" />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">미완료 문의</Typography>
                  <Chip label={pendingInquiries.length} color="error" size="small" />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">오늘 문의</Typography>
                  <Chip label={pendingInquiries.filter(inq => {
                    const today = new Date().toLocaleDateString("ko-KR");
                    return inq.createdAt === today;
                  }).length} color="info" size="small" />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">전체 문의</Typography>
                  <Chip label={pendingInquiries.length} color="primary" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 두 번째 row: 매출현황(1) | 공지사항(1) */}
      <Box
        sx={{ display: "flex", gap: 3, mb: 3, width: "100%", flexWrap: "wrap" }}
      >
        <Box sx={{ flex: "1 1 300px", minHeight: 400, minWidth: 0 }}>
          <Card sx={{ height: "100%", width: "100%" }}>
            <CardHeader
              title="매출현황"
              action={
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  sx={{ minWidth: "auto", p: 1 }}
                >
                  <Iconify icon="eva:refresh-fill" />
                </Button>
              }
            />
            <CardContent>
              {/* 기간 선택 버튼 */}
              <Box sx={{ mb: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setSelectedPeriod("day")}
                  color={selectedPeriod === "day" ? "primary" : "default"}
                >
                  일별
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setSelectedPeriod("week")}
                  color={selectedPeriod === "week" ? "primary" : "default"}
                >
                  주별
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setSelectedPeriod("month")}
                  color={selectedPeriod === "month" ? "primary" : "default"}
                >
                  월별
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setSelectedPeriod("year")}
                  color={selectedPeriod === "year" ? "primary" : "default"}
                >
                  연별
                </Button>
              </Box>

              {/* 차트 영역 */}
              <Box sx={{ height: 300, width: "100%" }}>
                {selectedPeriod === "day" && (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "end",
                      gap: 1,
                      p: 2,
                    }}
                  >
                    {dailyData.length === 0 ? (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          매출 데이터가 없습니다.
                        </Typography>
                      </Box>
                    ) : (
                      dailyData.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: "100%",
                            height: `${(item.amount / Math.max(...dailyData.map((d) => d.amount))) * 200}px`,
                            bgcolor: "primary.main",
                            borderRadius: "4px 4px 0 0",
                            mb: 1,
                            position: "relative",
                            "&:hover": {
                              bgcolor: "primary.dark",
                              "&::after": {
                                content: `"${formatCurrency(item.amount)}"`,
                                position: "absolute",
                                top: "-30px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                backgroundColor: "rgba(0,0,0,0.8)",
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.7rem",
                                whiteSpace: "nowrap",
                                zIndex: 1000,
                              },
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ textAlign: "center", fontSize: "0.7rem" }}
                        >
                          {item.date}
                        </Typography>
                      </Box>
                    ))
                    )}
                  </Box>
                )}

                {selectedPeriod === "week" && (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "end",
                      gap: 2,
                      p: 2,
                    }}
                  >
                    {weeklyData.length === 0 ? (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          매출 데이터가 없습니다.
                        </Typography>
                      </Box>
                    ) : (
                      weeklyData.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: "100%",
                            height: `${(item.amount / Math.max(...weeklyData.map((d) => d.amount))) * 200}px`,
                            bgcolor: "success.main",
                            borderRadius: "4px 4px 0 0",
                            mb: 1,
                            position: "relative",
                            "&:hover": {
                              bgcolor: "success.dark",
                              "&::after": {
                                content: `"${formatCurrency(item.amount)}"`,
                                position: "absolute",
                                top: "-30px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                backgroundColor: "rgba(0,0,0,0.8)",
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.7rem",
                                whiteSpace: "nowrap",
                                zIndex: 1000,
                              },
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ textAlign: "center", fontSize: "0.7rem" }}
                        >
                          {item.date}
                        </Typography>
                      </Box>
                    ))
                    )}
                  </Box>
                )}

                {selectedPeriod === "month" && (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "end",
                      gap: 1,
                      p: 2,
                    }}
                  >
                    {monthlyData.length === 0 ? (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          매출 데이터가 없습니다.
                        </Typography>
                      </Box>
                    ) : (
                      monthlyData.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: "100%",
                            height: `${(item.amount / Math.max(...monthlyData.map((d) => d.amount))) * 200}px`,
                            bgcolor: "info.main",
                            borderRadius: "4px 4px 0 0",
                            mb: 1,
                            position: "relative",
                            "&:hover": {
                              bgcolor: "info.dark",
                              "&::after": {
                                content: `"${formatCurrency(item.amount)}"`,
                                position: "absolute",
                                top: "-30px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                backgroundColor: "rgba(0,0,0,0.8)",
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.7rem",
                                whiteSpace: "nowrap",
                                zIndex: 1000,
                              },
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ textAlign: "center", fontSize: "0.6rem" }}
                        >
                          {item.date}
                        </Typography>
                      </Box>
                    ))
                    )}
                  </Box>
                )}

                {selectedPeriod === "year" && (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "end",
                      gap: 3,
                      p: 2,
                    }}
                  >
                    {yearlyData.length === 0 ? (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          매출 데이터가 없습니다.
                        </Typography>
                      </Box>
                    ) : (
                      yearlyData.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: "100%",
                            height: `${(item.amount / Math.max(...yearlyData.map((d) => d.amount))) * 200}px`,
                            bgcolor: "warning.main",
                            borderRadius: "4px 4px 0 0",
                            mb: 1,
                            position: "relative",
                            "&:hover": {
                              bgcolor: "warning.dark",
                              "&::after": {
                                content: `"${formatCurrency(item.amount)}"`,
                                position: "absolute",
                                top: "-30px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                backgroundColor: "rgba(0,0,0,0.8)",
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.7rem",
                                whiteSpace: "nowrap",
                                zIndex: 1000,
                              },
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ textAlign: "center", fontSize: "0.7rem" }}
                        >
                          {item.date}
                        </Typography>
                      </Box>
                    ))
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 300px", minHeight: 400, minWidth: 0 }}>
          <Card sx={{ height: "100%", width: "100%" }}>
            <CardHeader
              title="공지사항"
              action={
                <Button
                  size="small"
                  onClick={() => router.push("/dashboard/partner/notice")}
                >
                  전체보기
                </Button>
              }
            />
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {notices.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      공지사항이 없습니다.
                    </Typography>
                  </Box>
                ) : (
                  notices.slice(0, 4).map((notice) => (
                    <Box
                      key={notice.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2,
                        bgcolor: notice.is_pinned ? "error.50" : "grey.50",
                        borderRadius: 1,
                        ...(notice.is_pinned
                          ? {
                              border: "1px solid",
                              borderColor: "error.main",
                            }
                          : {}),
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {notice.is_pinned && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: "error.main",
                            }}
                          />
                        )}
                        <Box
                          sx={{ cursor: "pointer" }}
                          onClick={() => handleNoticeClick(notice.id)}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{
                              "&:hover": {
                                color: "primary.main",
                                textDecoration: "underline",
                              },
                            }}
                          >
                            {notice.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {notice.created_at
                              ? new Date(notice.created_at).toLocaleDateString(
                                  "ko-KR"
                                )
                              : ""}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={notice.is_pinned ? "중요" : "일반"}
                        color={notice.is_pinned ? "error" : "default"}
                        size="small"
                      />
                    </Box>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 세 번째 row: 최근주문 | 미완료 문의사항 */}
      <Box
        sx={{ display: "flex", gap: 3, mb: 3, width: "100%", flexWrap: "wrap" }}
      >
        <Box sx={{ flex: "1 1 300px", minHeight: 400, minWidth: 0 }}>
          <Card sx={{ height: "100%", width: "100%" }}>
            <CardHeader
              title="미확인 주문"
              action={
                <Button
                  variant="outlined"
                  onClick={() => router.push("/dashboard/partner/sale/order")}
                >
                  전체보기
                </Button>
              }
            />
            <CardContent>
              {recentOrders.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Iconify
                    icon="eva:checkmark-circle-2-fill"
                    width={48}
                    sx={{ color: "success.main", mb: 2 }}
                  />
                  <Typography variant="body1" color="text.secondary">
                    미확인 주문이 없습니다.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {recentOrders.map((order) => (
                    <Box
                      key={order.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": {
                          bgcolor: "action.hover",
                          borderColor: "primary.main",
                        },
                      }}
                      onClick={() => handleViewOrder(order.id)}
                    >
                      <Box>
                        <Typography variant="subtitle2">
                          {order.orderNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.customer.name} ({order.customer.email})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(order.totalAmount)}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrder(order.id);
                        }}
                      >
                        <Iconify icon="eva:arrow-ios-forward-fill" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 300px", minHeight: 400, minWidth: 0 }}>
          <Card sx={{ height: "100%", width: "100%" }}>
            <CardHeader
              title="미완료 문의사항"
              action={
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  sx={{ minWidth: "auto", p: 1 }}
                >
                  <Iconify icon="eva:refresh-fill" />
                </Button>
              }
            />
            <CardContent>
              {pendingInquiries.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Iconify
                    icon="eva:checkmark-circle-2-fill"
                    width={48}
                    sx={{ color: "success.main", mb: 2 }}
                  />
                  <Typography variant="body1" color="text.secondary">
                    미완료 문의사항이 없습니다.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {pendingInquiries.map((inquiry) => (
                    <Box
                      key={inquiry.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                      }}
                    >
                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="subtitle2">
                            {inquiry.title}
                          </Typography>
                          {inquiry.priority === "urgent" && (
                            <Chip label="긴급" color="error" size="small" />
                          )}
                          {inquiry.priority === "high" && (
                            <Chip label="높음" color="warning" size="small" />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {inquiry.customerName} • {inquiry.createdAt}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {inquiry.category}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Iconify icon="eva:edit-fill" />}
                          onClick={() => handleReplyInquiry(inquiry)}
                        >
                          답변하기
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 문의 상세보기 모달 */}
      <Dialog
        open={inquiryDetailOpen}
        onClose={() => setInquiryDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6">문의 상세보기</Typography>
            {selectedInquiry && (
              <>
                {selectedInquiry.priority === "urgent" && (
                  <Chip label="긴급" color="error" size="small" />
                )}
                {selectedInquiry.priority === "high" && (
                  <Chip label="높음" color="warning" size="small" />
                )}
                <Chip
                  label={selectedInquiry.category}
                  color="primary"
                  size="small"
                />
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInquiry && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  {selectedInquiry.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedInquiry.customerName} • {selectedInquiry.createdAt}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  문의 내용
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {selectedInquiry.content}
                </Typography>
              </Box>

              {/* 추가 정보가 있다면 여기에 표시 */}
              <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  문의 ID: {selectedInquiry.id}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInquiryDetailOpen(false)}>닫기</Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:edit-fill" />}
            onClick={() => {
              setInquiryDetailOpen(false);
              handleReplyInquiry(selectedInquiry);
            }}
          >
            답변하기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 답변 작성 모달 */}
      <Dialog
        open={replyModalOpen}
        onClose={() => setReplyModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">문의 답변 작성</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedInquiry && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* 원본 문의 요약 */}
              <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  원본 문의: {selectedInquiry.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {selectedInquiry.customerName} • {selectedInquiry.createdAt}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {selectedInquiry.content}
                </Typography>
              </Box>

              <Divider />

              {/* 답변 작성 영역 */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  답변 내용 *
                </Typography>
                <TextField
                  multiline
                  rows={6}
                  fullWidth
                  placeholder="고객님의 문의에 대한 답변을 작성해주세요..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  variant="outlined"
                />
              </Box>

              {/* 답변 가이드 */}
              <Box sx={{ bgcolor: "info.50", p: 2, borderRadius: 1 }}>
                <Typography variant="caption" color="info.main">
                  💡 답변 작성 팁: 친절하고 명확한 답변으로 고객 만족도를
                  높여보세요.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyModalOpen(false)}>취소</Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:paper-plane-fill" />}
            onClick={handleSubmitReply}
            disabled={!replyText.trim()}
          >
            답변 전송
          </Button>
        </DialogActions>
      </Dialog>

      {/* 공지사항 상세 다이얼로그 */}
      <Dialog
        open={noticeDetailOpen}
        onClose={() => setNoticeDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6">{selectedNotice?.title}</Typography>
            {selectedNotice?.is_pinned && (
              <Chip label="중요" color="error" size="small" />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNotice && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* 공지사항 정보 */}
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  작성일:{" "}
                  {selectedNotice.created_at
                    ? new Date(selectedNotice.created_at).toLocaleDateString(
                        "ko-KR"
                      )
                    : ""}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  조회수: {selectedNotice.view_count || 0}
                </Typography>
              </Box>

              <Divider />

              {/* 공지사항 내용 */}
              <Box
                sx={{
                  minHeight: 200,
                  p: 2,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                }}
              >
                <Typography variant="body1">
                  {selectedNotice.content}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoticeDetailOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 주문 상세 다이얼로그 */}
      <Dialog
        open={orderDetailOpen}
        onClose={() => setOrderDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">주문 상세</Typography>
            {selectedOrder && (
              <Chip
                label={getStatusLabel(selectedOrder.status)}
                color={getStatusColor(selectedOrder.status)}
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ pt: 2 }}>
              {/* 주문 기본 정보 */}
              <Card sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  주문 정보
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      주문번호
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedOrder.orderNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      주문일시
                    </Typography>
                    <Typography variant="body2">
                      {new Date(selectedOrder.createdAt).toLocaleString("ko-KR")}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      결제금액
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "primary.main" }}
                    >
                      {formatCurrency(selectedOrder.totalAmount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      결제방법
                    </Typography>
                    <Typography variant="body2">
                      {selectedOrder.paymentMethod || "카드결제"}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>

              {/* 고객 정보 */}
              <Card sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  고객 정보
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      고객명
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedOrder.customer?.name || "정보 없음"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      연락처
                    </Typography>
                    <Typography variant="body2">
                      {selectedOrder.customer?.phone || selectedOrder.customer?.email || "정보 없음"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      배송지
                    </Typography>
                    <Typography variant="body2">
                      {selectedOrder.shippingAddress || "정보 없음"}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>

              {/* 주문 상품 */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <Card sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    주문 상품
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {selectedOrder.items.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.product?.name || "상품명 없음"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            수량: {item.quantity || 0}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency((item.price || 0) * (item.quantity || 0))}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDetailOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
