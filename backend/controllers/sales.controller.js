const prisma = require("../config/prisma");
const { convertBigIntToString, parseBigIntId } = require("../utils/bigint");

/**
 * 매출 데이터 조회
 * GET /sales
 */
exports.getSalesData = async (req, res) => {
  try {
    const { type = 'overview', startDate, endDate } = req.query;

    // 날짜 필터 설정
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const whereClause = {
      paymentStatus: 'COMPLETED',
      ...(startDate || endDate ? { createdAt: dateFilter } : {}),
    };

    switch (type) {
      case 'overview':
        return await this.getSalesOverview(req, res, whereClause);
      case 'daily':
        return await this.getDailySales(req, res, whereClause);
      case 'monthly':
        return await this.getMonthlySales(req, res, whereClause);
      case 'products':
        return await this.getProductSales(req, res, whereClause);
      case 'partners':
        return await this.getPartnerSales(req, res, whereClause);
      default:
        return await this.getSalesOverview(req, res, whereClause);
    }
  } catch (error) {
    console.error("Sales data fetch error:", error);
    res.status(500).json({ error: "매출 데이터 조회 중 오류가 발생했습니다." });
  }
};

/**
 * 매출 개요 조회
 */
exports.getSalesOverview = async (req, res, whereClause) => {
  // 총 매출액
  const totalSales = await prisma.Order.aggregate({
    where: whereClause,
    _sum: { finalAmount: true },
  });

  // 총 주문 건수
  const totalOrders = await prisma.Order.count({
    where: whereClause,
  });

  // 평균 주문 금액
  const averageOrderValue = totalOrders > 0
    ? Number(totalSales._sum.finalAmount || 0) / totalOrders
    : 0;

  // 수수료 총액 (기본 10% 수수료로 계산)
  const commissionAmount = Number(totalSales._sum.finalAmount || 0) * 0.1;

  const overview = {
    totalSales: Number(totalSales._sum.finalAmount || 0),
    totalOrders,
    averageOrderValue,
    commissionAmount,
  };

  res.json({
    overview,
    list: [], // 개요에서는 빈 리스트
  });
};

/**
 * 일별 매출 조회
 */
exports.getDailySales = async (req, res, whereClause) => {
  const dailySales = await prisma.$queryRaw`
    SELECT
      DATE(createdAt) as date,
      SUM(finalAmount) as salesAmount,
      COUNT(*) as orderCount,
      SUM(finalAmount) * 0.1 as commissionAmount,
      SUM(finalAmount) * 0.9 as settlementAmount
    FROM Order
    WHERE paymentStatus = 'COMPLETED'
      ${whereClause.createdAt?.gte ? `AND createdAt >= ${whereClause.createdAt.gte}` : ''}
      ${whereClause.createdAt?.lte ? `AND createdAt <= ${whereClause.createdAt.lte}` : ''}
    GROUP BY DATE(createdAt)
    ORDER BY date DESC
  `;

  const overview = {
    totalSales: dailySales.reduce((sum, item) => sum + Number(item.salesAmount), 0),
    totalOrders: dailySales.reduce((sum, item) => sum + Number(item.orderCount), 0),
    averageOrderValue: 0,
    commissionAmount: dailySales.reduce((sum, item) => sum + Number(item.commissionAmount), 0),
  };

  if (overview.totalOrders > 0) {
    overview.averageOrderValue = overview.totalSales / overview.totalOrders;
  }

  const list = dailySales.map(item => ({
    date: item.date,
    salesAmount: Number(item.salesAmount),
    orderCount: Number(item.orderCount),
    commissionAmount: Number(item.commissionAmount),
    settlementAmount: Number(item.settlementAmount),
  }));

  res.json({ overview, list });
};

/**
 * 월별 매출 조회
 */
exports.getMonthlySales = async (req, res, whereClause) => {
  const monthlySales = await prisma.$queryRaw`
    SELECT
      DATE_FORMAT(createdAt, '%Y-%m') as month,
      SUM(finalAmount) as salesAmount,
      COUNT(*) as orderCount,
      SUM(finalAmount) * 0.1 as commissionAmount,
      SUM(finalAmount) * 0.9 as settlementAmount
    FROM Order
    WHERE paymentStatus = 'COMPLETED'
      ${whereClause.createdAt?.gte ? `AND createdAt >= ${whereClause.createdAt.gte}` : ''}
      ${whereClause.createdAt?.lte ? `AND createdAt <= ${whereClause.createdAt.lte}` : ''}
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
    ORDER BY month DESC
  `;

  const overview = {
    totalSales: monthlySales.reduce((sum, item) => sum + Number(item.salesAmount), 0),
    totalOrders: monthlySales.reduce((sum, item) => sum + Number(item.orderCount), 0),
    averageOrderValue: 0,
    commissionAmount: monthlySales.reduce((sum, item) => sum + Number(item.commissionAmount), 0),
  };

  if (overview.totalOrders > 0) {
    overview.averageOrderValue = overview.totalSales / overview.totalOrders;
  }

  const list = monthlySales.map(item => ({
    month: item.month,
    salesAmount: Number(item.salesAmount),
    orderCount: Number(item.orderCount),
    commissionAmount: Number(item.commissionAmount),
    settlementAmount: Number(item.settlementAmount),
  }));

  res.json({ overview, list });
};

/**
 * 상품별 매출 조회
 */
