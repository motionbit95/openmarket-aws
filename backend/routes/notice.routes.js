const express = require("express");
const router = express.Router();
const noticeController = require("../controllers/notice.controller");

/**
 * @swagger
 * tags:
 *   name: Notices
 *   description: 공지사항 API
 */

/**
 * @swagger
 * /notices:
 *   get:
 *     summary: 공지사항 전체 조회
 *     tags: [Notices]
 *     responses:
 *       200:
 *         description: 공지사항 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/", noticeController.getAllNotices);

router.get("/user", noticeController.getUserNotice);

/**
 * @swagger
 * /notices/type/{type}:
 *   get:
 *     summary: 타입별 공지사항 조회
 *     tags: [Notices]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [USER, SELLER]
 *     responses:
 *       200:
 *         description: 타입별 공지사항 목록 반환
 */
router.get("/type/:type", noticeController.getNoticesByType);

/**
 * @swagger
 * /notices/{id}:
 *   get:
 *     summary: 공지사항 상세 조회
 *     tags: [Notices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 공지사항 상세 반환
 *       404:
 *         description: 해당 공지사항을 찾을 수 없음
 */
router.get("/:id", noticeController.getNoticeById);

/**
 * @swagger
 * /notices:
 *   post:
 *     summary: 공지사항 생성
 *     tags: [Notices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - content
 *             properties:
 *               type:
 *                 type: string
 *                 example: "USER"
 *               title:
 *                 type: string
 *                 example: "공지 제목"
 *               content:
 *                 type: string
 *                 example: "공지 내용입니다."
 *               is_pinned:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: 공지사항 생성 성공
 */
router.post("/", noticeController.createNotice);

/**
 * @swagger
 * /notices/{id}:
 *   put:
 *     summary: 공지사항 수정
 *     tags: [Notices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               is_pinned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 공지사항 수정 성공
 *       404:
 *         description: 해당 공지사항을 찾을 수 없음
 */
router.put("/:id", noticeController.updateNotice);

/**
 * @swagger
 * /notices/{id}:
 *   delete:
 *     summary: 공지사항 삭제
 *     tags: [Notices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 공지사항 삭제 성공
 *       404:
 *         description: 해당 공지사항을 찾을 수 없음
 */
router.delete("/:id", noticeController.deleteNotice);

/**
 * @swagger
 * /notices/{id}/attachments:
 *   get:
 *     summary: 공지사항 첨부파일 목록 조회
 *     tags: [Notices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 첨부파일 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/:id/attachments", noticeController.getNoticeAttachments);

module.exports = router;
