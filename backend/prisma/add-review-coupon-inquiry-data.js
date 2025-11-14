const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔄 리뷰, 쿠폰, 문의 데이터 생성 중...\n");

  try {
    // Seller1의 상품 가져오기
    const products = await prisma.product.findMany({
      where: { sellerId: 1n },
      select: { id: true, displayName: true },
    });

    if (products.length === 0) {
      console.log("❌ Seller1의 상품이 없습니다.");
      return;
    }

    // 사용자 가져오기
    const users = await prisma.users.findMany({
      select: { id: true, user_name: true, email: true },
    });

    if (users.length === 0) {
      console.log("❌ 사용자가 없습니다.");
      return;
    }

    // 1. 리뷰 데이터 생성
    console.log("📝 리뷰 데이터 생성 중...");
    const reviewContents = [
      {
        rating: 5,
        content: "정말 좋은 상품입니다! 배송도 빠르고 품질도 훌륭해요.",
      },
      { rating: 4, content: "전반적으로 만족스러운 상품이에요. 추천합니다." },
      { rating: 5, content: "기대 이상입니다. 재구매 의향 있어요!" },
      { rating: 3, content: "괜찮은 편이지만 가격 대비 조금 아쉬워요." },
      { rating: 4, content: "품질은 좋은데 배송이 조금 늦었어요." },
      { rating: 5, content: "완벽합니다! 강력 추천드려요." },
      { rating: 4, content: "가격대비 좋아요. 다음에 또 구매할게요." },
      { rating: 5, content: "사진과 똑같아요. 매우 만족합니다." },
      { rating: 4, content: "생각보다 좋네요. 선물용으로도 좋을 것 같아요." },
      { rating: 5, content: "최고의 선택이었습니다. 감사합니다!" },
    ];

    for (let i = 0; i < 15; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomProduct =
        products[Math.floor(Math.random() * products.length)];
      const reviewData =
        reviewContents[Math.floor(Math.random() * reviewContents.length)];

      const daysAgo = Math.floor(Math.random() * 60) + 1;
      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() - daysAgo);

      await prisma.review.create({
        data: {
          userId: randomUser.id,
          productId: randomProduct.id,
          rating: reviewData.rating,
          content: reviewData.content,
          createdAt: reviewDate,
          updatedAt: reviewDate,
        },
      });
    }
    console.log("✅ 리뷰 15개 생성 완료");

    // 2. 쿠폰 데이터 생성
    console.log("\n🎫 쿠폰 데이터 생성 중...");
    const coupons = [
      {
        title: "신규 가입 축하 쿠폰",
        content: "첫 구매 시 사용 가능한 10% 할인 쿠폰",
        coupon_type: "DISCOUNT",
        discount_mode: "PERCENTAGE",
        discount_amount: 10,
        discount_max: 10000,
        min_order_amount: 50000,
        total_count: 1000,
        validity_days: 30,
      },
      {
        title: "주말 특가 쿠폰",
        content: "주말 한정 5000원 할인 쿠폰",
        coupon_type: "DISCOUNT",
        discount_mode: "AMOUNT",
        discount_amount: 5000,
        min_order_amount: 30000,
        total_count: 500,
        validity_days: 7,
      },
      {
        title: "VIP 회원 전용 쿠폰",
        content: "VIP 회원 대상 15% 할인 쿠폰",
        coupon_type: "DISCOUNT",
        discount_mode: "PERCENTAGE",
        discount_amount: 15,
        discount_max: 20000,
        min_order_amount: 100000,
        total_count: 200,
        validity_days: 60,
      },
      {
        title: "무료 배송 쿠폰",
        content: "배송비 무료 쿠폰",
        coupon_type: "FREE_SHIPPING",
        discount_mode: "AMOUNT",
        discount_amount: 0,
        min_order_amount: 20000,
        total_count: 1000,
        validity_days: 30,
      },
      {
        title: "생일 축하 쿠폰",
        content: "생일 기념 10000원 할인 쿠폰",
        coupon_type: "DISCOUNT",
        discount_mode: "AMOUNT",
        discount_amount: 10000,
        min_order_amount: 50000,
        total_count: 100,
        validity_days: 14,
      },
    ];

    for (const couponData of coupons) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);

      await prisma.coupon.create({
        data: {
          ...couponData,
          start_date: startDate,
          end_date: endDate,
          validity_type: "DAYS",
          issued_by: "PARTNER",
          issued_partner_id: 1n,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    console.log("✅ 쿠폰 5개 생성 완료");

    // 3. 문의 데이터 생성
    console.log("\n💬 문의 데이터 생성 중...");
    const inquiries = [
      {
        title: "배송 문의",
        content: "언제 배송되나요? 빠른 배송 가능한가요?",
        status: "ANSWERED",
        answer: "주문하신 상품은 3일 내 배송 예정입니다. 감사합니다.",
      },
      {
        title: "재고 문의",
        content: "이 상품 재고 있나요?",
        status: "ANSWERED",
        answer: "네, 재고 있습니다. 바로 주문 가능합니다.",
      },
      {
        title: "사이즈 문의",
        content: "사이즈가 큰 편인가요?",
        status: "PENDING",
        answer: null,
      },
      {
        title: "색상 문의",
        content: "실제 색상이 사진과 동일한가요?",
        status: "ANSWERED",
        answer: "네, 사진과 동일한 색상입니다.",
      },
      {
        title: "교환/환불 문의",
        content: "교환 가능한가요?",
        status: "ANSWERED",
        answer: "미개봉 제품에 한해 7일 이내 교환 가능합니다.",
      },
      {
        title: "배송지 변경 문의",
        content: "배송지 변경 가능한가요?",
        status: "PENDING",
        answer: null,
      },
      {
        title: "결제 문의",
        content: "무통장입금 가능한가요?",
        status: "ANSWERED",
        answer: "네, 무통장입금 가능합니다. 입금 확인 후 배송됩니다.",
      },
      {
        title: "상품 상세 문의",
        content: "상품 소재가 어떻게 되나요?",
        status: "PENDING",
        answer: null,
      },
    ];

    for (const inquiryData of inquiries) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomProduct =
        products[Math.floor(Math.random() * products.length)];

      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const inquiryDate = new Date();
      inquiryDate.setDate(inquiryDate.getDate() - daysAgo);

      const answeredAt =
        inquiryData.status === "ANSWERED" ? new Date(inquiryDate) : null;
      if (answeredAt) {
        answeredAt.setHours(answeredAt.getHours() + 2);
      }

      await prisma.inquiry.create({
        data: {
          senderId: randomUser.id,
          senderType: "USER",
          title: inquiryData.title,
          content: inquiryData.content,
          status: inquiryData.status,
          answer: inquiryData.answer,
          answeredAt,
          productId: randomProduct.id,
          createdAt: inquiryDate,
          updatedAt: answeredAt || inquiryDate,
        },
      });
    }
    console.log("✅ 문의 8개 생성 완료");

    // 최종 확인
    console.log("\n📊 생성 완료 - 최종 확인:");
    const finalReviewCount = await prisma.review.count({
      where: { Product: { sellerId: 1n } },
    });
    const finalCouponCount = await prisma.coupon.count({
      where: { issued_partner_id: 1n },
    });
    const finalInquiryCount = await prisma.inquiry.count({
      where: { Product: { sellerId: 1n } },
    });

    console.log(`   - 리뷰: ${finalReviewCount}개`);
    console.log(`   - 쿠폰: ${finalCouponCount}개`);
    console.log(`   - 문의: ${finalInquiryCount}개`);
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
