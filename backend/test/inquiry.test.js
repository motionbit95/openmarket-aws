const request = require("supertest");
const app = require("../app");

describe("문의 API 테스트", () => {
  let testUserId;
  let testSellerId;
  let createdInquiryId;
  let sellerInquiryId;
  let userInquiryId;

  // 테스트용 유저/판매자 생성
  beforeAll(async () => {
    // 유저 생성
    const userRes = await request(app)
      .post("/users")
      .send({
        user_name: "테스트 유저",
        email: `test_user_${Date.now()}@example.com`,
        password: "1234",
        phone: "010-1111-2222",
      });
    testUserId = userRes.body.id;

    // 판매자 생성
    const sellerRes = await request(app)
      .post("/sellers")
      .send({
        name: "테스트 판매자",
        email: `test_seller_${Date.now()}@example.com`,
        password: "sellerpw",
        phone: "010-2222-3333",
      });
    testSellerId = sellerRes.body.id;
  });

  // 유저 문의 CRUD
  describe("유저 문의", () => {
    it("POST /inquiries - 문의 생성", async () => {
      const res = await request(app).post("/inquiries").send({
        senderId: testUserId,
        senderType: "user",
        title: "테스트 문의 제목",
        content: "테스트 문의 내용",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.senderType).toBe("user");
      expect(res.body.title).toBe("테스트 문의 제목");
      createdInquiryId = res.body.id;
    });

    it("GET /inquiries - 전체 목록 조회", async () => {
      const res = await request(app).get("/inquiries");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((i) => i.id == createdInquiryId)).toBe(true);
    });

    it("GET /inquiries/:id - 단건 조회", async () => {
      const res = await request(app).get(`/inquiries/${createdInquiryId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("id", createdInquiryId);
      expect(res.body).toHaveProperty("senderInfo");
      expect(res.body.senderInfo).toHaveProperty("id", testUserId);
    });

    it("PUT /inquiries/:id - 수정", async () => {
      const res = await request(app)
        .put(`/inquiries/${createdInquiryId}`)
        .send({
          title: "수정된 문의 제목",
          content: "수정된 문의 내용",
          status: "답변완료",
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe("수정된 문의 제목");
      expect(res.body.content).toBe("수정된 문의 내용");
      expect(res.body.status).toBe("답변완료");
    });

    it("POST /inquiries/:id/answer - 답변 등록", async () => {
      const res = await request(app)
        .post(`/inquiries/${createdInquiryId}/answer`)
        .send({ answer: "관리자 답변입니다." });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("answer", "관리자 답변입니다.");
      expect(res.body.status).toBe("완료");
    });
  });

  // 판매자 문의 CRUD
  describe("판매자 문의", () => {
    it("POST /inquiries - 판매자 문의 생성", async () => {
      const res = await request(app).post("/inquiries").send({
        senderId: testSellerId,
        senderType: "seller",
        title: "판매자 문의 제목",
        content: "판매자 문의 내용",
      });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.senderType).toBe("seller");
      sellerInquiryId = res.body.id;
    });

    it("GET /inquiries/seller-to-admin/:sellerId - 판매자가 관리자에게 보낸 문의 목록", async () => {
      const res = await request(app).get(
        `/inquiries/seller-to-admin/${testSellerId}`
      );
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((i) => i.id == sellerInquiryId)).toBe(true);
      expect(res.body[0]).toHaveProperty("senderInfo");
      expect(res.body[0].senderInfo).toHaveProperty("id", testSellerId);
    });
  });

  // 유저별 문의 목록
  describe("유저별 문의 목록", () => {
    it("POST /inquiries - 유저 문의 추가 생성", async () => {
      const res = await request(app).post("/inquiries").send({
        senderId: testUserId,
        senderType: "user",
        title: "유저별 문의",
        content: "유저별 문의 내용",
      });
      expect(res.statusCode).toBe(201);
      userInquiryId = res.body.id;
    });

    it("GET /inquiries/user/:userId - 유저별 문의 목록", async () => {
      const res = await request(app).get(`/inquiries/user/${testUserId}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((i) => i.id == userInquiryId)).toBe(true);
      expect(res.body[0]).toHaveProperty("senderInfo");
      expect(res.body[0].senderInfo).toHaveProperty("id", testUserId);
    });
  });

  // 데이터 정리: 생성한 문의 → 판매자 → 유저 순서로 삭제
  afterAll(async () => {
    // 문의 삭제 (존재하면)
    if (userInquiryId) {
      await request(app).delete(`/inquiries/${userInquiryId}`);
    }
    if (sellerInquiryId) {
      await request(app).delete(`/inquiries/${sellerInquiryId}`);
    }
    if (createdInquiryId) {
      await request(app).delete(`/inquiries/${createdInquiryId}`);
    }
    // 판매자/유저 삭제 (존재하면)
    if (testSellerId) {
      await request(app).delete(`/sellers/${testSellerId}`);
    }
    if (testUserId) {
      await request(app).delete(`/users/${testUserId}`);
    }
  });
});
