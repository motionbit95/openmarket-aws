const request = require("supertest");
const express = require("express");
const termsRouter = require("../routes/terms.routes");

const app = express();
app.use(express.json());
app.use("/terms", termsRouter);

describe("약관 API 테스트", () => {
  let createdId;

  it("약관을 생성해야 한다", async () => {
    const res = await request(app).post("/terms").send({
      type: "PRIVACY", // ← Prisma Enum은 대문자
      title: "개인정보 처리방침",
      content: "내용 테스트",
      effective_date: "2025-07-01T00:00:00Z",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    createdId = res.body.id;
  });

  it("전체 약관을 조회해야 한다", async () => {
    const res = await request(app).get("/terms");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("특정 약관을 조회해야 한다", async () => {
    const res = await request(app).get(`/terms/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", createdId);
  });

  it("약관을 수정해야 한다", async () => {
    const res = await request(app).put(`/terms/${createdId}`).send({
      title: "개인정보 처리방침 수정",
      content: "수정된 내용",
      effective_date: "2025-07-10T00:00:00Z",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("개인정보 처리방침 수정");
  });

  it("약관을 삭제해야 한다", async () => {
    const res = await request(app).delete(`/terms/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("약관 삭제 완료");
  });
});