exports.getProductSales = async (req, res, whereClause) => {
  const productSales = await prisma.OrderItem.groupBy({
    by: ['productId'],
    where: {
      Order: whereClause,
    },
    _sum: {
      totalPrice: true,
      quantity: true,
    },
    _count: true,
  });

  const productIds = productSales.map(item => item.productId);

  const products = await prisma.Product.findMany({
    where: { id: { in: productIds } },
  });

  // Get seller info for products
  const sellerIds = [...new Set(products.map(p => p.sellerId))];
  const sellers = await prisma.users.findMany({
    where: { id: { in: sellerIds } },
    select: { id: true, user_name: true },
  });

  const list = productSales.map(item => {
    const product = products.find(p => p.id === item.productId);
    const seller = sellers.find(s => s.id === product?.sellerId);
    const salesAmount = Number(item._sum.totalPrice);
    const commissionRate = 10; // 기본 10%
    const commissionAmount = salesAmount * (commissionRate / 100);

    return {
      productName: product?.displayName || 'Unknown Product',
      partnerName: seller?.user_name || 'Unknown Partner',
      quantity: Number(item._sum.quantity),
      salesAmount,
      commissionRate,
      commissionAmount,
    };
  });

  const overview = {
    totalSales: list.reduce((sum, item) => sum + item.salesAmount, 0),
    totalOrders: list.length,
    averageOrderValue: list.length > 0 ? list.reduce((sum, item) => sum + item.salesAmount, 0) / list.length : 0,
    commissionAmount: list.reduce((sum, item) => sum + item.commissionAmount, 0),
  };

  res.json({ overview, list });
};

/**
 * 판매자별 매출 조회
 */
exports.getPartnerSales = async (req, res, whereClause) => {
  const partnerSales = await prisma.$queryRaw`
    SELECT
      p.sellerId,
      u.user_name as partnerName,
      u.email as partnerEmail,
      COUNT(DISTINCT p.id) as productCount,
      SUM(oi.totalPrice) as salesAmount,
      10 as commissionRate,
      SUM(oi.totalPrice) * 0.1 as commissionAmount,
      SUM(oi.totalPrice) * 0.9 as settlementAmount
    FROM OrderItem oi
    JOIN \`Order\` o ON oi.orderId = o.id
    JOIN Product p ON oi.productId = p.id
    JOIN users u ON p.sellerId = u.id
    WHERE o.paymentStatus = 'COMPLETED'
      ${whereClause.createdAt?.gte ? `AND o.createdAt >= ${whereClause.createdAt.gte}` : ''}
      ${whereClause.createdAt?.lte ? `AND o.createdAt <= ${whereClause.createdAt.lte}` : ''}
    GROUP BY p.sellerId, u.user_name, u.email
    ORDER BY salesAmount DESC
  `;

  const list = partnerSales.map(item => ({
    partnerName: item.partnerName,
    partnerEmail: item.partnerEmail,
    productCount: Number(item.productCount),
    salesAmount: Number(item.salesAmount),
    commissionRate: Number(item.commissionRate),
    settlementAmount: Number(item.settlementAmount),
  }));

  const overview = {
    totalSales: list.reduce((sum, item) => sum + item.salesAmount, 0),
    totalOrders: list.length,
    averageOrderValue: list.length > 0 ? list.reduce((sum, item) => sum + item.salesAmount, 0) / list.length : 0,
    commissionAmount: list.reduce((sum, item) => sum + item.settlementAmount * 0.1, 0),
  };

  res.json({ overview, list });
};

/**
 * 매출 통계 조회
 */
exports.getSalesStats = async (req, res) => {
  try {
    // 이번 달 매출
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const nextMonth = new Date(thisMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const thisMonthSales = await prisma.Order.aggregate({
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: thisMonth,
          lt: nextMonth,
        },
      },
      _sum: { finalAmount: true },
      _count: true,
    });

    // 지난 달 매출
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastMonthSales = await prisma.Order.aggregate({
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: lastMonth,
          lt: thisMonth,
        },
      },
      _sum: { finalAmount: true },
      _count: true,
    });

    const stats = {
      thisMonth: {
        sales: Number(thisMonthSales._sum.finalAmount || 0),
        orders: thisMonthSales._count,
      },
      lastMonth: {
        sales: Number(lastMonthSales._sum.finalAmount || 0),
        orders: lastMonthSales._count,
      },
      growth: {
        sales: lastMonthSales._sum.finalAmount
          ? ((Number(thisMonthSales._sum.finalAmount || 0) - Number(lastMonthSales._sum.finalAmount)) / Number(lastMonthSales._sum.finalAmount)) * 100
          : 0,
        orders: lastMonthSales._count
          ? ((thisMonthSales._count - lastMonthSales._count) / lastMonthSales._count) * 100
          : 0,
      },
    };

    res.json(convertBigIntToString(stats));
  } catch (error) {
    console.error("Sales stats fetch error:", error);
    res.status(500).json({ error: "매출 통계 조회 중 오류가 발생했습니다." });
  }
};

/**
 * 매출 데이터 Excel 다운로드
 */
exports.exportSalesData = async (req, res) => {
  try {
    // Excel 다운로드 기능은 추후 구현
    // xlsx 라이브러리를 사용하여 구현 가능
    res.json({ message: "Excel 다운로드 기능은 추후 구현 예정입니다." });
  } catch (error) {
    console.error("Sales data export error:", error);
    res.status(500).json({ error: "매출 데이터 내보내기 중 오류가 발생했습니다." });
  }
};