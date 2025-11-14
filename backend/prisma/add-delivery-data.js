const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 다양한 배송 상태의 주문 데이터 생성 시작...");

  // 모든 사용자와 판매자 가져오기
  const users = await prisma.users.findMany();
  const sellers = await prisma.sellers.findMany();
  const products = await prisma.product.findMany({
    include: {
      ProductImage: true,
      ProductPrice: true,
    },
  });

  if (users.length === 0 || sellers.length === 0 || products.length === 0) {
    console.log("❌ 사용자, 판매자 또는 상품 데이터가 없습니다.");
    return;
  }

  // 배송 상태별로 주문 생성
  const deliveryStatuses = [
    { orderStatus: "CONFIRMED", deliveryStatus: "PREPARING", count: 5 }, // 배송준비
    { orderStatus: "PREPARING", deliveryStatus: "PREPARING", count: 8 }, // 배송준비
    { orderStatus: "SHIPPED", deliveryStatus: "SHIPPED", count: 10 }, // 배송중 (Delivery 테이블은 IN_TRANSIT)
    { orderStatus: "DELIVERED", deliveryStatus: "DELIVERED", count: 15 }, // 배송완료
    { orderStatus: "CANCELLED", deliveryStatus: "RETURNED", count: 3 }, // 취소/반품
  ];

  const deliveryCompanies = [
    "CJ대한통운",
    "한진택배",
    "롯데택배",
    "로젠택배",
    "쿠팡물류",
  ];

  let totalCreated = 0;

  for (const statusConfig of deliveryStatuses) {
    console.log(
      `\n📦 ${statusConfig.orderStatus} 상태 주문 ${statusConfig.count}개 생성 중...`
    );

    for (let i = 0; i < statusConfig.count; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomProduct =
        products[Math.floor(Math.random() * products.length)];
      const randomSeller = sellers.find((s) => s.id === randomProduct.sellerId);

      if (!randomSeller) continue;

      // 주소 데이터 가져오기
      const userAddress = await prisma.user_addresses.findFirst({
        where: { userId: randomUser.id },
      });

      const quantity = Math.floor(Math.random() * 3) + 1;
      const itemPrice = randomProduct.ProductPrice?.[0]?.salePrice || 10000;
      const totalAmount = itemPrice * quantity;

      // 날짜 생성 (과거 1-30일)
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      // 주문 생성
      const order = await prisma.order.create({
        data: {
          userId: randomUser.id,
          orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          orderStatus: statusConfig.orderStatus,
          paymentStatus:
            statusConfig.orderStatus === "CANCELLED" ? "FAILED" : "COMPLETED",
          paymentMethod: Math.random() > 0.5 ? "CARD" : "BANK_TRANSFER",
          totalAmount: totalAmount,
          finalAmount: totalAmount,
          recipient: randomUser.name || "홍길동",
          phone: randomUser.phone || "010-1234-5678",
          postcode: userAddress?.postalCode || "12345",
          address1: userAddress?.roadAddress || "서울시 강남구 테헤란로 123",
          address2: userAddress?.detailAddress || "101동 202호",
          deliveryStatus: statusConfig.deliveryStatus,
          createdAt: orderDate,
          updatedAt: orderDate,
          OrderItem: {
            create: {
              productId: randomProduct.id,
              quantity: quantity,
              unitPrice: itemPrice,
              totalPrice: totalAmount,
              productName: randomProduct.displayName,
              optionSnapshot: {},
            },
          },
        },
      });

      // 배송중이거나 배송완료인 경우 배송 정보 생성
      if (
        statusConfig.orderStatus === "SHIPPED" ||
        statusConfig.orderStatus === "DELIVERED"
      ) {
        const deliveryCompany =
          deliveryCompanies[
            Math.floor(Math.random() * deliveryCompanies.length)
          ];
        const trackingNumber = `${
          Math.floor(Math.random() * 900000000000) + 100000000000
        }`;

        const shippedDate = new Date(orderDate);
        shippedDate.setDate(shippedDate.getDate() + 1);

        const deliveryStatus =
          statusConfig.orderStatus === "SHIPPED" ? "IN_TRANSIT" : "DELIVERED";

        await prisma.delivery.create({
          data: {
            orderId: order.id,
            trackingNumber: trackingNumber,
            deliveryCompany: deliveryCompany,
            status: deliveryStatus,
            estimatedDeliveryDate:
              statusConfig.orderStatus === "SHIPPED"
                ? new Date(shippedDate.getTime() + 3 * 24 * 60 * 60 * 1000)
                : null,
            actualDeliveryDate:
              statusConfig.orderStatus === "DELIVERED"
                ? new Date(shippedDate.getTime() + 2 * 24 * 60 * 60 * 1000)
                : null,
            createdAt: shippedDate,
            updatedAt: new Date(),
          },
        });
      }

      totalCreated++;
    }

    console.log(`✅ ${statusConfig.orderStatus} 상태 주문 생성 완료`);
  }

  console.log(
    `\n🎉 총 ${totalCreated}개의 다양한 배송 상태 주문이 생성되었습니다!`
  );
}

main()
  .catch((e) => {
    console.error("❌ 오류 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
