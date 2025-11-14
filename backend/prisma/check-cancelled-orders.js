const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 CANCELLED 주문 확인 중...\n");

  const cancelledOrders = await prisma.order.findMany({
    where: {
      orderStatus: "CANCELLED",
    },
    select: {
      id: true,
      orderNumber: true,
      orderStatus: true,
      deliveryStatus: true,
      Delivery: {
        select: {
          status: true,
        },
      },
    },
    take: 10,
  });

  console.log(`총 ${cancelledOrders.length}개의 CANCELLED 주문 발견\n`);

  cancelledOrders.forEach((order, index) => {
    console.log(`[주문 ${index + 1}]`);
    console.log(`  - ID: ${order.id}`);
    console.log(`  - 주문번호: ${order.orderNumber}`);
    console.log(`  - orderStatus: ${order.orderStatus}`);
    console.log(`  - deliveryStatus: ${order.deliveryStatus}`);
    console.log(`  - Delivery.status: ${order.Delivery?.status || "없음"}`);
    console.log("");
  });
}

main()
  .catch((e) => {
    console.error("❌ 오류:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
