const prisma = require("../config/prisma");
const { convertBigIntToString, parseBigIntId } = require("../utils/bigint");
const { checkSKUStock, reserveSKUStock, releaseSKUStock } = require("../utils/inventory");

/**
 * 장바구니에 상품 추가 (SKU 기반)
 * POST /cart/v2/add
 */
exports.addToCartV2 = async (req, res) => {
  const { userId, productId, skuId, quantity = 1 } = req.body;

  try {
    const parsedUserId = parseBigIntId(userId);
    const parsedProductId = parseBigIntId(productId);
    const parsedSkuId = skuId ? parseBigIntId(skuId) : null;

    // 상품 정보 조회
    const product = await prisma.product.findUnique({
      where: { id: parsedProductId },
      include: {
        prices: true,
        skus: skuId ? {
          where: { id: parsedSkuId }
        } : undefined
      }
    });

    if (!product) {
      return res.status(404).json({ error: "상품을 찾을 수 없습니다." });
    }

    // 단일상품 vs 옵션상품 검증
    if (product.isSingleProduct && skuId) {
      return res.status(400).json({ error: "단일상품에는 SKU를 지정할 수 없습니다." });
    }

    if (!product.isSingleProduct && !skuId) {
      return res.status(400).json({ error: "옵션상품에는 SKU를 지정해야 합니다." });
    }

    // 재고 확인
    let stockAvailable = false;
    let price = 0;

    if (product.isSingleProduct) {
      // 단일상품 재고 확인
      stockAvailable = product.stockQuantity >= quantity;
      price = product.prices?.salePrice || 0;
    } else {
      // SKU 재고 확인
      if (!product.skus || product.skus.length === 0) {
        return res.status(404).json({ error: "해당 옵션을 찾을 수 없습니다." });
      }
      
      const sku = product.skus[0];
      stockAvailable = await checkSKUStock(sku.id, quantity);
      price = sku.salePrice;
    }

    if (!stockAvailable) {
      return res.status(400).json({ error: "재고가 부족합니다." });
    }

    // 사용자 장바구니 조회 또는 생성
    let cart = await prisma.Cart.findFirst({
      where: { userId: parsedUserId }
    });

    if (!cart) {
      cart = await prisma.Cart.create({
        data: { userId: parsedUserId }
      });
    }

    // 기존 장바구니 아이템 확인
    const existingItem = await prisma.CartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: parsedProductId,
        skuId: parsedSkuId
      }
    });

    const result = await prisma.$transaction(async (tx) => {
      let cartItem;
      
      if (existingItem) {
        // 기존 아이템 수량 증가
        const newQuantity = existingItem.quantity + quantity;
        
        // 새로운 수량으로 재고 재확인
        if (!product.isSingleProduct) {
          const stockCheck = await checkSKUStock(parsedSkuId, newQuantity);
          if (!stockCheck) {
            throw new Error('재고가 부족합니다.');
          }
        }

        cartItem = await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { 
            quantity: newQuantity,
            price, // 가격 업데이트
            updatedAt: new Date()
          }
        });

        // 옵션상품인 경우 추가 재고 예약
        if (!product.isSingleProduct && parsedSkuId) {
          await reserveSKUStock(parsedSkuId, quantity);
        }
      } else {
        // 새 아이템 추가
        cartItem = await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: parsedProductId,
            skuId: parsedSkuId,
            quantity,
            price
          }
        });

        // 옵션상품인 경우 재고 예약
        if (!product.isSingleProduct && parsedSkuId) {
          await reserveSKUStock(parsedSkuId, quantity);
        }
      }

      return cartItem;
    });

    res.status(201).json({
      message: "장바구니에 상품이 추가되었습니다.",
      cartItem: convertBigIntToString(result)
    });

  } catch (error) {
    console.error("장바구니 추가 오류:", error);
    res.status(500).json({ 
      error: "장바구니 추가에 실패했습니다.", 
      details: error.message 
    });
  }
};

/**
 * 장바구니 조회 (SKU 기반)
 * GET /cart/v2/:userId
 */
