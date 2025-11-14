const express = require("express");
const router = express.Router();
const controller = require("../controllers/errorReport.controller");

/**
 * @swagger
 * tags:
 *   name: ErrorReports
 *   description: 오류 신고/처리 API
 */

router.get("/seller/:sellerId/:type", controller.getErrorReportBySeller);

/**
 * @swagger
 * /errorReport:
 *   post:
 *     summary: 에러 리포트 생성
 *     tags: [ErrorReports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reporter_id
 *               - reporter_type
 *               - category
 *               - content
 *             properties:
 *               reporter_id:
 *                 type: string
 *               reporter_type:
 *                 type: string
 *                 enum: [user, seller]
 *               category:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: 생성된 에러 리포트 반환
 */
router.post("/", controller.createErrorReport);

/**
 * @swagger
 * /errorReport:
 *   get:
 *     summary: 에러 리포트 목록 조회
 *     tags: [ErrorReports]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: reporter_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: reporter_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 에러 리포트 목록 반환
 */
router.get("/", controller.getAllErrorReports);

/**
 * @swagger
 * /errorReport/{id}:
 *   get:
 *     summary: 특정 에러 리포트 조회
 *     tags: [ErrorReports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 에러 리포트 상세 정보
 *       404:
 *         description: 리포트 없음
 */
router.get("/:id", controller.getErrorReportById);

/**
 * @swagger
 * /errorReport/{id}:
 *   put:
 *     summary: 에러 리포트 수정
 *     tags: [ErrorReports]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               category:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *               updated_by:
 *                 type: string
 *     responses:
 *       200:
 *         description: 수정된 에러 리포트
 */
router.put("/:id", controller.updateErrorReport);

/**
 * @swagger
 * /errorReport/{id}:
 *   delete:
 *     summary: 에러 리포트 삭제
 *     tags: [ErrorReports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 삭제 성공 메시지
 */
router.delete("/:id", controller.deleteErrorReport);

/**
 * @swagger
 * /errorReport/{id}/answer:
 *   post:
 *     summary: 에러 리포트 답변 등록
 *     tags: [ErrorReports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: 답변 등록 성공
 */
router.post("/:id/answer", controller.answerErrorReport);

/**
 * @swagger
 * /errorReport/{id}/attachments:
 *   get:
 *     summary: 특정 리포트의 첨부파일 목록 조회
 *     tags: [ErrorReports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 첨부파일 목록 반환
 */
router.get("/:id/attachments", controller.getErrorReportAttatchments);

module.exports = router;
