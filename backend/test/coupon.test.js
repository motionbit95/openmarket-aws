// test/coupon.test.js
const request = require("supertest");
const app = require("../app"); // express 앱이 export된 경로

describe("쿠폰 API 테스트", () => {
  let testCouponId;

  // 쿠폰 생성
  test("쿠폰을 생성해야 한다", async () => {
    const res = await request(app)
      .post("/coupons")
      .send({
        title: "테스트 쿠폰",
        content: "테스트용 쿠폰 설명",
        coupon_type: "REPEAT_PURCHASE",
        discount_mode: "amount", // 스키마상 필수
        discount_amount: 1000,
        discount_max: 5000,
        min_order_amount: 10000,
        total_count: 100,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        // available_date는 선택적, 스키마상 nullable
        issued_by: "ADMIN", // 스키마상 대문자
        issued_partner_id: null, // ADMIN 발급이므로 null
        validity_type: "FIXED_DATE", // 스키마상 FIXED_DATE 또는 PERIOD_AFTER_ISSUE
        validity_days: null,
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("테스트 쿠폰");
    testCouponId = res.body.id;
  });

  // 모든 쿠폰 조회
  test("모든 쿠폰을 조회해야 한다", async () => {
    const res = await request(app).get("/coupons");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    // 생성한 쿠폰이 목록에 있는지 확인
    const found = res.body.find((c) => c.id == testCouponId);
    expect(found).toBeDefined();
    expect(found.title).toBe("테스트 쿠폰");
  });

  // 쿠폰 상세 조회
  test("쿠폰 상세 정보를 조회해야 한다", async () => {
    const res = await request(app).get(`/coupons/${testCouponId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", testCouponId);
    expect(res.body.title).toBe("테스트 쿠폰");
  });

  // 쿠폰 수정
  test("쿠폰을 수정해야 한다", async () => {
    const updatedTitle = "수정된 쿠폰명";
    const res = await request(app).put(`/coupons/${testCouponId}`).send({
      title: updatedTitle,
      discount_amount: 2000,
      discount_mode: "percent", // discount_mode 필수
      validity_type: "PERIOD_AFTER_ISSUE",
      validity_days: 30,
      valid_from: null,
      valid_to: null,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe(updatedTitle);
    expect(res.body.discount_amount).toBe(2000);
    expect(res.body.validity_type).toBe("PERIOD_AFTER_ISSUE");
    expect(res.body.validity_days).toBe(30);
  });

  // 쿠폰 삭제 (마지막에 정리)
  afterAll(async () => {
    if (testCouponId) {
      const res = await request(app).delete(`/coupons/${testCouponId}`);
      expect([200, 404]).toContain(res.statusCode); // 이미 삭제됐을 수도 있음
    }
  });
});
