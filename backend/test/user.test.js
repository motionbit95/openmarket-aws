const request = require("supertest");
const app = require("../app");
const { PrismaClient } = require("@prisma/client");

describe("사용자 API 테스트", () => {
  let createdUserId;
  let createdUserEmail;
  // 삭제해야 할 테스트 유저 id 목록
  const testUserIds = [];

  // 테스트 종료 후 생성된 모든 테스트 유저 및 관련 데이터 삭제
  afterAll(async () => {
    const prisma = new PrismaClient();
    try {
      for (const userId of testUserIds) {
        // 리뷰 등 연관 데이터 먼저 삭제
        await prisma.review.deleteMany({
          where: { userId: BigInt(userId) },
        });
        // 유저 삭제
        await prisma.user.deleteMany({ where: { id: BigInt(userId) } });
      }
    } catch (e) {
      // 이미 삭제된 경우 무시
    } finally {
      await prisma.$disconnect();
    }
  });

  it("사용자를 생성해야 한다", async () => {
    const email = `testuser_${Date.now()}@example.com`;
    createdUserEmail = email;
    const res = await request(app).post("/users").send({
      user_name: "테스트 유저",
      email,
      password: "testpassword",
      phone: "010-1234-5678",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.email).toBe(email);
    createdUserId = res.body.id.toString ? res.body.id.toString() : res.body.id;
    testUserIds.push(createdUserId);
  });

  it("전체 사용자 목록을 조회해야 한다", async () => {
    const res = await request(app).get("/users");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // 생성한 유저가 목록에 포함되어 있는지 확인
    expect(res.body.some((u) => u.id == createdUserId)).toBe(true);
  });

  it("특정 사용자를 조회해야 한다", async () => {
    const res = await request(app).get(`/users/${createdUserId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body.id == createdUserId).toBe(true);
    expect(res.body.email).toBe(createdUserEmail);
  });

  it("사용자 로그인을 처리해야 한다", async () => {
    const res = await request(app).post("/users/login").send({
      email: createdUserEmail,
      password: "testpassword",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(createdUserEmail);
  });

  it("사용자 정보를 수정해야 한다", async () => {
    const newEmail = `updated_${Date.now()}@example.com`;
    const res = await request(app).put(`/users/${createdUserId}`).send({
      user_name: "수정된 유저",
      email: newEmail,
      password: "newpassword",
      phone: "010-9999-8888",
      mileage: 100,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.user_name).toBe("수정된 유저");
    expect(res.body.email).toBe(newEmail);
    expect(res.body.mileage).toBe(100);
    createdUserEmail = newEmail;
  });

  it("사용자를 삭제해야 한다", async () => {
    const res = await request(app).delete(`/users/${createdUserId}`);
    expect(res.statusCode).toBe(200);
    // 실제 메시지는 컨트롤러에서 "유저 및 관련 리뷰/댓글 삭제 완료"
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toMatch(/유저.*삭제 완료/);
    // 삭제 후 id를 null로 만들어 중복 삭제 방지, testUserIds는 유지 (afterAll에서 중복 삭제는 무시)
    createdUserId = null;
  });

  it("삭제된 사용자 조회 시 404를 반환해야 한다", async () => {
    // 새 유저 생성
    const email = `ghost_${Date.now()}@example.com`;
    const res1 = await request(app).post("/users").send({
      user_name: "삭제테스트",
      email,
      password: "ghostpw",
      phone: "010-0000-0000",
    });
    const ghostId = res1.body.id.toString
      ? res1.body.id.toString()
      : res1.body.id;
    testUserIds.push(ghostId);
    // 삭제
    await request(app).delete(`/users/${ghostId}`);
    // 조회
    const res2 = await request(app).get(`/users/${ghostId}`);
    expect(res2.statusCode).toBe(404);
    expect(res2.body.message).toBe("유저를 찾을 수 없습니다.");
  });
});
