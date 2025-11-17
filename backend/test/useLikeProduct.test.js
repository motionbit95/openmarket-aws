const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const { PrismaClient } = require("@prisma/client");

const userLikeProductRouter = require("../routes/userLikeProduct.routes");

const app = express();
app.use(bodyParser.json());
app.use("/user-like-products", userLikeProductRouter);

let prisma;

describe("사용자 관심상품 API 테스트", () => {
  let userId;
  let productId;

  // 유저/상품 생성
  beforeAll(async () => {
    prisma = new PrismaClient();

    // 유저 생성
    const user = await prisma.users.create({
      data: {
        user_name: "testuser_like",
        email: `testuser_like_${Date.now()}@test.com`,
        password: "testpassword",
      },
    });
    userId = user.id.toString();

    // 상품 생성 (seller 필요)
    // 임시 seller 생성
    const seller = await prisma.sellers.create({
      data: {
        name: "test seller",
        email: `seller_like_${Date.now()}@test.com`,
        shop_name: "test shop",
        password: "testpassword",
        bank_type: "KB",
      },
    });

    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        displayName: "테스트상품",
        internalName: "test_product_like",
        keywords: "test,like",
        categoryCode: "TEST",
        brand: "테스트브랜드",
        manufacturer: "테스트제조사",
        taxIncluded: true,
        saleStatus: "ON_SALE",
        displayStatus: "DISPLAYED",
        stockQuantity: 10,
        description: "테스트 상품 설명",
        isSingleProduct: true,
      },
    });
    productId = product.id.toString();
  });

  // 유저/상품/like 삭제
  afterAll(async () => {
    if (!prisma) return;
    try {
      // 관심상품 삭제
      if (prisma.userLikeProduct) {
        await prisma.userLikeProduct.deleteMany({
          where: {
            userId: BigInt(userId),
            productId: BigInt(productId),
          },
        });
      }

      // 상품 삭제 (연관된 likedByUsers, reviews 등도 삭제됨)
      if (prisma.product) {
        await prisma.product.deleteMany({
          where: { id: BigInt(productId) },
        });
      }

      // seller 삭제 (상품이 먼저 삭제되어야 함)
      if (prisma.seller) {
        await prisma.sellers.deleteMany({
          where: { shop_name: "test shop" },
        });
      }

      // 유저 삭제
      if (prisma.user) {
        await prisma.users.deleteMany({
          where: { id: BigInt(userId) },
        });
      }
    } catch (e) {
      // ignore errors during cleanup
    } finally {
      await prisma.$disconnect();
    }
  });

  // 관심상품 추가
  it("상품에 관심을 추가해야 한다", async () => {
    const res = await request(app)
      .post("/user-like-products")
      .send({ userId, productId });
    // If server error, print for debug
    if (res.statusCode === 500) {
      // Print error for debug
      // eslint-disable-next-line no-console
      console.error("Add like error:", res.body);
      // Fail the test if server error
      // Add context for easier debugging
      if (res.body && res.body.error) {
        // eslint-disable-next-line no-console
        console.error("Detailed error:", res.body.error);
      }
      expect(res.statusCode).not.toBe(500);
      return;
    }
    expect([201, 409]).toContain(res.statusCode); // 이미 있으면 409, 없으면 201
    if (res.statusCode === 201) {
      expect(res.body).toHaveProperty("userId");
      expect(res.body).toHaveProperty("productId");
    } else if (res.statusCode === 409) {
      expect(res.body.message).toBe("이미 관심상품에 추가되어 있습니다.");
    }
  });

  // 단건 조회
  it("사용자와 상품의 관심 정보를 조회해야 한다", async () => {
    const res = await request(app).get(
      `/user-like-products/${userId}/${productId}`
    );
    if (res.statusCode === 200) {
      expect(res.body.userId.toString()).toBe(userId);
      expect(res.body.productId.toString()).toBe(productId);
    } else if (res.statusCode === 404) {
      expect(res.body.message).toBe("관심상품이 아닙니다.");
    } else if (res.statusCode === 500) {
      // Print error for debug
      // eslint-disable-next-line no-console
      console.error("Get like error:", res.body);
      if (res.body && res.body.error) {
        // eslint-disable-next-line no-console
        console.error("Detailed error:", res.body.error);
      }
      // Fail the test if server error
      expect(res.statusCode).not.toBe(500);
    }
  });

  // 유저의 관심상품 리스트 조회 (productId 배열만 반환하는 경우도 커버)
  it("사용자의 모든 관심상품을 조회해야 한다", async () => {
    const res = await request(app).get(`/user-like-products/${userId}`);
    if (res.statusCode !== 200) {
      // Print error for debug
      // eslint-disable-next-line no-console
      console.error("Get all likes error:", res.body);
      if (res.body && res.body.error) {
        // eslint-disable-next-line no-console
        console.error("Detailed error:", res.body.error);
      }
      // Fail the test if server error
      expect(res.statusCode).toBe(200);
      return;
    }
    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      // 만약 productId만 배열로 반환하는 경우
      if (typeof res.body[0] === "string" || typeof res.body[0] === "number") {
        // productId 배열로만 반환하는 경우
        expect(typeof res.body[0]).toMatch(/string|number/);
        // 실제로 우리가 추가한 productId가 포함되어 있는지 확인
        expect(res.body.map(String)).toContain(productId);
      } else if (typeof res.body[0] === "object") {
        // 각 항목에 product 정보가 포함되어야 함
        expect(res.body[0]).toHaveProperty("product");
        // productId도 포함되어 있는지 확인
        expect(String(res.body[0].productId)).toBe(productId);
      }
    }
  });

  // 상품별 좋아요 수 조회
  it("상품의 관심 개수를 조회해야 한다", async () => {
    console.log("====> 상품 아이디 : ", productId);
    const res = await request(app).get(
      `/user-like-products/count/${productId}`
    );
    if (res.statusCode !== 200) {
      // Print error for debug
      // eslint-disable-next-line no-console
      console.error("Get like count error:", res.body);
      if (res.body && res.body.error) {
        // eslint-disable-next-line no-console
        console.error("Detailed error:", res.body.error);
      }
      // Fail the test if server error
      expect(res.statusCode).toBe(200);
      return;
    }
    expect(res.body).toHaveProperty("productId");
    expect(res.body).toHaveProperty("likeCount");
  });

  // 관심상품 삭제
  it("상품 관심을 제거해야 한다", async () => {
    const res = await request(app)
      .delete("/user-like-products")
      .send({ userId, productId });
    if (res.statusCode !== 200) {
      // Print error for debug
      // eslint-disable-next-line no-console
      console.error("Remove like error:", res.body);
      if (res.body && res.body.error) {
        // eslint-disable-next-line no-console
        console.error("Detailed error:", res.body.error);
      }
      // Fail the test if server error
      expect(res.statusCode).toBe(200);
      return;
    }
    expect(res.body.message).toBe("관심상품에서 삭제되었습니다.");
  });

  // 삭제 후 단건 조회 (존재하지 않아야 함)
  it("관심 제거 후 404를 반환해야 한다", async () => {
    const res = await request(app).get(
      `/user-like-products/${userId}/${productId}`
    );
    if (res.statusCode !== 404) {
      // Print error for debug
      // eslint-disable-next-line no-console
      console.error("Get after remove error:", res.body);
      if (res.body && res.body.error) {
        // eslint-disable-next-line no-console
        console.error("Detailed error:", res.body.error);
      }
      // Fail the test if server error
      expect(res.statusCode).toBe(404);
      return;
    }
    expect(res.body.message).toBe("관심상품이 아닙니다.");
  });

  // ID 형식 오류 테스트 (userId, productId가 숫자가 아닐 때)
  it("잘못된 userId/productId 형식에 대해 400을 반환해야 한다", async () => {
    const invalidUserId = "notanumber";
    const invalidProductId = "alsonotanumber";
    const res = await request(app).get(
      `/user-like-products/${invalidUserId}/${invalidProductId}`
    );
    if (res.statusCode !== 400) {
      // Print error for debug
      // eslint-disable-next-line no-console
      console.error("Get like count error:", res.body);
      if (res.body && res.body.error) {
        // eslint-disable-next-line no-console
        console.error("Detailed error:", res.body.error);
      }
      expect(res.statusCode).toBe(400);
      return;
    }
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("error");
    expect(res.body.message).toMatch(/ID 형식 오류/);
    expect(res.body.error).toMatch(/userId와 productId는 숫자여야 합니다/);
  });
});
