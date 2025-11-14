const recentlyViewedService = require('../utils/recentlyViewed');

/**
 * @swagger
 * components:
 *   schemas:
 *     RecentlyViewedProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         viewedAt:
 *           type: string
 *           format: date-time
 *         product:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             displayName:
 *               type: string
 *             brand:
 *               type: string
 *             categoryCode:
 *               type: string
 *             prices:
 *               type: object
 *             images:
 *               type: array
 *               items:
 *                 type: object
 *             averageRating:
 *               type: number
 *             reviewCount:
 *               type: integer
 *             likeCount:
 *               type: integer
 *             saleStatus:
 *               type: string
 *             displayStatus:
 *               type: string
 */

/**
 * @swagger
 * /recently-viewed:
 *   post:
 *     summary: 최근 본 상품 기록 추가
 *     tags: [Recently Viewed]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: 상품 ID
 *     responses:
 *       200:
 *         description: 기록 추가 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: 인증 필요
 */
const addRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '상품 ID가 필요합니다.'
      });
    }

    const success = await recentlyViewedService.addRecentlyViewed(userId, productId);

    if (success) {
      res.json({
        success: true,
        message: '최근 본 상품에 기록되었습니다.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '최근 본 상품 기록 중 오류가 발생했습니다.'
      });
    }
  } catch (error) {
    console.error('최근 본 상품 기록 오류:', error);
    res.status(500).json({
      success: false,
      message: '최근 본 상품 기록 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /recently-viewed:
 *   get:
 *     summary: 최근 본 상품 목록 조회
 *     tags: [Recently Viewed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 조회할 상품 개수
 *     responses:
 *       200:
 *         description: 최근 본 상품 목록
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
 *                     $ref: '#/components/schemas/RecentlyViewedProduct'
 *       401:
 *         description: 인증 필요
 */
const getRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit) || 20;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const recentlyViewed = await recentlyViewedService.getRecentlyViewed(userId, limit);

    res.json({
      success: true,
      data: recentlyViewed
    });
  } catch (error) {
    console.error('최근 본 상품 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '최근 본 상품 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /recently-viewed/{productId}:
 *   delete:
 *     summary: 최근 본 상품에서 특정 상품 제거
 *     tags: [Recently Viewed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 제거할 상품 ID
 *     responses:
 *       200:
 *         description: 제거 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: 인증 필요
 */
const removeRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const success = await recentlyViewedService.removeRecentlyViewed(userId, productId);

    if (success) {
      res.json({
        success: true,
        message: '최근 본 상품에서 제거되었습니다.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '상품 제거 중 오류가 발생했습니다.'
      });
    }
  } catch (error) {
    console.error('최근 본 상품 제거 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 제거 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /recently-viewed/clear:
 *   delete:
 *     summary: 모든 최근 본 상품 기록 삭제
 *     tags: [Recently Viewed]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 전체 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: 인증 필요
 */
const clearAllRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const success = await recentlyViewedService.clearAllRecentlyViewed(userId);

    if (success) {
      res.json({
        success: true,
        message: '모든 최근 본 상품 기록이 삭제되었습니다.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '기록 삭제 중 오류가 발생했습니다.'
      });
    }
  } catch (error) {
    console.error('최근 본 상품 전체 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '기록 삭제 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /recently-viewed/recommendations:
 *   get:
 *     summary: 최근 본 상품 기반 추천
 *     tags: [Recently Viewed]
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
 *         description: 최근 본 상품 기반 추천 목록
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
const getRecommendationsBasedOnRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit) || 10;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const recommendations = await recentlyViewedService.getRecommendationsBasedOnRecentlyViewed(userId, limit);
    
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
    console.error('최근 본 상품 기반 추천 오류:', error);
    res.status(500).json({
      success: false,
      message: '추천 상품 조회 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  addRecentlyViewed,
  getRecentlyViewed,
  removeRecentlyViewed,
  clearAllRecentlyViewed,
  getRecommendationsBasedOnRecentlyViewed
};