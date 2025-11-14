const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const recentlyViewedService = require('./recentlyViewed');

class RecommendationService {
  // 연관 상품 추천 - 같은 카테고리, 비슷한 가격대, 같은 브랜드 기준
  async getRelatedProducts(productId, limit = 8) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: BigInt(productId) },
        include: {
          prices: true
        }
      });

      if (!product) {
        return [];
      }

      // 같은 카테고리의 다른 상품들 조회
      const relatedProducts = await prisma.product.findMany({
        where: {
          AND: [
            { id: { not: BigInt(productId) } },
            { categoryCode: product.categoryCode },
            { saleStatus: 'ON_SALE' },
            { displayStatus: 'DISPLAYED' }
          ]
        },
        include: {
          prices: true,
          images: {
            where: { isMain: true },
            take: 1
          },
          reviews: {
            select: {
              rating: true
            }
          },
          _count: {
            select: {
              reviews: true,
              likedByUsers: true
            }
          }
        },
        take: limit * 2 // 더 많이 가져와서 필터링
      });

      // 점수 계산 및 정렬
      const scoredProducts = relatedProducts.map(p => {
        let score = 0;
        
        // 같은 브랜드면 점수 추가
        if (p.brand === product.brand) {
          score += 30;
        }
        
        // 비슷한 가격대면 점수 추가
        if (product.prices && p.prices) {
          const priceDiff = Math.abs(product.prices.salePrice - p.prices.salePrice);
          const avgPrice = (product.prices.salePrice + p.prices.salePrice) / 2;
          const priceRatio = priceDiff / avgPrice;
          
          if (priceRatio < 0.2) score += 25; // 20% 이내 차이
          else if (priceRatio < 0.5) score += 15; // 50% 이내 차이
          else if (priceRatio < 1.0) score += 5; // 100% 이내 차이
        }
        
        // 리뷰 점수 기반 점수 추가
        const avgRating = p.reviews.length > 0 
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length 
          : 0;
        score += avgRating * 2;
        
        // 인기도 점수 (리뷰 수 + 좋아요 수)
        score += (p._count.reviews * 0.5) + (p._count.likedByUsers * 0.3);
        
        return {
          ...p,
          score,
          averageRating: avgRating
        };
      });

      // 점수순 정렬 후 상위 결과 반환
      return scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      console.error('연관 상품 추천 오류:', error);
      return [];
    }
  }

  // 개인화 추천 - 사용자의 구매/관심/최근 본 상품 이력 기반
  async getPersonalizedRecommendations(userId, limit = 10) {
    try {
      // 사용자의 구매 이력 분석
      const purchaseHistory = await prisma.orderItem.findMany({
        where: {
          order: {
            userId: BigInt(userId),
            orderStatus: { in: ['DELIVERED', 'CONFIRMED'] }
          }
        },
        include: {
          product: {
            select: {
              categoryCode: true,
              brand: true
            }
          }
        },
        take: 50
      });

      // 사용자의 관심 상품 분석
      const likedProducts = await prisma.userLikeProduct.findMany({
        where: { userId: BigInt(userId) },
        include: {
          product: {
            select: {
              categoryCode: true,
              brand: true
            }
          }
        },
        take: 20
      });

      // 사용자의 최근 본 상품 분석
      const recentlyViewed = await prisma.userRecentlyViewed.findMany({
        where: { userId: BigInt(userId) },
        include: {
          product: {
            select: {
              categoryCode: true,
              brand: true
            }
          }
        },
        orderBy: { viewedAt: 'desc' },
        take: 30
      });

      // 선호 카테고리와 브랜드 분석 (가중치 적용)
      const categoryPreferences = {};
      const brandPreferences = {};

      // 구매 이력 (가중치 3)
      purchaseHistory.forEach(item => {
        const category = item.product.categoryCode;
        const brand = item.product.brand;
        
        categoryPreferences[category] = (categoryPreferences[category] || 0) + 3;
        brandPreferences[brand] = (brandPreferences[brand] || 0) + 3;
      });

      // 관심 상품 (가중치 2)
      likedProducts.forEach(item => {
        const category = item.product.categoryCode;
        const brand = item.product.brand;
        
        categoryPreferences[category] = (categoryPreferences[category] || 0) + 2;
        brandPreferences[brand] = (brandPreferences[brand] || 0) + 2;
      });

      // 최근 본 상품 (가중치 1)
      recentlyViewed.forEach(item => {
        const category = item.product.categoryCode;
        const brand = item.product.brand;
        
        categoryPreferences[category] = (categoryPreferences[category] || 0) + 1;
        brandPreferences[brand] = (brandPreferences[brand] || 0) + 1;
      });

      // 선호도 높은 카테고리/브랜드 추출
      const topCategories = Object.entries(categoryPreferences)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      const topBrands = Object.entries(brandPreferences)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([brand]) => brand);

      if (topCategories.length === 0) {
        // 구매 이력이 없으면 인기 상품 반환
        return await this.getPopularProducts(limit);
      }

      // 이미 구매했거나 관심상품으로 등록하거나 최근 본 상품 ID들
      const excludeProductIds = [
        ...purchaseHistory.map(p => p.productId),
        ...likedProducts.map(p => p.productId),
        ...recentlyViewed.map(p => p.productId)
      ];

      // 추천 상품 조회
      const recommendations = await prisma.product.findMany({
        where: {
          AND: [
            { id: { notIn: excludeProductIds } },
            { 
              OR: [
                { categoryCode: { in: topCategories } },
                { brand: { in: topBrands } }
              ]
            },
            { saleStatus: 'ON_SALE' },
            { displayStatus: 'DISPLAYED' }
          ]
        },
        include: {
          prices: true,
          images: {
            where: { isMain: true },
            take: 1
          },
          reviews: {
            select: {
              rating: true
            }
          },
          _count: {
            select: {
              reviews: true,
              likedByUsers: true
            }
          }
        },
        take: limit * 2
      });

      // 개인화 점수 계산
      const scoredRecommendations = recommendations.map(p => {
        let score = 0;
        
        // 선호 카테고리 점수
        const categoryScore = categoryPreferences[p.categoryCode] || 0;
        score += categoryScore * 10;
        
        // 선호 브랜드 점수
        const brandScore = brandPreferences[p.brand] || 0;
        score += brandScore * 5;
        
        // 전체적인 인기도
        const avgRating = p.reviews.length > 0 
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length 
          : 0;
        score += avgRating * 3;
        score += (p._count.reviews * 0.5) + (p._count.likedByUsers * 0.3);
        
        return {
          ...p,
          score,
          averageRating: avgRating
        };
      });

      return scoredRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      console.error('개인화 추천 오류:', error);
      return await this.getPopularProducts(limit);
    }
  }

  // 인기 상품 조회 (백업용)
  async getPopularProducts(limit = 10) {
    try {
      // 모든 상품을 가져와서 메모리에서 정렬
      const products = await prisma.product.findMany({
        where: {
          saleStatus: 'ON_SALE',
          displayStatus: 'DISPLAYED'
        },
        include: {
          ProductPrice: true,
          ProductImage: {
            where: { isMain: true },
            take: 1
          },
          Review: {
            select: {
              rating: true
            }
          },
          _count: {
            select: {
              Review: true,
              UserLikeProduct: true,
              OrderItem: true
            }
          }
        },
        take: 100 // 일단 100개 가져오기
      });

      // 인기도 점수 계산 및 정렬
      const scoredProducts = products.map(p => {
        const avgRating = p.Review && p.Review.length > 0
          ? p.Review.reduce((sum, r) => sum + r.rating, 0) / p.Review.length
          : 0;

        // 주문 수 * 3 + 좋아요 수 * 2 + 평점 * 10
        const popularityScore =
          (p._count.OrderItem * 3) +
          (p._count.UserLikeProduct * 2) +
          (avgRating * 10);

        return {
          ...p,
          prices: p.ProductPrice,
          images: p.ProductImage,
          reviews: p.Review,
          popularityScore
        };
      });

      // 인기도 점수로 정렬 후 limit만큼 반환
      return scoredProducts
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, limit);
    } catch (error) {
      console.error('인기 상품 조회 오류:', error);
      return [];
    }
  }

  // 카테고리별 추천
  async getCategoryRecommendations(categoryCode, limit = 10) {
    try {
      return await prisma.product.findMany({
        where: {
          categoryCode,
          saleStatus: 'ON_SALE',
          displayStatus: 'DISPLAYED'
        },
        include: {
          prices: true,
          images: {
            where: { isMain: true },
            take: 1
          },
          reviews: {
            select: {
              rating: true
            }
          },
          _count: {
            select: {
              reviews: true,
              likedByUsers: true
            }
          }
        },
        orderBy: [
          { likedByUsers: { _count: 'desc' } },
          { reviews: { _count: 'desc' } },
          { createdAt: 'desc' }
        ],
        take: limit
      });
    } catch (error) {
      console.error('카테고리별 추천 오류:', error);
      return [];
    }
  }
}

module.exports = new RecommendationService();