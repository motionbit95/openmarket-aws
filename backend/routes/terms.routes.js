const express = require("express");
const router = express.Router();
const termsController = require("../controllers/terms.controller");

/**
 * @swagger
 * tags:
 *   name: Terms
 *   description: 약관/정책 API
 */

/**
 * @swagger
 * /terms:
 *   get:
 *     summary: 전체 약관 조회
 *     tags: [Terms]
 *     responses:
 *       200:
 *         description: 약관 목록 반환
 *       500:
 *         description: 서버 에러
 */
router.get("/", termsController.getAllTerms);

/**
 * @swagger
 * /terms/latest/{type}:
 *   get:
 *     summary: 타입별 최신 약관 조회
 *     tags: [Terms]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: "약관 타입 (예: service, privacy 등)"
 *     responses:
 *       200:
 *         description: 최신 약관 반환
 *       404:
 *         description: 약관을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
router.get("/latest/:type", termsController.getLatestTermsByType);

/**
 * @swagger
 * /terms/{id}:
 *   get:
 *     summary: ID로 약관 조회
 *     tags: [Terms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 약관 UUID
 *     responses:
 *       200:
 *         description: 약관 반환
 *       404:
 *         description: 약관을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
router.get("/:id", termsController.getTermsById);

/**
 * @swagger
 * /terms:
 *   post:
 *     summary: 약관 생성
 *     tags: [Terms]
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
 *               - effective_date
 *             properties:
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               effective_date:
 *                 type: string
 *                 format: date
 *                 example: 2025-08-01
 *     responses:
 *       201:
 *         description: 약관 생성 성공
 *       500:
 *         description: 약관 생성 실패
 */
router.post("/", termsController.createTerms);

/**
 * @swagger
 * /terms/{id}:
 *   put:
 *     summary: 약관 수정
 *     tags: [Terms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 약관 UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - effective_date
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               effective_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: 약관 수정 성공
 *       404:
 *         description: 약관을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
router.put("/:id", termsController.updateTerms);

/**
 * @swagger
 * /terms/{id}:
 *   delete:
 *     summary: 약관 삭제
 *     tags: [Terms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 약관 UUID
 *     responses:
 *       200:
 *         description: 약관 삭제 완료
 *       404:
 *         description: 약관을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
router.delete("/:id", termsController.deleteTerms);

module.exports = router;
