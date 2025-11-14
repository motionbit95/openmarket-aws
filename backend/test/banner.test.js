const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const bannerRouter = require("../routes/banner.routes");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const app = express();
app.use(bodyParser.json());
app.use("/banners", bannerRouter);

describe("배너 API 테스트", () => {
  let testAttachment;
  let testBanner;

  beforeAll(async () => {
    // 테스트용 Attachment 생성 (Banner 생성에 필요)
    testAttachment = await prisma.attachment.create({
      data: {
        target_type: "Banner",
        target_id: 0, // 임시값
        filename: "test-banner.jpg",
        url: "https://example.com/test-banner.jpg",
        s3_key: "banners/0/test-banner.jpg", // 임시 키
        filesize: 1024, // 임시 크기
        mimetype: "image/jpeg", // 임시 MIME 타입
        created_at: new Date(),
      },
    });
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (testBanner)
      await prisma.banner
        .delete({ where: { id: BigInt(testBanner.id) } })
        .catch(() => {});
    if (testAttachment)
      await prisma.attachment
        .delete({ where: { id: testAttachment.id } })
        .catch(() => {});
    await prisma.$disconnect();
  });

  test("배너를 생성해야 한다", async () => {
    const res = await request(app).post("/banners").send({
      attachmentId: testAttachment.id.toString(), // BigInt → string
      url: "https://example.com/banner-click",
      ownerType: "ADVERTISER",
      ownerId: "user_123", // 👈 필수 필드 추가
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.url).toBe("https://example.com/banner-click");
    expect(res.body.ownerId).toBe("user_123");
    testBanner = res.body; // 이후 테스트에서 사용
  });

  test("모든 배너를 조회해야 한다", async () => {
    const res = await request(app).get("/banners");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test("배너 상세 정보를 조회해야 한다", async () => {
    const res = await request(app).get(`/banners/${testBanner.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", testBanner.id);
  });

  test("배너를 수정해야 한다", async () => {
    const newUrl = "https://example.com/banner-updated";
    const res = await request(app).put(`/banners/${testBanner.id}`).send({
      url: newUrl,
      ownerType: "SELLER",
      ownerId: "seller_999", // 👈 업데이트 시에도 ownerId 포함
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.url).toBe(newUrl);
    expect(res.body.ownerType).toBe("SELLER");
    expect(res.body.ownerId).toBe("seller_999");
  });

  test("배너를 삭제해야 한다", async () => {
    const res = await request(app).delete(`/banners/${testBanner.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "배너 삭제 완료");
    testBanner = null;
  });
});
