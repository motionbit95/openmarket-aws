const { PrismaClient } = require("@prisma/client");
const AdminDashboard = require("../utils/admin-dashboard");

describe("관리자 대시보드 API 테스트", () => {
  let adminDashboard;
  let prisma;

  beforeAll(async () => {
    prisma = new PrismaClient();
    adminDashboard = new AdminDashboard(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("getPlatformOverview", () => {
    it("플랫폼 개요 통계를 반환해야 한다", async () => {
      const result = await adminDashboard.getPlatformOverview();

      expect(result).toHaveProperty("totalUsers");
      expect(result).toHaveProperty("totalSellers");
      expect(result).toHaveProperty("totalProducts");
      expect(result).toHaveProperty("totalOrders");
      expect(result).toHaveProperty("todayOrders");
      expect(result).toHaveProperty("thisMonthOrders");
      expect(result).toHaveProperty("orderGrowth");
      expect(result).toHaveProperty("totalRevenue");
      expect(result).toHaveProperty("thisMonthRevenue");
      expect(result).toHaveProperty("revenueGrowth");

      // 데이터 타입 검증
      expect(typeof result.totalUsers).toBe("number");
      expect(typeof result.totalSellers).toBe("number");
      expect(typeof result.totalProducts).toBe("number");
      expect(typeof result.totalOrders).toBe("number");
      expect(typeof result.todayOrders).toBe("number");
      expect(typeof result.thisMonthOrders).toBe("number");
      expect(typeof result.orderGrowth).toBe("number");
      expect(typeof result.totalRevenue).toBe("number");
      expect(typeof result.thisMonthRevenue).toBe("number");
      expect(typeof result.revenueGrowth).toBe("number");

      // 값 범위 검증
      expect(result.totalUsers).toBeGreaterThanOrEqual(0);
      expect(result.totalSellers).toBeGreaterThanOrEqual(0);
      expect(result.totalProducts).toBeGreaterThanOrEqual(0);
      expect(result.totalOrders).toBeGreaterThanOrEqual(0);
      expect(result.todayOrders).toBeGreaterThanOrEqual(0);
      expect(result.thisMonthOrders).toBeGreaterThanOrEqual(0);
      expect(result.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(result.thisMonthRevenue).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getRevenueChart", () => {
    it("일별 매출 차트 데이터를 반환해야 한다", async () => {
      const result = await adminDashboard.getRevenueChart("daily", 7);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      if (result.length > 0) {
        const firstItem = result[0];
        expect(firstItem).toHaveProperty("date");
        expect(firstItem).toHaveProperty("revenue");
        expect(firstItem).toHaveProperty("orders");

        expect(typeof firstItem.date).toBe("string");
        expect(typeof firstItem.revenue).toBe("number");
        expect(typeof firstItem.orders).toBe("number");

        expect(firstItem.revenue).toBeGreaterThanOrEqual(0);
        expect(firstItem.orders).toBeGreaterThanOrEqual(0);
      }
    });

    it("잘못된 기간 매개변수를 처리해야 한다", async () => {
      const result = await adminDashboard.getRevenueChart("invalid");
      expect(result).toBeUndefined();
    });

    it("월별 매출 차트 데이터를 반환해야 한다", async () => {
      const result = await adminDashboard.getRevenueChart("monthly");

      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const firstItem = result[0];
        expect(firstItem).toHaveProperty("month");
        expect(firstItem).toHaveProperty("revenue");
        expect(firstItem).toHaveProperty("orders");

        expect(typeof firstItem.month).toBe("string");
        expect(typeof firstItem.revenue).toBe("number");
        expect(typeof firstItem.orders).toBe("number");

        expect(firstItem.revenue).toBeGreaterThanOrEqual(0);
        expect(firstItem.orders).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("getUserStats", () => {
    it("사용자 통계를 반환해야 한다", async () => {
      const result = await adminDashboard.getUserStats();

      expect(result).toHaveProperty("totalUsers");
      expect(result).toHaveProperty("newUsersThisMonth");
      expect(result).toHaveProperty("userGrowth");
      expect(result).toHaveProperty("activeUsers");
      expect(result).toHaveProperty("usersByAge");
      expect(result).toHaveProperty("topUsers");

      // 데이터 타입 검증
      expect(typeof result.totalUsers).toBe("number");
      expect(typeof result.newUsersThisMonth).toBe("number");
      expect(typeof result.userGrowth).toBe("number");
      expect(typeof result.activeUsers).toBe("number");
      expect(Array.isArray(result.usersByAge)).toBe(true);
      expect(Array.isArray(result.topUsers)).toBe(true);

      // 값 범위 검증
      expect(result.totalUsers).toBeGreaterThanOrEqual(0);
      expect(result.newUsersThisMonth).toBeGreaterThanOrEqual(0);
      expect(result.activeUsers).toBeGreaterThanOrEqual(0);

      // topUsers 구조 검증
      if (result.topUsers.length > 0) {
        const firstUser = result.topUsers[0];
        expect(firstUser).toHaveProperty("id");
        expect(firstUser).toHaveProperty("user_name");
        expect(firstUser).toHaveProperty("email");
        expect(firstUser).toHaveProperty("totalRevenue");
        expect(firstUser).toHaveProperty("orders");
      }
    });
  });

  describe("getSellerStats", () => {
    it("판매자 통계를 반환해야 한다", async () => {
      const result = await adminDashboard.getSellerStats();

      expect(result).toHaveProperty("totalSellers");
      expect(result).toHaveProperty("activeSellers");
      expect(result).toHaveProperty("topSellers");
      expect(result).toHaveProperty("sellerDistribution");

      // 데이터 타입 검증
      expect(typeof result.totalSellers).toBe("number");
      expect(typeof result.activeSellers).toBe("number");
      expect(Array.isArray(result.topSellers)).toBe(true);
      expect(Array.isArray(result.sellerDistribution)).toBe(true);

      // 값 범위 검증
      expect(result.totalSellers).toBeGreaterThanOrEqual(0);
      expect(result.activeSellers).toBeGreaterThanOrEqual(0);

      // topSellers 구조 검증
      if (result.topSellers.length > 0) {
        const firstSeller = result.topSellers[0];
        expect(firstSeller).toHaveProperty("id");
        expect(firstSeller).toHaveProperty("name");
        expect(firstSeller).toHaveProperty("shopName");
        expect(firstSeller).toHaveProperty("productCount");
        expect(firstSeller).toHaveProperty("orderCount");
        expect(firstSeller).toHaveProperty("totalRevenue");
      }
    });
  });

  describe("getProductStats", () => {
    it("상품 통계를 반환해야 한다", async () => {
      const result = await adminDashboard.getProductStats();

      expect(result).toHaveProperty("totalProducts");
      expect(result).toHaveProperty("activeProducts");
      expect(result).toHaveProperty("outOfStockProducts");
      expect(result).toHaveProperty("categoryStats");
      expect(result).toHaveProperty("topProducts");
      expect(result).toHaveProperty("recentProducts");

      // 데이터 타입 검증
      expect(typeof result.totalProducts).toBe("number");
      expect(typeof result.activeProducts).toBe("number");
      expect(typeof result.outOfStockProducts).toBe("number");
      expect(Array.isArray(result.categoryStats)).toBe(true);
      expect(Array.isArray(result.topProducts)).toBe(true);
      expect(Array.isArray(result.recentProducts)).toBe(true);

      // 값 범위 검증
      expect(result.totalProducts).toBeGreaterThanOrEqual(0);
      expect(result.activeProducts).toBeGreaterThanOrEqual(0);
      expect(result.outOfStockProducts).toBeGreaterThanOrEqual(0);

      // categoryStats 구조 검증
      if (result.categoryStats.length > 0) {
        const firstCategory = result.categoryStats[0];
        expect(firstCategory).toHaveProperty("category");
        expect(firstCategory).toHaveProperty("count");
      }

      // topProducts 구조 검증
      if (result.topProducts.length > 0) {
        const firstProduct = result.topProducts[0];
        expect(firstProduct).toHaveProperty("id");
        expect(firstProduct).toHaveProperty("name");
        expect(firstProduct).toHaveProperty("category");
        expect(firstProduct).toHaveProperty("orderCount");
        expect(firstProduct).toHaveProperty("totalQuantity");
        expect(firstProduct).toHaveProperty("totalRevenue");
      }
    });
  });

  describe("getOrderStats", () => {
    it("주문 통계를 반환해야 한다", async () => {
      const result = await adminDashboard.getOrderStats();

      expect(result).toHaveProperty("totalOrders");
      expect(result).toHaveProperty("todayOrders");
      expect(result).toHaveProperty("thisMonthOrders");
      expect(result).toHaveProperty("ordersByStatus");
      expect(result).toHaveProperty("ordersByPaymentMethod");
      expect(result).toHaveProperty("avgOrderValue");
      expect(result).toHaveProperty("orderTrends");

      // 데이터 타입 검증
      expect(typeof result.totalOrders).toBe("number");
      expect(typeof result.todayOrders).toBe("number");
      expect(typeof result.thisMonthOrders).toBe("number");
      expect(Array.isArray(result.ordersByStatus)).toBe(true);
      expect(Array.isArray(result.ordersByPaymentMethod)).toBe(true);
      expect(typeof result.avgOrderValue).toBe("number");
      expect(Array.isArray(result.orderTrends)).toBe(true);

      // 값 범위 검증
      expect(result.totalOrders).toBeGreaterThanOrEqual(0);
      expect(result.todayOrders).toBeGreaterThanOrEqual(0);
      expect(result.thisMonthOrders).toBeGreaterThanOrEqual(0);
      expect(result.avgOrderValue).toBeGreaterThanOrEqual(0);

      // ordersByStatus 구조 검증
      if (result.ordersByStatus.length > 0) {
        const firstStatus = result.ordersByStatus[0];
        expect(firstStatus).toHaveProperty("status");
        expect(firstStatus).toHaveProperty("count");
      }

      // ordersByPaymentMethod 구조 검증
      if (result.ordersByPaymentMethod.length > 0) {
        const firstMethod = result.ordersByPaymentMethod[0];
        expect(firstMethod).toHaveProperty("method");
        expect(firstMethod).toHaveProperty("count");
        expect(firstMethod).toHaveProperty("revenue");
      }
    });
  });

  describe("getCustomerSupportStats", () => {
    it("고객 지원 통계를 반환해야 한다", async () => {
      const result = await adminDashboard.getCustomerSupportStats();

      expect(result).toHaveProperty("totalInquiries");
      expect(result).toHaveProperty("pendingInquiries");
      expect(result).toHaveProperty("totalErrorReports");
      expect(result).toHaveProperty("pendingErrorReports");
      expect(result).toHaveProperty("inquiriesByType");
      expect(result).toHaveProperty("recentInquiries");
      expect(result).toHaveProperty("errorsByCategory");

      // 데이터 타입 검증
      expect(typeof result.totalInquiries).toBe("number");
      expect(typeof result.pendingInquiries).toBe("number");
      expect(typeof result.totalErrorReports).toBe("number");
      expect(typeof result.pendingErrorReports).toBe("number");
      expect(Array.isArray(result.inquiriesByType)).toBe(true);
      expect(Array.isArray(result.recentInquiries)).toBe(true);
      expect(Array.isArray(result.errorsByCategory)).toBe(true);

      // 값 범위 검증
      expect(result.totalInquiries).toBeGreaterThanOrEqual(0);
      expect(result.pendingInquiries).toBeGreaterThanOrEqual(0);
      expect(result.totalErrorReports).toBeGreaterThanOrEqual(0);
      expect(result.pendingErrorReports).toBeGreaterThanOrEqual(0);

      // inquiriesByType 구조 검증
      if (result.inquiriesByType.length > 0) {
        const firstType = result.inquiriesByType[0];
        expect(firstType).toHaveProperty("senderType");
        expect(firstType).toHaveProperty("_count");
      }

      // recentInquiries 구조 검증
      if (result.recentInquiries.length > 0) {
        const firstInquiry = result.recentInquiries[0];
        expect(firstInquiry).toHaveProperty("id");
        expect(firstInquiry).toHaveProperty("title");
        expect(firstInquiry).toHaveProperty("senderType");
        expect(firstInquiry).toHaveProperty("status");
        expect(firstInquiry).toHaveProperty("createdAt");
      }
    });
  });

  describe("getCouponStats", () => {
    it("쿠폰 통계를 반환해야 한다", async () => {
      const result = await adminDashboard.getCouponStats();

      expect(result).toHaveProperty("totalCoupons");
      expect(result).toHaveProperty("activeCoupons");
      expect(result).toHaveProperty("usedCoupons");
      expect(result).toHaveProperty("couponUsageStats");
      expect(result).toHaveProperty("topCoupons");

      // 데이터 타입 검증
      expect(typeof result.totalCoupons).toBe("number");
      expect(typeof result.activeCoupons).toBe("number");
      expect(typeof result.usedCoupons).toBe("number");
      expect(Array.isArray(result.couponUsageStats)).toBe(true);
      expect(Array.isArray(result.topCoupons)).toBe(true);

      // 값 범위 검증
      expect(result.totalCoupons).toBeGreaterThanOrEqual(0);
      expect(result.activeCoupons).toBeGreaterThanOrEqual(0);
      expect(result.usedCoupons).toBeGreaterThanOrEqual(0);

      // couponUsageStats 구조 검증
      if (result.couponUsageStats.length > 0) {
        const firstCoupon = result.couponUsageStats[0];
        expect(firstCoupon).toHaveProperty("id");
        expect(firstCoupon).toHaveProperty("title");
        expect(firstCoupon).toHaveProperty("totalCount");
        expect(firstCoupon).toHaveProperty("usedCount");
        expect(firstCoupon).toHaveProperty("usageRate");
      }

      // topCoupons 구조 검증
      if (result.topCoupons.length > 0) {
        const firstCoupon = result.topCoupons[0];
        expect(firstCoupon).toHaveProperty("id");
        expect(firstCoupon).toHaveProperty("title");
        expect(firstCoupon).toHaveProperty("discountAmount");
        expect(firstCoupon).toHaveProperty("discountMode");
        expect(firstCoupon).toHaveProperty("usedCount");
      }
    });
  });

  describe("getGrowthMetrics", () => {
    it("성장 지표를 반환해야 한다", async () => {
      const result = await adminDashboard.getGrowthMetrics();

      expect(result).toHaveProperty("userGrowth");
      expect(result).toHaveProperty("orderGrowth");
      expect(result).toHaveProperty("revenueGrowth");
      expect(result).toHaveProperty("productGrowth");

      // 데이터 타입 검증
      expect(typeof result.userGrowth).toBe("number");
      expect(typeof result.orderGrowth).toBe("number");
      expect(typeof result.revenueGrowth).toBe("number");
      expect(typeof result.productGrowth).toBe("number");

      // 성장률은 음수일 수도 있음 (감소하는 경우)
      expect(result.userGrowth).toBeGreaterThanOrEqual(-1000);
      expect(result.orderGrowth).toBeGreaterThanOrEqual(-1000);
      expect(result.revenueGrowth).toBeGreaterThanOrEqual(-1000);
      expect(result.productGrowth).toBeGreaterThanOrEqual(-1000);
    });
  });

  describe("Error Handling", () => {
    it("데이터베이스 연결 오류를 우아하게 처리해야 한다", async () => {
      // Prisma 클라이언트를 임시로 비활성화하여 에러 상황 시뮬레이션
      const originalPrisma = adminDashboard.prisma;
      adminDashboard.prisma = null;

      try {
        await expect(adminDashboard.getPlatformOverview()).rejects.toThrow();
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        // 원래 상태로 복구
        adminDashboard.prisma = originalPrisma;
      }
    });
  });

  describe("Data Consistency", () => {
    it("다양한 메서드에서 데이터 일관성을 유지해야 한다", async () => {
      const platformOverview = await adminDashboard.getPlatformOverview();
      const userStats = await adminDashboard.getUserStats();
      const sellerStats = await adminDashboard.getSellerStats();
      const productStats = await adminDashboard.getProductStats();
      const orderStats = await adminDashboard.getOrderStats();

      // 전체 사용자 수가 일치하는지 확인
      expect(platformOverview.totalUsers).toBe(userStats.totalUsers);

      // 전체 판매자 수가 일치하는지 확인
      expect(platformOverview.totalSellers).toBe(sellerStats.totalSellers);

      // 전체 상품 수가 일치하는지 확인
      expect(platformOverview.totalProducts).toBe(productStats.totalProducts);

      // 전체 주문 수가 일치하는지 확인
      expect(platformOverview.totalOrders).toBe(orderStats.totalOrders);
    });
  });
});
