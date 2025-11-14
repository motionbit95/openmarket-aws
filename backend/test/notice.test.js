const request = require("supertest");
const express = require("express");
const noticeRouter = require("../routes/notice.routes"); // 경로 확인

const app = express();
app.use(express.json());
app.use("/notices", noticeRouter);

describe("공지사항 API 테스트", () => {
  let createdId;

  // 공지 생성
  it("공지사항을 생성해야 한다", async () => {
    const res = await request(app).post("/notices").send({
      type: "USER", // 유효한 타입
      title: "공지사항 제목",
      content: "공지사항 내용",
      is_pinned: true,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("공지사항 제목");

    createdId = res.body.id.toString();
  });

  // 전체 공지 조회
  it("전체 공지사항을 조회해야 한다", async () => {
    const res = await request(app).get("/notices");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const found = res.body.find((n) => n.id.toString() === createdId);
    expect(found).toBeDefined();
    expect(found.title).toBe("공지사항 제목");
  });

  // 특정 공지 조회
  it("특정 공지사항을 조회해야 한다", async () => {
    const res = await request(app).get(`/notices/${createdId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body.id.toString()).toBe(createdId);
  });

  // 공지 수정
  it("공지사항을 수정해야 한다", async () => {
    const res = await request(app).put(`/notices/${createdId}`).send({
      title: "수정된 제목",
      content: "수정된 내용",
      is_pinned: false,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("수정된 제목");
    expect(res.body.is_pinned).toBe(false);
  });

  // 공지 삭제
  it("공지사항을 삭제해야 한다", async () => {
    const res = await request(app).delete(`/notices/${createdId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "공지 삭제 완료");
  });

  // 삭제된 공지 조회 시 404
  it("삭제된 공지사항 조회 시 404를 반환해야 한다", async () => {
    const res = await request(app).get(`/notices/${createdId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "공지 없음");
  });

  // 잘못된 type으로 생성 시 400
  it("유효하지 않은 type으로 생성 시 400을 반환해야 한다", async () => {
    const res = await request(app).post("/notices").send({
      type: "INVALID_TYPE",
      title: "테스트",
      content: "내용",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "유효하지 않은 공지 타입입니다."
    );
  });

  // 잘못된 type으로 수정 시 400
  it("유효하지 않은 type으로 수정 시 400을 반환해야 한다", async () => {
    // 임시 공지 생성
    const createRes = await request(app).post("/notices").send({
      type: "USER",
      title: "임시 공지",
      content: "내용",
    });
    const tempId = createRes.body.id.toString();

    // 잘못된 type 수정 요청
    const res = await request(app).put(`/notices/${tempId}`).send({
      type: "WRONG_TYPE",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "유효하지 않은 공지 타입입니다."
    );

    // cleanup
    await request(app).delete(`/notices/${tempId}`);
  });
});
