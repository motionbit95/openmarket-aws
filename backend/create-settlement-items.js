const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createSettlementItems() {
  try {
    console.log('=== Creating Additional Settlement Items ===');

    // Get seller1's products and orders for settlement items
    const seller1Products = await prisma.product.findMany({
      where: { sellerId: BigInt(1) },
      take: 10
    });

    console.log(`Found ${seller1Products.length} products for seller1`);

    if (seller1Products.length === 0) {
      console.log('No products found for seller1');
      return;
    }

    // Get existing settlements for seller1
    const settlements = await prisma.settlement.findMany({
      where: { sellerId: BigInt(1) },
      include: { SettlementItem: true }
    });

    console.log(`Found ${settlements.length} settlements`);

    // Add settlement items to settlements that don't have them
    for (const settlement of settlements) {
      if (settlement.SettlementItem.length === 0) {
        console.log(`Adding items to settlement ${settlement.id}`);

        // Create 3-5 settlement items per settlement
        const itemCount = Math.floor(Math.random() * 3) + 3;

        for (let i = 0; i < itemCount && i < seller1Products.length; i++) {
          const product = seller1Products[i];
          const quantity = Math.floor(Math.random() * 5) + 1;
          const unitPrice = 15000 + (Math.random() * 35000); // 15k-50k range
          const totalPrice = unitPrice * quantity;
          const commissionRate = 0.05; // 5%
          const commissionAmount = totalPrice * commissionRate;
          const settlementAmount = totalPrice - commissionAmount;

          await prisma.settlementItem.create({
            data: {
              settlementId: settlement.id,
              orderId: BigInt(154 + i),
              orderItemId: BigInt(264 + i),
              productName: product.name,
              skuCode: product.productCode || `SKU-${product.id}`,
              quantity: quantity,
              unitPrice: unitPrice,
              totalPrice: totalPrice,
              commissionRate: commissionRate,
              commissionAmount: commissionAmount,
              deliveryFee: 0,
              settlementAmount: settlementAmount,
              orderStatus: 'DELIVERED',
              paymentStatus: 'COMPLETED'
            }
          });

          console.log(`Created settlement item for product: ${product.name}`);
        }
      }
    }

    // Verify created items
    const allItems = await prisma.settlementItem.findMany({
      where: {
        Settlement: { sellerId: BigInt(1) }
      }
    });

    console.log(`✅ Total settlement items for seller1: ${allItems.length}`);

  } catch (error) {
    console.error('❌ Error creating settlement items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSettlementItems();