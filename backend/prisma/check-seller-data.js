const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("📊 Seller1 데이터 현황 확인 중...\n");

  try {
    // 리뷰 개수 확인
    const reviewCount = await prisma.review.count({
      where: {
        Product: {
          sellerId: 1n,
        },
      },
    });

    // 쿠폰 개수 확인
    const couponCount = await prisma.coupon.count({
      where: {
        issued_partner_id: 1n,
      },
    });

    // 문의 개수 확인
    const inquiryCount = await prisma.inquiry.count({
      where: {
        Product: {
          sellerId: 1n,
        },
      },
    });

    console.log("✅ Seller1 데이터 현황:");
    console.log(`   - 리뷰: ${reviewCount}개`);
    console.log(`   - 쿠폰: ${couponCount}개`);
    console.log(`   - 문의: ${inquiryCount}개`);

    if (reviewCount === 0) {
      console.log("\n⚠️  리뷰 데이터가 없습니다.");
    }
    if (couponCount === 0) {
      console.log("⚠️  쿠폰 데이터가 없습니다.");
    }
    if (inquiryCount === 0) {
      console.log("⚠️  문의 데이터가 없습니다.");
    }
  } catch (error) {
    console.error("❌ 오류 발생:", error.message);
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

