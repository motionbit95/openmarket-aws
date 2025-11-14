const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: 관리자 전용 API
 */

const jwt = require("jsonwebtoken");
const { getLatelyInquires } = require("../controllers/inquiry.controller");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// 고정 관리자 계정 정보
const ADMIN_ID = process.env.ADMIN_ID || "rgfood1";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "dkfwlvnem1!";

// 관리자 로그인 엔드포인트
router.post("/sign-in", (req, res) => {
  const { adminId, adminPw } = req.body;

  if (adminId !== ADMIN_ID || adminPw !== ADMIN_PASSWORD) {
    console.error(
      "[AUTH_001] 관리자 아이디 또는 비밀번호가 일치하지 않습니다."
    );
    return res.status(401).json({
      message: "[AUTH_001] 관리자 아이디 또는 비밀번호가 일치하지 않습니다.",
    });
  }

  // 토큰 발급 (관리자임을 명시)
  const token = jwt.sign({ id: ADMIN_ID, role: "admin" }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({ token });
});

router.get("/me", async (req, res) => {
  try {
    console.log("[getCurrentAdmin] 요청 시작");
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("[getCurrentAdmin] 토큰 없음");
      return res.status(401).json({ message: "토큰이 없습니다." });
    }

    const token = authHeader.split(" ")[1];
    console.log("[getCurrentAdmin] 토큰 추출:", token);
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded?.id) {
      console.log("[getCurrentAdmin] 유효하지 않은 토큰 (id 없음)");
      return res
        .status(401)
        .json({ message: "유효하지 않은 토큰입니다. (id 없음)" });
    }

    // 관리자 role 확인
    if (decoded?.role !== "admin") {
      console.log("[getCurrentAdmin] 관리자 권한 없음, role:", decoded?.role);
      return res.status(403).json({ message: "관리자 권한이 필요합니다." });
    }

    res.json({ admin: { decoded } });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      console.log("[getCurrentAdmin] JWT 오류:", error.message);
      return res.status(401).json({ message: "토큰이 유효하지 않습니다." });
    }
    if (error.name === "TokenExpiredError") {
      console.log("[getCurrentAdmin] 토큰 만료:", error.message);
      return res.status(401).json({ message: "토큰이 만료되었습니다." });
    }
    console.error("관리자 조회 실패:", error);
    res.status(500).json({ message: "서버 에러", error: error.message });
  }
});

// 대시 보드 데이터 가지고 오기
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const AdminDashboard = require("../utils/admin-dashboard");
const adminDashboard = new AdminDashboard(prisma);

