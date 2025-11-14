/**
 * 백엔드에서 받은 상품 데이터를 프론트엔드에서 사용할 형태로 변환
 */

export const transformProductData = (backendProduct) => {
  if (!backendProduct) return null;

  return {
    ...backendProduct,
    // 가격 정보 변환
    prices: backendProduct.ProductPrice || backendProduct.prices || {
      originalPrice: 0,
      salePrice: 0,
      discountRate: 0,
      flexzonePrice: 0
    },

    // 배송 정보 변환
    delivery: backendProduct.ProductDelivery || backendProduct.delivery || {},

    // 반품 정보 변환
    returns: backendProduct.ProductReturn || backendProduct.returns || {},

    // 이미지 정보 변환
    images: backendProduct.ProductImage || backendProduct.images || [],

    // 옵션 그룹 변환
    options: backendProduct.ProductOptionGroup || backendProduct.options || [],

    // SKU 정보 변환
    skus: backendProduct.ProductSKU || backendProduct.skus || [],

    // 정보고시 변환
    infoNotices: backendProduct.ProductInfoNotice || backendProduct.infoNotices || [],

    // 리뷰 정보 변환
    reviews: backendProduct.Review || backendProduct.reviews || [],

    // 문의 정보 변환
    inquiries: backendProduct.Inquiry || backendProduct.inquiries || [],

    // 주문 아이템 변환
    orderItems: backendProduct.OrderItem || backendProduct.orderItems || [],

    // 장바구니 아이템 변환
    cartItems: backendProduct.CartItem || backendProduct.cartItems || [],

    // 좋아요 정보 변환
    likedByUsers: backendProduct.UserLikeProduct || backendProduct.likedByUsers || [],
  };
};

/**
 * 상품 목록 데이터 변환
 */
export const transformProductList = (backendProductList) => {
  if (!Array.isArray(backendProductList)) return [];

  return backendProductList.map(product => transformProductData(product));
};

/**
 * API 응답 데이터 변환
 */
export const transformApiResponse = (response) => {
  if (!response) return response;

  // 단일 상품인 경우
  if (response.product) {
    return {
      ...response,
      product: transformProductData(response.product)
    };
  }

  // 상품 목록인 경우
  if (response.products && Array.isArray(response.products)) {
    return {
      ...response,
      products: transformProductList(response.products)
    };
  }

  // 직접 배열인 경우
  if (Array.isArray(response)) {
    return transformProductList(response);
  }

  return response;
};