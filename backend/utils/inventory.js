const prisma = require("../config/prisma");
const { parseBigIntId } = require("./bigint");

/**
 * SKU 재고 확인
 * @param {string|BigInt} skuId - SKU ID
 * @param {number} quantity - 필요한 수량
 * @returns {Promise<boolean>} 재고 충분 여부
 */
async function checkSKUStock(skuId, quantity) {
  try {
    const parsedSkuId = typeof skuId === 'bigint' ? skuId : parseBigIntId(skuId);
    
    const sku = await prisma.productSKU.findUnique({
      where: { id: parsedSkuId },
      select: { stockQuantity: true, reservedStock: true, isActive: true }
    });

    if (!sku || !sku.isActive) {
      return false;
    }

    const availableStock = sku.stockQuantity - sku.reservedStock;
    return availableStock >= quantity;
  } catch (error) {
    console.error('SKU 재고 확인 오류:', error);
    return false;
  }
}

/**
 * 다중 SKU 재고 확인
 * @param {Array<{skuId: string|BigInt, quantity: number}>} items - 확인할 SKU들
 * @returns {Promise<{available: boolean, unavailableItems: Array}>} 재고 확인 결과
 */
async function checkMultipleSKUStock(items) {
  const unavailableItems = [];
  
  for (const item of items) {
    const isAvailable = await checkSKUStock(item.skuId, item.quantity);
    if (!isAvailable) {
      unavailableItems.push(item);
    }
  }

  return {
    available: unavailableItems.length === 0,
    unavailableItems
  };
}

/**
 * SKU 재고 예약 (장바구니에 담기, 주문 생성 시)
 * @param {string|BigInt} skuId - SKU ID
 * @param {number} quantity - 예약할 수량
 * @returns {Promise<boolean>} 예약 성공 여부
 */
async function reserveSKUStock(skuId, quantity) {
  try {
    const parsedSkuId = typeof skuId === 'bigint' ? skuId : parseBigIntId(skuId);
    
    // 재고 확인 후 예약
    const result = await prisma.$transaction(async (tx) => {
      const sku = await tx.productSKU.findUnique({
        where: { id: parsedSkuId },
        select: { stockQuantity: true, reservedStock: true, isActive: true }
      });

      if (!sku || !sku.isActive) {
        throw new Error('유효하지 않은 SKU입니다.');
      }

      const availableStock = sku.stockQuantity - sku.reservedStock;
      if (availableStock < quantity) {
        throw new Error('재고가 부족합니다.');
      }

      // 예약 재고 증가
      await tx.productSKU.update({
        where: { id: parsedSkuId },
        data: { reservedStock: { increment: quantity } }
      });

      return true;
    });

    return result;
  } catch (error) {
    console.error('SKU 재고 예약 오류:', error);
    return false;
  }
}

/**
 * SKU 재고 예약 해제 (장바구니에서 제거, 주문 취소 시)
 * @param {string|BigInt} skuId - SKU ID
 * @param {number} quantity - 해제할 수량
 * @returns {Promise<boolean>} 해제 성공 여부
 */
async function releaseSKUStock(skuId, quantity) {
  try {
    const parsedSkuId = typeof skuId === 'bigint' ? skuId : parseBigIntId(skuId);
    
    await prisma.productSKU.update({
      where: { id: parsedSkuId },
      data: { 
        reservedStock: { 
          decrement: quantity 
        } 
      }
    });

    // 예약 재고가 음수가 되지 않도록 보정
    await prisma.productSKU.updateMany({
      where: { 
        id: parsedSkuId,
        reservedStock: { lt: 0 }
      },
      data: { reservedStock: 0 }
    });

    return true;
  } catch (error) {
    console.error('SKU 재고 해제 오류:', error);
    return false;
  }
}

/**
 * SKU 재고 차감 (결제 완료 시)
 * @param {string|BigInt} skuId - SKU ID
 * @param {number} quantity - 차감할 수량
 * @returns {Promise<boolean>} 차감 성공 여부
 */
