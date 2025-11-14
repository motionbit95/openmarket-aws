const express = require("express");
const router = express.Router();
const controller = require("../controllers/inquiry.controller");
/**
 * @swagger
 * tags:
 *   name: Inquiries
 *   description: 1:1 문의 API
 */

/**
 * @swagger
 * /inquiries/seller/{sellerId}:
 *   get:
 *     summary: 특정 판매자가 받은 모든 1:1 문의 조회
 *     tags: [Inquiries]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 판매자 ID
 *     responses:
 *       200:
 *         description: 문의 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inquiry'
 *       400:
 *         description: 잘못된 요청 (sellerId 누락 등)
 *       500:
 *         description: 서버 에러
 */
router.get("/seller/:sellerId", controller.getAllInquiryBySeller);

/**
 * @swagger
 * /inquiries/seller-to-admin/{sellerId}:
 *   get:
 *     summary: 특정 판매자가 관리자에게 보낸 1:1 문의 목록 조회
 *     tags: [Inquiries]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 판매자 ID
 *     responses:
 *       200:
 *         description: 문의 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inquiry'
 *       400:
 *         description: 잘못된 요청 (sellerId 누락 등)
 *       500:
 *         description: 서버 에러
 */
router.get(
  "/seller-to-admin/:sellerId",
  controller.getAllInquiryBySellerToAdmin
);

/**
 * @swagger
 * /inquiries:
 *   get:
 *     summary: 전체 1:1 문의 목록 조회
 *     tags: [Inquiries]
 *     responses:
 *       200:
 *         description: 문의 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inquiry'
 *       500:
 *         description: 서버 에러
 */
router.get("/", controller.getAllInquiries);

/**
 * @swagger
 * /inquiries/user/{userId}:
 *   get:
 *     summary: 특정 유저가 작성한 1:1 문의 목록 조회
 *     tags: [Inquiries]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 유저 ID
 *     responses:
 *       200:
 *         description: 문의 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inquiry'
 *       400:
 *         description: 잘못된 요청 (userId 누락 등)
 *       500:
 *         description: 서버 에러
 */
router.get("/user/:userId", controller.getInquiriesByUserId);

/**
 * @swagger
 * /inquiries/{id}:
 *   get:
 *     summary: 특정 1:1 문의 단건 조회
 *     tags: [Inquiries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 문의 ID
 *     responses:
 *       200:
 *         description: 문의 상세 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inquiry'
 *       404:
 *         description: 문의를 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
router.get("/:id", controller.getInquiryById);

/**
 * @swagger
 * /inquiries:
 *   post:
 *     summary: 1:1 문의 생성
 *     tags: [Inquiries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderId
 *               - senderType
 *               - title
 *               - content
 *             properties:
 *               senderId:
 *                 type: integer
 *                 description: 문의자 ID
 *               senderType:
 *                 type: string
 *                 enum: [user, seller]
 *                 description: 문의자 타입
 *               title:
 *                 type: string
 *                 description: 문의 제목
 *               content:
 *                 type: string
 *                 description: 문의 내용
 *               status:
 *                 type: string
 *                 description: "문의 상태 (기본값: 접수)"
 *     responses:
 *       201:
 *         description: 문의 생성 완료
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inquiry'
 *       500:
 *         description: 서버 에러
 */
router.post("/", controller.createInquiry);

/**
 * @swagger
 * /inquiries/{id}:
 *   put:
 *     summary: 1:1 문의 수정
 *     tags: [Inquiries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 문의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderId:
 *                 type: integer
 *                 description: 문의자 ID
 *               senderType:
 *                 type: string
 *                 enum: [user, seller]
 *                 description: 문의자 타입
 *               title:
 *                 type: string
 *                 description: 문의 제목
 *               content:
 *                 type: string
 *                 description: 문의 내용
 *               status:
 *                 type: string
 *                 description: 문의 상태
 *     responses:
 *       200:
 *         description: 문의 수정 완료
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inquiry'
 *       500:
 *         description: 서버 에러
 */
router.put("/:id", controller.updateInquiry);

/**
 * @swagger
 * /inquiries/{id}:
 *   delete:
 *     summary: 1:1 문의 삭제
 *     tags: [Inquiries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 문의 ID
 *     responses:
 *       204:
 *         description: "삭제 성공 (콘텐츠 없음)"
 *       500:
 *         description: 서버 에러
 */
router.delete("/:id", controller.deleteInquiry);

/**
 * @swagger
 * /inquiries/{id}/answer:
 *   post:
 *     summary: 문의에 대한 답변 작성
 *     tags: [Inquiries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 문의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answer
 *             properties:
 *               answer:
 *                 type: string
 *                 description: 작성할 답변 내용
 *                 example: 안녕하세요, 문의하신 내용에 대해 안내드립니다.
 *     responses:
 *       200:
 *         description: 답변 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 senderId:
 *                   type: string
 *                 senderType:
 *                   type: string
 *                 title:
 *                   type: string
 *                 content:
 *                   type: string
 *                 answer:
 *                   type: string
 *                 status:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *       400:
 *         description: 잘못된 요청 (필드 누락 등)
 *       404:
 *         description: 해당 ID의 문의가 없음
 *       500:
 *         description: 서버 오류
 */
router.post("/:id/answer", controller.answerInquiry);

/**
 * @swagger
 * /inquiries/{id}/attachments:
 *   get:
 *     summary: 특정 1:1 문의 첨부파일 목록 조회
 *     tags: [Inquiries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 문의 ID
 *     responses:
 *       200:
 *         description: 첨부파일 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   url:
 *                     type: string
 *                   size:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: 잘못된 요청 (ID 누락 등)
 *       500:
 *         description: 서버 에러
 */
router.get("/:id/attachments", controller.getInquiryAttachments);

module.exports = router;
