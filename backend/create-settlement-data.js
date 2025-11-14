const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createSettlementData() {
  try {
    console.log('=== Creating Settlement Data for Seller1 ===');

    // First, check if seller1 exists
    const seller1 = await prisma.sellers.findUnique({
      where: { id: BigInt(1) }
    });

    if (!seller1) {
      console.error('Seller1 not found!');
      return;
    }

    console.log('Found seller1:', seller1.businessName);

    // Get some completed orders for seller1 to create settlement data
    const seller1Orders = await prisma.order.findMany({
      where: {
        OrderItem: {
          some: {
            Product: {
              sellerId: BigInt(1)
            }
          }
        },
        orderStatus: 'DELIVERED',
        paymentStatus: 'COMPLETED'
      },
      include: {
        OrderItem: {
          where: {
            Product: {
              sellerId: BigInt(1)
            }
          },
          include: {
            Product: true,
            ProductSKU: true
          }
        }
      },
      take: 15 // Get 15 orders for settlement data
    });

    console.log(`Found ${seller1Orders.length} completed orders for seller1`);

    if (seller1Orders.length === 0) {
      console.log('No completed orders found for seller1. Creating settlement anyway...');
    }

    // Create a settlement period for the last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    const settlementDate = new Date();
    settlementDate.setDate(settlementDate.getDate() + 7); // Settlement in 7 days

    console.log('Creating settlement period:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      settlementDate: settlementDate.toISOString()
    });

    const settlementPeriod = await prisma.settlementPeriod.create({
      data: {
        periodType: 'MONTHLY',
        startDate,
        endDate,
        settlementDate,
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });

    console.log('Created settlement period:', settlementPeriod.id);

    // Calculate settlement amounts
    let totalOrderAmount = 0;
    let totalCommission = 0;
    let totalDeliveryFee = 0;

    const settlementItems = [];

    seller1Orders.forEach(order => {
      order.OrderItem.forEach(item => {
        const commissionRate = 0.05; // 5% commission rate
        const itemTotal = item.price * item.quantity;
        const itemCommission = itemTotal * commissionRate;
        const itemDeliveryFee = 3000; // 3000원 delivery fee per item

        totalOrderAmount += itemTotal;
        totalCommission += itemCommission;
        totalDeliveryFee += itemDeliveryFee;

        settlementItems.push({
          orderId: Number(order.id),
          orderItemId: Number(item.id),
          productName: item.Product.name,
          skuCode: item.ProductSKU?.skuCode || null,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: itemTotal,
          commissionRate: commissionRate,
          commissionAmount: itemCommission,
          deliveryFee: itemDeliveryFee,
          settlementAmount: itemTotal - itemCommission,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus
        });
      });
    });

    const finalSettlementAmount = totalOrderAmount - totalCommission - totalDeliveryFee;

    console.log('Settlement calculation:', {
      totalOrderAmount,
      totalCommission,
      totalDeliveryFee,
      finalSettlementAmount
    });

    // Create the settlement record
    const settlement = await prisma.settlement.create({
      data: {
        settlementPeriodId: settlementPeriod.id,
        sellerId: BigInt(1),
        totalOrderAmount,
        totalCommission,
        totalDeliveryFee,
        totalRefundAmount: 0,
        totalCancelAmount: 0,
        adjustmentAmount: 0,
        finalSettlementAmount,
        status: 'COMPLETED',
        settledAt: new Date(),
        memo: 'Sample settlement data for testing',
        updatedAt: new Date()
      }
    });

    console.log('Created settlement:', settlement.id);

    // Create settlement items
    if (settlementItems.length > 0) {
      for (const item of settlementItems) {
        await prisma.settlementItem.create({
          data: {
            settlementId: settlement.id,
            ...item
          }
        });
      }
      console.log(`Created ${settlementItems.length} settlement items`);
    }

    // Create another settlement period (PREPARING status) for current month
    const currentDate = new Date();
    const currentStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const nextSettlementDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 5);

    const currentSettlementPeriod = await prisma.settlementPeriod.create({
      data: {
        periodType: 'MONTHLY',
        startDate: currentStartDate,
        endDate: currentEndDate,
        settlementDate: nextSettlementDate,
        status: 'PREPARING',
        updatedAt: new Date()
      }
    });

    // Create pending settlement for current period
    const pendingSettlement = await prisma.settlement.create({
      data: {
        settlementPeriodId: currentSettlementPeriod.id,
        sellerId: BigInt(1),
        totalOrderAmount: 450000,
        totalCommission: 22500,
        totalDeliveryFee: 12000,
        totalRefundAmount: 0,
        totalCancelAmount: 0,
        adjustmentAmount: 0,
        finalSettlementAmount: 415500,
        status: 'PENDING',
        memo: 'Current month settlement (pending)',
        updatedAt: new Date()
      }
    });

    console.log('Created pending settlement for current period:', pendingSettlement.id);
    console.log('✅ Settlement data creation completed!');

  } catch (error) {
    console.error('❌ Error creating settlement data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSettlementData();