const request = require("supertest");
const app = require("../app");
const prisma = require("../config/prisma");
const { convertBigIntToString } = require("../utils/bigint");

describe("장바구니 API 테스트", () => {
  let user;
  let seller;
  let product;
  let option;
  let cartItem;

  beforeAll(async () => {
    // 1. 테스트용 판매자 생성
    seller = await prisma.sellers.create({
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

    // 2. 테스트용 유저 생성
    user = await prisma.users.create({
      data: {
        user_name: `test-user-${Date.now()}`,
        email: `test-user-${Date.now()}@example.com`,
        password: "password123",
        phone: "010-1234-5678",
      },
    });

    // 3. 테스트용 상품 생성
    product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        displayName: "테스트 상품",
        internalName: "test-product",
        keywords: "테스트,상품",
        categoryCode: "TEST001",
        brand: "테스트브랜드",
        manufacturer: "테스트제조사",
        taxIncluded: true,
        saleStatus: "ON_SALE",
        displayStatus: "DISPLAYED",
        stockQuantity: 100,
        saleStartDate: new Date(),
        description: "테스트용 상품입니다.",
        isSingleProduct: false,
        ProductPrice: {
          create: {
            originalPrice: 10000,
            salePrice: 9000,
            discountRate: 10,
            flexzonePrice: 8500,
          },
        },
      },
    });

    // 4. 옵션 그룹 생성
    const optionGroup = await prisma.ProductOptionGroup.create({
      data: {
        productId: product.id,
        name: "색상",
        displayName: "Color",
        required: true,
        sortOrder: 0,
        ProductOptionValue: {
          create: [
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
      },
      include: {
        ProductOptionValue: true,
      },
    });

    // 첫 번째 옵션 값을 option으로 저장
    option = optionGroup.ProductOptionValue[0];
  });

  afterAll(async () => {
    // 장바구니/아이템 삭제
    await prisma.CartItem.deleteMany({
      where: {
        Cart: { userId: user.id },
      },
    });
    await prisma.Cart.deleteMany({
      where: { userId: user.id },
    });

    // 옵션/가격/상품/유저/셀러 삭제
    // 먼저 ProductOptionValue 삭제 (ProductOptionGroup을 참조)
    await prisma.productOptionValue.deleteMany({
      where: {
        ProductOptionGroup: { productId: product.id },
      },
    });

    // 그 다음 ProductOptionGroup 삭제
    await prisma.ProductOptionGroup.deleteMany({
      where: { productId: product.id },
    });
    await prisma.productPrice.deleteMany({ where: { productId: product.id } });
    await prisma.product.deleteMany({ where: { id: product.id } });
    await prisma.users.deleteMany({ where: { id: user.id } });
    await prisma.sellers.deleteMany({ where: { id: seller.id } });

    await prisma.$disconnect();
  });

  test("장바구니에 상품 추가", async () => {
    const res = await request(app).post("/cart/add").send({
      userId: user.id.toString(),
      productId: product.id.toString(),
      skuId: option.id.toString(),
      quantity: 2,
      price: 9000,
    });
    if (res.statusCode !== 200) {
      // Print error for debug
      // eslint-disable-next-line no-console
      console.error("Add to cart error:", res.body);
      if (res.body && res.body.error) {
        // eslint-disable-next-line no-console
        console.error("Detailed error:", res.body.error);
      }
      // Fail the test if server error
      expect(res.statusCode).toBe(200);
      return;
    }
    // bigint는 string으로 바꿔서 내보낸다
    const item = convertBigIntToString(res.body.item);
    expect(item).toBeDefined();
    expect(item.quantity).toBe(2);
    cartItem = item;
  });

  test("장바구니 조회", async () => {
    const res = await request(app).get(`/cart/${user.id.toString()}`);
    if (res.statusCode !== 200) {
      // Print error for debug
      // eslint-disable-next-line no-console
      console.error("Get cart error:", res.body);
      if (res.body && res.body.error) {
        // eslint-disable-next-line no-console
        console.error("Detailed error:", res.body.error);
      }
      expect(res.statusCode).toBe(200);
      return;
    }
    // bigint는 string으로 바꿔서 내보낸다
    const cart = convertBigIntToString(res.body);
    expect(cart).toHaveProperty("id");
    expect(cart.items.length).toBeGreaterThan(0);
    // productId도 string이어야 함
    expect(cart.items[0].productId).toBe(product.id.toString());
  });

  test("장바구니 아이템 수량 변경", async () => {
    const res = await request(app)
      .patch(`/cart/item/${cartItem.id.toString()}`)
      .send({ quantity: 5 });
    if (res.statusCode !== 200) {
      // Print error for debug
      // eslint-disable-next-line no-console
      console.error("Update cart item quantity error:", res.body);
      if (res.body && res.body.error) {
        // eslint-disable-next-line no-console
        console.error("Detailed error:", res.body.error);
      }
      expect(res.statusCode).toBe(200);
      return;
    }
    expect(res.body.message).toBe("수량 변경됨");
  });

  test("장바구니에서 아이템 삭제", async () => {
    const res = await request(app).delete(
      `/cart/item/${cartItem.id.toString()}`
    );
    if (res.statusCode !== 200) {
      // Print error for debug
      // eslint-disable-next-line no-console
      console.error("Delete cart item error:", res.body);
      if (res.body && res.body.error) {
        // eslint-disable-next-line no-console
        console.error("Detailed error:", res.body.error);
      }
      expect(res.statusCode).toBe(200);
      return;
    }
    expect(res.body.message).toBe("장바구니 아이템 삭제됨");
  });

  test("장바구니 전체 비우기", async () => {
    // 먼저 아이템을 다시 추가
    const addRes = await request(app).post("/cart/add").send({
      userId: user.id.toString(),
      productId: product.id.toString(),
      skuId: option.id.toString(),
      quantity: 1,
      price: 9000,
    });
    expect(addRes.statusCode).toBe(200);

    // 전체 비우기
    const res = await request(app).delete(`/cart/all/${user.id.toString()}`);
    if (res.statusCode !== 200) {
      // Print error for debug
      // eslint-disable-next-line no-console
      console.error("Clear cart error:", res.body);
      if (res.body && res.body.error) {
        // eslint-disable-next-line no-console
        console.error("Detailed error:", res.body.error);
      }
      expect(res.statusCode).toBe(200);
      return;
    }
    expect(res.body.message).toBe("장바구니 비움");
  });
});
