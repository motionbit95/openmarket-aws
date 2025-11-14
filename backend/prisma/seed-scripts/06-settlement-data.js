const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createSettlementData() {
  console.log("🏦 정산 시스템 더미 데이터 생성 시작...");

  try {
    // 1. 수수료 정책 생성
    console.log("💰 수수료 정책 생성...");

    // 기본 수수료 정책 (전체 적용)
    const defaultCommissionPolicy = await prisma.commissionPolicy.create({
      data: {
        name: "기본 수수료 정책",
        commissionRate: 5.0,
        isActive: true,
        effectiveDate: new Date("2024-01-01"),
      },
    });

    // 전자제품 카테고리 수수료 (낮은 수수료)
    const electronicsCommissionPolicy = await prisma.commissionPolicy.create({
      data: {
        name: "전자제품 수수료 정책",
        categoryCode: "electronics",
        commissionRate: 3.0,
        isActive: true,
        effectiveDate: new Date("2024-01-01"),
      },
    });

    // 패션 카테고리 수수료 (높은 수수료)
    const fashionCommissionPolicy = await prisma.commissionPolicy.create({
      data: {
        name: "패션 수수료 정책",
        categoryCode: "fashion",
        commissionRate: 7.0,
        isActive: true,
        effectiveDate: new Date("2024-01-01"),
      },
    });

    // VIP 판매자 특별 수수료 (첫 번째 판매자에게 적용)
    const firstSeller = await prisma.sellers.findFirst();
    if (firstSeller) {
      await prisma.commissionPolicy.create({
        data: {
          name: "VIP 판매자 특별 수수료",
          sellerId: firstSeller.id,
          commissionRate: 2.5,
          isActive: true,
          effectiveDate: new Date("2024-01-01"),
        },
      });
    }

    console.log(`✅ 수수료 정책 ${4}개 생성 완료`);

    // 2. 정산 기간 생성 (지난 달과 이번 달)
    console.log("📅 정산 기간 생성...");

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStart = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      1
    );
    const lastMonthEnd = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() + 1,
      0
    );
    const lastMonthSettlementDate = new Date(lastMonthEnd);
    lastMonthSettlementDate.setDate(lastMonthEnd.getDate() + 5); // 5일 후 정산

    const lastMonthPeriod = await prisma.settlementPeriod.create({
      data: {
        periodType: "MONTHLY",
        startDate: lastMonthStart,
        endDate: lastMonthEnd,
        settlementDate: lastMonthSettlementDate,
        status: "COMPLETED",
      },
    });

    const thisMonth = new Date();
    const thisMonthStart = new Date(
      thisMonth.getFullYear(),
      thisMonth.getMonth(),
      1
    );
    const thisMonthEnd = new Date(
      thisMonth.getFullYear(),
      thisMonth.getMonth() + 1,
      0
    );
    const thisMonthSettlementDate = new Date(thisMonthEnd);
    thisMonthSettlementDate.setDate(thisMonthEnd.getDate() + 5);

    const thisMonthPeriod = await prisma.settlementPeriod.create({
      data: {
        periodType: "MONTHLY",
        startDate: thisMonthStart,
        endDate: thisMonthEnd,
        settlementDate: thisMonthSettlementDate,
        status: "PREPARING",
      },
    });

    console.log("✅ 정산 기간 2개 생성 완료");

    // 3. 완료된 주문이 있는지 확인하고, 없으면 샘플 주문 생성
    console.log("📦 주문 데이터 확인 및 생성...");

    const completedOrders = await prisma.order.findMany({
      where: {
        paymentStatus: "COMPLETED",
        orderStatus: "DELIVERED",
      },
      take: 5,
    });

    if (completedOrders.length === 0) {
      console.log("완료된 주문이 없어서 샘플 주문을 생성합니다...");

      // 사용자와 판매자 정보 가져오기
      const users = await prisma.user.findMany({ take: 3 });
      const sellers = await prisma.seller.findMany({ take: 3 });
      const products = await prisma.product.findMany({
        include: { prices: true },
        take: 10,
      });

      if (users.length > 0 && products.length > 0) {
        // 샘플 주문 생성
        for (let i = 0; i < 5; i++) {
          const user = users[i % users.length];
          const product = products[i % products.length];

          const orderNumber = `ORDER-${Date.now()}-${i}`;
          const quantity = Math.floor(Math.random() * 3) + 1;
          const unitPrice = product.prices?.salePrice || 50000;
          const totalPrice = unitPrice * quantity;

          await prisma.order.create({
            data: {
              orderNumber,
              userId: user.id,
              recipient: user.user_name,
              phone: user.phone || "010-1234-5678",
              postcode: "12345",
              address1: "서울시 강남구",
              address2: "테스트동 123-456",
              totalAmount: totalPrice,
              discountAmount: 0,
              deliveryFee: 3000,
              finalAmount: totalPrice + 3000,
              orderStatus: "DELIVERED",
              paymentStatus: "COMPLETED",
              paymentMethod: "CARD",
              paidAt: new Date(
                Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
              ), // 지난 30일 중 랜덤
              orderItems: {
                create: {
                  productId: product.id,
                  quantity,
                  unitPrice,
                  totalPrice,
                  productName: product.displayName,
                  skuCode: null,
                  skuDisplayName: null,
                },
              },
            },
          });
        }
        console.log("✅ 샘플 주문 5개 생성 완료");
      }
    }

    // 4. 지난 달 정산 데이터 생성
    console.log("💹 지난 달 정산 데이터 생성...");

    const lastMonthOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
        paymentStatus: "COMPLETED",
        orderStatus: "DELIVERED",
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    // 판매자별 정산 데이터 집계
    const sellerSettlements = new Map();

    for (const order of lastMonthOrders) {
      for (const orderItem of order.orderItems) {
        const sellerId = orderItem.product.sellerId;
        const sellerIdStr = sellerId.toString();

        if (!sellerSettlements.has(sellerIdStr)) {
          sellerSettlements.set(sellerIdStr, {
            sellerId,
            totalOrderAmount: 0,
            items: [],
          });
        }

        const settlementData = sellerSettlements.get(sellerIdStr);
        settlementData.totalOrderAmount += orderItem.totalPrice;
        settlementData.items.push({
          orderId: order.id,
          orderItemId: orderItem.id,
          productName: orderItem.productName,
          skuCode: orderItem.skuCode,
          quantity: orderItem.quantity,
          unitPrice: orderItem.unitPrice,
          totalPrice: orderItem.totalPrice,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
        });
      }
    }

    // 정산 생성
    for (const [sellerIdStr, data] of sellerSettlements) {
      const commissionRate = 5.0; // 기본 수수료율
      const totalCommission = data.totalOrderAmount * (commissionRate / 100);
      const finalSettlementAmount = data.totalOrderAmount - totalCommission;

      const settlement = await prisma.settlement.create({
        data: {
          settlementPeriodId: lastMonthPeriod.id,
          sellerId: data.sellerId,
          totalOrderAmount: data.totalOrderAmount,
          totalCommission,
          totalDeliveryFee: 0,
          totalRefundAmount: 0,
          totalCancelAmount: 0,
          finalSettlementAmount,
          status: "COMPLETED",
          settledAt: lastMonthSettlementDate,
        },
      });

      // 정산 상세 항목 생성
      for (const item of data.items) {
        const commissionAmount = item.totalPrice * (commissionRate / 100);
        const settlementAmount = item.totalPrice - commissionAmount;

        await prisma.settlementItem.create({
          data: {
            settlementId: settlement.id,
            orderId: item.orderId,
            orderItemId: item.orderItemId,
            productName: item.productName,
            skuCode: item.skuCode,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            commissionRate,
            commissionAmount,
            settlementAmount,
            orderStatus: item.orderStatus,
            paymentStatus: item.paymentStatus,
          },
        });
      }
    }

    console.log(
      `✅ 지난 달 정산 데이터 ${sellerSettlements.size}개 판매자 정산 생성 완료`
    );

    console.log("🎉 정산 시스템 더미 데이터 생성 완료!");

    // 생성된 데이터 요약 출력
    const totalPolicies = await prisma.commissionPolicy.count();
    const totalPeriods = await prisma.settlementPeriod.count();
    const totalSettlements = await prisma.settlement.count();
    const totalSettlementItems = await prisma.settlementItem.count();

    console.log("📊 생성된 데이터 요약:");
    console.log(`  - 수수료 정책: ${totalPolicies}개`);
    console.log(`  - 정산 기간: ${totalPeriods}개`);
    console.log(`  - 정산 내역: ${totalSettlements}개`);
    console.log(`  - 정산 상세 항목: ${totalSettlementItems}개`);
  } catch (error) {
    console.error("❌ 정산 데이터 생성 중 오류:", error);
    throw error;
  }
}

// 직접 실행시
if (require.main === module) {
  createSettlementData()
    .then(() => {
      console.log("정산 데이터 생성 완료");
      process.exit(0);
    })
    .catch((error) => {
      console.error("정산 데이터 생성 실패:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { createSettlementData };