exports.getCartByUserV2 = async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseBigIntId(userId);

    const cart = await prisma.Cart.findFirst({
      where: { userId: parsedUserId },
      include: {
        items: {
          include: {
            product: {
              include: {
                prices: true,
                images: {
                  where: { isMain: true },
                  take: 1
                }
              }
            },
            sku: {
              include: {
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
            }
          }
        }
      }
    });

    if (!cart) {
      return res.json({ cart: null, items: [] });
    }

    // 재고 상태 확인 및 추가 정보 계산
    const enhancedItems = await Promise.all(
      cart.items.map(async (item) => {
        const enhanced = { ...item };
        
        // 재고 확인
        if (item.sku) {
          enhanced.stockAvailable = await checkSKUStock(item.sku.id, item.quantity);
          enhanced.currentPrice = item.sku.salePrice;
        } else {
          enhanced.stockAvailable = item.product.stockQuantity >= item.quantity;
          enhanced.currentPrice = item.product.prices?.salePrice || 0;
        }
        
        // 가격 변동 여부
        enhanced.priceChanged = enhanced.currentPrice !== item.price;
        
        // 총액 계산
        enhanced.totalPrice = enhanced.currentPrice * item.quantity;
        
        return enhanced;
      })
    );

    const result = {
      ...cart,
      items: enhancedItems
    };

    res.json(convertBigIntToString(result));
  } catch (error) {
    console.error("장바구니 조회 오류:", error);
    res.status(500).json({ 
      error: "장바구니 조회에 실패했습니다.", 
      details: error.message 
    });
  }
};

/**
 * 장바구니 아이템 수량 변경
 * PUT /cart/v2/items/:itemId
 */
exports.updateCartItemV2 = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    const parsedItemId = parseBigIntId(itemId);

    if (quantity <= 0) {
      return res.status(400).json({ error: "수량은 1개 이상이어야 합니다." });
    }

    const cartItem = await prisma.CartItem.findUnique({
      where: { id: parsedItemId },
      include: {
        product: true,
        sku: true
      }
    });

    if (!cartItem) {
      return res.status(404).json({ error: "장바구니 아이템을 찾을 수 없습니다." });
    }

    // 재고 확인
    let stockAvailable = false;
    if (cartItem.sku) {
      stockAvailable = await checkSKUStock(cartItem.sku.id, quantity);
    } else {
      stockAvailable = cartItem.product.stockQuantity >= quantity;
    }

    if (!stockAvailable) {
      return res.status(400).json({ error: "재고가 부족합니다." });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 기존 예약 재고 해제
      if (cartItem.sku) {
        await releaseSKUStock(cartItem.sku.id, cartItem.quantity);
      }

      // 수량 업데이트
      const updatedItem = await tx.cartItem.update({
        where: { id: parsedItemId },
        data: { 
          quantity,
          updatedAt: new Date()
        },
        include: {
          product: {
            include: {
              prices: true
            }
          },
          sku: true
        }
      });

      // 새로운 수량으로 재고 예약
      if (cartItem.sku) {
        await reserveSKUStock(cartItem.sku.id, quantity);
      }

      return updatedItem;
    });

    res.json({
      message: "장바구니 아이템이 업데이트되었습니다.",
      cartItem: convertBigIntToString(result)
    });

  } catch (error) {
    console.error("장바구니 아이템 업데이트 오류:", error);
    res.status(500).json({ 
      error: "장바구니 아이템 업데이트에 실패했습니다.", 
      details: error.message 
    });
  }
};

/**
 * 장바구니 아이템 삭제
 * DELETE /cart/v2/items/:itemId
 */
exports.removeCartItemV2 = async (req, res) => {
  try {
    const { itemId } = req.params;
    const parsedItemId = parseBigIntId(itemId);

    const cartItem = await prisma.CartItem.findUnique({
      where: { id: parsedItemId },
      include: {
        sku: true
      }
    });

    if (!cartItem) {
      return res.status(404).json({ error: "장바구니 아이템을 찾을 수 없습니다." });
    }

    await prisma.$transaction(async (tx) => {
      // 예약 재고 해제
      if (cartItem.sku) {
        await releaseSKUStock(cartItem.sku.id, cartItem.quantity);
      }

      // 아이템 삭제
      await tx.cartItem.delete({
        where: { id: parsedItemId }
      });
    });

    res.json({ message: "장바구니에서 상품이 제거되었습니다." });

  } catch (error) {
    console.error("장바구니 아이템 삭제 오류:", error);
    res.status(500).json({ 
      error: "장바구니 아이템 삭제에 실패했습니다.", 
      details: error.message 
    });
  }
};

module.exports = exports;