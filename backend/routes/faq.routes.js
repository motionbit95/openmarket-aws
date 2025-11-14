const express = require("express");
const router = express.Router();
const faqController = require("../controllers/faq.controller");

/**
 * @swagger
 * tags:
 *   name: FAQ
 *   description: 자주 묻는 질문 API
 */

/**
 * @swagger
 * /faq:
 *   post:
 *     summary: FAQ 생성
 *     tags: [FAQ]
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
 *                 example: GENERAL
 *               title:
 *                 type: string
 *                 example: 환불은 어떻게 하나요?
 *               content:
 *                 type: string
 *                 example: 마이페이지 > 주문내역에서 환불 요청이 가능합니다.
 *     responses:
 *       201:
 *         description: 생성된 FAQ 반환
 *       400:
 *         description: 유효하지 않은 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/", faqController.createFAQ);

/**
 * @swagger
 * /faq:
 *   get:
 *     summary: 전체 FAQ 목록 조회
 *     tags: [FAQ]
 *     responses:
 *       200:
 *         description: FAQ 목록 반환
 *       500:
 *         description: 서버 오류
 */
router.get("/", faqController.getAllFAQs);

router.get("/user", faqController.getUserFAQs);

/**
 * @swagger
 * /faq/{id}:
 *   get:
 *     summary: 특정 FAQ 조회
 *     tags: [FAQ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: FAQ ID
 *     responses:
 *       200:
 *         description: FAQ 상세 정보 반환
 *       400:
 *         description: 유효하지 않은 ID
 *       404:
 *         description: FAQ 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/:id", faqController.getFAQById);

/**
 * @swagger
 * /faq/{id}:
 *   put:
 *     summary: FAQ 수정
 *     tags: [FAQ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: FAQ ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: GENERAL
 *               title:
 *                 type: string
 *                 example: 환불 방법이 궁금해요
 *               content:
 *                 type: string
 *                 example: 환불은 마이페이지에서 직접 요청할 수 있습니다.
 *     responses:
 *       200:
 *         description: 수정된 FAQ 반환
 *       400:
 *         description: 유효하지 않은 ID
 *       404:
 *         description: FAQ 없음
 *       500:
 *         description: 서버 오류
 */
router.put("/:id", faqController.updateFAQ);

/**
 * @swagger
 * /faq/{id}:
 *   delete:
 *     summary: FAQ 삭제
 *     tags: [FAQ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: FAQ ID
 *     responses:
 *       200:
 *         description: 삭제 성공 메시지
 *       400:
 *         description: 유효하지 않은 ID
 *       500:
 *         description: 서버 오류
 */
router.delete("/:id", faqController.deleteFAQ);

module.exports = router;
