const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addReturnData() {
  console.log("🔄 반품/취소 데이터 추가 시작...");

  try {
    // 모든 셀러, 상품, 유저 가져오기
    const sellers = await prisma.sellers.findMany();

    const products = await prisma.product.findMany({
      include: {
        ProductImage: true,
        ProductPrice: true,
      },
    });

    const users = await prisma.users.findMany({
      include: {
        user_addresses: true,
      },
    });

    if (sellers.length === 0 || products.length === 0 || users.length === 0) {
      console.log("❌ 셀러, 상품 또는 유저 데이터가 없습니다.");
      return;
    }

    // seller1의 상품만 필터링
    const seller1Products = products.filter((p) => p.sellerId === 1n);

    if (seller1Products.length === 0) {
      console.log("❌ seller1의 상품이 없습니다.");
      return;
    }

    // 취소/반품 상태별 주문 생성 (더 많이)
    const cancelReturnStatuses = [
      { orderStatus: "CANCELLING", count: 10 },
      { orderStatus: "CANCELLED", count: 15 },
      { orderStatus: "RETURNING", count: 12 },
      { orderStatus: "RETURNED", count: 18 },
      { orderStatus: "REFUNDED", count: 10 },
    ];

    let totalCreated = 0;

    for (const statusConfig of cancelReturnStatuses) {
      for (let i = 0; i < statusConfig.count; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomProduct =
          seller1Products[Math.floor(Math.random() * seller1Products.length)];

        if (!randomProduct) continue;

        const userAddress = randomUser.user_addresses?.[0];
        if (!userAddress) continue;

        const basePrice =
          randomProduct.ProductPrice?.salePrice ||
          randomProduct.ProductPrice?.originalPrice ||
          10000;
        const quantity = Math.floor(Math.random() * 3) + 1;
        const totalAmount = basePrice * quantity;

        // 주문 날짜 (과거 1-30일)
        const daysAgo = Math.floor(Math.random() * 30) + 1;
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - daysAgo);

        // 결제 상태: CANCELLED/REFUNDED는 REFUNDED, 나머지는 COMPLETED
        const paymentStatus =
          statusConfig.orderStatus === "CANCELLED" ||
          statusConfig.orderStatus === "REFUNDED"
            ? "REFUNDED"
            : "COMPLETED";

        // 배송 상태: CANCELLING은 PREPARING, CANCELLED은 RETURNED, RETURNING/RETURNED/REFUNDED는 RETURNED
        let deliveryStatus = "PREPARING";
        if (statusConfig.orderStatus === "CANCELLED") {
          deliveryStatus = "RETURNED";
        } else if (
          statusConfig.orderStatus === "RETURNING" ||
          statusConfig.orderStatus === "RETURNED" ||
          statusConfig.orderStatus === "REFUNDED"
        ) {
          deliveryStatus = "RETURNED";
        }

        // 주문 생성
        const order = await prisma.order.create({
          data: {
            orderNumber: `ORD-${Date.now()}-${Math.floor(
              Math.random() * 1000
            )}`,
            userId: randomUser.id,
            totalAmount,
            discountAmount: 0,
            finalAmount: totalAmount,
            deliveryFee: 3000,
            recipient: randomUser.user_name,
            phone: randomUser.phone,
            postcode: userAddress.postcode,
            address1: userAddress.address1,
            address2: userAddress.address2 || "",
            orderStatus: statusConfig.orderStatus,
            paymentStatus: paymentStatus,
            deliveryStatus: deliveryStatus,
            paymentMethod: "CARD",
            paidAt: orderDate,
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
            quantity: quantity,
            unitPrice: basePrice,
            totalPrice: totalAmount,
            optionSnapshot: {},
            createdAt: orderDate,
          },
        });

        // CANCELLED, RETURNED, REFUNDED 상태인 경우 Delivery 레코드 생성
        if (
          statusConfig.orderStatus === "CANCELLED" ||
          statusConfig.orderStatus === "RETURNED" ||
          statusConfig.orderStatus === "REFUNDED"
        ) {
          await prisma.delivery.create({
            data: {
              orderId: order.id,
              trackingNumber: null,
              deliveryCompany: null,
              status: "RETURNED",
              estimatedDeliveryDate: null,
              actualDeliveryDate: null,
              createdAt: orderDate,
              updatedAt: new Date(),
            },
          });
        }

        totalCreated++;
        console.log(
          `✅ ${statusConfig.orderStatus} 주문 생성 완료 (${i + 1}/${
            statusConfig.count
          })`
        );
      }
    }

    console.log(`\n✨ 총 ${totalCreated}개의 반품/취소 주문이 생성되었습니다!`);
  } catch (error) {
    console.error("❌ 반품/취소 데이터 추가 실패:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addReturnData();
