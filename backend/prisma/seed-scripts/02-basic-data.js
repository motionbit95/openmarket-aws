const {
  PrismaClient,
  sellers_bank_type,
  Notice_type,
  Product_saleStatus,
  Product_displayStatus,
  terms_type,
} = require("@prisma/client");
const { faker } = require("@faker-js/faker");

// 한국어 locale 설정
faker.locale = "ko";

const prisma = new PrismaClient();

// 카테고리 코드
const categories = [
  "C-FOOD-SEAFOOD-DRIED",
  "C-FOOD-POWDER-SEASONING-OIL",
  "C-FOOD-MEAT-EGG",
  "C-FOOD-FRESH-VEGETABLE",
  "C-FOOD-FRUIT",
  "C-FASHION-CLOTHING-MEN",
  "C-FASHION-CLOTHING-WOMEN",
  "C-FASHION-SHOES",
  "C-BEAUTY-COSMETIC",
  "C-BEAUTY-SKINCARE",
  "C-HOME-KITCHEN",
  "C-DIGITAL-PHONE",
  "C-BOOK-NOVEL",
  "C-SPORTS-FITNESS",
  "C-PET-DOG",
];

const koreanBrands = [
  "삼성",
  "LG",
  "롯데",
  "농심",
  "오뚜기",
  "CJ",
  "풀무원",
  "한샘",
  "아모레퍼시픽",
  "이니스프리",
];
const koreanManufacturers = [
  "삼성전자",
  "LG전자",
  "농심",
  "오뚜기",
  "CJ제일제당",
  "풀무원",
  "아모레퍼시픽",
  "LG생활건강",
  "한샘",
  "코웨이",
];

function getKoreanProductName(category) {
  const productNames = {
    "C-FOOD-SEAFOOD-DRIED": [
      "마른 오징어",
      "황태포",
      "북어채",
      "멸치",
      "다시마",
    ],
    "C-FOOD-POWDER-SEASONING-OIL": [
      "참기름",
      "들기름",
      "간장",
      "된장",
      "고춧가루",
    ],
    "C-FOOD-MEAT-EGG": ["한우 등심", "돼지 목살", "닭가슴살", "계란", "소시지"],
    "C-FOOD-FRESH-VEGETABLE": ["배추", "무", "당근", "양파", "마늘"],
    "C-FOOD-FRUIT": ["사과", "배", "귤", "딸기", "수박"],
    "C-FASHION-CLOTHING-MEN": [
      "남성 셔츠",
      "정장",
      "캐주얼 팬츠",
      "청바지",
      "티셔츠",
    ],
    "C-FASHION-CLOTHING-WOMEN": [
      "원피스",
      "블라우스",
      "스커트",
      "레깅스",
      "카디건",
    ],
    "C-FASHION-SHOES": ["운동화", "구두", "부츠", "샌들", "슬리퍼"],
    "C-BEAUTY-COSMETIC": [
      "파운데이션",
      "립스틱",
      "마스카라",
      "아이섀도",
      "블러셔",
    ],
    "C-BEAUTY-SKINCARE": ["토너", "에센스", "세럼", "크림", "클렌징폼"],
    "C-HOME-KITCHEN": ["프라이팬", "냄비", "압력솥", "전기밥솥", "믹서기"],
    "C-DIGITAL-PHONE": [
      "아이폰",
      "갤럭시",
      "아이패드",
      "갤럭시탭",
      "휴대폰케이스",
    ],
    "C-BOOK-NOVEL": ["소설", "추리소설", "로맨스소설", "판타지소설", "에세이"],
    "C-SPORTS-FITNESS": ["덤벨", "요가매트", "런닝머신", "헬스복", "운동화"],
    "C-PET-DOG": ["강아지사료", "강아지간식", "목줄", "강아지옷", "장난감"],
  };

  const names = productNames[category] || ["상품"];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const prefixes = ["프리미엄", "특선", "국산", "정품", "신선한"];
  const prefix =
    Math.random() < 0.7
      ? prefixes[Math.floor(Math.random() * prefixes.length)] + " "
      : "";

  return prefix + randomName;
}

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
    "상훈",
    "은지",
  ];

  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];

  return surname + givenName;
}

function getKoreanShopName() {
  const prefixes = ["행복한", "즐거운", "신나는", "따뜻한", "편안한"];
  const suffixes = ["마켓", "샵", "스토어", "몰", "하우스"];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return prefix + suffix;
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
  console.log("👤 기본 데이터 생성 시작...");

  try {
    // 1. 판매자 데이터 생성
    console.log("🏪 판매자 데이터 생성 중...");
    for (let i = 0; i < 10; i++) {
      await prisma.sellers.create({
        data: {
          name: getKoreanName(),
          email: `seller${i + 1}@shop.com`,
          shop_name: getKoreanShopName(),
          password: "1q2w3e4r!@",
          phone: `010-${Math.floor(Math.random() * 9000) + 1000}-${
            Math.floor(Math.random() * 9000) + 1000
          }`,
          business_number: String(
            Math.floor(Math.random() * 9000000000) + 1000000000
          ),
          bank_type: faker.helpers.arrayElement(
            Object.values(sellers_bank_type)
          ),
          bank_account: String(
            Math.floor(Math.random() * 900000000000) + 100000000000
          ),
          depositor_name: getKoreanName(),
          ceo_name: getKoreanName(),
          address1: getKoreanAddress(),
          address2: `${Math.floor(Math.random() * 999) + 1}호`,
          postcode: String(Math.floor(Math.random() * 90000) + 10000),
          onlinesales_number: String(
            Math.floor(Math.random() * 900000000000) + 100000000000
          ),
          email_verified: true,
        },
      });
    }

    // 2. 사용자 데이터 생성
    console.log("👥 사용자 데이터 생성 중...");
    for (let i = 0; i < 25; i++) {
      const now = new Date();
      const user = await prisma.users.create({
        data: {
          user_name: getKoreanName(),
          email: `user${i + 1}@test.com`,
          password: "1q2w3e4r!@",
          phone: `010-${Math.floor(Math.random() * 9000) + 1000}-${
            Math.floor(Math.random() * 9000) + 1000
          }`,
          mileage: Math.floor(Math.random() * 10000),
          created_at: now,
          updated_at: now,
        },
      });

      // 사용자 주소 생성
      await prisma.user_addresses.create({
        data: {
          userId: user.id,
          recipient: getKoreanName(),
          phone: `010-${Math.floor(Math.random() * 9000) + 1000}-${
            Math.floor(Math.random() * 9000) + 1000
          }`,
          postcode: String(Math.floor(Math.random() * 90000) + 10000),
          address1: getKoreanAddress(),
          address2: `${Math.floor(Math.random() * 999) + 1}호`,
          isDefault: true,
          memo: "문 앞에 놓아주세요",
          created_at: now,
          updated_at: now,
        },
      });
    }

    // 3. 상품 데이터 생성
    console.log("📦 상품 데이터 생성 중...");
    const sellers = await prisma.sellers.findMany();

    for (const seller of sellers) {
      for (let i = 0; i < 18; i++) {
        // 각 판매자당 18개씩 총 180개
        const category = faker.helpers.arrayElement(categories);
        const originalPrice = Math.floor(Math.random() * 100000) + 10000;
        const discountRate = Math.floor(Math.random() * 30) + 5;
        const salePrice = Math.floor(
          (originalPrice * (100 - discountRate)) / 100
        );

        const now = new Date();
        await prisma.product.create({
          data: {
            sellerId: seller.id,
            displayName: getKoreanProductName(category),
            internalName: getKoreanProductName(category),
            keywords: JSON.stringify(["신선한", "프리미엄", "인기"]),
            categoryCode: category,
            brand: faker.helpers.arrayElement(koreanBrands),
            manufacturer: faker.helpers.arrayElement(koreanManufacturers),
            taxIncluded: true,
            saleStatus: Product_saleStatus.ON_SALE,
            displayStatus: Product_displayStatus.DISPLAYED,
            stockQuantity: Math.floor(Math.random() * 200) + 10,
            description:
              "고품질의 제품으로 고객님의 만족을 위해 최선을 다하겠습니다. 신선하고 안전한 상품을 빠른 배송으로 전해드립니다.",
            isSingleProduct: Math.random() > 0.3, // 70% 단일상품, 30% 옵션상품
            refundNotice:
              "상품 수령 후 7일 이내 미사용 시 교환/반품 가능합니다.",
            createdAt: now,
            updatedAt: now,
            ProductPrice: {
              create: {
                originalPrice: originalPrice,
                salePrice: salePrice,
                discountRate: discountRate,
                flexzonePrice: salePrice - Math.floor(Math.random() * 3000),
              },
            },
            ProductDelivery: {
              create: {
                originAddress: getKoreanAddress(),
                deliveryMethod: "택배",
                isBundle: Math.random() > 0.7,
                bundleCondition: "5만원 이상 구매시",
                isIslandAvailable: Math.random() > 0.3,
                islandCondition: "제주/도서산간 배송 가능",
                courier: faker.helpers.arrayElement([
                  "CJ대한통운",
                  "롯데택배",
                  "우체국택배",
                ]),
                deliveryFeeType: faker.helpers.arrayElement([
                  "무료",
                  "유료",
                  "조건부무료",
                ]),
                deliveryFee: faker.helpers.arrayElement([0, 2500, 3000]),
                deliveryTime: faker.helpers.arrayElement([
                  "당일발송",
                  "1-2일",
                  "2-3일",
                ]),
                conditionalFreeMinAmount:
                  Math.floor(Math.random() * 50000) + 30000,
              },
            },
            ProductImage: {
              create: Array.from(
                { length: Math.floor(Math.random() * 4) + 2 },
                (_, idx) => ({
                  url: `https://picsum.photos/600/600?random=${
                    Date.now() + Math.random() * 1000 + idx
                  }`,
                  isMain: idx === 0,
                  sortOrder: idx,
                })
              ),
            },
            ProductInfoNotice: {
              create: [
                {
                  name: "제조국",
                  value: "대한민국",
                },
                {
                  name: "제조사",
                  value: faker.helpers.arrayElement(koreanManufacturers),
                },
              ],
            },
          },
        });
      }
    }

    // 4. 기본 쿠폰 데이터
    console.log("🎫 쿠폰 데이터 생성 중...");
    const couponTitles = [
      "신규회원 쿠폰",
      "특가 할인 쿠폰",
      "무료배송 쿠폰",
      "감사 쿠폰",
      "이벤트 쿠폰",
    ];

    for (let i = 0; i < 5; i++) {
      const now = new Date();
      await prisma.coupon.create({
        data: {
          title: couponTitles[i],
          content: `${(i + 1) * 5}% 할인 혜택을 드립니다!`,
          coupon_type: "ALL",
          discount_mode: "percent",
          discount_amount: (i + 1) * 5,
          discount_max: 10000,
          min_order_amount: 30000,
          total_count: 100,
          start_date: now,
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          validity_type: "FIXED_DATE",
          validity_days: null,
          valid_from: now,
          valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          issued_by: "ADMIN",
          issued_partner_id: null,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    // 5. 기본 공지사항, FAQ, 약관
    console.log("📢 기본 콘텐츠 생성 중...");

    // 공지사항
    const noticeTitles = [
      "개인정보 처리방침 개정 안내",
      "배송비 정책 변경 안내",
      "신규 쿠폰 이벤트 안내",
    ];
    for (let i = 0; i < 10; i++) {
      const now = new Date();
      await prisma.notice.create({
        data: {
          type: Notice_type.USER,
          title: noticeTitles[i % noticeTitles.length],
          content:
            "공지사항 내용을 안내드립니다. 자세한 사항은 고객센터로 문의해 주시기 바랍니다.",
          is_pinned: Math.random() > 0.8,
          view_count: Math.floor(Math.random() * 1000),
          created_at: now,
          updated_at: now,
        },
      });
    }

    // FAQ
    const now = new Date();
    await prisma.FAQ.createMany({
      data: [
        {
          type: "주문/결제",
          title: "주문 취소는 어떻게 하나요?",
          content: "마이페이지 > 주문내역에서 취소 가능합니다.",
          created_at: now,
          updated_at: now,
        },
        {
          type: "배송",
          title: "배송비는 얼마인가요?",
          content:
            "기본 배송비는 2,500원이며, 3만원 이상 구매시 무료배송입니다.",
          created_at: now,
          updated_at: now,
        },
        {
          type: "교환/반품",
          title: "교환/반품 기간은 얼마나 되나요?",
          content: "상품 수령 후 7일 이내에 교환/반품 신청이 가능합니다.",
          created_at: now,
          updated_at: now,
        },
      ],
    });

    // 약관
    const termsNow = new Date();
    await prisma.terms.createMany({
      data: [
        {
          id: "1",
          type: terms_type.TERMS,
          title: "이용약관",
          content:
            "제1조 (목적) 이 약관은 오픈마켓 서비스의 이용과 관련하여 회사와 회원간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.",
          effective_date: termsNow,
          created_at: termsNow,
          updated_at: termsNow,
        },
        {
          id: "2",
          type: terms_type.PRIVACY,
          title: "개인정보 처리방침",
          content:
            "오픈마켓은 정보주체의 자유와 권리 보호를 위해 개인정보 보호법을 준수하여 개인정보를 처리하고 관리하고 있습니다.",
          effective_date: termsNow,
          created_at: termsNow,
          updated_at: termsNow,
        },
      ],
    });

    console.log("✅ 기본 데이터 생성 완료!");
  } catch (error) {
    console.error("❌ 에러 발생:", error);
    throw error;
  }
}

main()
  .catch((err) => {
    console.error("❌ 기본 데이터 생성 중 오류 발생:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
