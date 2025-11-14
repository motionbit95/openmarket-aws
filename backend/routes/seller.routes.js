const express = require("express");
const router = express.Router();
const sellerController = require("../controllers/seller.controller");

/**
 * @swagger
 * tags:
 *   name: Sellers
 *   description: 판매자 관련 API
 */

/**
 * @swagger
 * /sellers:
 *   get:
 *     summary: 전체 판매자 목록 조회
 *     tags: [Sellers]
 *     responses:
 *       200:
 *         description: 판매자 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Seller'
 */
router.get("/", sellerController.getAllSellers);

router.get("/me", sellerController.getCurrentSeller);

router.get("/stats", sellerController.getSellerGrowthStats);

/**
 * @swagger
 * /sellers/{id}:
 *   get:
 *     summary: 특정 판매자 조회
 *     tags: [Sellers]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 판매자 ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 판매자 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Seller'
 *       404:
 *         description: 판매자를 찾을 수 없음
 */
router.get("/:id", sellerController.getSellerById);

/**
 * @swagger
 * /sellers:
 *   post:
 *     summary: 판매자 생성
 *     tags: [Sellers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SellerInput'
 *     responses:
 *       201:
 *         description: 판매자 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Seller'
 */
router.post("/", sellerController.createSeller);

/**
 * @swagger
 * /sellers/{id}:
 *   put:
 *     summary: 판매자 정보 수정
 *     tags: [Sellers]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 판매자 ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SellerInput'
 *     responses:
 *       200:
 *         description: 판매자 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Seller'
 */
router.put("/:id", sellerController.updateSeller);

/**
 * @swagger
 * /sellers/{id}:
 *   delete:
 *     summary: 판매자 삭제
 *     tags: [Sellers]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 판매자 ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 판매자 삭제 성공
 *       500:
 *         description: 서버 오류
 */
router.delete("/:id", sellerController.deleteSeller);

//  추가된 인증 관련 API

/**
 * @swagger
 * /sellers/me:
 *   get:
 *     summary: 현재 로그인한 판매자 정보 조회
 *     tags: [Sellers]
 *     responses:
 *       200:
 *         description: 판매자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Seller'
 *       401:
 *         description: 인증 실패
 */
router.get("/me", sellerController.getCurrentSeller);

/**
 * @swagger
 * /sellers/sign-in:
 *   post:
 *     summary: 판매자 로그인
 *     tags: [Sellers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: seller@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: 로그인 실패
 */
router.post("/sign-in", sellerController.signInSeller);

/**
 * @swagger
 * /sellers/sign-up:
 *   post:
 *     summary: 판매자 회원가입
 *     tags: [Sellers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SellerInput'
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Seller'
 */
router.post("/sign-up", sellerController.signUpSeller);

/**
 * @swagger
 * /sellers/find-id:
 *   post:
 *     summary: 판매자 아이디 찾기
 *     tags: [Sellers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 홍길동
 *               phone:
 *                 type: string
 *                 example: 010-1234-5678
 *             required:
 *               - name
 *               - phone
 *     responses:
 *       200:
 *         description: 아이디 찾기 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 아이디 찾기 완료
 *                 seller:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: seller@example.com
 *                     createdAt:
 *                       type: string
 *                       example: 2023-01-01
 *       400:
 *         description: 필수 정보 누락
 *       404:
 *         description: 일치하는 판매자 정보 없음
 */
router.post("/find-id", sellerController.findSellerEmail);

router.get("/:id/attachments", sellerController.getSellerAttachments);

module.exports = router;
