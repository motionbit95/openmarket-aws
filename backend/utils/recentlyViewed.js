const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class RecentlyViewedService {
  // 최근 본 상품 기록 추가/업데이트
  async addRecentlyViewed(userId, productId) {
    try {
      // 이미 본 상품이면 viewedAt 업데이트, 없으면 새로 생성
      await prisma.userRecentlyViewed.upsert({
        where: {
          userId_productId: {
            userId: BigInt(userId),
            productId: BigInt(productId)
          }
        },
        update: {
          viewedAt: new Date()
        },
        create: {
          userId: BigInt(userId),
          productId: BigInt(productId),
          viewedAt: new Date()
        }
      });

      // 사용자당 최대 50개까지만 보관 (오래된 것부터 삭제)
      await this.cleanupOldRecords(userId, 50);
      
      return true;
    } catch (error) {
      console.error('최근 본 상품 기록 오류:', error);
      return false;
    }
  }

  // 최근 본 상품 목록 조회
  async getRecentlyViewed(userId, limit = 20) {
    try {
      const recentlyViewed = await prisma.userRecentlyViewed.findMany({
        where: {
          userId: BigInt(userId)
        },
        include: {
          product: {
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
            }
          }
        },
        orderBy: {
          viewedAt: 'desc'
        },
        take: limit
      });

      return recentlyViewed.map(item => {
        const avgRating = item.product.reviews.length > 0 
          ? item.product.reviews.reduce((sum, r) => sum + r.rating, 0) / item.product.reviews.length 
          : 0;

        return {
          id: item.id.toString(),
          viewedAt: item.viewedAt,
          product: {
            id: item.product.id.toString(),
            displayName: item.product.displayName,
            brand: item.product.brand,
            categoryCode: item.product.categoryCode,
            prices: item.product.prices,
            images: item.product.images,
            averageRating: avgRating,
            reviewCount: item.product._count.reviews || 0,
            likeCount: item.product._count.likedByUsers || 0,
            saleStatus: item.product.saleStatus,
            displayStatus: item.product.displayStatus
          }
        };
      });
    } catch (error) {
      console.error('최근 본 상품 조회 오류:', error);
      return [];
    }
  }

  // 최근 본 상품 기록 삭제
  async removeRecentlyViewed(userId, productId) {
    try {
      await prisma.userRecentlyViewed.delete({
        where: {
          userId_productId: {
            userId: BigInt(userId),
            productId: BigInt(productId)
          }
        }
      });
      return true;
    } catch (error) {
      console.error('최근 본 상품 삭제 오류:', error);
      return false;
    }
  }

  // 사용자의 모든 최근 본 상품 기록 삭제
  async clearAllRecentlyViewed(userId) {
    try {
      await prisma.userRecentlyViewed.deleteMany({
        where: {
          userId: BigInt(userId)
        }
      });
      return true;
    } catch (error) {
      console.error('최근 본 상품 전체 삭제 오류:', error);
      return false;
    }
  }

  // 오래된 기록 정리 (최대 개수 유지)
  async cleanupOldRecords(userId, maxRecords = 50) {
    try {
      const totalCount = await prisma.userRecentlyViewed.count({
        where: { userId: BigInt(userId) }
      });

      if (totalCount > maxRecords) {
        // 오래된 기록부터 삭제할 개수 계산
        const deleteCount = totalCount - maxRecords;
        
        // 가장 오래된 기록들의 ID 조회
        const oldRecords = await prisma.userRecentlyViewed.findMany({
          where: { userId: BigInt(userId) },
          select: { id: true },
          orderBy: { viewedAt: 'asc' },
          take: deleteCount
        });

        // 오래된 기록들 삭제
        if (oldRecords.length > 0) {
          const idsToDelete = oldRecords.map(r => r.id);
          await prisma.userRecentlyViewed.deleteMany({
            where: {
              id: { in: idsToDelete }
            }
          });
        }
      }
    } catch (error) {
      console.error('오래된 최근 본 상품 기록 정리 오류:', error);
    }
  }

  // 최근 본 상품 기반 추천 (recommendation.js에서 사용될 수 있음)
  async getRecommendationsBasedOnRecentlyViewed(userId, limit = 10) {
    try {
      // 최근 본 상품들 조회 (최근 20개)
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
        take: 20
      });

      if (recentlyViewed.length === 0) {
        return [];
      }

      // 최근 본 상품들의 카테고리와 브랜드 분석
      const categoryCount = {};
      const brandCount = {};

      recentlyViewed.forEach(item => {
        const category = item.product.categoryCode;
        const brand = item.product.brand;
        
        categoryCount[category] = (categoryCount[category] || 0) + 1;
        brandCount[brand] = (brandCount[brand] || 0) + 1;
      });

      // 가장 많이 본 카테고리와 브랜드 추출
      const topCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      const topBrands = Object.entries(brandCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([brand]) => brand);

      // 이미 본 상품 ID들
      const viewedProductIds = recentlyViewed.map(item => item.productId);

      // 추천 상품 조회
      const recommendations = await prisma.product.findMany({
        where: {
          AND: [
            { id: { notIn: viewedProductIds } },
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

      // 추천 점수 계산
      const scoredRecommendations = recommendations.map(product => {
        let score = 0;
        
        // 카테고리 선호도 점수
        if (categoryCount[product.categoryCode]) {
          score += categoryCount[product.categoryCode] * 10;
        }
        
        // 브랜드 선호도 점수
        if (brandCount[product.brand]) {
          score += brandCount[product.brand] * 5;
        }
        
        // 상품 인기도 점수
        const avgRating = product.reviews.length > 0 
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length 
          : 0;
        score += avgRating * 2;
        score += (product._count.reviews * 0.3) + (product._count.likedByUsers * 0.2);
        
        return {
          ...product,
          score,
          averageRating: avgRating
        };
      });

      return scoredRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('최근 본 상품 기반 추천 오류:', error);
      return [];
    }
  }
}

module.exports = new RecentlyViewedService();