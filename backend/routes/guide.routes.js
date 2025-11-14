const express = require("express");
const router = express.Router();
const userGuideController = require("../controllers/guide.controller");

/**
 * @swagger
 * tags:
 *   name: Guides
 *   description: 가이드 문서 API
 */

/**
 * @swagger
 * /user-guides:
 *   post:
 *     summary: 유저 가이드 생성
 *     tags: [UserGuides]
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
 *                 description: 가이드 타입
 *               title:
 *                 type: string
 *                 description: 가이드 제목
 *               content:
 *                 type: string
 *                 description: 가이드 내용
 *               is_pinned:
 *                 type: boolean
 *                 description: 상단 고정 여부
 *                 default: false
 *     responses:
 *       201:
 *         description: 생성된 유저 가이드 객체 반환
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserGuide'
 *       500:
 *         description: 서버 에러
 */
router.post("/", userGuideController.createUserGuide);

/**
 * @swagger
 * /user-guides:
 *   get:
 *     summary: 모든 유저 가이드 조회 (고정된 순서로)
 *     tags: [UserGuides]
 *     responses:
 *       200:
 *         description: 유저 가이드 배열 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserGuide'
 *       500:
 *         description: 서버 에러
 */
router.get("/", userGuideController.getAllUserGuides);

/**
 * @swagger
 * /user-guides/{id}:
 *   get:
 *     summary: 특정 유저 가이드 조회
 *     tags: [UserGuides]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 유저 가이드 ID
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: 유저 가이드 객체 반환
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserGuide'
 *       404:
 *         description: 유저 가이드 없음
 *       500:
 *         description: 서버 에러
 */
router.get("/:id", userGuideController.getUserGuideById);

/**
 * @swagger
 * /user-guides/{id}:
 *   put:
 *     summary: 특정 유저 가이드 수정
 *     tags: [UserGuides]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 유저 가이드 ID
 *         schema:
 *           type: integer
 *           format: int64
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               is_pinned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 수정된 유저 가이드 객체 반환
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserGuide'
 *       404:
 *         description: 유저 가이드 없음
 *       500:
 *         description: 서버 에러
 */
router.put("/:id", userGuideController.updateUserGuide);

/**
 * @swagger
 * /user-guides/{id}:
 *   delete:
 *     summary: 특정 유저 가이드 삭제
 *     tags: [UserGuides]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 유저 가이드 ID
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: 삭제 완료 메시지 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: UserGuide 삭제 완료
 *       500:
 *         description: 서버 에러
 */
router.delete("/:id", userGuideController.deleteUserGuide);

router.get("/:id/attachments", userGuideController.getGuideAttachments);

module.exports = router;
