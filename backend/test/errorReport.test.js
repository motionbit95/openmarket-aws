const request = require("supertest");
const app = require("../app"); // app.js 경로에 맞게 조정

describe("에러 리포트 API 테스트", () => {
  let reportId;

  const newReportData = {
    reporter_id: "1",
    reporter_type: "user",
    category: "bug",
    title: "테스트 에러 제목",
    content: "테스트 에러 내용",
  };

  it("에러 리포트를 생성해야 한다", async () => {
    const res = await request(app).post("/errorReport").send(newReportData);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe(newReportData.title);
    reportId = res.body.id;
  });

  it("전체 에러 리포트를 조회해야 한다", async () => {
    const res = await request(app).get("/errorReport");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("단일 에러 리포트를 조회해야 한다", async () => {
    const res = await request(app).get(`/errorReport/${reportId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", reportId);
  });

  it("에러 리포트를 수정해야 한다", async () => {
    const updatedStatus = "처리중";
    const res = await request(app)
      .put(`/errorReport/${reportId}`)
      .send({ status: updatedStatus });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe(updatedStatus);
  });

  it("에러 리포트를 삭제해야 한다", async () => {
    const res = await request(app).delete(`/errorReport/${reportId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Report deleted");
  });

  it("삭제된 에러 리포트 조회 시 404를 반환해야 한다", async () => {
    const res = await request(app).get(`/errorReport/${reportId}`);

    expect(res.statusCode).toBe(404);
  });
});
