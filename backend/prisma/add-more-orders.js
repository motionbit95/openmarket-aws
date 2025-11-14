const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addMoreOrders() {
  try {
    console.log("📦 추가 주문 데이터 생성 시작...");

    // 기존 데이터 확인
    const users = await prisma.users.findMany({ take: 5 });
    const products = await prisma.product.findMany({
      where: { sellerId: BigInt(1) },
      include: {
        ProductPrice: true,
        ProductOptionGroup: {
          include: {
            ProductOptionValue: true,
          },
        },
      },
      take: 20,
    });
    const addresses = await prisma.user_addresses.findMany({ take: 5 });

    if (users.length === 0 || products.length === 0 || addresses.length === 0) {
      console.log("❌ 기본 데이터가 부족합니다.");
      return;
    }

    const statuses = [
      "PREPARING", // 상품 준비중
      "SHIPPED", // 배송중
      "DELIVERED", // 배송완료
      "CANCELLED", // 취소 접수
      "CANCELLING", // 취소 진행
      "RETURNED", // 반품접수
      "RETURNING", // 반품 진행
      "REFUNDED", // 환불완료
    ];

    const deliveryCompanies = [
      "CJ대한통운",
      "한진택배",
      "로젠택배",
      "우체국택배",
    ];

    let createdCount = 0;

    // 각 상태별로 5개씩 주문 생성
    for (const status of statuses) {
      for (let i = 0; i < 5; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const address = addresses[Math.floor(Math.random() * addresses.length)];
        const product = products[Math.floor(Math.random() * products.length)];

        const quantity = Math.floor(Math.random() * 3) + 1;
        const basePrice =
          product.ProductPrice?.[0]?.salePrice ||
          product.ProductPrice?.[0]?.regularPrice ||
          10000;
        const unitPrice = basePrice;
        const totalPrice = unitPrice * quantity;

        const orderNumber = `ORD-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`;

        // 옵션 스냅샷 생성
        let optionSnapshot = {};
        if (
          product.ProductOptionGroup &&
          product.ProductOptionGroup.length > 0
        ) {
          product.ProductOptionGroup.forEach((group) => {
            if (
              group.ProductOptionValue &&
              group.ProductOptionValue.length > 0
            ) {
              const randomOption =
                group.ProductOptionValue[
                  Math.floor(Math.random() * group.ProductOptionValue.length)
                ];
              optionSnapshot[group.displayName] = randomOption.displayName;
            }
          });
        }

        // 주문 생성
        const order = await prisma.order.create({
          data: {
            orderNumber,
            userId: user.id,
            orderStatus: status,
            paymentStatus:
              status === "PREPARING" ||
              status === "SHIPPED" ||
              status === "DELIVERED"
                ? "COMPLETED"
                : "PENDING",
            paymentMethod: "CARD",
            deliveryStatus:
              status === "PREPARING"
                ? "PREPARING"
                : status === "SHIPPED"
                ? "SHIPPED"
                : status === "DELIVERED"
                ? "DELIVERED"
                : "PREPARING",
            totalAmount: totalPrice,
            finalAmount: totalPrice,
            recipient: user.user_name || "고객",
            phone: user.phone || "010-0000-0000",
            postcode: address.zipCode || "12345",
            address1: address.address1 || "서울시 강남구",
            address2: address.address2 || "테스트동 123-456",
            createdAt: new Date(
              Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
            ), // 최근 30일 내
            updatedAt: new Date(),
            OrderItem: {
              create: {
                productId: product.id,
                productName: product.displayName,
                quantity: quantity,
                unitPrice: unitPrice,
                totalPrice: totalPrice,
                optionSnapshot: optionSnapshot,
              },
            },
          },
        });

        // 배송중이거나 배송완료인 경우 배송 정보 추가
        if (status === "SHIPPED" || status === "DELIVERED") {
          await prisma.delivery.create({
            data: {
              orderId: order.id,
              trackingNumber: `${
                Math.floor(Math.random() * 900000000000) + 100000000000
              }`,
              deliveryCompany:
                deliveryCompanies[
                  Math.floor(Math.random() * deliveryCompanies.length)
                ],
              status: status === "SHIPPED" ? "SHIPPED" : "DELIVERED",
              estimatedDeliveryDate: new Date(
                Date.now() + 3 * 24 * 60 * 60 * 1000
              ),
              updatedAt: new Date(),
            },
          });
        }

        createdCount++;
        console.log(`✅ [${status}] 주문 생성: ${orderNumber}`);
      }
    }

    console.log(`\n🎉 총 ${createdCount}개의 주문이 추가되었습니다!`);

    // 상태별 주문 개수 확인
    console.log("\n📊 주문 상태별 개수:");
    for (const status of statuses) {
      const count = await prisma.order.count({
        where: { orderStatus: status },
      });
      console.log(`  ${status}: ${count}개`);
    }
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addMoreOrders();
