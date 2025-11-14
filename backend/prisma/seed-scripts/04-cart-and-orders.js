const {
  PrismaClient,
  Order_orderStatus,
  Order_paymentStatus,
  Order_paymentMethod,
  Order_deliveryStatus,
} = require("@prisma/client");
const { faker } = require("@faker-js/faker");

faker.locale = "ko";

const prisma = new PrismaClient();

function getKoreanName() {
  const surnames = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"];
  const givenNames = [
    "민수",
    "지영",
    "현우",
    "수진",
    "준호",
    "예은",
    "동현",
    "소영",
  ];

  return (
    surnames[Math.floor(Math.random() * surnames.length)] +
    givenNames[Math.floor(Math.random() * givenNames.length)]
  );
}

function getKoreanAddress() {
  const cities = ["서울", "부산", "대구", "인천", "광주"];
  const districts = ["중구", "강남구", "서초구", "송파구", "마포구"];

  const city = cities[Math.floor(Math.random() * cities.length)];
  const district = districts[Math.floor(Math.random() * districts.length)];
  const streetNum = Math.floor(Math.random() * 999) + 1;

  return `${city}시 ${district} ${streetNum}-${
    Math.floor(Math.random() * 99) + 1
  }`;
}

async function main() {
  console.log("🛒 장바구니 및 주문 데이터 생성 시작...");

  try {
    const allUsers = await prisma.users.findMany();
    const allProducts = await prisma.product.findMany();

    // 1. 장바구니 데이터 생성 (사용자의 60%)
    console.log("🛒 장바구니 데이터 생성 중...");
    const usersWithCart = faker.helpers
      .shuffle(allUsers)
      .slice(0, Math.floor(allUsers.length * 0.6));

    for (const user of usersWithCart) {
      const now = new Date();
      const cart = await prisma.cart.create({
        data: {
          userId: user.id,
          createdAt: now,
          updatedAt: now,
        },
      });

      const itemCount = Math.floor(Math.random() * 5) + 2; // 2-6개
      const selectedProducts = faker.helpers
        .shuffle(allProducts)
        .slice(0, itemCount);

      for (const product of selectedProducts) {
        if (product.isSingleProduct) {
          const productPrice = await prisma.productPrice.findUnique({
            where: { productId: product.id },
          });

          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId: product.id,
              skuId: null,
              quantity: Math.floor(Math.random() * 3) + 1,
              price: productPrice?.salePrice || 20000,
              createdAt: now,
              updatedAt: now,
            },
          });
        } else {
          const skus = await prisma.productSKU.findMany({
            where: {
              productId: product.id,
              isActive: true,
            },
            take: 1,
          });

          if (skus.length > 0) {
            await prisma.cartItem.create({
              data: {
                cartId: cart.id,
                productId: product.id,
                skuId: skus[0].id,
                quantity: Math.floor(Math.random() * 2) + 1,
                price: skus[0].salePrice,
              },
            });
          }
        }
      }
    }

    // 2. 주문 데이터 생성 (과거 구매 이력)
    console.log("📋 주문 데이터 생성 중...");

    for (let i = 0; i < 80; i++) {
      if (allUsers.length === 0) {
        console.log("⚠️ 사용자 데이터가 없어 주문 생성을 건너뜁니다.");
        break;
      }

      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const orderDate = new Date(
        Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000
      ); // 최근 180일 내

      const userAddress = await prisma.user_addresses.findFirst({
        where: { userId: randomUser.id },
      });

      const order = await prisma.order.create({
        data: {
          orderNumber: `ORDER-${orderDate.getFullYear()}${String(
            orderDate.getMonth() + 1
          ).padStart(2, "0")}${String(orderDate.getDate()).padStart(
            2,
            "0"
          )}-${String(i + 1001).padStart(4, "0")}`,
          userId: randomUser.id,
          recipient: userAddress?.recipient || getKoreanName(),
          phone: userAddress?.phone || randomUser.phone || "010-0000-0000",
          postcode: userAddress?.postcode || "12345",
          address1: userAddress?.address1 || getKoreanAddress(),
          address2:
            userAddress?.address2 || `${Math.floor(Math.random() * 999) + 1}호`,
          deliveryMemo: faker.helpers.arrayElement([
            "문 앞에 놓아주세요",
            "경비실에 맡겨주세요",
            "직접 받겠습니다",
            "부재 시 연락주세요",
            "조심히 다뤄주세요",
            null,
          ]),
          totalAmount: 0,
          discountAmount:
            Math.random() > 0.7 ? Math.floor(Math.random() * 5000) : 0,
          deliveryFee: Math.random() > 0.5 ? 0 : 2500,
          finalAmount: 0,
          orderStatus: faker.helpers.arrayElement([
            Order_orderStatus.DELIVERED,
            Order_orderStatus.DELIVERED,
            Order_orderStatus.DELIVERED, // 60%
            Order_orderStatus.SHIPPED,
            Order_orderStatus.PREPARING,
            Order_orderStatus.CONFIRMED, // 40%
          ]),
          paymentStatus: Order_paymentStatus.COMPLETED,
          deliveryStatus: faker.helpers.arrayElement([
            Order_deliveryStatus.DELIVERED,
            Order_deliveryStatus.DELIVERED, // 60%
            Order_deliveryStatus.SHIPPED,
            Order_deliveryStatus.PREPARING, // 40%
          ]),
          paymentMethod: faker.helpers.arrayElement(
            Object.values(Order_paymentMethod)
          ),
          paymentId: `PAY${Date.now()}${Math.floor(Math.random() * 10000)}`,
          paidAt: orderDate,
          createdAt: orderDate,
          updatedAt: orderDate,
        },
      });

      // 주문 아이템 생성
      if (allProducts.length === 0) {
        console.log("⚠️ 상품 데이터가 없어 주문 아이템 생성을 건너뜁니다.");
        continue;
      }

      const orderItemCount = Math.floor(Math.random() * 4) + 1;
      const selectedProducts = faker.helpers
        .shuffle(allProducts)
        .slice(0, orderItemCount);
      let totalAmount = 0;

      for (const product of selectedProducts) {
        const quantity = Math.floor(Math.random() * 2) + 1;
        let unitPrice,
          skuId = null,
          skuCode = null,
          skuDisplayName = null;

        if (product.isSingleProduct) {
          const productPrice = await prisma.productPrice.findUnique({
            where: { productId: product.id },
          });
          unitPrice = productPrice?.salePrice || 20000;
        } else {
          const skus = await prisma.productSKU.findMany({
            where: {
              productId: product.id,
              isActive: true,
            },
          });

          if (skus.length > 0) {
            const randomSku = skus[Math.floor(Math.random() * skus.length)];
            skuId = randomSku.id;
            unitPrice = randomSku.salePrice;
            skuCode = randomSku.skuCode;
            skuDisplayName = randomSku.displayName;
          } else {
            unitPrice = 20000;
          }
        }

        const itemTotal = unitPrice * quantity;
        totalAmount += itemTotal;

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            skuId: skuId,
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: itemTotal,
            productName: product.displayName,
            skuCode: skuCode,
            skuDisplayName: skuDisplayName,
            optionSnapshot: skuDisplayName
              ? {
                  color: skuDisplayName.split("/")[0],
                  size: skuDisplayName.split("/")[1] || null,
                }
              : null,
          },
        });
      }

      // 주문 총액 업데이트
      const finalAmount =
        totalAmount + (order.deliveryFee || 0) - (order.discountAmount || 0);
      await prisma.order.update({
        where: { id: order.id },
        data: {
          totalAmount: totalAmount,
          finalAmount: finalAmount,
        },
      });
    }

    // 3. 사용자 쿠폰 발급
    console.log("🎫 사용자 쿠폰 발급 중...");
    const coupons = await prisma.coupon.findMany();

    for (const user of allUsers) {
      const couponCount = Math.floor(Math.random() * 3); // 0-2개
      const selectedCoupons = faker.helpers
        .shuffle(coupons)
        .slice(0, couponCount);

      for (const coupon of selectedCoupons) {
        const existingUserCoupon = await prisma.userCoupon.findUnique({
          where: {
            userId_couponId: {
              userId: user.id,
              couponId: coupon.id,
            },
          },
        });

        if (!existingUserCoupon) {
          await prisma.userCoupon.create({
            data: {
              userId: user.id,
              couponId: coupon.id,
              used: Math.random() > 0.8,
              usedAt:
                Math.random() > 0.8
                  ? new Date(
                      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
                    )
                  : null,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }
    }

    // 4. 관심상품(찜) 데이터
    console.log("❤️ 관심상품 데이터 생성 중...");
    for (const user of allUsers) {
      const likeCount = Math.floor(Math.random() * 8); // 0-7개
      const selectedProducts = faker.helpers
        .shuffle(allProducts)
        .slice(0, likeCount);

      for (const product of selectedProducts) {
        const existingLike = await prisma.userLikeProduct.findUnique({
          where: {
            userId_productId: {
              userId: user.id,
              productId: product.id,
            },
          },
        });

        if (!existingLike) {
          await prisma.userLikeProduct.create({
            data: {
              userId: user.id,
              productId: product.id,
            },
          });
        }
      }
    }

    console.log("✅ 장바구니 및 주문 데이터 생성 완료!");
  } catch (error) {
    console.error("❌ 에러 발생:", error);
    throw error;
  }
}

main()
  .catch((err) => {
    console.error("❌ 장바구니 및 주문 데이터 생성 중 오류 발생:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
