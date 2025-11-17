const request = require("supertest");
const app = require("../app");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

describe("상품 API 테스트", () => {
  let productId;
  let sellerId;

  beforeAll(async () => {
    // 테스트용 판매자 생성
    const seller = await prisma.sellers.create({
      data: {
        name: "테스트셀러",
        email: `test-seller-${Date.now()}@example.com`,
        shop_name: "테스트샵",
        password: "password123",
        phone: "010-1234-5678",
        bank_type: "KB",
        bank_account: "123-456-7890",
      },
    });
    sellerId = seller.id;
  });

  afterAll(async () => {
    // 상품 관련 데이터 먼저 삭제
    if (productId) {
      try {
        // 상품이 아직 존재하는지 확인
        const existingProduct = await prisma.product.findUnique({
          where: { id: BigInt(productId) },
        });

        if (existingProduct) {
          await prisma.productInfoNotice.deleteMany({
            where: { productId: BigInt(productId) },
          });
          await prisma.productImage.deleteMany({
            where: { productId: BigInt(productId) },
          });
          await prisma.productReturn.deleteMany({
            where: { productId: BigInt(productId) },
          });
          await prisma.productDelivery.deleteMany({
            where: { productId: BigInt(productId) },
          });
          await prisma.productPrice.deleteMany({
            where: { productId: BigInt(productId) },
          });
          await prisma.product.delete({ where: { id: BigInt(productId) } });
        }
      } catch (error) {
        console.log("상품 정리 중 에러 (이미 삭제됨):", error.message);
      }
    }
    // 테스트용 판매자 삭제
    await prisma.sellers.deleteMany({ where: { id: sellerId } });
    await prisma.$disconnect();
  });

  test("상품 생성 - 정상 케이스", async () => {
    // given
    const productData = {
      sellerId: sellerId.toString(),
      displayName: "테스트 상품",
      internalName: "test-product",
      keywords: "티셔츠,반팔,여름",
      categoryCode: "TOP001",
      brand: "테스트브랜드",
      manufacturer: "테스트제조사",
      taxIncluded: true,
      saleStatus: "ON_SALE",
      displayStatus: "DISPLAYED",
      stockQuantity: 100,
      saleStartDate: "2025-07-11T00:00:00Z",
      saleEndDate: null,
      description: "이것은 테스트 상품입니다.",
      ProductPrice: {
        originalPrice: 30000,
        salePrice: 25000,
        discountRate: 16.7,
        flexzonePrice: 20000,
      },
      ProductDelivery: {
        originAddress: "서울시 강남구",
        deliveryMethod: "택배",
        isBundle: true,
        isIslandAvailable: true,
        courier: "CJ대한통운",
        deliveryFeeType: "FREE",
        deliveryFee: 0,
        deliveryTime: "2~3일",
      },
      ProductReturn: {
        returnAddress: "서울시 강남구 반품센터",
        initialShippingFee: 0,
        returnShippingFee: 2500,
        exchangeShippingFee: 3000,
      },
      images: [
        {
          url: "https://cdn.com/image1.jpg",
          isMain: true,
          sortOrder: 1,
        },
        {
          url: "https://cdn.com/image2.jpg",
          isMain: false,
          sortOrder: 2,
        },
      ],
      optionGroups: [
        {
          name: "사이즈",
          displayName: "Size",
          required: true,
          sortOrder: 0,
          options: [
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
      ],
      infoNotices: [
        {
          name: "품명 및 모델명",
          value: "테스트 티셔츠",
        },
      ],
      isSingleProduct: true,
      refundNotice: "단순 변심 반품 가능 (단, 왕복 배송비 부담)",
    };

    // when
    let res;
    try {
      res = await request(app).post("/products").send(productData);
    } catch (err) {
      // supertest 내부 에러
      console.error("supertest error:", err);
      throw err;
    }

    if (res.status !== 201) {
      // 디버깅용: 응답 본문과 에러 출력
      console.error("상품 생성 실패 응답:", res.status, res.body);
    }
    expect(res.status).toBe(201);

    // then
    expect(res.body).toHaveProperty("id");
    expect(res.body.displayName).toBe("테스트 상품");
    expect(res.body.prices).toBeDefined();
    expect(res.body.delivery).toBeDefined();
    expect(res.body.returns).toBeDefined();
    expect(res.body.images.length).toBe(2);
    expect(res.body.optionGroups.length).toBe(1);
    expect(res.body.infoNotices.length).toBe(1);
    expect(res.body.refundNotice).toBe(
      "단순 변심 반품 가능 (단, 왕복 배송비 부담)"
    );

    // 생성된 상품 id 저장
    productId = res.body.id;
  });

  test("상품 단건 조회 - 정상 케이스", async () => {
    // given: 위에서 생성한 productId 사용

    // when
    let res;
    try {
      res = await request(app).get(`/products/${productId}`);
    } catch (err) {
      console.error("supertest error:", err);
      throw err;
    }
    if (res.status !== 200) {
      console.error("상품 단건 조회 실패 응답:", res.status, res.body);
    }
    expect(res.status).toBe(200);

    // then
    expect(res.body).toHaveProperty("id");
    expect(res.body.displayName).toBe("테스트 상품");
    expect(res.body.images.length).toBeGreaterThan(0);
    expect(res.body.optionGroups.length).toBeGreaterThan(0);
  });

  test("상품 수정 - 정상 케이스", async () => {
    // given
    const updateData = {
      displayName: "수정된 상품명",
      internalName: "updated-product",
      keywords: "수정,테스트",
      categoryCode: "TOP002",
      brand: "수정브랜드",
      manufacturer: "수정제조사",
      taxIncluded: false,
      saleStatus: "PAUSED",
      displayStatus: "HIDDEN",
      stockQuantity: 50,
      saleStartDate: "2025-08-01T00:00:00Z",
      saleEndDate: null,
      description: "수정된 상품 설명",
      isSingleProduct: false,
      ProductPrice: {
        originalPrice: 40000,
        salePrice: 35000,
        discountRate: 12.5,
        flexzonePrice: 30000,
      },
      ProductDelivery: {
        originAddress: "서울시 송파구",
        deliveryMethod: "퀵서비스",
        isBundle: false,
        isIslandAvailable: false,
        courier: "한진택배",
        deliveryFeeType: "PAID",
        deliveryFee: 3000,
        deliveryTime: "1~2일",
      },
      ProductReturn: {
        returnAddress: "서울시 송파구 반품센터",
        initialShippingFee: 3000,
        returnShippingFee: 3500,
        exchangeShippingFee: 4000,
      },
      images: [
        {
          url: "https://cdn.com/updated1.jpg",
          isMain: true,
          sortOrder: 1,
        },
      ],
      optionGroups: [
        {
          name: "색상",
          displayName: "Color",
          required: true,
          sortOrder: 0,
          options: [
            {
              value: "RED",
              displayName: "Red",
              extraPrice: 0,
              sortOrder: 0,
              isAvailable: true,
            },
            {
              value: "BLUE",
              displayName: "Blue",
              extraPrice: 0,
              sortOrder: 1,
              isAvailable: true,
            },
          ],
        },
      ],
      infoNotices: [
        {
          name: "제조국",
          value: "대한민국",
        },
      ],
      refundNotice: "수정된 환불 안내",
    };

    // when
    let res;
    try {
      res = await request(app).put(`/products/${productId}`).send(updateData);
    } catch (err) {
      console.error("supertest error:", err);
      throw err;
    }
    if (res.status !== 200) {
      console.error("상품 수정 실패 응답:", res.status, res.body);
    }
    expect(res.status).toBe(200);

    // then
    expect(res.body.displayName).toBe("수정된 상품명");
    expect(res.body.prices.originalPrice).toBe(40000);
    expect(res.body.delivery.courier).toBe("한진택배");
    expect(res.body.images.length).toBe(1);
    expect(res.body.optionGroups[0].name).toBe("색상");
    expect(res.body.infoNotices[0].name).toBe("제조국");
    expect(res.body.refundNotice).toBe("수정된 환불 안내");
  });

  test("상품 삭제 - 정상 케이스", async () => {
    // when
    let res;
    try {
      res = await request(app).delete(`/products/${productId}`);
    } catch (err) {
      console.error("supertest error:", err);
      throw err;
    }
    if (res.status !== 200) {
      console.error("상품 삭제 실패 응답:", res.status, res.body);
    }
    expect(res.status).toBe(200);

    // then
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("상품이 성공적으로 삭제되었습니다");

    // 실제로 DB에서 삭제되었는지 확인
    let deleted = null;
    try {
      if (productId !== null && productId !== undefined) {
        deleted = await prisma.product.findUnique({
          where: { id: BigInt(productId) },
        });
      }
    } catch (err) {
      // 만약 productId가 undefined/null이거나 BigInt 변환이 불가하면 deleted는 null로 둠
      deleted = null;
    }
    expect(deleted).toBeNull();

    // productId는 afterAll에서 정리할 때까지 유지
  });

  test("상품 단건 조회 - 없는 상품", async () => {
    // 존재하지 않는 id로 조회
    let res;
    try {
      res = await request(app).get(`/products/999999999999`);
    } catch (err) {
      console.error("supertest error:", err);
      throw err;
    }
    if (res.status !== 404) {
      console.error("없는 상품 조회 실패 응답:", res.status, res.body);
    }
    expect(res.status).toBe(404);

    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("상품을 찾을 수 없습니다");
  });
});
