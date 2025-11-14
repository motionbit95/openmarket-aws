const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedInquiries() {
  try {
    console.log("샘플 문의 데이터 생성 시작...");

    // 첫 번째 사용자와 판매자 ID 가져오기
    const firstUser = await prisma.users.findFirst();
    const firstSeller = await prisma.sellers.findFirst();

    if (!firstUser) {
      console.error("사용자가 없습니다. 먼저 사용자를 생성해주세요.");
      return;
    }

    // 샘플 문의 데이터
    const inquiries = [
      {
        senderId: firstUser.id,
        senderType: "user",
        title: "배송 문의드립니다",
        content: "주문한 상품의 배송이 지연되고 있는데 언제쯤 도착할까요?",
        status: "접수",
      },
      {
        senderId: firstUser.id,
        senderType: "user",
        title: "결제 오류 문의",
        content: "결제 중 오류가 발생했습니다. 확인 부탁드립니다.",
        status: "접수",
      },
      {
        senderId: firstUser.id,
        senderType: "user",
        title: "상품 교환 요청",
        content: "받은 상품이 설명과 다릅니다. 교환 가능한가요?",
        status: "완료",
        answer: "교환 절차를 안내해드렸습니다.",
        answeredAt: new Date(),
      },
      {
        senderId: firstUser.id,
        senderType: "user",
        title: "회원가입 문의",
        content: "회원가입이 안되는데 도움을 주실 수 있나요?",
        status: "접수",
      },
      {
        senderId: firstUser.id,
        senderType: "user",
        title: "쿠폰 사용 문의",
        content: "쿠폰이 적용되지 않습니다. 확인 부탁드립니다.",
        status: "완료",
        answer: "쿠폰 사용 조건을 확인해주세요.",
        answeredAt: new Date(),
      },
    ];

    // 판매자 문의 추가 (판매자가 있을 경우)
    if (firstSeller) {
      inquiries.push(
        {
          senderId: firstSeller.id,
          senderType: "seller",
          title: "정산 문의드립니다",
          content: "이번 달 정산 금액 확인 부탁드립니다.",
          status: "접수",
        },
        {
          senderId: firstSeller.id,
          senderType: "seller",
          title: "상품 등록 오류",
          content: "상품 등록 중 오류가 발생합니다.",
          status: "완료",
          answer: "오류를 수정했습니다.",
          answeredAt: new Date(),
        }
      );
    }

    // 문의 데이터 생성
    for (const inquiry of inquiries) {
      await prisma.inquiry.create({
        data: inquiry,
      });
      console.log(`문의 생성: ${inquiry.title}`);
    }

    console.log("\n샘플 문의 데이터 생성 완료!");
    console.log(`총 ${inquiries.length}개의 문의가 생성되었습니다.`);
  } catch (error) {
    console.error("문의 데이터 생성 실패:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedInquiries();
