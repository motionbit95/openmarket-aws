const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrderStatus() {
  try {
    // 각 상태별 주문 개수 확인
    const statusCounts = await prisma.order.groupBy({
      by: ['orderStatus'],
      _count: {
        orderStatus: true,
      },
    });

    console.log('주문 상태별 개수:');
    statusCounts.forEach(item => {
      console.log(`- ${item.orderStatus}: ${item._count.orderStatus}개`);
    });

    console.log('\n각 상태별 샘플 주문:');
    for (const status of statusCounts) {
      const sample = await prisma.order.findFirst({
        where: { orderStatus: status.orderStatus },
        select: {
          id: true,
          orderNumber: true,
          orderStatus: true,
        }
      });
      console.log(`${status.orderStatus}: ${sample.orderNumber}`);
    }
  } catch (error) {
    console.error('오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrderStatus();
