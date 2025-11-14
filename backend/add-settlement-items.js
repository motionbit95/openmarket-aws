const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSettlementItems() {
  try {
    // 제품 목록 (실제 seller1의 제품들)
    const products = [
      { name: '스마트폰 케이스', sku: 'CASE001', price: 19900 },
      { name: '노트북 파우치', sku: 'POUCH001', price: 29900 },
      { name: '블루투스 이어폰', sku: 'BT001', price: 89000 },
      { name: '무선 마우스', sku: 'MOUSE001', price: 45000 },
      { name: '키보드 커버', sku: 'COVER001', price: 15900 },
      { name: 'USB 허브', sku: 'HUB001', price: 35000 },
      { name: '태블릿 스탠드', sku: 'STAND001', price: 25000 },
      { name: '충전기', sku: 'CHARGER001', price: 39000 }
    ];

    // Settlement ID 3번 (PENDING)에 아이템 추가
    const settlement3Items = [
      {
        settlementId: BigInt(3),
        orderId: BigInt(101),
        orderItemId: BigInt(201),
        productName: products[0].name,
        skuCode: products[0].sku,
        quantity: 2,
        unitPrice: products[0].price,
        totalPrice: products[0].price * 2,
        commissionRate: 0.1,
        commissionAmount: Math.floor(products[0].price * 2 * 0.1),
        settlementAmount: Math.floor(products[0].price * 2 * 0.9),
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID'
      },
      {
        settlementId: BigInt(3),
        orderId: BigInt(102),
        orderItemId: BigInt(202),
        productName: products[2].name,
        skuCode: products[2].sku,
        quantity: 1,
        unitPrice: products[2].price,
        totalPrice: products[2].price,
        commissionRate: 0.1,
        commissionAmount: Math.floor(products[2].price * 0.1),
        settlementAmount: Math.floor(products[2].price * 0.9),
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID'
      },
      {
        settlementId: BigInt(3),
        orderId: BigInt(103),
        orderItemId: BigInt(203),
        productName: products[3].name,
        skuCode: products[3].sku,
        quantity: 3,
        unitPrice: products[3].price,
        totalPrice: products[3].price * 3,
        commissionRate: 0.1,
        commissionAmount: Math.floor(products[3].price * 3 * 0.1),
        settlementAmount: Math.floor(products[3].price * 3 * 0.9),
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID'
      }
    ];

    // Settlement ID 4번 (CALCULATING)에 아이템 추가
    const settlement4Items = [
      {
        settlementId: BigInt(4),
        orderId: BigInt(104),
        orderItemId: BigInt(204),
        productName: products[4].name,
        skuCode: products[4].sku,
        quantity: 5,
        unitPrice: products[4].price,
        totalPrice: products[4].price * 5,
        commissionRate: 0.1,
        commissionAmount: Math.floor(products[4].price * 5 * 0.1),
        settlementAmount: Math.floor(products[4].price * 5 * 0.9),
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID'
      },
      {
        settlementId: BigInt(4),
        orderId: BigInt(105),
        orderItemId: BigInt(205),
        productName: products[5].name,
        skuCode: products[5].sku,
        quantity: 2,
        unitPrice: products[5].price,
        totalPrice: products[5].price * 2,
        commissionRate: 0.1,
        commissionAmount: Math.floor(products[5].price * 2 * 0.1),
        settlementAmount: Math.floor(products[5].price * 2 * 0.9),
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID'
      },
      {
        settlementId: BigInt(4),
        orderId: BigInt(106),
        orderItemId: BigInt(206),
        productName: products[6].name,
        skuCode: products[6].sku,
        quantity: 1,
        unitPrice: products[6].price,
        totalPrice: products[6].price,
        commissionRate: 0.1,
        commissionAmount: Math.floor(products[6].price * 0.1),
        settlementAmount: Math.floor(products[6].price * 0.9),
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID'
      },
      {
        settlementId: BigInt(4),
        orderId: BigInt(107),
        orderItemId: BigInt(207),
        productName: products[7].name,
        skuCode: products[7].sku,
        quantity: 4,
        unitPrice: products[7].price,
        totalPrice: products[7].price * 4,
        commissionRate: 0.1,
        commissionAmount: Math.floor(products[7].price * 4 * 0.1),
        settlementAmount: Math.floor(products[7].price * 4 * 0.9),
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID'
      }
    ];

    // Settlement ID 2번에도 추가 아이템 넣기
    const settlement2Items = [
      {
        settlementId: BigInt(2),
        orderId: BigInt(108),
        orderItemId: BigInt(208),
        productName: products[1].name,
        skuCode: products[1].sku,
        quantity: 2,
        unitPrice: products[1].price,
        totalPrice: products[1].price * 2,
        commissionRate: 0.1,
        commissionAmount: Math.floor(products[1].price * 2 * 0.1),
        settlementAmount: Math.floor(products[1].price * 2 * 0.9),
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID'
      },
      {
        settlementId: BigInt(2),
        orderId: BigInt(109),
        orderItemId: BigInt(209),
        productName: products[4].name,
        skuCode: products[4].sku,
        quantity: 3,
        unitPrice: products[4].price,
        totalPrice: products[4].price * 3,
        commissionRate: 0.1,
        commissionAmount: Math.floor(products[4].price * 3 * 0.1),
        settlementAmount: Math.floor(products[4].price * 3 * 0.9),
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID'
      }
    ];

    // 각 정산의 아이템들 추가
    console.log('Adding items to Settlement ID 3...');
    for (const item of settlement3Items) {
      await prisma.settlementItem.create({ data: item });
    }

    console.log('Adding items to Settlement ID 4...');
    for (const item of settlement4Items) {
      await prisma.settlementItem.create({ data: item });
    }

    console.log('Adding items to Settlement ID 2...');
    for (const item of settlement2Items) {
      await prisma.settlementItem.create({ data: item });
    }

    // 정산 총액 업데이트
    console.log('Updating settlement totals...');
    const settlements = await prisma.settlement.findMany({
      where: { sellerId: BigInt(1) },
      include: { SettlementItem: true }
    });

    for (const settlement of settlements) {
      const totalOrderAmount = settlement.SettlementItem.reduce((sum, item) => sum + item.totalPrice, 0);
      const totalCommission = settlement.SettlementItem.reduce((sum, item) => sum + item.commissionAmount, 0);
      const finalSettlementAmount = settlement.SettlementItem.reduce((sum, item) => sum + item.settlementAmount, 0);

      await prisma.settlement.update({
        where: { id: settlement.id },
        data: {
          totalOrderAmount,
          totalCommission,
          finalSettlementAmount
        }
      });

      console.log(`Updated Settlement ${settlement.id}: Order=${totalOrderAmount}, Commission=${totalCommission}, Final=${finalSettlementAmount}`);
    }

    console.log('Settlement items added and totals updated successfully!');

  } catch (error) {
    console.error('Error adding settlement items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSettlementItems();