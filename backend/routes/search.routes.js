const express = require("express");
const router = express.Router();
const {
  searchProducts,
  getSearchSuggestions,
  getFilterOptions,
  getPopularSearchTerms,
} = require("../controllers/search.controller");

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: 상품 검색 관련 API
 */

/**
 * @swagger
 * /search:
 *   get:
 *     summary: 상품 검색
 *     tags: [Search]
 *     parameters:
 *       - name: q
 *         in: query
 *         description: 검색어
 *         required: true
 *         schema:
 *           type: string
 *       - name: category
 *         in: query
 *         description: 카테고리 필터
 *         required: false
 *         schema:
 *           type: string
 *       - name: brand
 *         in: query
 *         description: 브랜드 필터
 *         required: false
 *         schema:
 *           type: string
 *       - name: minPrice
 *         in: query
 *         description: 최소 가격
 *         required: false
 *         schema:
 *           type: number
 *       - name: maxPrice
 *         in: query
 *         description: 최대 가격
 *         required: false
 *         schema:
 *           type: number
 *       - name: sort
 *         in: query
 *         description: 정렬 기준 (relevance, price_asc, price_desc, newest, popular)
 *         required: false
 *         schema:
 *           type: string
 *           default: relevance
 *       - name: page
 *         in: query
 *         description: 페이지 번호
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: 페이지당 항목 수
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 검색 결과 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: 상품 ID
 *                       displayName:
 *                         type: string
 *                         description: 상품명
 *                       brand:
 *                         type: string
 *                         description: 브랜드
 *                       price:
 *                         type: number
 *                         description: 가격
 *                       originalPrice:
 *                         type: number
 *                         description: 원가
 *                       discountRate:
 *                         type: number
 *                         description: 할인율
 *                       imageUrl:
 *                         type: string
 *                         description: 상품 이미지 URL
 *                       rating:
 *                         type: number
 *                         description: 평점
 *                       reviewCount:
 *                         type: integer
 *                         description: 리뷰 수
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       description: 현재 페이지
 *                     totalPages:
 *                       type: integer
 *                       description: 전체 페이지 수
 *                     totalItems:
 *                       type: integer
 *                       description: 전체 검색 결과 수
 *                 filters:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           code:
 *                             type: string
 *                             description: 카테고리 코드
 *                           name:
 *                             type: string
 *                             description: 카테고리명
 *                           count:
 *                             type: integer
 *                             description: 해당 카테고리 상품 수
 *                     brands:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: 브랜드명
 *                           count:
 *                             type: integer
 *                             description: 해당 브랜드 상품 수
 *       400:
 *         description: 검색어가 필요합니다
 *       500:
 *         description: 서버 오류
 */
// 상품 검색
router.get("/", searchProducts);

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: 검색어 자동완성
 *     tags: [Search]
 *     parameters:
 *       - name: q
 *         in: query
 *         description: 검색어 (부분 일치)
 *         required: true
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         description: 최대 제안 수
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 검색어 자동완성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   term:
 *                     type: string
 *                     description: 검색어
 *                   type:
 *                     type: string
 *                     description: 제안 타입 (keyword, product, category)
 *                   count:
 *                     type: integer
 *                     description: 검색 결과 수
 *       400:
 *         description: 검색어가 필요합니다
 *       500:
 *         description: 서버 오류
 */
// 검색어 자동완성
router.get("/suggestions", getSearchSuggestions);

/**
 * @swagger
 * /search/filters:
 *   get:
 *     summary: 필터 옵션 조회
 *     tags: [Search]
 *     parameters:
 *       - name: category
 *         in: query
 *         description: 카테고리 (선택사항)
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 필터 옵션 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         description: 카테고리 코드
 *                       name:
 *                         type: string
 *                         description: 카테고리명
 *                       parentCode:
 *                         type: string
 *                         description: 상위 카테고리 코드
 *                 brands:
 *                   type: array
 *                   items:
 *                     type: string
 *                     description: 브랜드명
 *                 priceRanges:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       min:
 *                         type: number
 *                         description: 최소 가격
 *                       max:
 *                         type: number
 *                         description: 최대 가격
 *                       label:
 *                         type: string
 *                         description: 가격 범위 라벨
 *                 sortOptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                         description: 정렬 값
 *                       label:
 *                         type: string
 *                         description: 정렬 라벨
 *       500:
 *         description: 서버 오류
 */
// 필터 옵션 조회
router.get("/filters", getFilterOptions);

/**
 * @swagger
 * /search/popular-terms:
 *   get:
 *     summary: 인기 검색어 조회
 *     tags: [Search]
 *     parameters:
 *       - name: period
 *         in: query
 *         description: 기간 (today, week, month)
 *         required: false
 *         schema:
 *           type: string
 *           default: week
 *       - name: limit
 *         in: query
 *         description: 최대 검색어 수
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 인기 검색어 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   term:
 *                     type: string
 *                     description: 검색어
 *                   count:
 *                     type: integer
 *                     description: 검색 횟수
 *                   rank:
 *                     type: integer
 *                     description: 순위
 *       500:
 *         description: 서버 오류
 */
// 인기 검색어 조회
router.get("/popular-terms", getPopularSearchTerms);

module.exports = router;
