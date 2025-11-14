const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    // seller1의 ID 찾기
    const seller = await prisma.seller.findUnique({
      where: { email: 'seller1@shop.com' }
    });

    if (!seller) {
      console.log('❌ seller1을 찾을 수 없습니다.');
      return;
    }

    console.log('✅ Seller ID:', seller.id.toString());

    // seller1의 상품 찾기
    const products = await prisma.product.findMany({
      where: { sellerId: seller.id }
    });

    console.log('✅ 상품 개수:', products.length);

    // seller1의 주문 찾기
    const orders = await prisma.order.findMany({
      where: {
        OrderItem: {
          some: {
            Product: {
              sellerId: seller.id
            }
          }
        }
      },
      include: {
        OrderItem: true
      }
    });

    console.log('✅ 총 주문 개수:', orders.length);

    // 주문 상태별 개수
    const statusCount = {};
    orders.forEach(order => {
      statusCount[order.orderStatus] = (statusCount[order.orderStatus] || 0) + 1;
    });

    console.log('📊 주문 상태별 개수:', statusCount);

    // DELIVERED 상태의 주문
    const deliveredOrders = orders.filter(o => o.orderStatus === 'DELIVERED');
    console.log('✅ 배송완료 주문:', deliveredOrders.length);

    if (deliveredOrders.length > 0) {
      const totalSales = deliveredOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      console.log('💰 총 매출:', totalSales.toLocaleString(), '원');

      // 최근 배송완료 주문 5개 출력
      console.log('\n최근 배송완료 주문:');
      deliveredOrders.slice(0, 5).forEach(order => {
        console.log(`  - ${order.orderNumber}: ${Number(order.totalAmount).toLocaleString()}원 (${new Date(order.createdAt).toLocaleDateString()})`);
      });
    }

  } catch (error) {
    console.error('❌ 에러:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
