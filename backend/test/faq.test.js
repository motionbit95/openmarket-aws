const request = require("supertest");
const app = require("../app"); // Express 앱 객체

describe("FAQ API 테스트", () => {
  let createdId;

  it("FAQ를 생성해야 한다", async () => {
    const res = await request(app).post("/faq").send({
      type: "일반",
      title: "테스트 질문",
      content: "테스트 내용입니다.",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("테스트 질문");
    createdId = res.body.id;
  });

  it("FAQ 목록을 조회해야 한다", async () => {
    const res = await request(app).get("/faq");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("FAQ 상세 정보를 조회해야 한다", async () => {
    const res = await request(app).get(`/faq/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(createdId);
  });

  it("FAQ를 수정해야 한다", async () => {
    const res = await request(app).put(`/faq/${createdId}`).send({
      title: "수정된 질문",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("수정된 질문");
  });

  it("FAQ를 삭제해야 한다", async () => {
    const res = await request(app).delete(`/faq/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("삭제");
  });
});
