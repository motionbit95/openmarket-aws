const recommendationService = require('../utils/recommendation');

/**
 * @swagger
 * components:
 *   schemas:
 *     RecommendedProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         displayName:
 *           type: string
 *         brand:
 *           type: string
 *         categoryCode:
 *           type: string
 *         prices:
 *           type: object
 *           properties:
 *             originalPrice:
 *               type: number
 *             salePrice:
 *               type: number
 *             discountRate:
 *               type: number
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               isMain:
 *                 type: boolean
 *         averageRating:
 *           type: number
 *         reviewCount:
 *           type: integer
 *         likeCount:
 *           type: integer
 *         score:
 *           type: number
 *           description: 추천 점수
 */

/**
 * @swagger
 * /recommendations/related/{productId}:
 *   get:
 *     summary: 연관 상품 추천
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 기준 상품 ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *         description: 추천 상품 개수
 *     responses:
 *       200:
 *         description: 연관 상품 목록
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
 *                     $ref: '#/components/schemas/RecommendedProduct'
 *       404:
 *         description: 상품을 찾을 수 없음
 */
const getRelatedProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 8;

    const relatedProducts = await recommendationService.getRelatedProducts(productId, limit);
    
    const formattedProducts = relatedProducts.map(product => ({
      id: product.id.toString(),
      displayName: product.displayName,
      brand: product.brand,
      categoryCode: product.categoryCode,
      prices: product.prices,
      images: product.images,
      averageRating: product.averageRating || 0,
      reviewCount: product._count?.reviews || 0,
      likeCount: product._count?.likedByUsers || 0,
      score: product.score || 0
    }));

    res.json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    console.error('연관 상품 추천 오류:', error);
    res.status(500).json({
      success: false,
      message: '연관 상품 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /recommendations/personalized:
 *   get:
 *     summary: 개인화 상품 추천
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 추천 상품 개수
 *     responses:
 *       200:
 *         description: 개인화 추천 상품 목록
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
 *                     $ref: '#/components/schemas/RecommendedProduct'
 *       401:
 *         description: 인증 필요
 */
const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit) || 10;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const recommendations = await recommendationService.getPersonalizedRecommendations(userId, limit);
    
    const formattedProducts = recommendations.map(product => ({
      id: product.id.toString(),
      displayName: product.displayName,
      brand: product.brand,
      categoryCode: product.categoryCode,
      prices: product.prices,
      images: product.images,
      averageRating: product.averageRating || 0,
      reviewCount: product._count?.reviews || 0,
      likeCount: product._count?.likedByUsers || 0,
      score: product.score || 0
    }));

    res.json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    console.error('개인화 추천 오류:', error);
    res.status(500).json({
      success: false,
      message: '개인화 추천 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /recommendations/popular:
 *   get:
 *     summary: 인기 상품 추천
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 추천 상품 개수
 *     responses:
 *       200:
 *         description: 인기 상품 목록
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
 *                     $ref: '#/components/schemas/RecommendedProduct'
 */
const getPopularProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const popularProducts = await recommendationService.getPopularProducts(limit);
    
    const formattedProducts = popularProducts.map(product => {
      const avgRating = product.reviews.length > 0 
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length 
        : 0;

      return {
        id: product.id.toString(),
        displayName: product.displayName,
        brand: product.brand,
        categoryCode: product.categoryCode,
        prices: product.prices,
        images: product.images,
        averageRating: avgRating,
        reviewCount: product._count?.reviews || 0,
        likeCount: product._count?.likedByUsers || 0,
        orderCount: product._count?.orderItems || 0
      };
    });

    res.json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    console.error('인기 상품 추천 오류:', error);
    res.status(500).json({
      success: false,
      message: '인기 상품 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /recommendations/category/{categoryCode}:
 *   get:
 *     summary: 카테고리별 추천 상품
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: categoryCode
 *         required: true
 *         schema:
 *           type: string
 *         description: 카테고리 코드
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 추천 상품 개수
 *     responses:
 *       200:
 *         description: 카테고리별 추천 상품 목록
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
 *                     $ref: '#/components/schemas/RecommendedProduct'
 */
const getCategoryRecommendations = async (req, res) => {
  try {
    const { categoryCode } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const recommendations = await recommendationService.getCategoryRecommendations(categoryCode, limit);
    
    const formattedProducts = recommendations.map(product => {
      const avgRating = product.reviews.length > 0 
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length 
        : 0;

      return {
        id: product.id.toString(),
        displayName: product.displayName,
        brand: product.brand,
        categoryCode: product.categoryCode,
        prices: product.prices,
        images: product.images,
        averageRating: avgRating,
        reviewCount: product._count?.reviews || 0,
        likeCount: product._count?.likedByUsers || 0
      };
    });

    res.json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    console.error('카테고리별 추천 오류:', error);
    res.status(500).json({
      success: false,
      message: '카테고리별 추천 상품 조회 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getRelatedProducts,
  getPersonalizedRecommendations,
  getPopularProducts,
  getCategoryRecommendations
};