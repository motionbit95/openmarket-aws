const searchService = require('../utils/search');

/**
 * @swagger
 * components:
 *   schemas:
 *     SearchResult:
 *       type: object
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               displayName:
 *                 type: string
 *               brand:
 *                 type: string
 *               categoryCode:
 *                 type: string
 *               prices:
 *                 type: object
 *               images:
 *                 type: array
 *               averageRating:
 *                 type: number
 *               reviewCount:
 *                 type: integer
 *               likeCount:
 *                 type: integer
 *               orderCount:
 *                 type: integer
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             totalCount:
 *               type: integer
 *             hasNext:
 *               type: boolean
 *             hasPrev:
 *               type: boolean
 *             limit:
 *               type: integer
 *         filters:
 *           type: object
 */

/**
 * @swagger
 * /search:
 *   get:
 *     summary: 상품 검색
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: 검색어
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 카테고리 코드 (여러 개는 쉼표로 구분)
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: 브랜드명 (여러 개는 쉼표로 구분)
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
 *         name: minRating
 *         schema:
 *           type: number
 *         description: 최소 평점
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [latest, price_asc, price_desc, rating, popularity]
 *           default: latest
 *         description: 정렬 기준
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
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 검색 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SearchResult'
 */
const searchProducts = async (req, res) => {
  try {
    const {
      q: query = '',
      category = null,
      brand = null,
      minPrice = null,
      maxPrice = null,
      minRating = null,
      sortBy = 'latest',
      page = 1,
      limit = 20
    } = req.query;

    // 파라미터 처리
    const searchParams = {
      query: query.toString(),
      categoryCode: category ? category.split(',') : null,
      brand: brand ? brand.split(',') : null,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      minRating: minRating ? parseFloat(minRating) : null,
      sortBy: sortBy.toString(),
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    };

    const searchResult = await searchService.searchProducts(searchParams);

    res.json({
      success: true,
      data: searchResult
    });
  } catch (error) {
    console.error('상품 검색 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 검색 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: 검색어 자동완성
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색어 (최소 2글자)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 추천어 개수
 *     responses:
 *       200:
 *         description: 추천 검색어 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
const getSearchSuggestions = async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: '검색어는 최소 2글자 이상 입력해주세요.'
      });
    }

    const suggestions = await searchService.getSearchSuggestions(query, parseInt(limit));

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('검색어 추천 오류:', error);
    res.status(500).json({
      success: false,
      message: '검색어 추천 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /search/filters:
 *   get:
 *     summary: 필터 옵션 조회
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: 필터링 가능한 옵션들
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           code:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     brands:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     priceRange:
 *                       type: object
 *                       properties:
 *                         min:
 *                           type: number
 *                         max:
 *                           type: number
 *                         avg:
 *                           type: number
 */
const getFilterOptions = async (req, res) => {
  try {
    const filterOptions = await searchService.getFilterOptions();

    res.json({
      success: true,
      data: filterOptions
    });
  } catch (error) {
    console.error('필터 옵션 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '필터 옵션 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /search/popular-terms:
 *   get:
 *     summary: 인기 검색어 조회
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 인기 검색어 개수
 *     responses:
 *       200:
 *         description: 인기 검색어 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       keyword:
 *                         type: string
 *                       count:
 *                         type: integer
 */
const getPopularSearchTerms = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const popularTerms = await searchService.getPopularSearchTerms(parseInt(limit));

    res.json({
      success: true,
      data: popularTerms
    });
  } catch (error) {
    console.error('인기 검색어 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '인기 검색어 조회 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  searchProducts,
  getSearchSuggestions,
  getFilterOptions,
  getPopularSearchTerms
};