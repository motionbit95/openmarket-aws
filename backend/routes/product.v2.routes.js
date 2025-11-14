const express = require("express");
const router = express.Router();
const productV2Controller = require("../controllers/product.v2.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductOptionGroup:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: 옵션 그룹명
 *           example: "색상"
 *         displayName:
 *           type: string
 *           description: 표시명
 *           example: "Color"
 *         required:
 *           type: boolean
 *           description: 필수 선택 여부
 *           default: true
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductOptionValue'
 *
 *     ProductOptionValue:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           description: 옵션 값
 *           example: "빨강"
 *         displayName:
 *           type: string
 *           description: 표시명
 *           example: "Red"
 *         colorCode:
 *           type: string
 *           description: 색상 코드 (색상 옵션인 경우)
 *           example: "#FF0000"
 *         extraPrice:
 *           type: number
 *           description: 추가 가격
 *           default: 0
 *
 *     ProductSKU:
 *       type: object
 *       properties:
 *         originalPrice:
 *           type: number
 *           description: 원가
 *         salePrice:
 *           type: number
 *           description: 판매가
 *         stockQuantity:
 *           type: number
 *           description: 재고 수량
 *         optionValues:
 *           type: array
 *           description: 옵션 조합
 *           items:
 *             type: object
 *           example: [{"색상": "빨강"}, {"사이즈": "M"}]
 *         isMain:
 *           type: boolean
 *           description: 대표 SKU 여부
 *           default: false
 */

/**
 * @swagger
 * /products/v2/create:
 *   post:
 *     summary: 상품 생성 (개선된 버전)
 *     tags: [Products V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sellerId
 *               - displayName
 *               - internalName
 *               - categoryCode
 *               - description
 *             properties:
 *               sellerId:
 *                 type: string
 *                 description: 판매자 ID
 *               displayName:
 *                 type: string
 *                 description: 상품명
 *               internalName:
 *                 type: string
 *                 description: 내부 상품명
 *               keywords:
 *                 type: string
 *                 description: 검색 키워드
 *               categoryCode:
 *                 type: string
 *                 description: 카테고리 코드
 *               isSingleProduct:
 *                 type: boolean
 *                 description: 단일상품 여부
 *                 default: true
 *               optionGroups:
 *                 type: array
 *                 description: 옵션 그룹들 (옵션상품인 경우)
 *                 items:
 *                   $ref: '#/components/schemas/ProductOptionGroup'
 *               skus:
 *                 type: array
 *                 description: SKU 목록 (옵션상품인 경우)
 *                 items:
 *                   $ref: '#/components/schemas/ProductSKU'
 *     responses:
 *       201:
 *         description: 상품 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/create", productV2Controller.createProductV2);

/**
 * @swagger
 * /products/v2/{productId}/stock:
 *   get:
 *     summary: 상품 재고 조회
 *     tags: [Products V2]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 상품 ID
 *     responses:
 *       200:
 *         description: 상품 재고 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 displayName:
 *                   type: string
 *                 isSingleProduct:
 *                   type: boolean
 *                 stockQuantity:
 *                   type: integer
 *                 skus:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       skuCode:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       stockQuantity:
 *                         type: integer
 *                       reservedStock:
 *                         type: integer
 *                       salePrice:
 *                         type: number
 *       404:
 *         description: 상품을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/:productId/stock", productV2Controller.getProductStock);

/**
 * @swagger
 * /products/v2/{productId}:
 *   get:
 *     summary: 상품 상세 조회 (개선된 버전)
 *     tags: [Products V2]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 상품 ID
 *     responses:
 *       200:
 *         description: 상품 상세 정보
 *       404:
 *         description: 상품을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/:productId", productV2Controller.getProductByIdV2);

/**
 * @swagger
 * /products/v2:
 *   get:
 *     summary: 상품 목록 조회 (개선된 버전)
 *     tags: [Products V2]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 페이지 크기
 *       - in: query
 *         name: categoryCode
 *         schema:
 *           type: string
 *         description: 카테고리 코드
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 검색 키워드
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: 최소 가격
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: 최대 가격
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [latest, price_low, price_high, popular]
 *           default: latest
 *         description: 정렬 기준
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *           default: true
 *         description: 재고 있는 상품만 조회
 *     responses:
 *       200:
 *         description: 상품 목록
 *       500:
 *         description: 서버 오류
 */
router.get("/", productV2Controller.getProductsV2);

module.exports = router;
