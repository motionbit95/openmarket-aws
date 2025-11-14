const { PrismaClient } = require("@prisma/client");
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

async function main() {
  console.log("💬 고객지원 및 파일 시스템 데이터 생성 시작...");

  try {
    const allUsers = await prisma.users.findMany();
    const allSellers = await prisma.sellers.findMany();

    // 1. 유저가이드 데이터 생성
    console.log("📖 유저가이드 데이터 생성 중...");

    const userGuideData = [
      {
        type: "회원가입",
        title: "회원가입하는 방법",
        content: `**1단계: 회원가입 페이지 접속**\n홈페이지 상단의 '회원가입' 버튼을 클릭하세요.\n\n**2단계: 기본정보 입력**\n- 이메일 주소\n- 비밀번호\n- 이름\n- 휴대폰 번호\n\n**3단계: 이메일 인증**\n입력한 이메일로 발송된 인증번호를 입력하세요.`,
      },
      {
        type: "주문/결제",
        title: "상품 주문하는 방법",
        content: `**1단계: 상품 선택**\n원하는 상품을 선택하고 장바구니에 담으세요.\n\n**2단계: 주문하기**\n장바구니에서 주문할 상품을 확인하고 '주문하기'를 클릭하세요.\n\n**3단계: 배송지 정보**\n수령인 정보와 배송주소를 입력하세요.`,
      },
      {
        type: "배송",
        title: "배송 관련 안내",
        content: `**배송업체**: CJ대한통운, 롯데택배 등\n\n**배송비**: 기본 2,500원 (30,000원 이상 무료)\n\n**배송기간**: 1-3일\n\n**배송조회**: 마이페이지에서 확인 가능`,
      },
      {
        type: "교환/반품",
        title: "교환 및 반품 안내",
        content: `**기간**: 상품 수령일로부터 7일 이내\n\n**조건**: 미사용 상품\n\n**절차**: 고객센터 신청 → 상품 반송 → 검수 → 처리`,
      },
      {
        type: "결제",
        title: "결제수단 안내",
        content: `**결제수단**\n- 신용카드/체크카드\n- 계좌이체\n- 카카오페이\n- 네이버페이\n\n**할부**: 5만원 이상 시 무이자 할부 가능`,
      },
      {
        type: "적립금",
        title: "적립금 사용 안내",
        content: `**적립률**: 구매금액의 1%\n\n**사용**: 1,000원 이상부터 사용 가능\n\n**유효기간**: 적립일로부터 2년`,
      },
    ];

    for (const guide of userGuideData) {
      await prisma.userGuide.create({
        data: {
          ...guide,
          is_pinned: Math.random() > 0.7,
          view_count: Math.floor(Math.random() * 5000) + 100,
          updated_at: new Date(),
        },
      });
    }

    // 2. 에러리포트 데이터 생성
    console.log("🐛 에러리포트 데이터 생성 중...");

    const errorCategories = [
      "버그신고",
      "기능개선",
      "서비스장애",
      "결제오류",
      "로그인문제",
      "기타",
    ];
    const errorTitles = [
      "로그인 후 장바구니가 사라져요",
      "결제 완료 후 주문내역이 안보여요",
      "상품 이미지가 로딩되지 않아요",
      "쿠폰 적용이 안됩니다",
      "배송조회가 업데이트 안돼요",
      "앱이 자주 강제종료됩니다",
      "검색 기능이 제대로 작동하지 않아요",
      "리뷰 작성이 안됩니다",
      "적립금 계산이 틀려요",
      "카테고리 페이지가 열리지 않아요",
    ];

    const errorContents = [
      "안녕하세요. 계속 같은 문제가 발생하고 있습니다. 확인 부탁드려요.",
      "결제는 완료되었는데 주문내역이 표시되지 않습니다.",
      "상품 상세페이지에서 이미지가 로딩되지 않아요.",
      "할인쿠폰 적용이 되지 않습니다. 조건도 맞는데 왜 안되는지 모르겠어요.",
      "배송조회가 업데이트되지 않고 있어요.",
      "앱 사용 중에 자주 강제종료됩니다.",
      "검색 결과가 이상해요. 원하는 상품을 찾을 수 없어요.",
      "리뷰 작성 버튼이 작동하지 않습니다.",
      "적립금 계산이 틀린 것 같아요.",
      "카테고리 페이지가 로딩되지 않습니다.",
    ];

    for (let i = 0; i < 50; i++) {
      const isUserReport = Math.random() > 0.2;

      if (isUserReport && allUsers.length === 0) {
        console.log("⚠️ 사용자 데이터가 없어 에러리포트 생성을 건너뜁니다.");
        continue;
      }

      if (!isUserReport && allSellers.length === 0) {
        console.log("⚠️ 판매자 데이터가 없어 에러리포트 생성을 건너뜁니다.");
        continue;
      }

      const reporterId = isUserReport
        ? allUsers[Math.floor(Math.random() * allUsers.length)].id
        : allSellers[Math.floor(Math.random() * allSellers.length)].id;

      const reportDate = new Date(
        Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000
      );

      await prisma.errorReport.create({
        data: {
          reporter_id: reporterId,
          reporter_type: isUserReport ? "user" : "seller",
          category: faker.helpers.arrayElement(errorCategories),
          title: faker.helpers.arrayElement(errorTitles),
          content: faker.helpers.arrayElement(errorContents),
          status: faker.helpers.arrayElement([
            "접수",
            "처리중",
            "완료",
            "완료",
            "완료",
          ]),
          created_at: reportDate,
          updated_by: Math.random() > 0.3 ? "관리자" : null,
          updated_at:
            Math.random() > 0.3
              ? new Date(
                  reportDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000
                )
              : null,
          answer:
            Math.random() > 0.3
              ? "신고해주신 문제를 확인했습니다. 해당 이슈는 수정되었습니다."
              : null,
          answeredAt:
            Math.random() > 0.3
              ? new Date(
                  reportDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000
                )
              : null,
        },
      });
    }

    // 3. 문의 데이터 추가
    console.log("💬 문의 데이터 생성 중...");
    const inquiryTitles = [
      "배송 관련 문의드립니다",
      "상품 교환 가능한가요?",
      "재고 언제 입고되나요?",
      "할인 쿠폰 사용법 문의",
      "반품 절차 안내 부탁드려요",
      "적립금 사용법 궁금해요",
      "회원 등급 혜택 문의",
      "대량 주문 할인 문의",
    ];

    for (let i = 0; i < 30; i++) {
      const isUserInquiry = Math.random() > 0.2;

      if (isUserInquiry && allUsers.length === 0) {
        console.log("⚠️ 사용자 데이터가 없어 문의 생성을 건너뜁니다.");
        continue;
      }

      if (!isUserInquiry && allSellers.length === 0) {
        console.log("⚠️ 판매자 데이터가 없어 문의 생성을 건너뜁니다.");
        continue;
      }

      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const randomSeller =
        allSellers[Math.floor(Math.random() * allSellers.length)];

      await prisma.inquiry.create({
        data: {
          senderId: isUserInquiry ? randomUser.id : randomSeller.id,
          senderType: isUserInquiry ? "user" : "seller",
          title:
            inquiryTitles[Math.floor(Math.random() * inquiryTitles.length)],
          content:
            "안녕하세요. 문의사항이 있어서 연락드립니다. 빠른 답변 부탁드립니다.",
          status: faker.helpers.arrayElement([
            "접수",
            "처리중",
            "완료",
            "완료",
          ]),
          answer:
            Math.random() > 0.3
              ? "문의해주신 내용에 대해 답변드립니다. 감사합니다."
              : null,
          answeredAt: Math.random() > 0.3 ? new Date() : null,
          productId: null,
        },
      });
    }

    // 4. 첨부파일 데이터 생성
    console.log("📎 첨부파일 데이터 생성 중...");

    // 상품 이미지 첨부파일
    const products = await prisma.product.findMany({
      include: { ProductImage: true },
      take: 100,
    });

    for (const product of products) {
      for (const image of product.ProductImage) {
        await prisma.attachments.create({
          data: {
            target_type: "product",
            target_id: product.id,
            filename: `product_${product.id}_${image.sortOrder + 1}.jpg`,
            url: image.url,
            s3_key: `products/${product.id}/${image.sortOrder + 1}.jpg`,
            filesize: Math.floor(Math.random() * 2000000) + 100000,
            mimetype: "image/jpeg",
            image_type: image.isMain ? "main" : "detail",
            image_width: 600,
            image_height: 600,
          },
        });
      }
    }

    // 리뷰 이미지 첨부파일
    const reviewsWithImages = await prisma.review.findMany({
      include: { ReviewImage: true },
      where: {
        ReviewImage: {
          some: {},
        },
      },
    });

    for (const review of reviewsWithImages) {
      for (const image of review.ReviewImage) {
        await prisma.attachments.create({
          data: {
            target_type: "review",
            target_id: review.id,
            filename: `review_${review.id}_${image.sortOrder + 1}.jpg`,
            url: image.url,
            s3_key: `reviews/${review.id}/${image.sortOrder + 1}.jpg`,
            filesize: Math.floor(Math.random() * 5000000) + 500000,
            mimetype: "image/jpeg",
            image_type: "review",
            image_width: 400,
            image_height: 300,
          },
        });
      }
    }

    // 5. 배너 데이터 생성
    console.log("🎨 배너 데이터 생성 중...");

    for (let i = 0; i < 8; i++) {
      const attachment = await prisma.attachments.create({
        data: {
          target_type: "banner",
          target_id: 1000 + i,
          filename: `banner_${i + 1}.jpg`,
          url: `https://picsum.photos/1200/400?random=${Date.now() + i}`,
          s3_key: `banners/banner_${i + 1}.jpg`,
          filesize: Math.floor(Math.random() * 3000000) + 500000,
          mimetype: "image/jpeg",
          image_type: "banner",
          image_width: 1200,
          image_height: 400,
        },
      });

      await prisma.banners.create({
        data: {
          attachmentId: attachment.id,
          url: Math.random() > 0.5 ? `https://example.com/event/${i + 1}` : "",
          ownerType: faker.helpers.arrayElement(["ADVERTISER", "SELLER"]),
          ownerId: String(i + 1),
          updatedAt: new Date(),
        },
      });

      await prisma.attachments.update({
        where: { id: attachment.id },
        data: { target_id: i + 1 },
      });
    }

    console.log("✅ 고객지원 및 파일 시스템 데이터 생성 완료!");
  } catch (error) {
    console.error("❌ 에러 발생:", error);
    throw error;
  }
}

main()
  .catch((err) => {
    console.error("❌ 고객지원 및 파일 데이터 생성 중 오류 발생:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
