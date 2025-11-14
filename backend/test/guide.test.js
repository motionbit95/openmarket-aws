const request = require("supertest");
const express = require("express");
const userGuideRouter = require("../routes/guide.routes");

const app = express();
app.use(express.json());
app.use("/user-guides", userGuideRouter);

describe("사용자 가이드 API 테스트", () => {
  let createdId;

  it("사용자 가이드를 생성해야 한다", async () => {
    const res = await request(app).post("/user-guides").send({
      type: "CUSTOMER",
      title: "테스트 가이드 제목",
      content: "테스트 가이드 내용",
      is_pinned: true,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("테스트 가이드 제목");

    createdId = res.body.id;
  });

  it("전체 사용자 가이드를 조회해야 한다", async () => {
    const res = await request(app).get("/user-guides");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((g) => g.id === createdId)).toBe(true);
  });

  it("특정 사용자 가이드를 조회해야 한다", async () => {
    const res = await request(app).get(`/user-guides/${createdId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", createdId);
  });

  it("사용자 가이드를 수정해야 한다", async () => {
    const res = await request(app).put(`/user-guides/${createdId}`).send({
      title: "수정된 가이드 제목",
      content: "수정된 가이드 내용",
      is_pinned: false,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("수정된 가이드 제목");
    expect(res.body.is_pinned).toBe(false);
  });

  it("사용자 가이드를 삭제해야 한다", async () => {
    const res = await request(app).delete(`/user-guides/${createdId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "UserGuide 삭제 완료");
  });

  it("삭제된 사용자 가이드 조회 시 404를 반환해야 한다", async () => {
    const res = await request(app).get(`/user-guides/${createdId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "UserGuide 없음");
  });
});
