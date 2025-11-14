const express = require("express");
const multer = require("multer");
const attachmentController = require("../controllers/attachment.controller");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // 파일명 복원
    try {
      const originalNameBuffer = Buffer.from(file.originalname, "latin1");
      file.originalname = originalNameBuffer.toString("utf8");
    } catch (e) {
      console.warn("파일명 디코딩 실패", e);
    }
    cb(null, true);
  },
});

/**
 * @swagger
 * tags:
 *   name: Attachments
 *   description: 첨부파일/다운로드 API
 */

/**
 * @swagger
 * /attachments/temp/upload/{id}:
 *   post:
 *     summary: 임시 첨부파일 업로드
 *     tags: [Attachments]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 임시 폴더 ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 업로드할 파일들
 *     responses:
 *       201:
 *         description: 임시 파일 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                         description: 파일명
 *                       url:
 *                         type: string
 *                         description: 파일 URL
 *       400:
 *         description: 파일이 필요합니다
 *       500:
 *         description: 서버 오류
 */
// 임시 첨부파일 업로드 및 관리 (temp)
router.post(
  "/temp/upload/:id",
  upload.array("files"),
  attachmentController.uploadTempAttachments
);

/**
 * @swagger
 * /attachments/editor/upload/{id}:
 *   post:
 *     summary: 에디터 첨부파일 업로드
 *     tags: [Attachments]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 에디터 ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 업로드할 파일들
 *     responses:
 *       201:
 *         description: 에디터 파일 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                         description: 파일명
 *                       url:
 *                         type: string
 *                         description: 파일 URL
 *       400:
 *         description: 파일이 필요합니다
 *       500:
 *         description: 서버 오류
 */
router.post(
  "/editor/upload/:id",
  upload.array("files"),
  attachmentController.uploadEditorAttachments
);

/**
 * @swagger
 * /attachments/temp/clear/{id}:
 *   delete:
 *     summary: 임시 폴더 정리
 *     tags: [Attachments]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 임시 폴더 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 임시 폴더 정리 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *       500:
 *         description: 서버 오류
 */
router.delete("/temp/clear/:id", attachmentController.clearTempFolder);

/**
 * @swagger
 * /attachments/upload/{type}/{id}:
 *   post:
 *     summary: 일반 첨부파일 업로드
 *     tags: [Attachments]
 *     parameters:
 *       - name: type
 *         in: path
 *         description: 첨부파일 타입 (notice, guide, error_report, banner, inquiry)
 *         required: true
 *         schema:
 *           type: string
 *       - name: id
 *         in: path
 *         description: 대상 ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 업로드할 파일들
 *     responses:
 *       201:
 *         description: 첨부파일 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                         description: 파일명
 *                       url:
 *                         type: string
 *                         description: 파일 URL
 *                       s3_key:
 *                         type: string
 *                         description: S3 키
 *                       filesize:
 *                         type: integer
 *                         description: 파일 크기
 *                       mimetype:
 *                         type: string
 *                         description: MIME 타입
 *       400:
 *         description: 파일이 필요하거나 허용되지 않는 타입
 *       500:
 *         description: 서버 오류
 */
// 일반 첨부파일 업로드 (notice, guide, error_report, banner, inquiry 등)
router.post(
  "/upload/:type/:id",
  upload.array("files"),
  attachmentController.uploadAttachments
);

/**
 * @swagger
 * /attachments/images/upload/{type}/{id}:
 *   post:
 *     summary: 최적화된 이미지 업로드
 *     tags: [Attachments]
 *     parameters:
 *       - name: type
 *         in: path
 *         description: 이미지 타입 (product, seller, banner)
 *         required: true
 *         schema:
 *           type: string
 *       - name: id
 *         in: path
 *         description: 대상 ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 업로드할 이미지 파일들
 *     responses:
 *       201:
 *         description: 이미지 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                         description: 파일명
 *                       url:
 *                         type: string
 *                         description: 최적화된 이미지 URL
 *                       originalUrl:
 *                         type: string
 *                         description: 원본 이미지 URL
 *                       thumbnailUrl:
 *                         type: string
 *                         description: 썸네일 URL
 *       400:
 *         description: 파일이 필요하거나 지원되지 않는 이미지 형식
 *       500:
 *         description: 서버 오류
 */
// 최적화된 이미지 업로드 (상품, 판매자, 배너 이미지용)
router.post(
  "/images/upload/:type/:id",
  upload.array("files"),
  attachmentController.uploadOptimizedImages
);

/**
 * @swagger
 * /attachments/download-url/{key}:
 *   get:
 *     summary: 파일 다운로드 URL 발급
 *     tags: [Attachments]
 *     parameters:
 *       - name: key
 *         in: path
 *         description: S3 키
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 다운로드 URL 발급 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: 다운로드 URL
 *                 expiresIn:
 *                   type: integer
 *                   description: 만료 시간 (초)
 *       404:
 *         description: 파일을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
// 파일 다운로드 URL 발급
router.get("/download-url/:key", attachmentController.getDownloadUrl);

/**
 * @swagger
 * /attachments/delete/{id}:
 *   post:
 *     summary: 첨부파일 삭제
 *     tags: [Attachments]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 첨부파일 ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 삭제할 첨부파일 ID 배열
 *     responses:
 *       200:
 *         description: 첨부파일 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *                 deletedCount:
 *                   type: integer
 *                   description: 삭제된 파일 수
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 첨부파일을 찾을 수 없음
 */
router.post("/delete/:id", attachmentController.deleteAttachment);

module.exports = router;
