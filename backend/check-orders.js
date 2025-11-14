const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    const count = await prisma.order.count();
    console.log(`총 주문 수: ${count}`);

    if (count > 0) {
      const orders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          orderStatus: true,
          totalAmount: true,
          finalAmount: true,
          createdAt: true,
        }
      });

      console.log('\n최근 주문 5개:');
      orders.forEach(order => {
        console.log(`- ID: ${order.id}, 주문번호: ${order.orderNumber}, 상태: ${order.orderStatus}, 금액: ${order.finalAmount}원`);
      });
    } else {
      console.log('주문 데이터가 없습니다.');
    }
  } catch (error) {
    console.error('오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
