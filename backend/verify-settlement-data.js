const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function verifySettlementData() {
  try {
    console.log('=== Verifying Settlement Data for Seller1 ===');

    // Check settlement periods
    const periods = await prisma.settlementPeriod.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📊 Settlement Periods (${periods.length}):`);
    periods.forEach(period => {
      console.log(`- ID: ${period.id}, Type: ${period.periodType}, Status: ${period.status}`);
      console.log(`  Period: ${period.startDate.toISOString().split('T')[0]} ~ ${period.endDate.toISOString().split('T')[0]}`);
      console.log(`  Settlement Date: ${period.settlementDate.toISOString().split('T')[0]}\n`);
    });

    // Check settlements for seller1
    const settlements = await prisma.settlement.findMany({
      where: { sellerId: BigInt(1) },
      include: {
        SettlementPeriod: true,
        sellers: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`💰 Settlements for Seller1 (${settlements.length}):`);
    settlements.forEach(settlement => {
      console.log(`- ID: ${settlement.id}, Status: ${settlement.status}`);
      console.log(`  Period: ${settlement.SettlementPeriod.periodType} (${settlement.SettlementPeriod.status})`);
      console.log(`  Total Order Amount: ₩${settlement.totalOrderAmount.toLocaleString()}`);
      console.log(`  Commission: ₩${settlement.totalCommission.toLocaleString()}`);
      console.log(`  Final Settlement: ₩${settlement.finalSettlementAmount.toLocaleString()}`);
      console.log(`  Seller: ${settlement.sellers.businessName || settlement.sellers.name}`);
      console.log(`  Memo: ${settlement.memo || 'No memo'}\n`);
    });

    // Check if there are any settlement items
    const settlementItems = await prisma.settlementItem.findMany({
      where: {
        Settlement: {
          sellerId: BigInt(1)
        }
      }
    });

    console.log(`📝 Settlement Items for Seller1: ${settlementItems.length} items`);

    // Summary statistics
    const summary = {
      totalCompleted: settlements.filter(s => s.status === 'COMPLETED').length,
      totalPending: settlements.filter(s => s.status === 'PENDING').length,
      totalCalculating: settlements.filter(s => s.status === 'CALCULATING').length,
      totalAmount: settlements.reduce((sum, s) => sum + s.finalSettlementAmount, 0)
    };

    console.log('\n📈 Settlement Summary:');
    console.log(`- Completed: ${summary.totalCompleted}`);
    console.log(`- Pending: ${summary.totalPending}`);
    console.log(`- Calculating: ${summary.totalCalculating}`);
    console.log(`- Total Settlement Amount: ₩${summary.totalAmount.toLocaleString()}`);

    console.log('\n✅ Settlement data verification completed!');

  } catch (error) {
    console.error('❌ Error verifying settlement data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySettlementData();