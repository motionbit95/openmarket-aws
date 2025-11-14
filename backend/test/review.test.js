const request = require("supertest");
const app = require("../app");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

let userId;
let productId;
let sellerId;
let createdReviewId;

beforeAll(async () => {
  // 테스트용 seller 생성
  const seller = await prisma.seller.create({
    data: {
      name: "테스트 셀러",
      email: `seller-${Date.now()}@example.com`,
      password: "password123",
      bank_type: "KB",
      bank_account: "123-456-7890",
      depositor_name: "테스트 셀러",
      ceo_name: "대표자",
    },
  });
  sellerId = seller.id;

  // 유저 생성
  const user = await prisma.user.create({
    data: {
      user_name: "리뷰 유저",
      email: `reviewer-${Date.now()}@example.com`,
      password: "password123",
      phone: "010-1234-5678",
    },
  });
  userId = user.id;

  // 상품 생성 (스키마에 맞게 필수/관계 필드 포함)
  const product = await prisma.product.create({
    data: {
      sellerId: seller.id,
      displayName: "리뷰용 상품",
      internalName: "review-product",
      keywords: "리뷰,테스트",
      categoryCode: "CAT123",
      brand: "리뷰브랜드",
      manufacturer: "리뷰제조사",
      taxIncluded: true,
      saleStatus: "ON_SALE",
      displayStatus: "DISPLAYED",
      stockQuantity: 10,
      saleStartDate: new Date(),
      saleEndDate: null,
      description: "리뷰 테스트용 상품입니다.",
      isSingleProduct: true,
      prices: {
        create: {
          originalPrice: 30000,
          salePrice: 25000,
          discountRate: 16.7,
          flexzonePrice: 0,
        },
      },
      delivery: {
        create: {
          originAddress: "서울시 강남구",
          deliveryMethod: "택배",
          isBundle: true,
          isIslandAvailable: true,
          courier: "CJ대한통운",
          deliveryFeeType: "FREE",
          deliveryFee: 0,
          deliveryTime: "2~3일",
        },
      },
      returns: {
        create: {
          returnAddress: "서울시 강남구 반품센터",
          initialShippingFee: 0,
          returnShippingFee: 2500,
          exchangeShippingFee: 3000,
        },
      },
      images: {
        create: [
          { url: "https://cdn.com/image1.jpg", isMain: true, sortOrder: 1 },
        ],
      },
      optionGroups: {
        create: [
          {
            name: "사이즈",
            displayName: "Size",
            required: true,
            sortOrder: 0,
            options: {
              create: [
                {
                  value: "S",
                  displayName: "Small",
                  extraPrice: 0,
                  sortOrder: 0,
                  isAvailable: true,
                },
                {
                  value: "M",
                  displayName: "Medium",
                  extraPrice: 0,
                  sortOrder: 1,
                  isAvailable: true,
                },
                {
                  value: "L",
                  displayName: "Large",
                  extraPrice: 0,
                  sortOrder: 2,
                  isAvailable: false,
                },
              ],
            },
          },
        ],
      },
      infoNotices: {
        create: [
          { name: "품명 및 모델명", value: "리뷰용 티셔츠" },
          { name: "제조국", value: "대한민국" },
        ],
      },
    },
  });

  productId = product.id;
});

afterAll(async () => {
  // 리뷰 삭제 (존재하면)
  if (createdReviewId) {
    // 리뷰 이미지 먼저 삭제
    await prisma.reviewImage.deleteMany({
      where: { reviewId: createdReviewId },
    });
    // 리뷰 삭제
    await prisma.review.deleteMany({
      where: { id: createdReviewId },
    });
  }

  // product의 자식 테이블(종속관계)부터 순서대로 삭제
  // 먼저 ProductOptionValue 삭제 (ProductOptionGroup을 참조)
  await prisma.productOptionValue.deleteMany({
    where: {
      optionGroup: { productId },
    },
  });

  // 그 다음 ProductOptionGroup 삭제
  await prisma.productOptionGroup.deleteMany({ where: { productId } });
  await prisma.productInfoNotice.deleteMany({ where: { productId } });
  await prisma.productImage.deleteMany({ where: { productId } });
  await prisma.productReturn.deleteMany({ where: { productId } });
  await prisma.productDelivery.deleteMany({ where: { productId } });
  await prisma.productPrice.deleteMany({ where: { productId } });

  // product 삭제
  await prisma.product.deleteMany({ where: { id: productId } });

  // user 삭제
  await prisma.user.deleteMany({ where: { id: userId } });

  // 테스트용 seller 삭제
  await prisma.seller.deleteMany({ where: { id: sellerId } });

  await prisma.$disconnect();
});

describe("리뷰 API 테스트", () => {
  test("리뷰를 생성해야 한다", async () => {
    const res = await request(app)
      .post("/reviews")
      .send({
        productId: productId.toString(),
        userId: userId.toString(),
        rating: 5,
        content: "이 제품 정말 좋아요!",
        images: [
          {
            url: "https://cdn.com/review1.jpg",
            sortOrder: 1,
          },
        ],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.content).toBe("이 제품 정말 좋아요!");
    expect(res.body.rating).toBe(5);
    expect(res.body.productId).toBeDefined();
    expect(res.body.userId).toBeDefined();
    expect(Array.isArray(res.body.images)).toBe(true);
    expect(res.body.images[0].url).toBe("https://cdn.com/review1.jpg");
    createdReviewId = res.body.id;
  });

  test("상품별 리뷰를 조회해야 한다", async () => {
    const res = await request(app).get(`/reviews/products/${productId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // createdReviewId가 포함되어 있는지 확인
    const found = res.body.find((r) => {
      // id는 string으로 반환될 수 있으므로 문자열로 비교
      return r.id?.toString() === createdReviewId?.toString();
    });
    expect(found).toBeTruthy();
    expect(found.productId?.toString()).toBe(productId.toString());
    expect(found.userId?.toString()).toBe(userId.toString());
    expect(Array.isArray(found.images)).toBe(true);
  });

  test("리뷰를 수정해야 한다", async () => {
    const res = await request(app)
      .put(`/reviews/${createdReviewId}`)
      .send({
        rating: 4,
        content: "수정된 리뷰입니다.",
        images: [
          {
            url: "https://cdn.com/updated.jpg",
            sortOrder: 1,
          },
        ],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.rating).toBe(4);
    expect(res.body.content).toBe("수정된 리뷰입니다.");
    expect(Array.isArray(res.body.images)).toBe(true);
    expect(res.body.images[0].url).toBe("https://cdn.com/updated.jpg");
  });

  test("리뷰를 삭제해야 한다", async () => {
    const res = await request(app).delete(`/reviews/${createdReviewId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/삭제/);

    // 실제로 DB에서 삭제됐는지 확인
    const deleted = await prisma.review.findUnique({
      where: { id: createdReviewId },
    });
    expect(deleted).toBeNull();
    // createdReviewId를 null로 만들어서 afterAll에서 중복 삭제 방지
    createdReviewId = null;
  });
});