router.get("/dashboard", async (req, res) => {
  try {
    // 관리자 권한 확인
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "토큰이 없습니다." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded?.id || decoded?.role !== "admin") {
      return res.status(403).json({ message: "관리자 권한이 필요합니다." });
    }

    console.log("[Dashboard] Request received with query:", req.query);

    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    const now = new Date();

    // Get date parameter from query (optional)
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const period = req.query.period || "monthly";

    console.log("[Dashboard] Target date:", targetDate);
    console.log("[Dashboard] Period:", period);

    const [
      platformOverview,
      recentInquiriesData,
      thisYearRevenue,
      lastYearRevenue,
      weeklyRevenue,
      dailyRevenue,
    ] = await Promise.all([
      adminDashboard.getPlatformOverview(),
      (async () => {
        const inquiries = await prisma.inquiry.findMany({
          where: {
            status: {
              not: "답변완료",
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        });

        const inquiriesWithSenderInfo = await Promise.all(
          inquiries.map(async (inquiry) => {
            let senderInfo = null;

            if (inquiry.senderType === "user") {
              senderInfo = await prisma.users.findUnique({
                where: { id: BigInt(inquiry.senderId) },
                select: {
                  id: true,
                  user_name: true,
                  email: true,
                },
              });
            } else if (inquiry.senderType === "seller") {
              senderInfo = await prisma.sellers.findUnique({
                where: { id: BigInt(inquiry.senderId) },
                select: {
                  id: true,
                  name: true,
                  shop_name: true,
                  email: true,
                },
              });
            }

            return {
              id: inquiry.id.toString(),
              title: inquiry.title,
              content: inquiry.content,
              status: inquiry.status,
              createdAt: inquiry.createdAt,
              senderType: inquiry.senderType,
              senderInfo: senderInfo
                ? {
                    ...senderInfo,
                    id: senderInfo.id.toString(),
                  }
                : null,
            };
          })
        );

        return inquiriesWithSenderInfo;
      })(),
      // 올해 월별 매출
      (async () => {
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

        const orders = await prisma.order.findMany({
          where: {
            paymentStatus: "COMPLETED",
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            createdAt: true,
            finalAmount: true,
          },
        });

        const monthlyData = Array(12)
          .fill(0)
          .map((_, i) => ({
            month: i + 1,
            revenue: 0,
            orders: 0,
          }));

        orders.forEach((order) => {
          const month = order.createdAt.getMonth();
          monthlyData[month].revenue += Number(order.finalAmount) || 0;
          monthlyData[month].orders += 1;
        });

        return monthlyData;
      })(),
      // 작년 월별 매출
      (async () => {
        const startDate = new Date(lastYear, 0, 1);
        const endDate = new Date(lastYear, 11, 31, 23, 59, 59);

        const orders = await prisma.order.findMany({
          where: {
            paymentStatus: "COMPLETED",
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            createdAt: true,
            finalAmount: true,
          },
        });

        const monthlyData = Array(12)
          .fill(0)
          .map((_, i) => ({
            month: i + 1,
            revenue: 0,
            orders: 0,
          }));

        orders.forEach((order) => {
          const month = order.createdAt.getMonth();
          monthlyData[month].revenue += Number(order.finalAmount) || 0;
          monthlyData[month].orders += 1;
        });

        return monthlyData;
      })(),
      // 최근 7일 일별 매출 (or specific date range)
      (async () => {
        const startDate = new Date(targetDate);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);

        const orders = await prisma.order.findMany({
          where: {
            paymentStatus: "COMPLETED",
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            createdAt: true,
            finalAmount: true,
          },
        });

        console.log(`[Dashboard] Weekly orders found: ${orders.length}`);
        if (orders.length > 0) {
          console.log("[Dashboard] Sample order:", orders[0]);
        }

        const dailyData = Array(7)
          .fill(0)
          .map((_, i) => {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            return {
              date: date.toISOString().split("T")[0],
              revenue: 0,
              orders: 0,
            };
          });

        orders.forEach((order) => {
          const dateKey = order.createdAt.toISOString().split("T")[0];
          const dayData = dailyData.find((d) => d.date === dateKey);
          if (dayData) {
            dayData.revenue += Number(order.finalAmount) || 0;
            dayData.orders += 1;
          }
        });

        console.log("[Dashboard] Weekly dailyData:", dailyData);
        return dailyData;
      })(),
      // 최근 24시간 시간별 매출 (or specific date)
      (async () => {
        const startDate = new Date(targetDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);

        const orders = await prisma.order.findMany({
          where: {
            paymentStatus: "COMPLETED",
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            createdAt: true,
            finalAmount: true,
          },
        });

        const hourlyData = Array(24)
          .fill(0)
          .map((_, i) => {
            return {
              hour: i,
              revenue: 0,
              orders: 0,
            };
          });

        orders.forEach((order) => {
          const hour = order.createdAt.getHours();
          if (hourlyData[hour]) {
            hourlyData[hour].revenue += Number(order.finalAmount) || 0;
            hourlyData[hour].orders += 1;
          }
        });

        return hourlyData;
      })(),
    ]);

    // 최근 6개월 트렌드 데이터 계산
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const trendData = await Promise.all([
      // 사용자 수 트렌드
      (async () => {
        const users = await prisma.users.findMany({
          where: {
            created_at: { gte: sixMonthsAgo },
          },
          select: {
            created_at: true,
          },
        });

        const monthlyUsers = Array(6).fill(0);

        users.forEach((user) => {
          const userMonth = new Date(user.created_at).getMonth();
          const currentMonth = new Date().getMonth();
          const diff = (currentMonth - userMonth + 12) % 12;
          if (diff < 6) {
            monthlyUsers[5 - diff]++;
          }
        });

        return monthlyUsers;
      })(),

      // 판매자 수 트렌드
      (async () => {
        const sellers = await prisma.sellers.findMany({
          where: {
            created_at: { gte: sixMonthsAgo },
          },
          select: {
            created_at: true,
          },
        });

        const monthlySellers = Array(6).fill(0);

        sellers.forEach((seller) => {
          const sellerMonth = new Date(seller.created_at).getMonth();
          const currentMonth = new Date().getMonth();
          const diff = (currentMonth - sellerMonth + 12) % 12;
          if (diff < 6) {
            monthlySellers[5 - diff]++;
          }
        });

        return monthlySellers;
      })(),

      // 주문 수 트렌드
      (async () => {
        const orders = await prisma.order.findMany({
          where: {
            createdAt: { gte: sixMonthsAgo },
          },
          select: {
            createdAt: true,
          },
        });

        const monthlyOrders = Array(6).fill(0);

        orders.forEach((order) => {
          const orderMonth = new Date(order.createdAt).getMonth();
          const currentMonth = new Date().getMonth();
          const diff = (currentMonth - orderMonth + 12) % 12;
          if (diff < 6) {
            monthlyOrders[5 - diff]++;
          }
        });

        return monthlyOrders;
      })(),

      // 매출 트렌드
      (async () => {
        const orders = await prisma.order.findMany({
          where: {
            paymentStatus: "COMPLETED",
            createdAt: { gte: sixMonthsAgo },
          },
          select: {
            createdAt: true,
            finalAmount: true,
          },
        });

        const monthlyRevenue = Array(6).fill(0);

        orders.forEach((order) => {
          const orderMonth = new Date(order.createdAt).getMonth();
          const currentMonth = new Date().getMonth();
          const diff = (currentMonth - orderMonth + 12) % 12;
          if (diff < 6) {
            monthlyRevenue[5 - diff] += Number(order.finalAmount) || 0;
          }
        });

        return monthlyRevenue;
      })(),
    ]);

    res.json({
      totalUsers: platformOverview.totalUsers,
      totalSellers: platformOverview.totalSellers,
      totalOrders: platformOverview.totalOrders,
      totalSales: platformOverview.totalRevenue,
      recentInquiries: recentInquiriesData,
      yearlyRevenue: {
        currentYear,
        lastYear,
        thisYearData: thisYearRevenue,
        lastYearData: lastYearRevenue,
      },
      weeklyRevenue: weeklyRevenue,
      dailyRevenue: dailyRevenue,
      trends: {
        users: trendData[0],
        sellers: trendData[1],
        orders: trendData[2],
        revenue: trendData[3],
      },
    });
  } catch (error) {
    console.error("대시보드 데이터 조회 실패:", error);
    res.status(500).json({ message: "서버 에러", error: error.message });
  }
});
module.exports = router;
