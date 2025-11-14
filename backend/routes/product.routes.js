const express = require("express");
const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getKeywordSuggestions,
  getProductsByKeyword,
} = require("../controllers/product.controller");

/**
 * @swagger
 * /products/keyword-suggestions:
 *   get:
 *     summary: 상품 키워드 자동완성
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: 자동완성할 키워드 검색어
 *     responses:
 *       200:
 *         description: 키워드 자동완성 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       400:
 *         description: 검색어(query)가 필요합니다.
 *       500:
 *         description: 키워드 자동완성 오류
 */
router.get("/keyword-suggestions", getKeywordSuggestions);

/**
 * @swagger
 * /products/search-by-keyword:
 *   get:
 *     summary: 키워드 기반 상품 검색
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색할 키워드
 *     responses:
 *       200:
 *         description: 키워드로 검색된 상품 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       400:
 *         description: 검색 키워드(keyword)가 필요합니다.
 *       500:
 *         description: 상품 키워드 검색 오류
 */
router.get("/search-by-keyword", getProductsByKeyword);

// 판매자별 상품 조회 (토큰 기반)
router.get("/seller", getAllProducts);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: 상품 생성
 *     tags: [Product]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               selellerId:
 *                 type: integer
 *                 example: 1
 *               displayName:
 *                 type: string
 *                 example: "테스트 상품"
 *               internalName:
 *                 type: string
 *                 example: "test-product"
 *               keywords:
 *                 type: string
 *                 example: "티셔츠,반팔,여름"
 *               categoryCode:
 *                 type: string
 *                 example: "TOP001"
 *               brand:
 *                 type: string
 *                 example: "테스트브랜드"
 *               manufacturer:
 *                 type: string
 *                 example: "테스트제조사"
 *               taxIncluded:
 *                 type: boolean
 *                 example: true
 *               saleStatus:
 *                 type: string
 *                 example: "ON_SALE"
 *               displayStatus:
 *                 type: string
 *                 example: "DISPLAYED"
 *               stockQuantity:
 *                 type: integer
 *                 example: 100
 *               saleStartDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-07-11T00:00:00Z"
 *               saleEndDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: null
 *               description:
 *                 type: string
 *                 example: "이것은 테스트 상품입니다."
 *               prices:
 *                 type: object
 *                 properties:
 *                   originalPrice:
 *                     type: number
 *                     example: 30000
 *                   salePrice:
 *                     type: number
 *                     example: 25000
 *                   discountRate:
 *                     type: number
 *                     example: 16.7
 *               delivery:
 *                 type: object
 *                 properties:
 *                   originAddress:
 *                     type: string
 *                     example: "서울시 강남구"
 *                   deliveryMethod:
 *                     type: string
 *                     example: "택배"
 *                   isBundle:
 *                     type: boolean
 *                     example: true
 *                   isIslandAvailable:
 *                     type: boolean
 *                     example: true
 *                   courier:
 *                     type: string
 *                     example: "CJ대한통운"
 *                   deliveryFeeType:
 *                     type: string
 *                     example: "FREE"
 *                   deliveryFee:
 *                     type: number
 *                     example: 0
 *                   deliveryTime:
 *                     type: string
 *                     example: "2~3일"
 *               returns:
 *                 type: object
 *                 properties:
 *                   returnAddress:
 *                     type: string
 *                     example: "서울시 강남구 반품센터"
 *                   initialShippingFee:
 *                     type: number
 *                     example: 0
 *                   returnShippingFee:
 *                     type: number
 *                     example: 2500
 *                   exchangeShippingFee:
 *                     type: number
 *                     example: 3000
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: "https://cdn.com/image1.jpg"
 *                     isMain:
 *                       type: boolean
 *                       example: true
 *                     sortOrder:
 *                       type: integer
 *                       example: 1
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "사이즈"
 *                     values:
 *                       type: string
 *                       example: "S,M,L"
 *                     stockMap:
 *                       type: object
 *                       example: { "S": 10, "M": 5, "L": 0 }
 *               infoNotices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "품명 및 모델명"
 *                     value:
 *                       type: string
 *                       example: "테스트 티셔츠"
 *               isSingleProduct:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: 상품이 생성되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       500:
 *         description: 서버 오류
 */
router.post("/", createProduct);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: 상품 전체 목록 조회
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: 상품 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: 서버 오류
 */
router.get("/", getAllProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: ID로 상품 단건 조회
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 상품 ID
 *     responses:
 *       200:
 *         description: 상품 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: 상품을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/:id", getProductById);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: 상품 정보 수정
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 상품 ID
 *     requestBody:
 *       description: 수정할 상품 데이터
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 example: "수정된 상품명"
 *               internalName:
 *                 type: string
 *               keywords:
 *                 type: string
 *               categoryCode:
 *                 type: string
 *               brand:
 *                 type: string
 *               manufacturer:
 *                 type: string
 *               taxIncluded:
 *                 type: boolean
 *               saleStatus:
 *                 type: string
 *               displayStatus:
 *                 type: string
 *               stockQuantity:
 *                 type: integer
 *               saleStartDate:
 *                 type: string
 *                 format: date-time
 *               saleEndDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               description:
 *                 type: string
 *               isSingleProduct:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: 수정된 상품 반환
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       500:
 *         description: 서버 오류
 */
router.put("/:id", updateProduct);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: 상품 삭제
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 상품 ID
 *     responses:
 *       200:
 *         description: 삭제 성공 메시지
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "상품이 성공적으로 삭제되었습니다"
 *       500:
 *         description: 서버 오류
 */
router.delete("/:id", deleteProduct);

module.exports = router;
