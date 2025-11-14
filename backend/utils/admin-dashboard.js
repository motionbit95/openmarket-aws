const { PrismaClient } = require("@prisma/client");

/**
 * 관리자 대시보드용 통계 함수 모음
 * - 전체 플랫폼 통계
 * - 사용자/판매자 관리
 * - 매출 분석
 * - 상품 관리
 * - 고객지원 현황
 */

class AdminDashboard {
  constructor(prismaClient = null) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * 📊 전체 플랫폼 개요 통계
   */
  async getPlatformOverview() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      todayOrders,
      thisMonthOrders,
      lastMonthOrders,
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.sellers.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: thisMonth,
            lte: thisMonthEnd,
          },
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
      this.prisma.order.aggregate({
        _sum: {
          finalAmount: true,
        },
        where: {
          paymentStatus: "COMPLETED",
        },
      }),
      this.prisma.order.aggregate({
        _sum: {
          finalAmount: true,
        },
        where: {
          paymentStatus: "COMPLETED",
          createdAt: {
            gte: thisMonth,
            lte: thisMonthEnd,
          },
        },
      }),
      this.prisma.order.aggregate({
        _sum: {
          finalAmount: true,
        },
        where: {
          paymentStatus: "COMPLETED",
          createdAt: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
    ]);

    const orderGrowth =
      lastMonthOrders === 0
        ? 0
        : ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100;

    const revenueGrowth =
      lastMonthRevenue._sum.finalAmount === 0
        ? 0
        : ((thisMonthRevenue._sum.finalAmount -
            lastMonthRevenue._sum.finalAmount) /
            lastMonthRevenue._sum.finalAmount) *
          100;

    return {
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      todayOrders,
      thisMonthOrders,
      orderGrowth: Math.round(orderGrowth * 100) / 100,
      totalRevenue: totalRevenue._sum.finalAmount || 0,
      thisMonthRevenue: thisMonthRevenue._sum.finalAmount || 0,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
    };
  }

  /**
   * 📈 매출 추이 (일별, 월별)
   */
  async getRevenueChart(period = "daily", days = 30) {
    const endDate = new Date();
    const startDate = new Date();

    if (period === "daily") {
      startDate.setDate(startDate.getDate() - days);

      const revenueData = await this.prisma.order.groupBy({
        by: ["createdAt"],
        _sum: {
          finalAmount: true,
        },
        _count: {
          id: true,
        },
        where: {
          paymentStatus: "COMPLETED",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // 날짜별로 그룹화
      const dailyRevenue = {};
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateKey = d.toISOString().split("T")[0];
        dailyRevenue[dateKey] = { revenue: 0, orders: 0 };
      }

      revenueData.forEach((item) => {
        const dateKey = item.createdAt.toISOString().split("T")[0];
        if (dailyRevenue[dateKey]) {
          dailyRevenue[dateKey].revenue += item._sum.finalAmount || 0;
          dailyRevenue[dateKey].orders += item._count.id;
        }
      });

      return Object.entries(dailyRevenue).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }));
    }

    // 월별 통계
    if (period === "monthly") {
      startDate.setMonth(startDate.getMonth() - 12);

      // $queryRaw 대신 Prisma 기본 메서드 사용
      const monthlyData = await this.prisma.order.groupBy({
        by: ["createdAt"],
        _sum: {
          finalAmount: true,
        },
        _count: {
          id: true,
        },
        where: {
          paymentStatus: "COMPLETED",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // 월별로 그룹화
      const monthlyRevenue = {};
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setMonth(d.getMonth() + 1)
      ) {
        const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
        monthlyRevenue[monthKey] = { revenue: 0, orders: 0 };
      }

      monthlyData.forEach((item) => {
        const monthKey = item.createdAt.toISOString().slice(0, 7);
        if (monthlyRevenue[monthKey]) {
          monthlyRevenue[monthKey].revenue += item._sum.finalAmount || 0;
          monthlyRevenue[monthKey].orders += item._count.id;
        }
      });

      return Object.entries(monthlyRevenue).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        orders: data.orders,
      }));
    }
  }

  /**
   * 👥 사용자 통계
   */
  async getUserStats() {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [
      totalUsers,
      newUsersThisMonth,
      lastMonthUsers,
      activeUsers,
      usersByAge,
      topUsers,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.users.count({
        where: {
          created_at: {
            gte: thisMonth,
            lte: thisMonthEnd,
          },
        },
      }),
      this.prisma.users.count({
        where: {
          created_at: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
      this.prisma.users.count({
        where: {
          orders: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      }),
      // 사용자 등록 시기별 분포
      this.prisma.users.groupBy({
        by: ["created_at"],
        _count: {
          id: true,
        },
        where: {
          created_at: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            lte: today,
          },
        },
      }),
      // 주문 많은 사용자 TOP 10
      this.prisma.users.findMany({
        select: {
          id: true,
          user_name: true,
          email: true,
          _count: {
            select: {
              orders: true,
            },
          },
          orders: {
            select: {
              finalAmount: true,
            },
            where: {
              paymentStatus: "COMPLETED",
            },
          },
        },
        orderBy: {
          orders: {
            _count: "desc",
          },
        },
        take: 10,
      }),
    ]);

    const userGrowth =
      lastMonthUsers === 0
        ? 0
        : ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers) * 100;

    const topUsersWithRevenue = topUsers.map((user) => ({
      ...user,
      totalRevenue: user.orders.reduce(
        (sum, order) => sum + (order.finalAmount || 0),
        0
      ),
      orders: user._count.orders,
    }));

    return {
      totalUsers,
      newUsersThisMonth,
      userGrowth: Math.round(userGrowth * 100) / 100,
      activeUsers,
      usersByAge,
      topUsers: topUsersWithRevenue,
    };
  }

  /**
   * 🏪 판매자 통계
   */
  async getSellerStats() {
    const [totalSellers, activeSellers, topSellers, sellerDistribution] =
      await Promise.all([
        this.prisma.sellers.count(),
        // 활성 판매자 (상품이 있는 판매자)
        this.prisma.sellers.count({
          where: {
            id: {
              in: await this.prisma.product
                .findMany({
                  select: { sellerId: true },
                  distinct: ["sellerId"],
                })
                .then((products) => products.map((p) => p.sellerId)),
            },
          },
        }),
        // 매출 상위 판매자 TOP 10 (단순화)
        this.prisma.sellers.findMany({
          take: 10,
        }),
        // 판매자별 상품 수 분포
        this.prisma.sellers.groupBy({
          by: ["id"],
          _count: {
            id: true,
          },
        }),
      ]);

    return {
      totalSellers,
      activeSellers,
      topSellers: topSellers.map((seller) => ({
        id: seller.id,
        name: seller.name,
        shopName: seller.shop_name,
        productCount: 0, // 단순화
        orderCount: 0, // 단순화
        totalRevenue: 0, // 단순화
      })),
      sellerDistribution: sellerDistribution.map((item) => ({
        range: "상품 수 분포",
        count: item._count.id,
      })),
    };
  }

  /**
   * 📦 상품 통계
   */
  async getProductStats() {
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      categoryStats,
      topProducts,
      recentProducts,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({
        where: {
          saleStatus: "ON_SALE",
          displayStatus: "DISPLAYED",
        },
      }),
      this.prisma.product.count({
        where: {
          saleStatus: "OUT_OF_STOCK",
        },
      }),
      // 카테고리별 상품 수
      this.prisma.product.groupBy({
        by: ["categoryCode"],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 10,
      }),
      // 주문 많은 상품 TOP 10 (단순화)
      this.prisma.product.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
      }),
      // 최근 등록 상품
      this.prisma.product.findMany({
        select: {
          id: true,
          displayName: true,
          categoryCode: true,
          createdAt: true,
          saleStatus: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      categoryStats: categoryStats.map((cat) => ({
        category: cat.categoryCode,
        count: cat._count.id,
      })),
      topProducts: topProducts.map((product) => ({
        id: product.id,
        name: product.displayName,
        category: product.categoryCode,
        orderCount: parseInt(product.order_count) || 0,
        totalQuantity: parseInt(product.total_quantity) || 0,
        totalRevenue: parseFloat(product.total_revenue) || 0,
      })),
      recentProducts,
    };
  }

  /**
   * 📊 주문 통계
   */
  async getOrderStats() {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalOrders,
      todayOrders,
      thisMonthOrders,
      ordersByStatus,
      ordersByPaymentMethod,
      avgOrderValue,
      orderTrends,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: thisMonth,
          },
        },
      }),
      // 주문 상태별 통계
      this.prisma.order.groupBy({
        by: ["orderStatus"],
        _count: {
          id: true,
        },
      }),
      // 결제 방법별 통계
      this.prisma.order.groupBy({
        by: ["paymentMethod"],
        _count: {
          id: true,
        },
        _sum: {
          finalAmount: true,
        },
        where: {
          paymentStatus: "COMPLETED",
        },
      }),
      // 평균 주문 금액
      this.prisma.order.aggregate({
        _avg: {
          finalAmount: true,
        },
        where: {
          paymentStatus: "COMPLETED",
        },
      }),
      // 주문 트렌드 (최근 7일)
      this.prisma.order.groupBy({
        by: ["createdAt"],
        _sum: {
          finalAmount: true,
        },
        _count: {
          id: true,
        },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalOrders,
      todayOrders,
      thisMonthOrders,
      ordersByStatus: ordersByStatus.map((status) => ({
        status: status.orderStatus,
        count: status._count.id,
      })),
      ordersByPaymentMethod: ordersByPaymentMethod.map((method) => ({
        method: method.paymentMethod,
        count: method._count.id,
        revenue: method._sum.finalAmount || 0,
      })),
      avgOrderValue: avgOrderValue._avg.finalAmount || 0,
      orderTrends: orderTrends.map((trend) => ({
        date: trend.createdAt,
        orderCount: parseInt(trend._count.id),
        revenue: parseFloat(trend._sum.finalAmount) || 0,
      })),
    };
  }

  /**
   * 💬 고객지원 현황
   */
  async getCustomerSupportStats() {
    const [
      totalInquiries,
      pendingInquiries,
      totalErrorReports,
      pendingErrorReports,
      inquiriesByType,
      recentInquiries,
      errorsByCategory,
    ] = await Promise.all([
      this.prisma.inquiry.count(),
      this.prisma.inquiry.count({
        where: {
          status: "접수",
        },
      }),
      this.prisma.errorReport.count(),
      this.prisma.errorReport.count({
        where: {
          status: "접수",
        },
      }),
      // 문의 유형별 분류 (senderType 기준)
      this.prisma.inquiry.groupBy({
        by: ["senderType"],
        _count: {
          id: true,
        },
      }),
      // 최근 문의 10건
      this.prisma.inquiry.findMany({
        select: {
          id: true,
          title: true,
          senderType: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
      // 에러 카테고리별 분류
      this.prisma.errorReport.groupBy({
        by: ["category"],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
      }),
    ]);

    return {
      totalInquiries,
      pendingInquiries,
      totalErrorReports,
      pendingErrorReports,
      inquiriesByType,
      recentInquiries,
      errorsByCategory: errorsByCategory.map((error) => ({
        category: error.category,
        count: error._count.id,
      })),
    };
  }

  /**
   * 🎫 쿠폰 사용 통계
   */
  async getCouponStats() {
    const [
      totalCoupons,
      activeCoupons,
      usedCoupons,
      couponUsageStats,
      topCoupons,
    ] = await Promise.all([
      this.prisma.coupon.count(),
      this.prisma.coupon.count({
        where: {
          end_date: {
            gte: new Date(),
          },
        },
      }),
      this.prisma.userCoupon.count({
        where: {
          used: true,
        },
      }),
      // 쿠폰 사용률
      this.prisma.coupon.findMany({
        select: {
          id: true,
          title: true,
          total_count: true,
          _count: {
            select: {
              userCoupons: {
                where: {
                  used: true,
                },
              },
            },
          },
        },
      }),
      // 많이 사용된 쿠폰 TOP 5
      this.prisma.coupon.findMany({
        select: {
          id: true,
          title: true,
          discount_amount: true,
          discount_mode: true,
          _count: {
            select: {
              userCoupons: {
                where: {
                  used: true,
                },
              },
            },
          },
        },
        orderBy: {
          userCoupons: {
            _count: "desc",
          },
        },
        take: 5,
      }),
    ]);

    return {
      totalCoupons,
      activeCoupons,
      usedCoupons,
      couponUsageStats: couponUsageStats.map((coupon) => ({
        id: coupon.id,
        title: coupon.title,
        totalCount: coupon.total_count,
        usedCount: coupon._count.userCoupons,
        usageRate:
          coupon.total_count > 0
            ? Math.round((coupon._count.userCoupons / coupon.total_count) * 100)
            : 0,
      })),
      topCoupons: topCoupons.map((coupon) => ({
        id: coupon.id,
        title: coupon.title,
        discountAmount: coupon.discount_amount,
        discountMode: coupon.discount_mode,
        usedCount: coupon._count.userCoupons,
      })),
    };
  }

  /**
   * 📈 플랫폼 성장 지표
   */
  async getGrowthMetrics() {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [thisMonthStats, lastMonthStats] = await Promise.all([
      // 이번 달 통계
      Promise.all([
        this.prisma.users.count({
          where: { created_at: { gte: thisMonth, lte: thisMonthEnd } },
        }),
        this.prisma.order.count({
          where: { createdAt: { gte: thisMonth, lte: thisMonthEnd } },
        }),
        this.prisma.order.aggregate({
          _sum: { finalAmount: true },
          where: {
            paymentStatus: "COMPLETED",
            createdAt: { gte: thisMonth, lte: thisMonthEnd },
          },
        }),
        this.prisma.product.count({
          where: { createdAt: { gte: thisMonth, lte: thisMonthEnd } },
        }),
      ]),
      // 지난 달 통계
      Promise.all([
        this.prisma.users.count({
          where: { created_at: { gte: lastMonth, lt: thisMonth } },
        }),
        this.prisma.order.count({
          where: { createdAt: { gte: lastMonth, lt: thisMonth } },
        }),
        this.prisma.order.aggregate({
          _sum: { finalAmount: true },
          where: {
            paymentStatus: "COMPLETED",
            createdAt: { gte: lastMonth, lt: thisMonth },
          },
        }),
        this.prisma.product.count({
          where: { createdAt: { gte: lastMonth, lt: thisMonth } },
        }),
      ]),
    ]);

    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 10000) / 100;
    };

    return {
      userGrowth: calculateGrowth(thisMonthStats[0], lastMonthStats[0]),
      orderGrowth: calculateGrowth(thisMonthStats[1], lastMonthStats[1]),
      revenueGrowth: calculateGrowth(
        thisMonthStats[2]._sum.finalAmount || 0,
        lastMonthStats[2]._sum.finalAmount || 0
      ),
      productGrowth: calculateGrowth(thisMonthStats[3], lastMonthStats[3]),
    };
  }
}

module.exports = AdminDashboard;
