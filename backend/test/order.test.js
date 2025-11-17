const request = require("supertest");
const app = require("../app");
const prisma = require("../config/prisma");

describe("주문 API 테스트", () => {
  let testUser;
  let testSeller;
  let testProduct;
  let testAddress;
  let testCart;
  let testCartItem;
  let testCoupon;
  let testUserCoupon;
  let testOrder;

  beforeAll(async () => {
    // 테스트용 사용자 생성
    testUser = await prisma.users.create({
      data: {
        user_name: "주문테스트유저",
        email: `order_test_${Date.now()}@test.com`,
        password: "hashedpassword",
        phone: "010-1234-5678",
        mileage: 10000,
      },
    });

    // 테스트용 판매자 생성
    testSeller = await prisma.sellers.create({
      data: {
        name: "테스트판매자",
        email: `seller_order_test_${Date.now()}@test.com`,
        shop_name: "테스트샵",
        password: "hashedpassword",
        phone: "010-9876-5432",
        business_number: "123-45-67890",
        bank_type: "KB",
        bank_account: "1234567890",
        depositor_name: "테스트판매자",
        ceo_name: "김테스트",
      },
    });

    // 테스트용 상품 생성
    testProduct = await prisma.product.create({
      data: {
        sellerId: testSeller.id,
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
        description: "테스트용 상품입니다.",
        isSingleProduct: true,
        ProductPrice: {
          create: {
            originalPrice: 20000,
            salePrice: 18000,
            discountRate: 10,
            flexzonePrice: 17000,
          },
        },
      },
    });

    // 테스트용 배송지 생성
    testAddress = await prisma.user_addresses.create({
      data: {
        userId: testUser.id,
        recipient: "홍길동",
        phone: "010-1111-2222",
        postcode: "12345",
        address1: "서울시 강남구",
        address2: "테헤란로 123",
        isDefault: true,
        memo: "문앞에 놔주세요",
      },
    });

    // 테스트용 쿠폰 생성
    testCoupon = await prisma.Coupon.create({
      data: {
        title: "테스트 할인 쿠폰",
        content: "테스트용 쿠폰입니다",
        coupon_type: "ALL",
        discount_mode: "amount",
        discount_amount: 2000,
        discount_max: null,
        min_order_amount: 10000,
        total_count: 100,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        validity_type: "PERIOD_AFTER_ISSUE",
        validity_days: 30,
        issued_by: "ADMIN",
        issued_partner_id: null,
        available_date: new Date(),
      },
    });

    // 테스트용 사용자 쿠폰 생성
    testUserCoupon = await prisma.UserCoupon.create({
      data: {
        userId: testUser.id,
        couponId: testCoupon.id,
        used: false,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // 테스트용 장바구니 생성
    testCart = await prisma.Cart.create({
      data: {
        userId: testUser.id,
      },
    });

    // 테스트용 장바구니 아이템 생성
    testCartItem = await prisma.CartItem.create({
      data: {
        cartId: testCart.id,
        productId: testProduct.id,
        skuId: null,
        quantity: 2,
        price: 18000,
      },
    });
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (testOrder) {
      await prisma.OrderItem.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.Order.delete({ where: { id: testOrder.id } });
    }

    await prisma.CartItem.deleteMany({ where: { cartId: testCart.id } });
    await prisma.Cart.delete({ where: { id: testCart.id } });

    await prisma.UserCoupon.deleteMany({ where: { userId: testUser.id } });
    await prisma.Coupon.delete({ where: { id: testCoupon.id } });

    await prisma.user_addresses.delete({ where: { id: testAddress.id } });

    await prisma.productPrice.deleteMany({
      where: { productId: testProduct.id },
    });
    await prisma.product.delete({ where: { id: testProduct.id } });

    await prisma.sellers.delete({ where: { id: testSeller.id } });
    await prisma.users.delete({ where: { id: testUser.id } });
  });

  it("장바구니에서 주문을 생성해야 한다", async () => {
    const res = await request(app).post("/orders/create-from-cart").send({
      userId: testUser.id.toString(),
      addressId: testAddress.id.toString(),
      paymentMethod: "CARD",
      deliveryMemo: "안전하게 배송해 주세요",
      usedCouponId: testCoupon.id.toString(),
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("주문이 생성되었습니다.");
    expect(res.body.order).toHaveProperty("orderNumber");
    expect(res.body.order.recipient).toBe("홍길동");
    expect(res.body.order.totalAmount).toBe(36000); // 18000 * 2
    expect(res.body.order.discountAmount).toBe(2000); // 쿠폰 할인
    expect(res.body.order.deliveryFee).toBe(0); // 30000원 이상이므로 무료배송
    expect(res.body.order.finalAmount).toBe(34000); // 36000 - 2000 + 0
    expect(res.body.order.orderStatus).toBe("PENDING");
    expect(res.body.order.paymentStatus).toBe("PENDING");

    testOrder = { id: BigInt(res.body.order.id) };
  });

  it("사용자의 주문 목록을 조회해야 한다", async () => {
    const res = await request(app).get(`/orders/user/${testUser.id}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const order = res.body[0];
    expect(order).toHaveProperty("orderNumber");
    expect(order).toHaveProperty("orderItems");
    expect(Array.isArray(order.orderItems)).toBe(true);
  });

  it("특정 주문의 상세 정보를 조회해야 한다", async () => {
    const res = await request(app).get(`/orders/${testOrder.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("orderNumber");
    expect(res.body).toHaveProperty("orderItems");
    expect(res.body).toHaveProperty("user");
    expect(res.body.orderItems).toHaveLength(1);
    expect(res.body.orderItems[0].productName).toBe("테스트 상품");
  });

  it("주문 상태를 업데이트해야 한다", async () => {
    const res = await request(app)
      .patch(`/orders/${testOrder.id}/status`)
      .send({
        orderStatus: "CONFIRMED",
        paymentStatus: "COMPLETED",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("주문 상태가 업데이트되었습니다.");
    expect(res.body.order.orderStatus).toBe("CONFIRMED");
    expect(res.body.order.paymentStatus).toBe("COMPLETED");
    expect(res.body.order.paidAt).toBeTruthy();
  });

  it("존재하지 않는 주문 조회시 404를 반환해야 한다", async () => {
    const res = await request(app).get("/orders/999999");

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("주문을 찾을 수 없습니다.");
  });

  it("잘못된 주문 ID로 400을 반환해야 한다", async () => {
    const res = await request(app).get("/orders/invalid-id");

    expect(res.statusCode).toBe(500); // parseBigIntId 오류로 500 반환
  });

  it("빈 장바구니로 주문 생성시 400을 반환해야 한다", async () => {
    // 장바구니 아이템 삭제
    await prisma.CartItem.deleteMany({ where: { cartId: testCart.id } });

    const res = await request(app).post("/orders/create-from-cart").send({
      userId: testUser.id.toString(),
      addressId: testAddress.id.toString(),
      paymentMethod: "CARD",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("장바구니가 비어있습니다.");
  });

  it("유효하지 않은 배송지로 주문 생성시 404를 반환해야 한다", async () => {
    // 장바구니 아이템 다시 생성
    await prisma.CartItem.create({
      data: {
        cartId: testCart.id,
        productId: testProduct.id,
        skuId: null,
        quantity: 1,
        price: 18000,
      },
    });

    const res = await request(app).post("/orders/create-from-cart").send({
      userId: testUser.id.toString(),
      addressId: "999999",
      paymentMethod: "CARD",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("배송지를 찾을 수 없습니다.");
  });
});
