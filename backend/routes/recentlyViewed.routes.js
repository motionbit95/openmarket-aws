const express = require("express");
const router = express.Router();
const {
  addRecentlyViewed,
  getRecentlyViewed,
  removeRecentlyViewed,
  clearAllRecentlyViewed,
  getRecommendationsBasedOnRecentlyViewed,
} = require("../controllers/recentlyViewed.controller");

// 인증 미들웨어가 있다면 import (선택사항)
// const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Recently Viewed
 *   description: 최근 본 상품 관련 API
 */

/**
 * @swagger
 * /recently-viewed:
 *   post:
 *     summary: 최근 본 상품 기록 추가
 *     tags: [Recently Viewed]
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
 *         description: 최근 본 상품 기록 추가 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *                 recordId:
 *                   type: string
 *                   description: 생성된 기록 ID
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
// 최근 본 상품 기록 추가
// router.post('/', authMiddleware, addRecentlyViewed);
router.post("/", addRecentlyViewed);

/**
 * @swagger
 * /recently-viewed:
 *   get:
 *     summary: 최근 본 상품 목록 조회
 *     tags: [Recently Viewed]
 *     parameters:
 *       - name: userId
 *         in: query
 *         description: 사용자 ID
 *         required: true
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         description: 최대 조회 개수
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 최근 본 상품 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: 기록 ID
 *                   productId:
 *                     type: string
 *                     description: 상품 ID
 *                   productName:
 *                     type: string
 *                     description: 상품명
 *                   brand:
 *                     type: string
 *                     description: 브랜드
 *                   price:
 *                     type: number
 *                     description: 가격
 *                   imageUrl:
 *                     type: string
 *                     description: 상품 이미지 URL
 *                   viewedAt:
 *                     type: string
 *                     format: date-time
 *                     description: 조회 시간
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
// 최근 본 상품 목록 조회
// router.get('/', authMiddleware, getRecentlyViewed);
router.get("/", getRecentlyViewed);

/**
 * @swagger
 * /recently-viewed/recommendations:
 *   get:
 *     summary: 최근 본 상품 기반 추천
 *     tags: [Recently Viewed]
 *     parameters:
 *       - name: userId
 *         in: query
 *         description: 사용자 ID
 *         required: true
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         description: 최대 추천 개수
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 추천 상품 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: 상품 ID
 *                   displayName:
 *                     type: string
 *                     description: 상품명
 *                   brand:
 *                     type: string
 *                     description: 브랜드
 *                   price:
 *                     type: number
 *                     description: 가격
 *                   originalPrice:
 *                     type: number
 *                     description: 원가
 *                   discountRate:
 *                     type: number
 *                     description: 할인율
 *                   imageUrl:
 *                     type: string
 *                     description: 상품 이미지 URL
 *                   similarityScore:
 *                     type: number
 *                     description: 유사도 점수
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
// 최근 본 상품 기반 추천
// router.get('/recommendations', authMiddleware, getRecommendationsBasedOnRecentlyViewed);
router.get("/recommendations", getRecommendationsBasedOnRecentlyViewed);

/**
 * @swagger
 * /recently-viewed/clear:
 *   delete:
 *     summary: 모든 최근 본 상품 기록 삭제
 *     tags: [Recently Viewed]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 ID
 *     responses:
 *       200:
 *         description: 모든 최근 본 상품 기록 삭제 성공
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
 *                   description: 삭제된 기록 수
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
// 모든 최근 본 상품 기록 삭제
// router.delete('/clear', authMiddleware, clearAllRecentlyViewed);
router.delete("/clear", clearAllRecentlyViewed);

/**
 * @swagger
 * /recently-viewed/{productId}:
 *   delete:
 *     summary: 특정 상품을 최근 본 상품에서 제거
 *     tags: [Recently Viewed]
 *     parameters:
 *       - name: productId
 *         in: path
 *         description: 상품 ID
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 ID
 *     responses:
 *       200:
 *         description: 특정 상품 최근 본 기록 삭제 성공
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
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 최근 본 기록을 찾을 수 없음
 */
// 특정 상품을 최근 본 상품에서 제거
// router.delete('/:productId', authMiddleware, removeRecentlyViewed);
router.delete("/:productId", removeRecentlyViewed);

module.exports = router;
