const request = require("supertest");
const express = require("express");
const path = require("path");
const fs = require("fs");
const attachmentRouter = require("../routes/attachment.routes");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use("/attachments", attachmentRouter);

describe("첨부파일 API 테스트", () => {
  let createdNoticeId;
  let uploadedAttachmentIds = [];
  let uploadedS3Key = "";

  // S3 mocking을 위한 환경변수 설정 (테스트 환경에서만)
  beforeAll(async () => {
    // 테스트용 Notice 생성 (Attachment의 target_id로 사용)
    const notice = await prisma.notice.create({
      data: {
        type: "USER",
        title: "첨부파일 테스트용 공지",
        content: "첨부파일 테스트용 내용",
      },
    });
    createdNoticeId = notice.id;
  });

  afterAll(async () => {
    // 첨부파일 및 테스트용 Notice 정리
    if (uploadedAttachmentIds.length > 0) {
      await prisma.attachment.deleteMany({
        where: { id: { in: uploadedAttachmentIds } },
      });
    }
    if (createdNoticeId) {
      await prisma.notice.deleteMany({ where: { id: createdNoticeId } });
    }
    await prisma.$disconnect();
  });

  describe("POST /attachments/upload/:type/:id - 파일 업로드", () => {
    it("여러 파일 업로드 시 201, DB에 저장, S3 URL/s3_key 반환", async () => {
      const res = await request(app)
        .post(`/attachments/upload/notice/${createdNoticeId}`)
        .attach("files", Buffer.from("file content 1"), "한글파일1.txt")
        .attach("files", Buffer.from("file content 2"), "file2.txt");

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("업로드 성공");
      expect(Array.isArray(res.body.files)).toBe(true);
      expect(res.body.files.length).toBe(2);

      // 파일 정보 확인
      for (const file of res.body.files) {
        expect(file).toHaveProperty("filename");
        expect(file).toHaveProperty("url");
        expect(file).toHaveProperty("s3_key");
        expect(file).toHaveProperty("filesize");
        expect(file).toHaveProperty("mimetype");
        expect(file.filename).toMatch(/file|한글/);
        expect(file.url).toMatch(/^https:\/\/.+amazonaws\.com\//);
        expect(file.s3_key).toMatch(/notice/);
      }

      // DB에 실제로 저장되었는지 확인
      const dbFiles = await prisma.attachment.findMany({
        where: {
          target_type: "notice",
          target_id: BigInt(createdNoticeId),
        },
      });
      expect(dbFiles.length).toBeGreaterThanOrEqual(2);

      // 테스트 후 삭제를 위해 id/s3_key 저장
      uploadedAttachmentIds = dbFiles.map((f) => f.id);
      uploadedS3Key = res.body.files[0].s3_key;
    });

    it("파일 없이 요청 시 400 반환", async () => {
      const res = await request(app).post(
        `/attachments/upload/notice/${createdNoticeId}`
      );
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message", "파일이 필요합니다.");
    });

    it("허용되지 않는 타입으로 요청 시 400 반환", async () => {
      const res = await request(app)
        .post(`/attachments/upload/invalidtype/${createdNoticeId}`)
        .attach("files", Buffer.from("file content"), "file.txt");
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message", "허용되지 않는 타입입니다.");
    });
  });

  describe("GET /attachments/download-url/:key - presigned URL 발급", () => {
    it("유효한 s3_key로 presigned URL 반환", async () => {
      // 업로드 테스트에서 s3_key를 저장해둠
      expect(uploadedS3Key).toBeTruthy();
      const res = await request(app).get(
        `/attachments/download-url/${encodeURIComponent(uploadedS3Key)}`
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("url");
      expect(res.body.url).toContain(uploadedS3Key.split("/").pop());
    });

    it("존재하지 않는 key로 요청 시 500 또는 에러 반환", async () => {
      const res = await request(app).get(
        `/attachments/download-url/not-exist-key-123456`
      );
      // presigned URL 발급 실패 시 500 또는 404 반환
      expect([200, 404, 500]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        // 만약 presigned URL이 발급되어도, url 속성이 있어야 함
        expect(res.body).toHaveProperty("url");
      } else {
        // 실패 시 error 속성이 있어야 함
        expect(res.body).toHaveProperty("error");
      }
    });
  });

  describe("POST /attachments/delete/:id - 첨부파일 삭제", () => {
    it("존재하는 첨부파일 id 배열로 삭제 성공", async () => {
      if (uploadedAttachmentIds.length === 0) return;
      const res = await request(app)
        .post("/attachments/delete/0") // 실제 라우트는 /delete/:id 이지만, 컨트롤러에서 body.ids 사용
        .send({ ids: uploadedAttachmentIds.map((id) => id.toString()) });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "첨부파일이 성공적으로 삭제되었습니다."
      );
      expect(res.body.deletedIds).toEqual(
        uploadedAttachmentIds.map((id) => id.toString())
      );

      // DB에서 실제로 삭제되었는지 확인
      const remain = await prisma.attachment.findMany({
        where: { id: { in: uploadedAttachmentIds } },
      });
      expect(remain.length).toBe(0);
      uploadedAttachmentIds = [];
    });

    it("없는 id로 삭제 시 404 반환", async () => {
      const res = await request(app)
        .post("/attachments/delete/0")
        .send({ ids: ["999999999999999"] });
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/찾을 수 없습니다/);
    });

    it("ids 배열 없이 삭제 요청 시 400 반환", async () => {
      const res = await request(app).post("/attachments/delete/0").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        "message",
        "삭제할 첨부파일 id 배열이 필요합니다."
      );
    });
  });

  describe("POST /attachments/temp/upload/:id - 임시 파일 업로드", () => {
    it("임시 파일 업로드 성공 및 DB 저장 안됨", async () => {
      const tempId = "test-temp-id";
      const res = await request(app)
        .post(`/attachments/temp/upload/${tempId}`)
        .attach("files", Buffer.from("temp file"), "temp1.txt");
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("임시 업로드 성공");
      expect(Array.isArray(res.body.files)).toBe(true);
      expect(res.body.files[0]).toHaveProperty("filename", "temp1.txt");
      expect(res.body.files[0].url).toMatch(/temp/);

      // DB에는 저장되지 않음
      const dbFiles = await prisma.attachment.findMany({
        where: { filename: "temp1.txt" },
      });
      expect(dbFiles.length).toBe(0);
    });
  });

  describe("DELETE /attachments/temp/clear/:id - 임시 폴더 비우기", () => {
    it("임시 폴더 내 파일 삭제 성공", async () => {
      const tempId = "test-temp-id";
      // 먼저 업로드
      await request(app)
        .post(`/attachments/temp/upload/${tempId}`)
        .attach("files", Buffer.from("temp file2"), "temp2.txt");
      // 삭제
      const res = await request(app).delete(
        `/attachments/temp/clear/${tempId}`
      );
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/삭제되었습니다/);
    });
  });

  describe("POST /attachments/editor/upload/:id - 에디터 파일 업로드", () => {
    it("에디터 파일 업로드 성공 및 DB 저장 안됨", async () => {
      const editorId = "test-editor-id";
      const res = await request(app)
        .post(`/attachments/editor/upload/${editorId}`)
        .attach("files", Buffer.from("editor file"), "editor1.txt");
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("임시 업로드 성공");
      expect(Array.isArray(res.body.files)).toBe(true);
      expect(res.body.files[0]).toHaveProperty("filename", "editor1.txt");
      expect(res.body.files[0].url).toMatch(/editor/);

      // DB에는 저장되지 않음
      const dbFiles = await prisma.attachment.findMany({
        where: { filename: "editor1.txt" },
      });
      expect(dbFiles.length).toBe(0);
    });
  });
});
