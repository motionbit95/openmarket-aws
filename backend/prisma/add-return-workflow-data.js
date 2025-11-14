const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔄 반품 프로세스 더미 데이터 생성 중...");

  try {
    // seller1의 상품 가져오기
    const products = await prisma.product.findMany({
      where: { sellerId: 1n },
      include: { ProductPrice: true },
    });

    if (products.length === 0) {
      console.log("❌ seller1의 상품이 없습니다.");
      return;
    }

    // 사용자 가져오기
    const users = await prisma.users.findMany({
      include: { user_addresses: true },
    });

    if (users.length === 0) {
      console.log("❌ 일반 사용자가 없습니다.");
      return;
    }

    // 반품 워크플로우 상태별 주문 생성
    const returnWorkflowStatuses = {
      RETURNING: 5, // 반품요청 (반품진행)
      RETURN_APPROVED: 4, // 반품승인
      RETURN_PICKUP_SCHEDULED: 3, // 수거예정
      RETURN_INSPECTING: 3, // 검수중
      RETURNED: 8, // 반품완료
      RETURN_REJECTED: 2, // 반품거부
    };

    let totalCreated = 0;

    for (const [orderStatus, count] of Object.entries(returnWorkflowStatuses)) {
      for (let i = 0; i < count; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomProduct =
          products[Math.floor(Math.random() * products.length)];
        const userAddress = randomUser.user_addresses?.[0];

        if (!userAddress) continue;

        const quantity = Math.floor(Math.random() * 3) + 1;
        const unitPrice = randomProduct.ProductPrice?.[0]?.salePrice || 10000;
        const totalPrice = unitPrice * quantity;
        const deliveryFee = 3000;
        const totalAmount = totalPrice + deliveryFee;

        // 과거 날짜 생성 (1-30일 전)
        const daysAgo = Math.floor(Math.random() * 30) + 1;
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - daysAgo);

        // 주문 생성
        const order = await prisma.order.create({
          data: {
            orderNumber: `ORD-${Date.now()}-${i}-${orderStatus}`,
            userId: randomUser.id,
            orderStatus,
            paymentStatus:
              orderStatus === "RETURNED" || orderStatus === "RETURN_REJECTED"
                ? "REFUNDED"
                : "COMPLETED",
            paymentMethod: Math.random() > 0.5 ? "CARD" : "BANK_TRANSFER",
            deliveryStatus:
              orderStatus === "RETURNED" || orderStatus === "RETURN_REJECTED"
                ? "RETURNED"
                : "SHIPPED",
            totalAmount,
            finalAmount: totalAmount,
            deliveryFee,
            recipient: randomUser.user_name,
            phone: randomUser.phone || "010-1234-5678",
            postcode: userAddress.postcode,
            address1: userAddress.address1,
            address2: userAddress.address2 || "",
            deliveryMemo: "문 앞에 놓아주세요",
            createdAt: orderDate,
            updatedAt: new Date(),
          },
        });

        // 주문 아이템 생성
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: randomProduct.id,
            productName: randomProduct.displayName,
            quantity,
            unitPrice,
            totalPrice,
            optionSnapshot: {},
            createdAt: orderDate,
          },
        });

        // Delivery 레코드 생성 (배송 관련)
        const deliveryDate = new Date(orderDate);
        deliveryDate.setDate(deliveryDate.getDate() + 2);

        await prisma.delivery.create({
          data: {
            orderId: order.id,
            status:
              orderStatus === "RETURNED" || orderStatus === "RETURN_REJECTED"
                ? "RETURNED"
                : "SHIPPED",
            trackingNumber: `TRK-${Date.now()}-${i}`,
            deliveryCompany: [
              "CJ대한통운",
              "우체국택배",
              "한진택배",
              "로젠택배",
            ][Math.floor(Math.random() * 4)],
            estimatedDeliveryDate: deliveryDate,
            actualDeliveryDate:
              orderStatus === "RETURNED" || orderStatus === "RETURN_REJECTED"
                ? deliveryDate
                : null,
            createdAt: orderDate,
            updatedAt: new Date(),
          },
        });

        totalCreated++;
        console.log(`✅ ${orderStatus} 주문 생성 (${i + 1}/${count})`);
      }
    }

    console.log(`\n✅ 반품 워크플로우 데이터 생성 완료!`);
    console.log(`📊 총 ${totalCreated}개의 반품 주문이 생성되었습니다.`);

    // 생성된 데이터 확인
    const statusCounts = {};
    const statuses = [
      "RETURNING",
      "RETURN_APPROVED",
      "RETURN_PICKUP_SCHEDULED",
      "RETURN_INSPECTING",
      "RETURNED",
      "RETURN_REJECTED",
    ];

    for (const status of statuses) {
      const count = await prisma.order.count({
        where: {
          OrderItem: { some: { Product: { sellerId: 1n } } },
          orderStatus: status,
        },
      });
      statusCounts[status] = count;
    }

    console.log("\n📈 Seller1 반품 상태별 개수:");
    console.log(`   - 반품요청 (RETURNING): ${statusCounts.RETURNING}개`);
    console.log(
      `   - 반품승인 (RETURN_APPROVED): ${statusCounts.RETURN_APPROVED}개`
    );
    console.log(
      `   - 수거예정 (RETURN_PICKUP_SCHEDULED): ${statusCounts.RETURN_PICKUP_SCHEDULED}개`
    );
    console.log(
      `   - 검수중 (RETURN_INSPECTING): ${statusCounts.RETURN_INSPECTING}개`
    );
    console.log(`   - 반품완료 (RETURNED): ${statusCounts.RETURNED}개`);
    console.log(
      `   - 반품거부 (RETURN_REJECTED): ${statusCounts.RETURN_REJECTED}개`
    );
  } catch (error) {
    console.error("❌ 오류 발생:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
