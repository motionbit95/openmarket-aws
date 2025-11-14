const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");

faker.locale = "ko";

const prisma = new PrismaClient();

function getReviewContent(rating) {
  const reviews = {
    5: [
      "정말 만족스러운 구매였어요! 품질도 우수하고 배송도 빨라서 완전 추천합니다.",
      "기대 이상이에요! 사진보다 실물이 훨씬 좋네요. 포장도 꼼꼼하게 잘 되어있어요.",
      "와 진짜 좋아요! 가격 대비 퀄리티가 말이 안 되게 좋습니다.",
      "최고의 상품이에요! 배송도 하루만에 오고 품질도 완벽해요.",
      "대박 만족해요! 색깔도 예쁘고 사이즈도 딱 맞아요.",
    ],
    4: [
      "전체적으로 만족해요. 품질도 좋고 가격도 합리적입니다.",
      "나쁘지 않아요! 사용해보니 기대했던 정도는 됩니다.",
      "괜찮은 상품이에요. 품질은 좋은데 포장이 조금 아쉬웠습니다.",
      "만족스러운 구매였어요. 실물과 사진이 거의 비슷하고 사용감도 좋습니다.",
    ],
    3: [
      "보통이에요. 나쁘지 않지만 엄청 좋지도 않은 정도?",
      "그럭저럭 쓸만해요. 기대를 많이 했는데 생각보다는 평범합니다.",
      "무난한 상품이에요. 특별한 건 없지만 기본은 하는 것 같습니다.",
    ],
  };

  const ratingReviews = reviews[rating] || reviews[4];
  return ratingReviews[Math.floor(Math.random() * ratingReviews.length)];
}

async function main() {
  console.log("🎨 옵션 시스템 및 리뷰 데이터 생성 시작...");

  try {
    // 기존 데이터 조회
    const allUsers = await prisma.users.findMany();
    const allProducts = await prisma.product.findMany();

    // 1. 옵션상품 시스템 생성
    console.log("🎨 옵션상품 시스템 생성 중...");

    const fashionProducts = await prisma.product.findMany({
      where: {
        OR: [
          { categoryCode: { contains: "FASHION" } },
          { categoryCode: { contains: "BEAUTY" } },
          { categoryCode: { contains: "CLOTHING" } },
        ],
        isSingleProduct: false,
      },
    });

    for (const product of fashionProducts) {
      // 색상 옵션 그룹 생성
      const colorGroup = await prisma.productOptionGroup.create({
        data: {
          productId: product.id,
          name: "color",
          displayName: "색상",
          required: true,
          sortOrder: 0,
        },
      });

      const colors = [
        { value: "블랙", displayName: "블랙", colorCode: "#000000" },
        { value: "화이트", displayName: "화이트", colorCode: "#FFFFFF" },
        { value: "네이비", displayName: "네이비", colorCode: "#000080" },
      ];

      const colorOptions = [];
      for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        const colorOption = await prisma.productOptionValue.create({
          data: {
            optionGroupId: colorGroup.id,
            value: color.value,
            displayName: color.displayName,
            colorCode: color.colorCode,
            extraPrice: i * 1000,
            sortOrder: i,
            isAvailable: true,
          },
        });
        colorOptions.push(colorOption);
      }

      // 의류인 경우 사이즈 옵션 추가
      if (product.categoryCode.includes("CLOTHING")) {
        const sizeGroup = await prisma.productOptionGroup.create({
          data: {
            productId: product.id,
            name: "size",
            displayName: "사이즈",
            required: true,
            sortOrder: 1,
          },
        });

        const sizes = [
          { value: "S", displayName: "S (90-95)" },
          { value: "M", displayName: "M (95-100)" },
          { value: "L", displayName: "L (100-105)" },
        ];

        const sizeOptions = [];
        for (let i = 0; i < sizes.length; i++) {
          const size = sizes[i];
          const sizeOption = await prisma.productOptionValue.create({
            data: {
              optionGroupId: sizeGroup.id,
              value: size.value,
              displayName: size.displayName,
              extraPrice: i * 2000,
              sortOrder: i,
              isAvailable: true,
            },
          });
          sizeOptions.push(sizeOption);
        }

        // 모든 색상-사이즈 조합 SKU 생성
        const productPrice = await prisma.productPrice.findUnique({
          where: { productId: product.id },
        });

        for (const colorOption of colorOptions) {
          for (const sizeOption of sizeOptions) {
            const extraPrice = colorOption.extraPrice + sizeOption.extraPrice;
            const sku = await prisma.productSKU.create({
              data: {
                productId: product.id,
                skuCode: `${product.id}-${colorOption.value}-${sizeOption.value}`,
                displayName: `${colorOption.displayName}/${sizeOption.displayName}`,
                originalPrice:
                  (productPrice?.originalPrice || 30000) + extraPrice,
                salePrice: (productPrice?.salePrice || 20000) + extraPrice,
                discountRate: productPrice?.discountRate || 10,
                stockQuantity: Math.floor(Math.random() * 50) + 5,
                isActive: true,
                isMain:
                  colorOptions.indexOf(colorOption) === 0 &&
                  sizeOptions.indexOf(sizeOption) === 0,
              },
            });

            await prisma.productSKUOption.createMany({
              data: [
                { skuId: sku.id, optionValueId: colorOption.id },
                { skuId: sku.id, optionValueId: sizeOption.id },
              ],
            });
          }
        }
      } else {
        // 뷰티 제품은 색상만
        const productPrice = await prisma.productPrice.findUnique({
          where: { productId: product.id },
        });

        for (const colorOption of colorOptions) {
          const sku = await prisma.productSKU.create({
            data: {
              productId: product.id,
              skuCode: `${product.id}-${colorOption.value}`,
              displayName: colorOption.displayName,
              originalPrice:
                (productPrice?.originalPrice || 30000) + colorOption.extraPrice,
              salePrice:
                (productPrice?.salePrice || 20000) + colorOption.extraPrice,
              discountRate: productPrice?.discountRate || 10,
              stockQuantity: Math.floor(Math.random() * 100) + 10,
              isActive: true,
              isMain: colorOptions.indexOf(colorOption) === 0,
            },
          });

          await prisma.productSKUOption.create({
            data: {
              skuId: sku.id,
              optionValueId: colorOption.id,
            },
          });
        }
      }
    }

    // 2. 리뷰 데이터 대량 생성
    console.log("⭐ 리뷰 데이터 생성 중...");

    for (const product of allProducts) {
      const reviewCount = Math.floor(Math.random() * 15) + 1; // 1-15개

      const shuffledUsers = faker.helpers.shuffle(allUsers);
      const selectedUsers = shuffledUsers.slice(
        0,
        Math.min(reviewCount, allUsers.length)
      );

      for (const user of selectedUsers) {
        const rating = Math.floor(Math.random() * 3) + 3; // 3-5점

        await prisma.review.create({
          data: {
            productId: product.id,
            userId: user.id,
            rating: rating,
            content: getReviewContent(rating),
            images:
              Math.random() > 0.85
                ? {
                    create: [
                      {
                        url: `https://picsum.photos/400/300?random=${
                          Date.now() + Math.random()
                        }`,
                        sortOrder: 0,
                      },
                    ],
                  }
                : undefined,
          },
        });
      }
    }

    console.log("✅ 옵션 시스템 및 리뷰 데이터 생성 완료!");
  } catch (error) {
    console.error("❌ 에러 발생:", error);
    throw error;
  }
}

main()
  .catch((err) => {
    console.error("❌ 옵션 및 리뷰 데이터 생성 중 오류 발생:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
