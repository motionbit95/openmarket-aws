const request = require("supertest");
const app = require("../app");
const prisma = require("../config/prisma");
const InicisPayment = require("../utils/inicis");

describe("결제 API 테스트", () => {
  let testUser;
  let testSeller;
  let testProduct;
  let testAddress;
  let testOrder;

  beforeAll(async () => {
    // 테스트용 사용자 생성
    testUser = await prisma.user.create({
      data: {
        user_name: "결제테스트유저",
        email: `payment_test_${Date.now()}@test.com`,
        password: "hashedpassword",
        phone: "010-1234-5678",
        mileage: 10000,
      },
    });

    // 테스트용 판매자 생성
    testSeller = await prisma.seller.create({
      data: {
        name: "테스트판매자",
        email: `seller_payment_test_${Date.now()}@test.com`,
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
        displayName: "결제테스트 상품",
        internalName: "payment-test-product",
        keywords: "결제,테스트,상품",
        categoryCode: "PAY001",
        brand: "테스트브랜드",
        manufacturer: "테스트제조사",
        taxIncluded: true,
        saleStatus: "ON_SALE",
        displayStatus: "DISPLAYED",
        stockQuantity: 50,
        description: "결제 테스트용 상품입니다.",
        isSingleProduct: true,
        prices: {
          create: {
            originalPrice: 15000,
            salePrice: 12000,
            discountRate: 20,
            flexzonePrice: 11000,
          },
        },
      },
    });

    // 테스트용 배송지 생성
    testAddress = await prisma.userAddress.create({
      data: {
        userId: testUser.id,
        recipient: "김결제",
        phone: "010-3333-4444",
        postcode: "54321",
        address1: "부산시 해운대구",
        address2: "센텀로 456",
        isDefault: true,
        memo: "부재시 경비실에 맡겨주세요",
      },
    });

    // 테스트용 주문 생성
    testOrder = await prisma.order.create({
      data: {
        orderNumber: `TEST-ORDER-${Date.now()}`,
        userId: testUser.id,
        recipient: testAddress.recipient,
        phone: testAddress.phone,
        postcode: testAddress.postcode,
        address1: testAddress.address1,
        address2: testAddress.address2,
        deliveryMemo: "테스트 주문",
        totalAmount: 24000, // 12000 * 2
        discountAmount: 0,
        deliveryFee: 3000,
        finalAmount: 27000,
        paymentMethod: "CARD",
        orderStatus: "PENDING",
        paymentStatus: "PENDING",
        orderItems: {
          create: [
            {
              productId: testProduct.id,
              skuId: null,
              quantity: 2,
              unitPrice: 12000,
              totalPrice: 24000,
              productName: "결제테스트 상품",
            },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
    await prisma.order.delete({ where: { id: testOrder.id } });

    await prisma.userAddress.delete({ where: { id: testAddress.id } });

    await prisma.productPrice.deleteMany({
      where: { productId: testProduct.id },
    });
    await prisma.product.delete({ where: { id: testProduct.id } });

    await prisma.seller.delete({ where: { id: testSeller.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  it("결제를 승인해야 한다", async () => {
    const res = await request(app)
      .post("/payment/approve")
      .send({
        orderId: testOrder.id.toString(),
        paymentId: "test_payment_id_123",
        paymentMethod: "CARD",
        paidAmount: 27000,
        paymentData: {
          cardNumber: "**** **** **** 1234",
          cardType: "신용카드",
        },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("결제가 승인되었습니다.");
    expect(res.body.order.paymentStatus).toBe("COMPLETED");
    expect(res.body.order.orderStatus).toBe("CONFIRMED");
    expect(res.body.order.paymentId).toBe("test_payment_id_123");
    expect(res.body.order.paidAt).toBeTruthy();

    // 상품 재고가 차감되었는지 확인
    const updatedProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
    });
    expect(updatedProduct.stockQuantity).toBe(48); // 50 - 2 = 48
  });

  it("결제 정보를 조회해야 한다", async () => {
    const res = await request(app).get(`/payment/order/${testOrder.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("orderNumber");
    expect(res.body.paymentStatus).toBe("COMPLETED");
    expect(res.body.paymentId).toBe("test_payment_id_123");
    expect(res.body.finalAmount).toBe(27000);
  });

  it("결제 실패를 처리해야 한다", async () => {
    // 새로운 테스트 주문 생성
    const failOrder = await prisma.order.create({
      data: {
        orderNumber: `FAIL-ORDER-${Date.now()}`,
        userId: testUser.id,
        recipient: testAddress.recipient,
        phone: testAddress.phone,
        postcode: testAddress.postcode,
        address1: testAddress.address1,
        address2: testAddress.address2,
        deliveryMemo: "실패 테스트 주문",
        totalAmount: 12000,
        discountAmount: 0,
        deliveryFee: 3000,
        finalAmount: 15000,
        paymentMethod: "CARD",
        orderStatus: "PENDING",
        paymentStatus: "PENDING",
      },
    });

    const res = await request(app).post("/payment/fail").send({
      orderId: failOrder.id.toString(),
      failureReason: "카드 한도 초과",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("결제 실패 처리가 완료되었습니다.");
    expect(res.body.order.paymentStatus).toBe("FAILED");
    expect(res.body.order.orderStatus).toBe("CANCELLED");

    // 테스트 주문 삭제
    await prisma.order.delete({ where: { id: failOrder.id } });
  });

  it("환불을 처리해야 한다", async () => {
    const res = await request(app).post("/payment/refund").send({
      orderId: testOrder.id.toString(),
      refundAmount: 27000,
      refundReason: "단순 변심",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("환불 처리가 완료되었습니다.");
    expect(res.body.order.paymentStatus).toBe("REFUNDED");
    expect(res.body.order.orderStatus).toBe("REFUNDED");

    // 상품 재고가 복원되었는지 확인
    const updatedProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
    });
    expect(updatedProduct.stockQuantity).toBe(50); // 48 + 2 = 50 (복원)
  });

  it("결제 금액 불일치시 400을 반환해야 한다", async () => {
    // 새로운 테스트 주문 생성
    const mismatchOrder = await prisma.order.create({
      data: {
        orderNumber: `MISMATCH-ORDER-${Date.now()}`,
        userId: testUser.id,
        recipient: testAddress.recipient,
        phone: testAddress.phone,
        postcode: testAddress.postcode,
        address1: testAddress.address1,
        address2: testAddress.address2,
        deliveryMemo: "금액 불일치 테스트",
        totalAmount: 10000,
        discountAmount: 0,
        deliveryFee: 3000,
        finalAmount: 13000,
        paymentMethod: "CARD",
        orderStatus: "PENDING",
        paymentStatus: "PENDING",
      },
    });

    const res = await request(app).post("/payment/approve").send({
      orderId: mismatchOrder.id.toString(),
      paymentId: "test_payment_mismatch",
      paymentMethod: "CARD",
      paidAmount: 15000, // 실제 주문금액(13000)과 다름
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("결제 금액이 일치하지 않습니다.");
    expect(res.body.expectedAmount).toBe(13000);
    expect(res.body.paidAmount).toBe(15000);

    // 테스트 주문 삭제
    await prisma.order.delete({ where: { id: mismatchOrder.id } });
  });

  it("이미 결제 완료된 주문에 대해 400을 반환해야 한다", async () => {
    // 이미 결제 완료된 주문 생성
    const completedOrder = await prisma.order.create({
      data: {
        orderNumber: `COMPLETED-ORDER-${Date.now()}`,
        userId: testUser.id,
        recipient: testAddress.recipient,
        phone: testAddress.phone,
        postcode: testAddress.postcode,
        address1: testAddress.address1,
        address2: testAddress.address2,
        deliveryMemo: "이미 완료된 주문",
        totalAmount: 10000,
        discountAmount: 0,
        deliveryFee: 3000,
        finalAmount: 13000,
        paymentMethod: "CARD",
        orderStatus: "CONFIRMED",
        paymentStatus: "COMPLETED", // 이미 완료됨
        paymentId: "already_paid_123",
        paidAt: new Date(),
      },
    });

    const res = await request(app).post("/payment/approve").send({
      orderId: completedOrder.id.toString(),
      paymentId: "duplicate_payment",
      paymentMethod: "CARD",
      paidAmount: 13000,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("이미 결제가 완료된 주문입니다.");

    // 테스트 주문 삭제
    await prisma.order.delete({ where: { id: completedOrder.id } });
  });

  it("존재하지 않는 주문에 대해 404를 반환해야 한다", async () => {
    const res = await request(app).get("/payment/order/999999");

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("주문을 찾을 수 없습니다.");
  });

  it("PG사 웹훅을 처리해야 한다", async () => {
    // 새로운 테스트 주문 생성
    const webhookOrder = await prisma.order.create({
      data: {
        orderNumber: `WEBHOOK-ORDER-${Date.now()}`,
        userId: testUser.id,
        recipient: testAddress.recipient,
        phone: testAddress.phone,
        postcode: testAddress.postcode,
        address1: testAddress.address1,
        address2: testAddress.address2,
        deliveryMemo: "웹훅 테스트",
        totalAmount: 20000,
        discountAmount: 0,
        deliveryFee: 3000,
        finalAmount: 23000,
        paymentMethod: "KAKAO_PAY",
        orderStatus: "PENDING",
        paymentStatus: "PENDING",
      },
    });

    const res = await request(app)
      .post("/payment/webhook")
      .send({
        type: "payment.completed",
        data: {
          orderId: webhookOrder.id.toString(),
          paymentId: "webhook_payment_123",
          paymentMethod: "KAKAO_PAY",
          paidAmount: 23000,
        },
      });

    expect(res.statusCode).toBe(200);

    // 테스트 주문 삭제
    await prisma.order.delete({ where: { id: webhookOrder.id } });
  });
});

describe("KG이니시스 결제 API 테스트", () => {
  let testUser;
  let testOrder;
  let inicisPayment;

  beforeAll(async () => {
    inicisPayment = new InicisPayment();
    
    // 테스트용 사용자 생성
    testUser = await prisma.user.create({
      data: {
        user_name: '이니시스테스트유저',
        email: `inicis_test_${Date.now()}@test.com`,
        password: 'hashed_password',
        phone: '010-1111-2222'
      }
    });

    // 테스트용 주문 생성
    testOrder = await prisma.order.create({
      data: {
        orderNumber: `INICIS-${Date.now()}`,
        userId: testUser.id,
        recipient: '이니시스테스트수령인',
        phone: '010-1111-2222',
        postcode: '12345',
        address1: '서울시 강남구',
        address2: '테스트동 123-456',
        totalAmount: 50000,
        discountAmount: 0,
        deliveryFee: 3000,
        finalAmount: 53000,
        paymentMethod: 'CARD'
      }
    });
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.order.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });
  });

  describe("POST /payment/inicis/request", () => {
    it("이니시스 결제 요청 데이터를 생성해야 한다", async () => {
      const response = await request(app)
        .post('/payment/inicis/request')
        .send({
          orderId: testOrder.id.toString(),
          paymentMethod: 'CARD',
          returnUrl: 'https://example.com/payment/callback'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('이니시스 결제 요청 데이터가 생성되었습니다.');
      expect(response.body.paymentUrl).toContain('inicis.com');
      expect(response.body.params).toHaveProperty('P_INI_PAYMENT', 'CARD');
      expect(response.body.params).toHaveProperty('P_MID');
      expect(response.body.params).toHaveProperty('P_OID', testOrder.orderNumber);
      expect(response.body.params).toHaveProperty('P_AMT', '53000');
      expect(response.body.params).toHaveProperty('P_UNAME', '이니시스테스트유저');
      expect(response.body.params).toHaveProperty('P_NEXT_URL', 'https://example.com/payment/callback');
    });

    it("가상계좌 결제 요청시 notiUrl을 포함해야 한다", async () => {
      const response = await request(app)
        .post('/payment/inicis/request')
        .send({
          orderId: testOrder.id.toString(),
          paymentMethod: 'VIRTUAL_ACCOUNT',
          returnUrl: 'https://example.com/payment/callback',
          notiUrl: 'https://example.com/payment/noti'
        });

      expect(response.status).toBe(200);
      expect(response.body.params.P_INI_PAYMENT).toBe('VBANK');
      expect(response.body.params.P_NOTI_URL).toBe('https://example.com/payment/noti');
      expect(response.body.params.P_RESERVED).toContain('noti=https://example.com/payment/noti');
    });

    it("휴대폰 결제 요청시 상품유형을 포함해야 한다", async () => {
      const response = await request(app)
        .post('/payment/inicis/request')
        .send({
          orderId: testOrder.id.toString(),
          paymentMethod: 'PHONE',
          returnUrl: 'https://example.com/payment/callback',
          hppMethod: '1'
        });

      expect(response.status).toBe(200);
      expect(response.body.params.P_INI_PAYMENT).toBe('HPP');
      expect(response.body.params.P_HPP_METHOD).toBe('1');
    });

    it("존재하지 않는 주문 ID로 요청시 404를 반환해야 한다", async () => {
      const response = await request(app)
        .post('/payment/inicis/request')
        .send({
          orderId: '999999',
          paymentMethod: 'CARD',
          returnUrl: 'https://example.com/payment/callback'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('주문을 찾을 수 없습니다.');
    });
  });

  describe("POST /payment/inicis/callback", () => {
    beforeEach(async () => {
      // 각 테스트 전 주문 상태 초기화
      await prisma.order.update({
        where: { id: testOrder.id },
        data: {
          paymentStatus: 'PENDING',
          orderStatus: 'PENDING'
        }
      });
    });

    it("신용카드 결제 성공 콜백을 처리해야 한다", async () => {
      const callbackData = {
        P_STATUS: '00',
        P_RMESG1: '성공',
        P_TID: 'TEST_TID_' + Date.now(),
        P_MID: 'INIpayTest',
        P_OID: testOrder.orderNumber,
        P_AMT: '53000',
        P_TYPE: 'CARD',
        P_AUTH_DT: '20250909143000',
        P_AUTH_NO: '12345678',
        P_UNAME: '이니시스테스트유저',
        P_CARD_NUM: '1234-****-****-5678',
        P_FN_NM: '테스트카드',
        CARD_CorpFlag: '0',
        P_CARD_CHECKFLAG: '0',
        idc_name: 'stg',
        P_REQ_URL: 'https://stgmobile.inicis.com/smart/payment/'
      };

      const response = await request(app)
        .post('/payment/inicis/callback')
        .send(callbackData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('결제가 성공적으로 완료되었습니다.');
      expect(response.body.payment.success).toBe(true);
      expect(response.body.payment.card).toBeDefined();
      expect(response.body.payment.card.authNo).toBe('12345678');
      expect(response.body.payment.card.cardType).toBe('신용카드');

      // 주문 상태 확인
      const updatedOrder = await prisma.order.findUnique({
        where: { id: testOrder.id }
      });
      expect(updatedOrder.paymentStatus).toBe('COMPLETED');
      expect(updatedOrder.orderStatus).toBe('CONFIRMED');
    });

    it("가상계좌 결제 성공 콜백을 처리해야 한다", async () => {
      const callbackData = {
        P_STATUS: '00',
        P_RMESG1: '성공',
        P_TID: 'TEST_VBANK_TID_' + Date.now(),
        P_MID: 'INIpayTest',
        P_OID: testOrder.orderNumber,
        P_AMT: '53000',
        P_TYPE: 'VBANK',
        P_AUTH_DT: '20250909143000',
        P_UNAME: '이니시스테스트유저',
        P_VACT_NUM: '123456789012',
        P_VACT_BANK_CODE: '003',
        P_VACT_NAME: '테스트예금주',
        P_VACT_DATE: '20250910',
        P_VACT_TIME: '235959',
        P_FN_NM: '기업은행',
        idc_name: 'stg',
        P_REQ_URL: 'https://stgmobile.inicis.com/smart/payment/'
      };

      const response = await request(app)
        .post('/payment/inicis/callback')
        .send(callbackData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.payment.virtualAccount).toBeDefined();
      expect(response.body.payment.virtualAccount.accountNumber).toBe('123456789012');
      expect(response.body.payment.virtualAccount.bankName).toBe('기업은행');
    });

    it("결제 실패 콜백을 처리해야 한다", async () => {
      const callbackData = {
        P_STATUS: '01',
        P_RMESG1: '카드승인 실패',
        P_MID: 'INIpayTest',
        P_OID: testOrder.orderNumber,
        P_AMT: '53000',
        P_UNAME: '이니시스테스트유저',
        idc_name: 'stg',
        P_REQ_URL: 'https://stgmobile.inicis.com/smart/payment/'
      };

      const response = await request(app)
        .post('/payment/inicis/callback')
        .send(callbackData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('결제가 실패했습니다.');
      expect(response.body.error).toContain('카드승인 실패');

      // 주문 상태 확인
      const updatedOrder = await prisma.order.findUnique({
        where: { id: testOrder.id }
      });
      expect(updatedOrder.paymentStatus).toBe('FAILED');
      expect(updatedOrder.orderStatus).toBe('CANCELLED');
    });

    it("유효하지 않은 IDC 센터코드로 요청시 400을 반환해야 한다", async () => {
      const callbackData = {
        P_STATUS: '00',
        P_OID: testOrder.orderNumber,
        P_AMT: '53000',
        idc_name: 'invalid',
        P_REQ_URL: 'https://invalid.com/payment/'
      };

      const response = await request(app)
        .post('/payment/inicis/callback')
        .send(callbackData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('유효하지 않은 IDC센터코드입니다.');
    });

    it("승인요청 URL 불일치시 400을 반환해야 한다", async () => {
      const callbackData = {
        P_STATUS: '00',
        P_OID: testOrder.orderNumber,
        P_AMT: '53000',
        idc_name: 'stg',
        P_REQ_URL: 'https://malicious.com/payment/'
      };

      const response = await request(app)
        .post('/payment/inicis/callback')
        .send(callbackData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('승인요청 URL이 유효하지 않습니다.');
    });

    it("결제 금액 불일치시 400을 반환해야 한다", async () => {
      const callbackData = {
        P_STATUS: '00',
        P_RMESG1: '성공',
        P_TID: 'TEST_TID_' + Date.now(),
        P_MID: 'INIpayTest',
        P_OID: testOrder.orderNumber,
        P_AMT: '99999', // 잘못된 금액
        P_TYPE: 'CARD',
        P_AUTH_DT: '20250909143000',
        P_UNAME: '이니시스테스트유저',
        idc_name: 'stg',
        P_REQ_URL: 'https://stgmobile.inicis.com/smart/payment/'
      };

      const response = await request(app)
        .post('/payment/inicis/callback')
        .send(callbackData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('결제 금액이 일치하지 않습니다.');
      expect(response.body.expectedAmount).toBe(53000);
      expect(response.body.paidAmount).toBe(99999);
    });
  });

  describe("POST /payment/inicis/net-cancel", () => {
    it("망취소 요청을 처리해야 한다", async () => {
      // 실제 이니시스 API 호출 대신 모킹
      const mockNetCancel = jest.spyOn(InicisPayment.prototype, 'requestNetCancel')
        .mockResolvedValue({
          P_STATUS: '00',
          P_RMESG1: '성공',
          P_TID: 'CANCEL_TID_123'
        });

      const response = await request(app)
        .post('/payment/inicis/net-cancel')
        .send({
          P_TID: 'TEST_AUTH_TID_123',
          P_MID: 'INIpayTest',
          P_AMT: '53000',
          P_OID: testOrder.orderNumber,
          P_REQ_URL: 'https://stgmobile.inicis.com/smart/payment/'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('망취소가 성공적으로 완료되었습니다.');

      mockNetCancel.mockRestore();
    });

    it("필수 파라미터 누락시 400을 반환해야 한다", async () => {
      const response = await request(app)
        .post('/payment/inicis/net-cancel')
        .send({
          P_TID: 'TEST_TID',
          // P_MID 누락
          P_AMT: '53000'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('필수 파라미터가 누락되었습니다.');
      expect(response.body.required).toContain('P_MID');
    });
  });
});

describe("InicisPayment 유틸리티 테스트", () => {
  let inicisPayment;

  beforeAll(() => {
    inicisPayment = new InicisPayment();
  });

  describe("결제 파라미터 생성", () => {
    it("기본 결제 파라미터를 생성해야 한다", () => {
      const orderData = {
        orderNumber: 'TEST-ORDER-001',
        amount: 10000,
        goodsName: '테스트상품',
        buyerName: '홍길동',
        returnUrl: 'https://example.com/callback',
        paymentMethod: 'CARD'
      };

      const params = inicisPayment.createPaymentParams(orderData);

      expect(params.P_INI_PAYMENT).toBe('CARD');
      expect(params.P_OID).toBe('TEST-ORDER-001');
      expect(params.P_AMT).toBe('10000');
      expect(params.P_GOODS).toBe('테스트상품');
      expect(params.P_UNAME).toBe('홍길동');
      expect(params.P_NEXT_URL).toBe('https://example.com/callback');
      expect(params.P_RESERVED).toBe('centerCd=Y');
    });

    it("가상계좌 결제 파라미터에 notiUrl을 포함해야 한다", () => {
      const orderData = {
        orderNumber: 'TEST-ORDER-002',
        amount: 20000,
        goodsName: '가상계좌테스트',
        buyerName: '김철수',
        returnUrl: 'https://example.com/callback',
        paymentMethod: 'VIRTUAL_ACCOUNT',
        notiUrl: 'https://example.com/noti'
      };

      const params = inicisPayment.createPaymentParams(orderData);

      expect(params.P_INI_PAYMENT).toBe('VBANK');
      expect(params.P_NOTI_URL).toBe('https://example.com/noti');
      expect(params.P_RESERVED).toContain('noti=https://example.com/noti');
    });

    it("상품명이 40자를 초과하면 잘라야 한다", () => {
      const longProductName = '이것은 매우 긴 상품명입니다. 테스트를 위해 40자를 넘어서는 상품명을 만들어보겠습니다. 길고 긴 상품명입니다.';
      const orderData = {
        orderNumber: 'TEST-ORDER-003',
        amount: 30000,
        goodsName: longProductName,
        buyerName: '이영희',
        returnUrl: 'https://example.com/callback',
        paymentMethod: 'CARD'
      };

      const params = inicisPayment.createPaymentParams(orderData);

      expect(params.P_GOODS.length).toBeLessThanOrEqual(40);
    });
  });

  describe("결제 수단 매핑", () => {
    it("결제 수단을 올바르게 매핑해야 한다", () => {
      expect(inicisPayment.mapPaymentMethod('CARD')).toBe('CARD');
      expect(inicisPayment.mapPaymentMethod('VIRTUAL_ACCOUNT')).toBe('VBANK');
      expect(inicisPayment.mapPaymentMethod('BANK_TRANSFER')).toBe('REAL');
      expect(inicisPayment.mapPaymentMethod('PHONE')).toBe('HPP');
      expect(inicisPayment.mapPaymentMethod('UNKNOWN')).toBe('CARD'); // 기본값
    });
  });

  describe("IDC 센터코드 검증", () => {
    it("유효한 IDC 센터코드를 검증해야 한다", () => {
      expect(inicisPayment.validateIdcCode('fc')).toBe(true);
      expect(inicisPayment.validateIdcCode('ks')).toBe(true);
      expect(inicisPayment.validateIdcCode('stg')).toBe(true);
      expect(inicisPayment.validateIdcCode('invalid')).toBe(false);
      expect(inicisPayment.validateIdcCode('')).toBe(false);
      expect(inicisPayment.validateIdcCode(null)).toBe(false);
    });
  });

  describe("승인요청 URL 검증", () => {
    it("유효한 승인요청 URL을 검증해야 한다", () => {
      expect(inicisPayment.validateReqUrl('https://mobile.inicis.com/smart/payment/', 'fc')).toBe(true);
      expect(inicisPayment.validateReqUrl('https://mobile.inicis.com/smart/payment/', 'ks')).toBe(true);
      expect(inicisPayment.validateReqUrl('https://stgmobile.inicis.com/smart/payment/', 'stg')).toBe(true);
      expect(inicisPayment.validateReqUrl('https://invalid.com/payment/', 'fc')).toBe(false);
      expect(inicisPayment.validateReqUrl('', 'fc')).toBe(false);
      expect(inicisPayment.validateReqUrl(null, 'fc')).toBe(false);
    });
  });

  describe("결제 결과 파싱", () => {
    it("성공한 신용카드 결제 결과를 파싱해야 한다", () => {
      const callbackData = {
        P_STATUS: '00',
        P_RMESG1: '성공',
        P_TID: 'TEST_TID_123',
        P_TYPE: 'CARD',
        P_AMT: '10000',
        P_AUTH_NO: '12345678',
        P_CARD_NUM: '1234-****-****-5678',
        P_FN_NM: '테스트카드',
        CARD_CorpFlag: '0',
        P_CARD_CHECKFLAG: '0'
      };

      const result = inicisPayment.parsePaymentResult(callbackData);

      expect(result.success).toBe(true);
      expect(result.status).toBe('00');
      expect(result.message).toBe('성공');
      expect(result.tid).toBe('TEST_TID_123');
      expect(result.card).toBeDefined();
      expect(result.card.authNo).toBe('12345678');
      expect(result.card.cardType).toBe('신용카드');
      expect(result.card.cardCorpFlag).toBe('개인카드');
    });

    it("실패한 결제 결과를 파싱해야 한다", () => {
      const callbackData = {
        P_STATUS: '01',
        P_RMESG1: '카드승인 실패',
        P_TID: null,
        P_TYPE: 'CARD'
      };

      const result = inicisPayment.parsePaymentResult(callbackData);

      expect(result.success).toBe(false);
      expect(result.status).toBe('01');
      expect(result.message).toBe('카드승인 실패');
    });

    it("가상계좌 결제 결과를 파싱해야 한다", () => {
      const callbackData = {
        P_STATUS: '00',
        P_RMESG1: '성공',
        P_TID: 'VBANK_TID_123',
        P_TYPE: 'VBANK',
        P_VACT_NUM: '123456789012',
        P_VACT_BANK_CODE: '003',
        P_VACT_NAME: '예금주명',
        P_VACT_DATE: '20250910',
        P_VACT_TIME: '235959',
        P_FN_NM: '기업은행'
      };

      const result = inicisPayment.parsePaymentResult(callbackData);

      expect(result.success).toBe(true);
      expect(result.virtualAccount).toBeDefined();
      expect(result.virtualAccount.accountNumber).toBe('123456789012');
      expect(result.virtualAccount.bankName).toBe('기업은행');
      expect(result.virtualAccount.depositorName).toBe('예금주명');
    });
  });

  describe("해시 생성", () => {
    it("올바른 해시를 생성해야 한다", () => {
      const hash = inicisPayment.generateHash('10000', 'TEST-ORDER-001', '1234567890');
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it("해시키가 없으면 null을 반환해야 한다", () => {
      const originalHashKey = inicisPayment.hashKey;
      inicisPayment.hashKey = null;
      
      const hash = inicisPayment.generateHash('10000', 'TEST-ORDER-001', '1234567890');
      expect(hash).toBeNull();
      
      inicisPayment.hashKey = originalHashKey;
    });
  });

  describe("결제 URL", () => {
    it("올바른 결제 URL을 반환해야 한다", () => {
      const paymentUrl = inicisPayment.getPaymentUrl();
      expect(paymentUrl).toBeTruthy();
      expect(paymentUrl).toContain('inicis.com');
    });
  });
});
