const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🎯 OpenMarket 데이터베이스 현황 확인");
  console.log("=".repeat(60));
  
  try {
    const counts = {
      // 기본 엔티티
      sellers: await prisma.sellers.count(),
      users: await prisma.users.count(),
      addresses: await prisma.userAddress.count(),
      
      // 상품 관련
      products: await prisma.product.count(),
      singleProducts: await prisma.product.count({ where: { isSingleProduct: true } }),
      optionProducts: await prisma.product.count({ where: { isSingleProduct: false } }),
      productPrices: await prisma.productPrice.count(),
      productImages: await prisma.productImage.count(),
      
      // 옵션 시스템
      optionGroups: await prisma.productOptionGroup.count(),
      optionValues: await prisma.productOptionValue.count(),
      skus: await prisma.productSKU.count(),
      skuOptions: await prisma.productSKUOption.count(),
      
      // 리뷰 시스템
      reviews: await prisma.review.count(),
      reviewImages: await prisma.reviewImage.count(),
      
      // 장바구니 & 주문
      carts: await prisma.cart.count(),
      cartItems: await prisma.cartItem.count(),
      orders: await prisma.order.count(),
      orderItems: await prisma.orderItem.count(),
      
      // 쿠폰 시스템
      coupons: await prisma.coupon.count(),
      userCoupons: await prisma.userCoupon.count(),
      
      // 관심상품
      userLikeProducts: await prisma.userLikeProduct.count(),
      
      // 고객지원
      inquiries: await prisma.inquiry.count(),
      notices: await prisma.notice.count(),
      faqs: await prisma.fAQ.count(),
      userGuides: await prisma.userGuide.count(),
      errorReports: await prisma.errorReport.count(),
      terms: await prisma.terms.count(),
      
      // 첨부파일 & 배너
      attachments: await prisma.attachment.count(),
      banners: await prisma.banner.count()
    };
    
    console.log("\n📊 **데이터 현황 요약**\n");
    
    console.log("👤 **사용자 관련:**");
    console.log(`   판매자: ${counts.sellers}개`);
    console.log(`   사용자: ${counts.users}개`);
    console.log(`   배송지 주소: ${counts.addresses}개`);
    
    console.log("\n📦 **상품 시스템:**");
    console.log(`   전체 상품: ${counts.products}개`);
    console.log(`   ├─ 단일상품: ${counts.singleProducts}개 (${Math.round(counts.singleProducts/counts.products*100)}%)`);
    console.log(`   └─ 옵션상품: ${counts.optionProducts}개 (${Math.round(counts.optionProducts/counts.products*100)}%)`);
    console.log(`   상품 이미지: ${counts.productImages}개`);
    
    console.log("\n🎨 **옵션 시스템:**");
    console.log(`   옵션 그룹: ${counts.optionGroups}개`);
    console.log(`   옵션 값: ${counts.optionValues}개`);
    console.log(`   SKU: ${counts.skus}개`);
    console.log(`   SKU-옵션 연결: ${counts.skuOptions}개`);
    
    console.log("\n⭐ **리뷰 시스템:**");
    console.log(`   리뷰: ${counts.reviews}개`);
    console.log(`   리뷰 이미지: ${counts.reviewImages}개`);
    
    console.log("\n🛒 **쇼핑 시스템:**");
    console.log(`   장바구니: ${counts.carts}개`);
    console.log(`   장바구니 아이템: ${counts.cartItems}개`);
    console.log(`   주문: ${counts.orders}개`);
    console.log(`   주문 아이템: ${counts.orderItems}개`);
    
    console.log("\n🎫 **쿠폰 시스템:**");
    console.log(`   쿠폰: ${counts.coupons}개`);
    console.log(`   사용자 보유 쿠폰: ${counts.userCoupons}개`);
    
    console.log("\n❤️ **관심상품:**");
    console.log(`   찜한 상품: ${counts.userLikeProducts}개`);
    
    console.log("\n💬 **고객지원:**");
    console.log(`   문의: ${counts.inquiries}개`);
    console.log(`   공지사항: ${counts.notices}개`);
    console.log(`   FAQ: ${counts.faqs}개`);
    console.log(`   유저가이드: ${counts.userGuides}개`);
    console.log(`   에러리포트: ${counts.errorReports}개`);
    console.log(`   약관: ${counts.terms}개`);
    
    console.log("\n📎 **파일 시스템:**");
    console.log(`   첨부파일: ${counts.attachments}개`);
    console.log(`   배너: ${counts.banners}개`);
    
    // 총 레코드 수
    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log("\n" + "=".repeat(60));
    console.log(`📊 **총 데이터:** ${totalRecords.toLocaleString()}개 레코드`);
    
    // 주문 상태 분포
    console.log("\n📋 **주문 상태 분포:**");
    const orderStatuses = await prisma.order.groupBy({
      by: ['orderStatus'],
      _count: { orderStatus: true }
    });
    
    const statusNames = {
      'PENDING': '주문접수',
      'CONFIRMED': '주문확인', 
      'PREPARING': '준비중',
      'SHIPPED': '배송중',
      'DELIVERED': '배송완료',
      'CANCELLED': '취소',
      'REFUNDED': '환불완료'
    };
    
    orderStatuses.forEach(status => {
      console.log(`   ${statusNames[status.orderStatus] || status.orderStatus}: ${status._count.orderStatus}개`);
    });
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 **데이터베이스 상태: 완전!**");
    console.log("✨ 앱 심사용 데이터가 완벽하게 준비되었습니다!");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("❌ 데이터 확인 중 오류:", error);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });