const request = require("supertest");
const app = require("../app");

describe("판매자 API 테스트", () => {
  let createdSellerId;
  let testEmail;
  let authToken;

  beforeAll(() => {
    // 중복 방지용 고정된 이메일
    testEmail = `test${Date.now()}@example.com`;
  });

  it("판매자를 생성해야 한다", async () => {
    const res = await request(app).post("/sellers").send({
      name: "테스트 판매자",
      email: testEmail,
      shop_name: "테스트샵",
      password: "password123",
      phone: "010-1234-5678",
      bank_type: "KB",
      bank_account: "123-456-7890",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    createdSellerId = res.body.id;
  });

  it("판매자 로그인을 처리해야 한다", async () => {
    const res = await request(app).post("/sellers/sign-in").send({
      email: testEmail,
      password: "password123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    authToken = res.body.token;
  });

  it("전체 판매자 목록을 조회해야 한다", async () => {
    const res = await request(app).get("/sellers");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("특정 판매자를 조회해야 한다", async () => {
    const res = await request(app).get(`/sellers/${createdSellerId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", createdSellerId);
  });

  it("판매자 정보를 수정해야 한다", async () => {
    const updatedEmail = `updated${Date.now()}@example.com`;

    const res = await request(app).put(`/sellers/${createdSellerId}`).send({
      name: "수정된 판매자",
      email: updatedEmail,
      shop_name: "수정샵",
      password: "newpassword",
      phone: "010-1111-2222",
      bank_type: "SH",
      bank_account: "987-654-3210",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(updatedEmail);

    // 이메일 업데이트 → 이후 테스트를 위해 저장
    testEmail = updatedEmail;
  });

  it("판매자를 삭제해야 한다", async () => {
    const res = await request(app).delete(`/sellers/${createdSellerId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "판매자 삭제 완료");
  });

  it("삭제된 판매자 조회 시 404를 반환해야 한다", async () => {
    const res = await request(app).get(`/sellers/${createdSellerId}`);
    expect(res.statusCode).toBe(404);
  });
});
