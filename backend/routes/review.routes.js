const express = require("express");
const router = express.Router();
const {
  createReview,
  getReviewsByProduct,
  getReviewById,
  updateReview,
  deleteReview,
  getAllReviewsBySeller,
  getReviewAttachments,
} = require("../controllers/review.controller");

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: 상품 리뷰 API
 */

router.get("/seller/:sellerId", getAllReviewsBySeller);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: 리뷰 생성
 *     description: 새로운 리뷰를 생성합니다.
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - userId
 *               - rating
 *               - content
 *             properties:
 *               productId:
 *                 type: string
 *                 description: 리뷰가 달릴 상품의 ID
 *               userId:
 *                 type: integer
 *                 description: 리뷰 작성자 유저 ID
 *               rating:
 *                 type: integer
 *                 description: 평점 (1~5)
 *               content:
 *                 type: string
 *                 description: 리뷰 내용
 *               images:
 *                 type: array
 *                 description: 리뷰에 첨부된 이미지 배열
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: 이미지 URL
 *                     sortOrder:
 *                       type: integer
 *                       description: 정렬 순서
 *     responses:
 *       201:
 *         description: 리뷰 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       500:
 *         description: 서버 오류
 */
router.post("/", createReview);

/**
 * @swagger
 * /reviews/products/{productId}:
 *   get:
 *     summary: 특정 상품의 리뷰 목록 조회
 *     description: 상품 ID로 해당 상품에 달린 리뷰 목록을 조회합니다.
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: 상품 ID
 *     responses:
 *       200:
 *         description: 리뷰 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       500:
 *         description: 서버 오류
 */
router.get("/products/:productId", getReviewsByProduct);

/**
 * @swagger
 * /reviews/{id}:
 *   get:
 *     summary: 리뷰 단건 조회
 *     description: 리뷰 ID로 리뷰를 단건 조회합니다.
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 리뷰 ID
 *     responses:
 *       200:
 *         description: 리뷰 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       404:
 *         description: 리뷰를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/:id", getReviewById);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: 리뷰 수정
 *     description: 리뷰 ID로 리뷰 내용을 수정합니다.
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 리뷰 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 description: 평점
 *               content:
 *                 type: string
 *                 description: 리뷰 내용
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     sortOrder:
 *                       type: integer
 *     responses:
 *       200:
 *         description: 리뷰 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       500:
 *         description: 서버 오류
 */
router.put("/:id", updateReview);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: 리뷰 삭제
 *     description: 리뷰 ID로 리뷰를 삭제합니다.
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 리뷰 ID
 *     responses:
 *       200:
 *         description: 리뷰 삭제 성공 메시지
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: 서버 오류
 */
router.delete("/:id", deleteReview);

router.get("/:id/attachments", getReviewAttachments);

module.exports = router;