async function consumeSKUStock(skuId, quantity) {
  try {
    const parsedSkuId = typeof skuId === 'bigint' ? skuId : parseBigIntId(skuId);
    
    const result = await prisma.$transaction(async (tx) => {
      const sku = await tx.productSKU.findUnique({
        where: { id: parsedSkuId },
        select: { stockQuantity: true, reservedStock: true }
      });

      if (!sku) {
        throw new Error('SKU를 찾을 수 없습니다.');
      }

      if (sku.stockQuantity < quantity) {
        throw new Error('재고가 부족합니다.');
      }

      // 실제 재고 차감 및 예약 재고 해제
      await tx.productSKU.update({
        where: { id: parsedSkuId },
        data: {
          stockQuantity: { decrement: quantity },
          reservedStock: { decrement: Math.min(quantity, sku.reservedStock) }
        }
      });

      return true;
    });

    return result;
  } catch (error) {
    console.error('SKU 재고 차감 오류:', error);
    return false;
  }
}

/**
 * SKU 재고 복원 (환불, 반품 시)
 * @param {string|BigInt} skuId - SKU ID
 * @param {number} quantity - 복원할 수량
 * @returns {Promise<boolean>} 복원 성공 여부
 */
async function restoreSKUStock(skuId, quantity) {
  try {
    const parsedSkuId = typeof skuId === 'bigint' ? skuId : parseBigIntId(skuId);
    
    await prisma.productSKU.update({
      where: { id: parsedSkuId },
      data: { stockQuantity: { increment: quantity } }
    });

    return true;
  } catch (error) {
    console.error('SKU 재고 복원 오류:', error);
    return false;
  }
}

/**
 * 상품의 총 재고 계산 (모든 활성 SKU의 재고 합계)
 * @param {string|BigInt} productId - 상품 ID
 * @returns {Promise<{totalStock: number, availableStock: number}>} 총 재고 정보
 */
async function getProductTotalStock(productId) {
  try {
    const parsedProductId = typeof productId === 'bigint' ? productId : parseBigIntId(productId);
    
    const product = await prisma.product.findUnique({
      where: { id: parsedProductId },
      select: {
        isSingleProduct: true,
        stockQuantity: true,
        skus: {
          where: { isActive: true },
          select: { stockQuantity: true, reservedStock: true }
        }
      }
    });

    if (!product) {
      return { totalStock: 0, availableStock: 0 };
    }

    if (product.isSingleProduct) {
      return {
        totalStock: product.stockQuantity,
        availableStock: product.stockQuantity // 단일상품은 예약재고 개념이 없음
      };
    }

    const totalStock = product.skus.reduce((sum, sku) => sum + sku.stockQuantity, 0);
    const totalReserved = product.skus.reduce((sum, sku) => sum + sku.reservedStock, 0);
    const availableStock = totalStock - totalReserved;

    return { totalStock, availableStock };
  } catch (error) {
    console.error('상품 총 재고 계산 오류:', error);
    return { totalStock: 0, availableStock: 0 };
  }
}

/**
 * 재고 부족 SKU 조회
 * @param {string|BigInt} productId - 상품 ID (선택)
 * @param {number} threshold - 알림 기준 재고 (기본값: SKU의 alertStock)
 * @returns {Promise<Array>} 재고 부족 SKU 목록
 */
async function getLowStockSKUs(productId = null, threshold = null) {
  try {
    const where = {
      isActive: true,
      ...(productId && { productId: typeof productId === 'bigint' ? productId : parseBigIntId(productId) })
    };

    if (threshold) {
      where.stockQuantity = { lte: threshold };
    } else {
      // SKU별 알림 기준 재고보다 적은 경우
      where.stockQuantity = { lte: prisma.productSKU.fields.alertStock };
    }

    const lowStockSKUs = await prisma.productSKU.findMany({
      where: {
        isActive: true,
        ...(productId && { productId: typeof productId === 'bigint' ? productId : parseBigIntId(productId) }),
        // Prisma에서 동적 필드 비교는 raw query 필요
      },
      include: {
        product: {
          select: { displayName: true }
        },
        skuOptions: {
          include: {
            optionValue: {
              include: {
                optionGroup: true
              }
            }
          }
        }
      }
    });

    // 메모리에서 필터링 (Prisma 한계)
    return lowStockSKUs.filter(sku => 
      sku.stockQuantity <= (threshold || sku.alertStock)
    );
  } catch (error) {
    console.error('재고 부족 SKU 조회 오류:', error);
    return [];
  }
}

module.exports = {
  checkSKUStock,
  checkMultipleSKUStock,
  reserveSKUStock,
  releaseSKUStock,
  consumeSKUStock,
  restoreSKUStock,
  getProductTotalStock,
  getLowStockSKUs
};