const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 판매자 대시보드용 통계 함수 모음
 * - 개인 매출 통계
 * - 상품 관리
 * - 주문 관리
 * - 고객 분석
 * - 리뷰 관리
 */

class SellerDashboard {
  constructor(sellerId) {
    this.sellerId = BigInt(sellerId);
  }

  /**
   * 📊 판매자 매출 개요
   */
  async getSalesOverview() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalProducts,
      totalOrders,
      todayOrders,
      thisMonthOrders,
      lastMonthOrders,
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      avgOrderValue,
      pendingOrders,
    ] = await Promise.all([
      // 총 상품 수
      prisma.product.count({
        where: { sellerId: this.sellerId },
      }),
      // 총 주문 수
      prisma.order.count({
        where: {
          orderItems: {
            some: {
              product: {
                sellerId: this.sellerId,
              },
            },
          },
          paymentStatus: "COMPLETED",
        },
      }),
      // 오늘 주문 수
      prisma.order.count({
        where: {
          orderItems: {
            some: {
              product: {
                sellerId: this.sellerId,
              },
            },
          },
          paymentStatus: "COMPLETED",
          createdAt: {
            gte: today,
          },
        },
      }),
      // 이번 달 주문 수
      prisma.order.count({
        where: {
          orderItems: {
            some: {
              product: {
                sellerId: this.sellerId,
              },
            },
          },
          paymentStatus: "COMPLETED",
          createdAt: {
            gte: thisMonth,
            lte: thisMonthEnd,
          },
        },
      }),
      // 지난 달 주문 수
      prisma.order.count({
        where: {
          orderItems: {
            some: {
              product: {
                sellerId: this.sellerId,
              },
            },
          },
          paymentStatus: "COMPLETED",
          createdAt: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
      // 총 매출
      prisma.orderItem.aggregate({
        _sum: {
          totalPrice: true,
        },
        where: {
          product: {
            sellerId: this.sellerId,
          },
          order: {
            paymentStatus: "COMPLETED",
          },
        },
      }),
      // 이번 달 매출
      prisma.orderItem.aggregate({
        _sum: {
          totalPrice: true,
        },
        where: {
          product: {
            sellerId: this.sellerId,
          },
          order: {
            paymentStatus: "COMPLETED",
            createdAt: {
              gte: thisMonth,
              lte: thisMonthEnd,
            },
          },
        },
      }),
      // 지난 달 매출
      prisma.orderItem.aggregate({
        _sum: {
          totalPrice: true,
        },
        where: {
          product: {
            sellerId: this.sellerId,
          },
          order: {
            paymentStatus: "COMPLETED",
            createdAt: {
              gte: lastMonth,
              lt: thisMonth,
            },
          },
        },
      }),
      // 평균 주문 금액
      prisma.orderItem.aggregate({
        _avg: {
          totalPrice: true,
        },
        where: {
          product: {
            sellerId: this.sellerId,
          },
          order: {
            paymentStatus: "COMPLETED",
          },
        },
      }),
      // 처리 대기 주문
      prisma.order.count({
        where: {
          orderItems: {
            some: {
              product: {
                sellerId: this.sellerId,
              },
            },
          },
          orderStatus: {
            in: ["PENDING", "CONFIRMED"],
          },
        },
      }),
    ]);

    const orderGrowth =
      lastMonthOrders === 0
        ? 0
        : ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100;

    const revenueGrowth =
      (lastMonthRevenue._sum.totalPrice || 0) === 0
        ? 0
        : (((thisMonthRevenue._sum.totalPrice || 0) -
            (lastMonthRevenue._sum.totalPrice || 0)) /
            (lastMonthRevenue._sum.totalPrice || 0)) *
          100;

    return {
      totalProducts,
      totalOrders,
      todayOrders,
      thisMonthOrders,
      orderGrowth: Math.round(orderGrowth * 100) / 100,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      thisMonthRevenue: thisMonthRevenue._sum.totalPrice || 0,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      avgOrderValue: avgOrderValue._avg.totalPrice || 0,
      pendingOrders,
    };
  }

  /**
   * 📈 매출 차트 데이터 (일별, 월별)
   */
  async getRevenueChart(period = "daily", days = 30) {
    const endDate = new Date();
    const startDate = new Date();

    if (period === "daily") {
      startDate.setDate(startDate.getDate() - days);

      const revenueData = await prisma.$queryRaw`
        SELECT 
          DATE(o.createdAt) as order_date,
          COUNT(DISTINCT o.id) as order_count,
          SUM(oi.totalPrice) as revenue,
          SUM(oi.quantity) as items_sold
        FROM orders o
        JOIN order_items oi ON o.id = oi.orderId
        JOIN products p ON oi.productId = p.id
        WHERE p.sellerId = ${this.sellerId}
          AND o.paymentStatus = 'COMPLETED'
          AND o.createdAt >= ${startDate}
          AND o.createdAt <= ${endDate}
        GROUP BY DATE(o.createdAt)
        ORDER BY order_date
      `;

      return revenueData.map((item) => ({
        date: item.order_date,
        revenue: parseFloat(item.revenue) || 0,
        orders: parseInt(item.order_count) || 0,
        itemsSold: parseInt(item.items_sold) || 0,
      }));
    }

    // 월별 통계
    if (period === "monthly") {
      startDate.setMonth(startDate.getMonth() - 12);

      const monthlyData = await prisma.$queryRaw`
        SELECT 
          DATE_FORMAT(o.createdAt, '%Y-%m') as month,
          COUNT(DISTINCT o.id) as order_count,
          SUM(oi.totalPrice) as revenue,
          SUM(oi.quantity) as items_sold
        FROM orders o
        JOIN order_items oi ON o.id = oi.orderId
        JOIN products p ON oi.productId = p.id
        WHERE p.sellerId = ${this.sellerId}
          AND o.paymentStatus = 'COMPLETED'
          AND o.createdAt >= ${startDate}
          AND o.createdAt <= ${endDate}
        GROUP BY DATE_FORMAT(o.createdAt, '%Y-%m')
        ORDER BY month
      `;

      return monthlyData.map((item) => ({
        month: item.month,
        revenue: parseFloat(item.revenue) || 0,
        orders: parseInt(item.order_count) || 0,
        itemsSold: parseInt(item.items_sold) || 0,
      }));
    }
  }

  /**
   * 📦 상품 통계
   */
  async getProductStats() {
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
      bestSellingProducts,
      recentProducts,
      categoryPerformance,
    ] = await Promise.all([
      // 총 상품 수
      prisma.product.count({
        where: { sellerId: this.sellerId },
      }),
      // 판매중 상품
      prisma.product.count({
        where: {
          sellerId: this.sellerId,
          saleStatus: "ON_SALE",
          displayStatus: "DISPLAYED",
        },
      }),
      // 품절 상품
      prisma.product.count({
        where: {
          sellerId: this.sellerId,
          saleStatus: "OUT_OF_STOCK",
        },
      }),
      // 재고 부족 상품 (10개 이하)
      prisma.product.count({
        where: {
          sellerId: this.sellerId,
          stockQuantity: {
            lte: 10,
          },
        },
      }),
      // 베스트셀러 TOP 10
      prisma.$queryRaw`
        SELECT 
          p.id,
          p.displayName,
          p.categoryCode,
          COUNT(oi.id) as order_count,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.totalPrice) as total_revenue,
          AVG(r.rating) as avg_rating,
          COUNT(DISTINCT r.id) as review_count
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.productId
        LEFT JOIN orders o ON oi.orderId = o.id AND o.paymentStatus = 'COMPLETED'
        LEFT JOIN reviews r ON p.id = r.productId
        WHERE p.sellerId = ${this.sellerId}
        GROUP BY p.id, p.displayName, p.categoryCode
        ORDER BY order_count DESC, total_quantity DESC
        LIMIT 10
      `,
      // 최근 등록 상품
      prisma.product.findMany({
        where: { sellerId: this.sellerId },
        select: {
          id: true,
          displayName: true,
          saleStatus: true,
          stockQuantity: true,
          createdAt: true,
          prices: {
            select: {
              salePrice: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
      // 카테고리별 성과
      prisma.$queryRaw`
        SELECT 
          p.categoryCode as category,
          COUNT(DISTINCT p.id) as product_count,
          COUNT(oi.id) as order_count,
          SUM(oi.totalPrice) as revenue
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.productId
        LEFT JOIN orders o ON oi.orderId = o.id AND o.paymentStatus = 'COMPLETED'
        WHERE p.sellerId = ${this.sellerId}
        GROUP BY p.categoryCode
        ORDER BY revenue DESC
      `,
    ]);

    return {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
      bestSellingProducts: bestSellingProducts.map((product) => ({
        id: product.id,
        name: product.displayName,
        category: product.categoryCode,
        orderCount: parseInt(product.order_count) || 0,
        totalQuantity: parseInt(product.total_quantity) || 0,
        totalRevenue: parseFloat(product.total_revenue) || 0,
        avgRating: product.avg_rating
          ? parseFloat(product.avg_rating).toFixed(1)
          : 0,
        reviewCount: parseInt(product.review_count) || 0,
      })),
      recentProducts,
      categoryPerformance: categoryPerformance.map((cat) => ({
        category: cat.category,
        productCount: parseInt(cat.product_count) || 0,
        orderCount: parseInt(cat.order_count) || 0,
        revenue: parseFloat(cat.revenue) || 0,
      })),
    };
  }

  /**
   * 📋 주문 관리
   */
  async getOrderStats() {
    const [
      totalOrders,
      ordersByStatus,
      recentOrders,
      orderTrends,
      topCustomers,
      returnRequests,
    ] = await Promise.all([
      // 총 주문 수
      prisma.order.count({
        where: {
          orderItems: {
            some: {
              product: {
                sellerId: this.sellerId,
              },
            },
          },
        },
      }),
      // 주문 상태별
      prisma.$queryRaw`
        SELECT 
          o.orderStatus as status,
          COUNT(DISTINCT o.id) as count
        FROM orders o
        JOIN order_items oi ON o.id = oi.orderId
        JOIN products p ON oi.productId = p.id
        WHERE p.sellerId = ${this.sellerId}
        GROUP BY o.orderStatus
      `,
      // 최근 주문 10건
      prisma.$queryRaw`
        SELECT DISTINCT
          o.id,
          o.orderNumber,
          o.recipient,
          o.orderStatus,
          o.finalAmount,
          o.createdAt,
          COUNT(oi.id) as item_count
        FROM orders o
        JOIN order_items oi ON o.id = oi.orderId
        JOIN products p ON oi.productId = p.id
        WHERE p.sellerId = ${this.sellerId}
        GROUP BY o.id, o.orderNumber, o.recipient, o.orderStatus, o.finalAmount, o.createdAt
        ORDER BY o.createdAt DESC
        LIMIT 10
      `,
      // 주문 트렌드 (최근 30일)
      prisma.$queryRaw`
        SELECT 
          DATE(o.createdAt) as order_date,
          COUNT(DISTINCT o.id) as order_count
        FROM orders o
        JOIN order_items oi ON o.id = oi.orderId
        JOIN products p ON oi.productId = p.id
        WHERE p.sellerId = ${this.sellerId}
          AND o.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(o.createdAt)
        ORDER BY order_date
      `,
      // 단골 고객 TOP 5
      prisma.$queryRaw`
        SELECT 
          u.id,
          u.user_name,
          u.email,
          COUNT(DISTINCT o.id) as order_count,
          SUM(oi.totalPrice) as total_spent
        FROM users u
        JOIN orders o ON u.id = o.userId
        JOIN order_items oi ON o.id = oi.orderId
        JOIN products p ON oi.productId = p.id
        WHERE p.sellerId = ${this.sellerId}
          AND o.paymentStatus = 'COMPLETED'
        GROUP BY u.id, u.user_name, u.email
        ORDER BY order_count DESC, total_spent DESC
        LIMIT 5
      `,
      // 반품 요청 (취소/환불 상태 주문)
      prisma.order.count({
        where: {
          orderItems: {
            some: {
              product: {
                sellerId: this.sellerId,
              },
            },
          },
          orderStatus: {
            in: ["CANCELLED", "REFUNDED"],
          },
        },
      }),
    ]);

    return {
      totalOrders,
      ordersByStatus: ordersByStatus.map((status) => ({
        status: status.status,
        count: parseInt(status.count),
      })),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        recipient: order.recipient,
        status: order.orderStatus,
        amount: parseFloat(order.finalAmount),
        itemCount: parseInt(order.item_count),
        createdAt: order.createdAt,
      })),
      orderTrends: orderTrends.map((trend) => ({
        date: trend.order_date,
        orderCount: parseInt(trend.order_count),
      })),
      topCustomers: topCustomers.map((customer) => ({
        id: customer.id,
        name: customer.user_name,
        email: customer.email,
        orderCount: parseInt(customer.order_count),
        totalSpent: parseFloat(customer.total_spent),
      })),
      returnRequests,
    };
  }

  /**
   * ⭐ 리뷰 통계
   */
  async getReviewStats() {
    const [
      totalReviews,
      averageRating,
      ratingDistribution,
      recentReviews,
      reviewsWithImages,
      responseRate,
    ] = await Promise.all([
      // 총 리뷰 수
      prisma.review.count({
        where: {
          product: {
            sellerId: this.sellerId,
          },
        },
      }),
      // 평균 평점
      prisma.review.aggregate({
        _avg: {
          rating: true,
        },
        where: {
          product: {
            sellerId: this.sellerId,
          },
        },
      }),
      // 평점 분포
      prisma.review.groupBy({
        by: ["rating"],
        _count: {
          id: true,
        },
        where: {
          product: {
            sellerId: this.sellerId,
          },
        },
        orderBy: {
          rating: "desc",
        },
      }),
      // 최근 리뷰 10건
      prisma.review.findMany({
        where: {
          product: {
            sellerId: this.sellerId,
          },
        },
        select: {
          id: true,
          rating: true,
          content: true,
          createdAt: true,
          user: {
            select: {
              user_name: true,
            },
          },
          product: {
            select: {
              displayName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
      // 이미지 포함 리뷰 수
      prisma.review.count({
        where: {
          product: {
            sellerId: this.sellerId,
          },
          images: {
            some: {},
          },
        },
      }),
      // 응답률 (필요시 구현)
      0, // 임시값
    ]);

    return {
      totalReviews,
      averageRating: averageRating._avg.rating || 0,
      ratingDistribution: ratingDistribution.map((dist) => ({
        rating: dist.rating,
        count: dist._count.id,
      })),
      recentReviews,
      reviewsWithImages,
      responseRate,
    };
  }

  /**
   * 📊 재고 관리
   */
  async getInventoryStats() {
    const [
      lowStockProducts,
      outOfStockProducts,
      topSellingProducts,
      slowMovingProducts,
      stockValueAnalysis,
    ] = await Promise.all([
      // 재고 부족 상품 (10개 이하)
      prisma.product.findMany({
        where: {
          sellerId: this.sellerId,
          stockQuantity: {
            lte: 10,
          },
          saleStatus: "ON_SALE",
        },
        select: {
          id: true,
          displayName: true,
          stockQuantity: true,
          prices: {
            select: {
              salePrice: true,
            },
          },
        },
        orderBy: {
          stockQuantity: "asc",
        },
      }),
      // 품절 상품
      prisma.product.findMany({
        where: {
          sellerId: this.sellerId,
          OR: [{ stockQuantity: 0 }, { saleStatus: "OUT_OF_STOCK" }],
        },
        select: {
          id: true,
          displayName: true,
          stockQuantity: true,
          saleStatus: true,
        },
      }),
      // 빨리 팔리는 상품 (최근 30일)
      prisma.$queryRaw`
        SELECT 
          p.id,
          p.displayName,
          p.stockQuantity,
          SUM(oi.quantity) as sold_quantity,
          pp.salePrice
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.productId
        LEFT JOIN orders o ON oi.orderId = o.id 
        LEFT JOIN product_prices pp ON p.id = pp.productId
        WHERE p.sellerId = ${this.sellerId}
          AND o.paymentStatus = 'COMPLETED'
          AND o.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY p.id, p.displayName, p.stockQuantity, pp.salePrice
        ORDER BY sold_quantity DESC
        LIMIT 10
      `,
      // 느리게 팔리는 상품 (30일간 판매 없음)
      prisma.$queryRaw`
        SELECT 
          p.id,
          p.displayName,
          p.stockQuantity,
          pp.salePrice,
          p.createdAt
        FROM products p
        LEFT JOIN product_prices pp ON p.id = pp.productId
        WHERE p.sellerId = ${this.sellerId}
          AND p.id NOT IN (
            SELECT DISTINCT oi.productId 
            FROM order_items oi
            JOIN orders o ON oi.orderId = o.id
            WHERE o.paymentStatus = 'COMPLETED'
              AND o.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          )
          AND p.saleStatus = 'ON_SALE'
        ORDER BY p.createdAt ASC
        LIMIT 10
      `,
      // 재고 가치 분석
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_products,
          SUM(p.stockQuantity * pp.salePrice) as total_stock_value,
          AVG(p.stockQuantity) as avg_stock_quantity
        FROM products p
        JOIN product_prices pp ON p.id = pp.productId
        WHERE p.sellerId = ${this.sellerId}
          AND p.saleStatus = 'ON_SALE'
      `,
    ]);

    return {
      lowStockProducts,
      outOfStockProducts,
      topSellingProducts: topSellingProducts.map((product) => ({
        id: product.id,
        name: product.displayName,
        stockQuantity: product.stockQuantity,
        soldQuantity: parseInt(product.sold_quantity) || 0,
        price: parseFloat(product.salePrice) || 0,
      })),
      slowMovingProducts: slowMovingProducts.map((product) => ({
        id: product.id,
        name: product.displayName,
        stockQuantity: product.stockQuantity,
        price: parseFloat(product.salePrice) || 0,
        createdAt: product.createdAt,
      })),
      stockValueAnalysis: stockValueAnalysis[0]
        ? {
            totalProducts: parseInt(stockValueAnalysis[0].total_products) || 0,
            totalStockValue:
              parseFloat(stockValueAnalysis[0].total_stock_value) || 0,
            avgStockQuantity:
              parseFloat(stockValueAnalysis[0].avg_stock_quantity) || 0,
          }
        : null,
    };
  }

  /**
   * 💰 정산 정보
   */
  async getSettlementInfo() {
    const thisMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const lastMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 1,
      1
    );

    const [thisMonthSales, lastMonthSales, pendingSettlement, totalCommission] =
      await Promise.all([
        // 이번 달 매출
        prisma.orderItem.aggregate({
          _sum: {
            totalPrice: true,
          },
          _count: {
            id: true,
          },
          where: {
            product: {
              sellerId: this.sellerId,
            },
            order: {
              paymentStatus: "COMPLETED",
              createdAt: {
                gte: thisMonth,
              },
            },
          },
        }),
        // 지난 달 매출
        prisma.orderItem.aggregate({
          _sum: {
            totalPrice: true,
          },
          _count: {
            id: true,
          },
          where: {
            product: {
              sellerId: this.sellerId,
            },
            order: {
              paymentStatus: "COMPLETED",
              createdAt: {
                gte: lastMonth,
                lt: thisMonth,
              },
            },
          },
        }),
        // 정산 대기 금액 (배송완료 상태)
        prisma.orderItem.aggregate({
          _sum: {
            totalPrice: true,
          },
          where: {
            product: {
              sellerId: this.sellerId,
            },
            order: {
              paymentStatus: "COMPLETED",
              orderStatus: "DELIVERED",
            },
          },
        }),
        // 수수료 계산 (매출의 5% 가정)
        prisma.orderItem.aggregate({
          _sum: {
            totalPrice: true,
          },
          where: {
            product: {
              sellerId: this.sellerId,
            },
            order: {
              paymentStatus: "COMPLETED",
            },
          },
        }),
      ]);

    const thisMonthRevenue = thisMonthSales._sum.totalPrice || 0;
    const lastMonthRevenue = lastMonthSales._sum.totalPrice || 0;
    const commission = (totalCommission._sum.totalPrice || 0) * 0.05; // 5% 수수료

    return {
      thisMonthRevenue,
      lastMonthRevenue,
      revenueGrowth:
        lastMonthRevenue === 0
          ? 0
          : Math.round(
              ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 10000
            ) / 100,
      thisMonthOrders: thisMonthSales._count.id,
      pendingSettlement: pendingSettlement._sum.totalPrice || 0,
      totalCommission: commission,
      netRevenue: thisMonthRevenue - thisMonthRevenue * 0.05,
    };
  }
}

module.exports = SellerDashboard;
