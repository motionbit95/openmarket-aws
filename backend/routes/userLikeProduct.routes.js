const express = require("express");
const router = express.Router();
const userLikeProductController = require("../controllers/userLikeProduct.controller");

/**
 * @swagger
 * tags:
 *   name: Likes
 *   description: 상품 좋아요(관심상품) API
 */

/**
 * @swagger
 * /user-like-products/count/{productId}:
 *   get:
 *     summary: 상품별 좋아요 수 조회
 *     tags: [Likes]
 *     parameters:
 *       - name: productId
 *         in: path
 *         description: 상품 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 좋아요 수 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: 좋아요 수
 *       400:
 *         description: 잘못된 상품 ID
 *       404:
 *         description: 상품을 찾을 수 없음
 */
router.get("/count/:productId", userLikeProductController.getProductLikeCount);

/**
 * @swagger
 * /user-like-products/products/{userId}:
 *   get:
 *     summary: 특정 사용자의 관심상품 리스트 조회
 *     tags: [Likes]
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: 사용자 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 관심상품 리스트 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   productId:
 *                     type: string
 *                     description: 상품 ID
 *                   productName:
 *                     type: string
 *                     description: 상품명
 *                   price:
 *                     type: number
 *                     description: 가격
 *                   imageUrl:
 *                     type: string
 *                     description: 상품 이미지 URL
 *       400:
 *         description: 잘못된 사용자 ID
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.get("/products/:userId", userLikeProductController.getUserLikesProducts);

/**
 * @swagger
 * /user-like-products:
 *   post:
 *     summary: 관심상품 추가
 *     tags: [Likes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 ID
 *               productId:
 *                 type: string
 *                 description: 상품 ID
 *     responses:
 *       201:
 *         description: 관심상품 추가 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *                 likeId:
 *                   type: string
 *                   description: 생성된 좋아요 ID
 *       400:
 *         description: 잘못된 요청
 *       409:
 *         description: 이미 관심상품으로 등록됨
 */
router.post("/", userLikeProductController.addLike);

/**
 * @swagger
 * /user-like-products:
 *   delete:
 *     summary: 관심상품 삭제
 *     tags: [Likes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 ID
 *               productId:
 *                 type: string
 *                 description: 상품 ID
 *     responses:
 *       200:
 *         description: 관심상품 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 관심상품을 찾을 수 없음
 */
router.delete("/", userLikeProductController.removeLike);

/**
 * @swagger
 * /user-like-products/all/{userId}:
 *   delete:
 *     summary: 사용자의 모든 관심상품 삭제
 *     tags: [Likes]
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: 사용자 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 모든 관심상품 삭제 성공
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
 *                   description: 삭제된 관심상품 수
 *       400:
 *         description: 잘못된 사용자 ID
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.delete("/all/:userId", userLikeProductController.removeAllLikes);

/**
 * @swagger
 * /user-like-products/{userId}:
 *   get:
 *     summary: 사용자의 관심상품 ID 리스트 조회
 *     tags: [Likes]
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: 사용자 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 관심상품 ID 리스트 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 description: 상품 ID
 *       400:
 *         description: 잘못된 사용자 ID
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.get("/:userId", userLikeProductController.getUserLikes);

/**
 * @swagger
 * /user-like-products/{userId}/{productId}:
 *   get:
 *     summary: 특정 사용자의 특정 상품 관심 여부 조회
 *     tags: [Likes]
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: 사용자 ID
 *         required: true
 *         schema:
 *           type: string
 *       - name: productId
 *         in: path
 *         description: 상품 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 관심 여부 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isLiked:
 *                   type: boolean
 *                   description: 관심 여부
 *                 likeId:
 *                   type: string
 *                   description: 좋아요 ID (관심인 경우)
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 사용자 또는 상품을 찾을 수 없음
 */
router.get("/:userId/:productId", userLikeProductController.getLike);

module.exports = router;
