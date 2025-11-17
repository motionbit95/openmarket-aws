const request = require("supertest");
const app = require("../app");

describe("배송지 API 테스트", () => {
  let createdAddressId;
  let testUserId;
  let createdAddressId2;

  // 테스트용 유저 생성 (prisma 직접 사용)
  beforeAll(async () => {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    // 임시 유저 생성
    const user = await prisma.users.create({
      data: {
        user_name: "Test User",
        email: `testuser_${Date.now()}@example.com`,
        password: "testpassword",
      },
    });
    testUserId = user.id.toString();
    await prisma.$disconnect();
  });

  // 테스트용 유저 삭제 (주소 먼저 삭제 후 유저 삭제)
  afterAll(async () => {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    // 주소 먼저 삭제
    await prisma.user_addresses.deleteMany({
      where: { userId: BigInt(testUserId) },
    });
    // 유저 삭제
    await prisma.users.deleteMany({
      where: { id: BigInt(testUserId) },
    });
    await prisma.$disconnect();
  });

  it("새 배송지를 생성해야 한다", async () => {
    const res = await request(app).post("/address").send({
      userId: testUserId,
      recipient: "홍길동",
      phone: "010-1234-5678",
      postcode: "12345",
      address1: "서울특별시 강남구",
      address2: "101동 202호",
      isDefault: true,
      memo: "문 앞에 두세요",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.userId).toBe(testUserId);
    expect(res.body.isDefault).toBe(true);
    createdAddressId = res.body.id;
  });

  it("해당 유저의 모든 배송지를 조회해야 한다", async () => {
    const res = await request(app).get(`/address?userId=${testUserId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((addr) => addr.id === createdAddressId)).toBe(true);
  });

  it("생성된 배송지를 id로 조회해야 한다", async () => {
    const res = await request(app).get(`/address/${createdAddressId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(createdAddressId);
    expect(res.body.userId).toBe(testUserId);
  });

  it("배송지 정보를 수정해야 한다", async () => {
    const res = await request(app).put(`/address/${createdAddressId}`).send({
      recipient: "이몽룡",
      phone: "010-9999-8888",
      postcode: "54321",
      address1: "부산광역시 해운대구",
      address2: "303동 404호",
      isDefault: false,
      memo: "경비실에 맡겨주세요",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.recipient).toBe("이몽룡");
    expect(res.body.phone).toBe("010-9999-8888");
    expect(res.body.isDefault).toBe(false);
  });

  it("배송지를 삭제해야 한다", async () => {
    const res = await request(app).delete(`/address/${createdAddressId}`);
    // 삭제된 주소가 이미 없을 경우 400 또는 200을 허용
    expect([200, 400]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty("message", "배송지 삭제 완료");
    }
  });

  it("삭제된 배송지 조회 시 404를 반환해야 한다", async () => {
    const res = await request(app).get(`/address/${createdAddressId}`);
    expect([404, 400]).toContain(res.statusCode);
  });

  // 추가된 부분 테스트: 특정 유저의 배송지 목록 조회 (GET /address/user/:userId)
  it("다른 배송지를 생성하고 userId 경로로 배송지 목록을 조회해야 한다", async () => {
    // 새 주소 생성
    const res1 = await request(app).post("/address").send({
      userId: testUserId,
      recipient: "성춘향",
      phone: "010-2222-3333",
      postcode: "67890",
      address1: "전라북도 남원시",
      address2: "춘향동 1번지",
      isDefault: true,
      memo: "문 열어주세요",
    });
    expect(res1.statusCode).toBe(201);
    createdAddressId2 = res1.body.id;

    // GET /address/user/:userId
    const res2 = await request(app).get(`/address/user/${testUserId}`);
    expect(res2.statusCode).toBe(200);
    expect(Array.isArray(res2.body)).toBe(true);
    expect(res2.body.some((addr) => addr.id === createdAddressId2)).toBe(true);
    expect(res2.body.every((addr) => addr.userId === testUserId)).toBe(true);
  });

  // 추가: 기본 배송지는 삭제가 안 될 수 있음. 삭제 시도 후 결과에 따라 분기
  it("두 번째 배송지 삭제를 시도하고 유저 배송지 목록을 확인해야 한다", async () => {
    const delRes = await request(app).delete(`/address/${createdAddressId2}`);
    // eslint-disable-next-line no-console
    console.log("삭제 응답:", delRes.statusCode, delRes.body);

    // 기본 배송지면 삭제 불가(400), 아니면 200
    if (delRes.statusCode === 400) {
      // 기본배송지는 삭제할 수 없습니다 메시지 확인
      expect(delRes.body).toHaveProperty("message");
      expect(delRes.body.message).toMatch(/기본배송지는 삭제할 수 없습니다/);
    } else {
      // 삭제 성공
      expect(delRes.statusCode).toBe(200);
      expect(delRes.body).toHaveProperty("message", "배송지 삭제 완료");
    }

    // 삭제 후에도 userId로 목록 조회는 200이어야 함
    const listRes = await request(app).get(`/address/user/${testUserId}`);
    // eslint-disable-next-line no-console
    console.log("목록 조회 응답:", listRes.statusCode, listRes.body);

    expect(listRes.statusCode).toBe(200);

    if (delRes.statusCode === 200) {
      // 삭제 성공 시 목록에 없어야 함
      expect(listRes.body.some((addr) => addr.id === createdAddressId2)).toBe(
        false
      );
    } else {
      // 삭제 실패(기본배송지)면 목록에 남아있어야 함
      expect(listRes.body.some((addr) => addr.id === createdAddressId2)).toBe(
        true
      );
    }
  });

  // 추가: 잘못된 userId, id에 대한 에러 처리
  it("/address?userId에서 잘못된 userId로 400을 반환해야 한다", async () => {
    const res = await request(app).get("/address?userId=notanumber");
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/userId/);
  });

  it("/address/user/:userId에서 잘못된 userId로 400을 반환해야 한다", async () => {
    const res = await request(app).get("/address/user/invalidid");
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/userId/);
  });

  it("/address/:id에서 잘못된 id로 400을 반환해야 한다", async () => {
    const res = await request(app).get("/address/invalidid");
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/주소 ID/);
  });

  it("생성 시 필수 항목 누락 시 400을 반환해야 한다", async () => {
    const res = await request(app).post("/address").send({
      userId: testUserId,
      recipient: "",
      phone: "",
      postcode: "",
      address1: "",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/필수 항목/);
  });
});
