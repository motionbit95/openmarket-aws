// reset-products.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // 하위 테이블부터 삭제
  await prisma.productInfoNotice.deleteMany({});
  console.log("✅ ProductInfoNotice 초기화 완료");

  await prisma.productOption.deleteMany({});
  console.log("✅ ProductOption 초기화 완료");

  await prisma.productImage.deleteMany({});
  console.log("✅ ProductImage 초기화 완료");

  await prisma.productReturn.deleteMany({});
  console.log("✅ ProductReturn 초기화 완료");

  await prisma.productDelivery.deleteMany({});
  console.log("✅ ProductDelivery 초기화 완료");

  await prisma.productPrice.deleteMany({});
  console.log("✅ ProductPrice 초기화 완료");

  // 리뷰는 상품과 별도로 관계 맺고 있으므로 별도 처리
  await prisma.reviewImage.deleteMany({});
  console.log("✅ ReviewImage 초기화 완료");

  await prisma.review.deleteMany({});
  console.log("✅ Review 초기화 완료");

  // 마지막으로 Product 삭제
  await prisma.product.deleteMany({});
  console.log("✅ Product 초기화 완료");
}

main()
  .catch((e) => {
    console.error("❌ 오류 발생:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
