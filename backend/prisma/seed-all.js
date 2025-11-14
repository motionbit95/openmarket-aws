const { PrismaClient } = require("@prisma/client");
const { execSync } = require("child_process");

const prisma = new PrismaClient();

async function seedAllData() {
  console.log("🌱 전체 시드 데이터 생성 시작...");

  try {
    // 1. 데이터베이스 초기화
    console.log("🗑️  데이터베이스 초기화...");
    console.log("📊 데이터베이스 스키마 리셋 중...");

    execSync("npx prisma db push --force-reset", {
      stdio: "inherit",
      cwd: process.cwd(),
      env: {
        ...process.env,
        PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes",
      },
    });

    console.log("✅ 데이터베이스 초기화 완료!");

    // 2. 기본 데이터 생성 (사용자, 판매자, 상품, 쿠폰 등)
    console.log("👥 기본 데이터 생성...");
    await require("./seed-scripts/02-basic-data.js");

    // 3. 옵션 및 리뷰 데이터 생성
    console.log("📝 옵션 및 리뷰 데이터 생성...");
    await require("./seed-scripts/03-options-and-reviews.js");

    // 4. 장바구니 및 주문 데이터 생성
    console.log("🛒 장바구니 및 주문 데이터 생성...");
    await require("./seed-scripts/04-cart-and-orders.js");

    // 5. 고객지원 및 파일 데이터 생성
    console.log("💬 고객지원 및 파일 데이터 생성...");
    await require("./seed-scripts/05-support-and-files.js");

    // 6. 기본 정산 데이터 생성
    console.log("💰 기본 정산 데이터 생성...");
    const settlementData = require("./seed-settlement.js");
    await settlementData.seedSettlementData();

    // 7. 추가 정산 데이터 생성
    console.log("🏦 추가 정산 데이터 생성...");
    const moreSettlements = require("./create-more-settlements.js");
    await moreSettlements.createMoreSettlementData();

    console.log("✅ 모든 시드 데이터 생성 완료!");

    // 최종 데이터 현황 출력
    console.log("\n📊 생성된 데이터 현황:");
    const userCount = await prisma.users.count();
    const sellerCount = await prisma.sellers.count();
    const productCount = await prisma.product.count();
    const orderCount = await prisma.order.count();
    const errorReportCount = await prisma.errorReport.count();
    const inquiryCount = await prisma.inquiry.count();
    const settlementCount = await prisma.settlement.count();
    const settlementPeriodCount = await prisma.settlementPeriod.count();
    const settlementItemCount = await prisma.settlementItem.count();

    console.log(`👥 사용자: ${userCount}개`);
    console.log(`🏪 판매자: ${sellerCount}개`);
    console.log(`📦 상품: ${productCount}개`);
    console.log(`🛒 주문: ${orderCount}개`);
    console.log(`🐛 에러리포트 (제보/제안): ${errorReportCount}개`);
    console.log(`💬 문의: ${inquiryCount}개`);
    console.log(`💰 정산: ${settlementCount}개`);
    console.log(`📅 정산 기간: ${settlementPeriodCount}개`);
    console.log(`📋 정산 아이템: ${settlementItemCount}개`);
  } catch (error) {
    console.error("❌ 시드 데이터 생성 중 오류:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  seedAllData().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { seedAllData };
