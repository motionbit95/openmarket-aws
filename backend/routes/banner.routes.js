const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/banner.controller");

/**
 * @swagger
 * tags:
 *   name: Banners
 *   description: 배너 관리 API
 */

router.get("/seller/:sellerId", bannerController.getBannersBySeller);

/**
 * @swagger
 * /banners:
 *   post:
 *     summary: 배너 생성
 *     tags: [Banners]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attachmentId
 *               - url
 *               - ownerType
 *             properties:
 *               attachmentId:
 *                 type: string
 *                 description: 첨부파일 ID (BigInt 문자열)
 *               url:
 *                 type: string
 *                 description: 배너 클릭 시 이동할 URL
 *               ownerType:
 *                 type: string
 *                 enum: [ADVERTISER, SELLER]
 *                 description: 배너 소유자 타입 (광고주, 판매자)
 *     responses:
 *       201:
 *         description: 배너 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 *       400:
 *         description: 필수 필드 누락 또는 유효하지 않은 입력
 *       500:
 *         description: 서버 에러
 */
router.post("/", bannerController.createBanner);

/**
 * @swagger
 * /banners:
 *   get:
 *     summary: 모든 배너 조회
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: 배너 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Banner'
 *       500:
 *         description: 서버 에러
 */
router.get("/", bannerController.getAllBanners);

/**
 * @swagger
 * /banners/{id}:
 *   get:
 *     summary: 배너 상세 조회
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 배너 ID (BigInt 문자열)
 *     responses:
 *       200:
 *         description: 배너 상세 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 *       400:
 *         description: 유효하지 않은 ID
 *       404:
 *         description: 배너를 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
router.get("/:id", bannerController.getBannerById);

/**
 * @swagger
 * /banners/{id}:
 *   put:
 *     summary: 배너 수정
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 배너 ID (BigInt 문자열)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attachmentId:
 *                 type: string
 *                 description: 첨부파일 ID (BigInt 문자열)
 *               url:
 *                 type: string
 *                 description: 배너 클릭 시 이동할 URL
 *               ownerType:
 *                 type: string
 *                 enum: [ADVERTISER, SELLER]
 *                 description: 배너 소유자 타입
 *     responses:
 *       200:
 *         description: 배너 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 *       400:
 *         description: 유효하지 않은 입력값
 *       500:
 *         description: 서버 에러
 */
router.put("/:id", bannerController.updateBanner);

/**
 * @swagger
 * /banners/{id}:
 *   delete:
 *     summary: 배너 삭제
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 배너 ID (BigInt 문자열)
 *     responses:
 *       200:
 *         description: 배너 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 배너 삭제 완료
 *       400:
 *         description: 유효하지 않은 ID
 *       500:
 *         description: 서버 에러
 */
router.delete("/:id", bannerController.deleteBanner);

module.exports = router;
