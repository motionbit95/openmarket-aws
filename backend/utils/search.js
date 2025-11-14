const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SearchService {
  // 고급 검색 - 다양한 필터 옵션 지원
  async searchProducts({
    query = '',           // 검색어 (상품명, 키워드, 브랜드 등)
    categoryCode = null,  // 카테고리 필터
    brand = null,         // 브랜드 필터
    minPrice = null,      // 최소 가격
    maxPrice = null,      // 최대 가격
    minRating = null,     // 최소 평점
    sortBy = 'latest',    // 정렬 기준: latest, price_asc, price_desc, rating, popularity
    page = 1,             // 페이지 번호
    limit = 20            // 페이지당 항목 수
  }) {
    try {
      const skip = (page - 1) * limit;
      
      // 기본 검색 조건
      const whereConditions = {
        AND: [
          { saleStatus: 'ON_SALE' },
          { displayStatus: 'DISPLAYED' }
        ]
      };

      // 검색어 조건
      if (query && query.trim()) {
        whereConditions.AND.push({
          OR: [
            { displayName: { contains: query.trim() } },
            { internalName: { contains: query.trim() } },
            { keywords: { contains: query.trim() } },
            { brand: { contains: query.trim() } },
            { manufacturer: { contains: query.trim() } }
          ]
        });
      }

      // 카테고리 필터
      if (categoryCode) {
        if (Array.isArray(categoryCode)) {
          whereConditions.AND.push({ categoryCode: { in: categoryCode } });
        } else {
          whereConditions.AND.push({ categoryCode });
        }
      }

      // 브랜드 필터
      if (brand) {
        if (Array.isArray(brand)) {
          whereConditions.AND.push({ brand: { in: brand } });
        } else {
          whereConditions.AND.push({ brand });
        }
      }

      // 가격 필터
      if (minPrice !== null || maxPrice !== null) {
        const priceCondition = {};
        if (minPrice !== null) priceCondition.gte = minPrice;
        if (maxPrice !== null) priceCondition.lte = maxPrice;

        whereConditions.AND.push({
          ProductPrice: {
            salePrice: priceCondition
          }
        });
      }

      // 정렬 옵션 설정
      let orderBy = [];
      switch (sortBy) {
        case 'price_asc':
          orderBy = [{ ProductPrice: { salePrice: 'asc' } }];
          break;
        case 'price_desc':
          orderBy = [{ ProductPrice: { salePrice: 'desc' } }];
          break;
        case 'rating':
          // 평점순은 별도 처리 (계산된 평점으로 정렬)
          orderBy = [{ createdAt: 'desc' }]; // 기본값으로 설정, 나중에 점수로 재정렬
          break;
        case 'popularity':
          // 인기순 (좋아요 + 주문 수)
          orderBy = [
            { UserLikeProduct: { _count: 'desc' } },
            { OrderItem: { _count: 'desc' } },
            { createdAt: 'desc' }
          ];
          break;
        case 'latest':
        default:
          orderBy = [{ createdAt: 'desc' }];
          break;
      }

      // 상품 검색 실행
      const products = await prisma.product.findMany({
        where: whereConditions,
        include: {
          ProductPrice: true,
          ProductImage: {
            where: { isMain: true },
            take: 1
          },
          Review: {
            select: { rating: true }
          },
          _count: {
            select: {
              Review: true,
              UserLikeProduct: true,
              OrderItem: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      });

      // 전체 결과 수 계산
      const totalCount = await prisma.product.count({
        where: whereConditions
      });

      // 결과 가공 및 추가 필터링
      let processedProducts = products.map(product => {
        const avgRating = product.Review && product.Review.length > 0
          ? product.Review.reduce((sum, r) => sum + r.rating, 0) / product.Review.length
          : 0;

        return {
          id: product.id.toString(),
          displayName: product.displayName,
          brand: product.brand,
          categoryCode: product.categoryCode,
          manufacturer: product.manufacturer,
          keywords: product.keywords,
          prices: product.ProductPrice,
          images: product.ProductImage,
          averageRating: Math.round(avgRating * 10) / 10, // 소수점 첫째자리까지
          reviewCount: product._count.Review,
          likeCount: product._count.UserLikeProduct,
          orderCount: product._count.OrderItem,
          saleStatus: product.saleStatus,
          displayStatus: product.displayStatus,
          createdAt: product.createdAt
        };
      });

      // 최소 평점 필터 (DB 쿼리로 처리하기 어려우므로 후처리)
      if (minRating !== null) {
        processedProducts = processedProducts.filter(p => p.averageRating >= minRating);
      }

      // 평점순 정렬 (DB에서 처리할 수 없으므로 후처리)
      if (sortBy === 'rating') {
        processedProducts.sort((a, b) => {
          if (b.averageRating === a.averageRating) {
            return b.reviewCount - a.reviewCount; // 평점이 같으면 리뷰 수순
          }
          return b.averageRating - a.averageRating;
        });
      }

      const totalPages = Math.ceil(totalCount / limit);

      return {
        products: processedProducts,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          limit
        },
        filters: {
          query,
          categoryCode,
          brand,
          minPrice,
          maxPrice,
          minRating,
          sortBy
        }
      };

    } catch (error) {
      console.error('상품 검색 오류:', error);
      return {
        products: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrev: false,
          limit
        },
        filters: {},
        error: '검색 중 오류가 발생했습니다.'
      };
    }
  }

  // 자동완성/추천 검색어
  async getSearchSuggestions(query, limit = 10) {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const suggestions = [];

      // 상품명에서 검색어 추천
      const productSuggestions = await prisma.product.findMany({
        where: {
          AND: [
            {
              OR: [
                { displayName: { contains: query.trim() } },
                { brand: { contains: query.trim() } },
                { keywords: { contains: query.trim() } }
              ]
            },
            { saleStatus: 'ON_SALE' },
            { displayStatus: 'DISPLAYED' }
          ]
        },
        select: {
          displayName: true,
          brand: true,
          keywords: true
        },
        take: limit
      });

      // 중복 제거하면서 추천어 수집
      const suggestionSet = new Set();
      
      productSuggestions.forEach(product => {
        // 상품명에서 추천어 추출
        if (product.displayName.toLowerCase().includes(query.toLowerCase())) {
          suggestionSet.add(product.displayName);
        }
        
        // 브랜드에서 추천어 추출
        if (product.brand.toLowerCase().includes(query.toLowerCase())) {
          suggestionSet.add(product.brand);
        }
        
        // 키워드에서 추천어 추출
        if (product.keywords) {
          const keywords = product.keywords.split(',');
          keywords.forEach(keyword => {
            const trimmedKeyword = keyword.trim();
            if (trimmedKeyword.toLowerCase().includes(query.toLowerCase())) {
              suggestionSet.add(trimmedKeyword);
            }
          });
        }
      });

      return Array.from(suggestionSet).slice(0, limit);

    } catch (error) {
      console.error('검색 추천어 조회 오류:', error);
      return [];
    }
  }

  // 필터 옵션 조회 (카테고리, 브랜드, 가격대 등)
  async getFilterOptions() {
    try {
      // 사용 가능한 카테고리 목록
      const categories = await prisma.product.groupBy({
        by: ['categoryCode'],
        where: {
          saleStatus: 'ON_SALE',
          displayStatus: 'DISPLAYED'
        },
        _count: true,
        orderBy: {
          _count: {
            categoryCode: 'desc'
          }
        }
      });

      // 사용 가능한 브랜드 목록
      const brands = await prisma.product.groupBy({
        by: ['brand'],
        where: {
          saleStatus: 'ON_SALE',
          displayStatus: 'DISPLAYED'
        },
        _count: true,
        orderBy: {
          _count: {
            brand: 'desc'
          }
        }
      });

      // 가격 범위 정보
      const priceRange = await prisma.productPrice.aggregate({
        where: {
          product: {
            saleStatus: 'ON_SALE',
            displayStatus: 'DISPLAYED'
          }
        },
        _min: { salePrice: true },
        _max: { salePrice: true },
        _avg: { salePrice: true }
      });

      return {
        categories: categories.map(cat => ({
          code: cat.categoryCode,
          count: cat._count
        })),
        brands: brands.map(brand => ({
          name: brand.brand,
          count: brand._count
        })),
        priceRange: {
          min: priceRange._min.salePrice || 0,
          max: priceRange._max.salePrice || 0,
          avg: Math.round(priceRange._avg.salePrice || 0)
        }
      };

    } catch (error) {
      console.error('필터 옵션 조회 오류:', error);
      return {
        categories: [],
        brands: [],
        priceRange: { min: 0, max: 0, avg: 0 }
      };
    }
  }

  // 인기 검색어 조회 (검색 로그가 있다면 활용)
  async getPopularSearchTerms(limit = 10) {
    // 실제로는 검색 로그 테이블이 필요하지만, 여기서는 키워드 빈도로 대체
    try {
      const products = await prisma.product.findMany({
        where: {
          saleStatus: 'ON_SALE',
          displayStatus: 'DISPLAYED',
          keywords: { not: null }
        },
        select: { keywords: true },
        take: 500 // 샘플링
      });

      const keywordCount = {};
      
      products.forEach(product => {
        if (product.keywords) {
          const keywords = product.keywords.split(',');
          keywords.forEach(keyword => {
            const trimmed = keyword.trim();
            if (trimmed.length > 1) {
              keywordCount[trimmed] = (keywordCount[trimmed] || 0) + 1;
            }
          });
        }
      });

      return Object.entries(keywordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([keyword, count]) => ({ keyword, count }));

    } catch (error) {
      console.error('인기 검색어 조회 오류:', error);
      return [];
    }
  }
}

module.exports = new SearchService();