const express = require("express");
const router = express.Router();
const {
  getRelatedProducts,
  getPersonalizedRecommendations,
  getPopularProducts,
  getCategoryRecommendations,
} = require("../controllers/recommendation.controller");

// 인증 미들웨어가 있다면 import (선택사항)
// const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: 상품 추천 관련 API
 */

/**
 * @swagger
 * /recommendations/related/{productId}:
 *   get:
 *     summary: 연관 상품 추천
 *     tags: [Recommendations]
 *     parameters:
 *       - name: productId
 *         in: path
 *         description: 기준 상품 ID
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
 *         description: 연관 상품 추천 성공
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
 *         description: 잘못된 상품 ID
 *       404:
 *         description: 상품을 찾을 수 없음
 */
// 연관 상품 추천
router.get("/related/:productId", getRelatedProducts);

/**
 * @swagger
 * /recommendations/personalized:
 *   get:
 *     summary: 개인화 추천 (로그인 필요)
 *     tags: [Recommendations]
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
 *           default: 20
 *       - name: algorithm
 *         in: query
 *         description: 추천 알고리즘 (collaborative, content, hybrid)
 *         required: false
 *         schema:
 *           type: string
 *           default: hybrid
 *     responses:
 *       200:
 *         description: 개인화 추천 성공
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
 *                   recommendationScore:
 *                     type: number
 *                     description: 추천 점수
 *                   reason:
 *                     type: string
 *                     description: 추천 이유
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
// 개인화 추천 (로그인 필요)
// router.get('/personalized', authMiddleware, getPersonalizedRecommendations);
router.get("/personalized", getPersonalizedRecommendations);

/**
 * @swagger
 * /recommendations/popular:
 *   get:
 *     summary: 인기 상품 추천
 *     tags: [Recommendations]
 *     parameters:
 *       - name: period
 *         in: query
 *         description: 기간 (day, week, month)
 *         required: false
 *         schema:
 *           type: string
 *           default: week
 *       - name: category
 *         in: query
 *         description: 카테고리 필터
 *         required: false
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         description: 최대 추천 개수
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 인기 상품 추천 성공
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
 *                   popularityScore:
 *                     type: number
 *                     description: 인기도 점수
 *                   salesCount:
 *                     type: integer
 *                     description: 판매 수량
 *       500:
 *         description: 서버 오류
 */
// 인기 상품 추천
router.get("/popular", getPopularProducts);

/**
 * @swagger
 * /recommendations/category/{categoryCode}:
 *   get:
 *     summary: 카테고리별 추천
 *     tags: [Recommendations]
 *     parameters:
 *       - name: categoryCode
 *         in: path
 *         description: 카테고리 코드
 *         required: true
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         description: 최대 추천 개수
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: sortBy
 *         in: query
 *         description: 정렬 기준 (popular, newest, price_asc, price_desc)
 *         required: false
 *         schema:
 *           type: string
 *           default: popular
 *     responses:
 *       200:
 *         description: 카테고리별 추천 성공
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
 *                   categoryCode:
 *                     type: string
 *                     description: 카테고리 코드
 *       400:
 *         description: 잘못된 카테고리 코드
 *       404:
 *         description: 카테고리를 찾을 수 없음
 */
// 카테고리별 추천
router.get("/category/:categoryCode", getCategoryRecommendations);

module.exports = router;
