const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createSimpleSettlementData() {
  try {
    console.log('=== Creating Simple Settlement Data for Seller1 ===');

    // First, check if seller1 exists
    const seller1 = await prisma.sellers.findUnique({
      where: { id: BigInt(1) }
    });

    if (!seller1) {
      console.error('Seller1 not found!');
      return;
    }

    console.log('Found seller1:', seller1.businessName || seller1.name);

    // Create a settlement period for the last month (COMPLETED)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    const settlementDate = new Date();
    settlementDate.setDate(settlementDate.getDate() - 5); // Settled 5 days ago

    console.log('Creating settlement period (COMPLETED):', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      settlementDate: settlementDate.toISOString()
    });

    const completedPeriod = await prisma.settlementPeriod.create({
      data: {
        periodType: 'MONTHLY',
        startDate,
        endDate,
        settlementDate,
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });

    console.log('Created settlement period:', completedPeriod.id);

    // Create settlement with sample amounts
    const totalOrderAmount = 1250000; // 125만원
    const totalCommission = 62500;    // 5% commission
    const totalDeliveryFee = 15000;   // 배송비
    const finalSettlementAmount = totalOrderAmount - totalCommission;

    const completedSettlement = await prisma.settlement.create({
      data: {
        settlementPeriodId: completedPeriod.id,
        sellerId: BigInt(1),
        totalOrderAmount,
        totalCommission,
        totalDeliveryFee,
        totalRefundAmount: 0,
        totalCancelAmount: 0,
        adjustmentAmount: 0,
        finalSettlementAmount,
        status: 'COMPLETED',
        settledAt: settlementDate,
        memo: 'Sample completed settlement data for testing',
        updatedAt: new Date()
      }
    });

    console.log('Created completed settlement:', completedSettlement.id);

    // Create current month settlement period (PREPARING)
    const currentDate = new Date();
    const currentStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const nextSettlementDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 5);

    const preparingPeriod = await prisma.settlementPeriod.create({
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
        settlementPeriodId: preparingPeriod.id,
        sellerId: BigInt(1),
        totalOrderAmount: 890000,
        totalCommission: 44500,
        totalDeliveryFee: 12000,
        totalRefundAmount: 50000,
        totalCancelAmount: 30000,
        adjustmentAmount: 0,
        finalSettlementAmount: 763500,
        status: 'PENDING',
        memo: 'Current month settlement (pending)',
        updatedAt: new Date()
      }
    });

    console.log('Created pending settlement for current period:', pendingSettlement.id);

    // Create a PROCESSING settlement period for last week
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const weekStart = new Date(lastWeek);
    weekStart.setDate(weekStart.getDate() - 6); // Start of last week
    const weekEnd = lastWeek;
    const weekSettlementDate = new Date();
    weekSettlementDate.setDate(weekSettlementDate.getDate() + 3);

    const processingPeriod = await prisma.settlementPeriod.create({
      data: {
        periodType: 'WEEKLY',
        startDate: weekStart,
        endDate: weekEnd,
        settlementDate: weekSettlementDate,
        status: 'PROCESSING',
        updatedAt: new Date()
      }
    });

    const processingSettlement = await prisma.settlement.create({
      data: {
        settlementPeriodId: processingPeriod.id,
        sellerId: BigInt(1),
        totalOrderAmount: 320000,
        totalCommission: 16000,
        totalDeliveryFee: 6000,
        totalRefundAmount: 0,
        totalCancelAmount: 0,
        adjustmentAmount: 5000, // 조정 금액
        finalSettlementAmount: 309000,
        status: 'CALCULATING',
        memo: 'Weekly settlement being processed',
        updatedAt: new Date()
      }
    });

    console.log('Created processing settlement:', processingSettlement.id);

    console.log('✅ Settlement data creation completed successfully!');
    console.log('Created data summary:');
    console.log('- 1 COMPLETED settlement: ₩' + finalSettlementAmount.toLocaleString());
    console.log('- 1 PENDING settlement: ₩763,500');
    console.log('- 1 CALCULATING settlement: ₩309,000');

  } catch (error) {
    console.error('❌ Error creating settlement data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSimpleSettlementData();