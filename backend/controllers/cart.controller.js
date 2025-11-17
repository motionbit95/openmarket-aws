const prisma = require("../config/prisma");
const { convertBigIntToString, parseBigIntId } = require("../utils/bigint");

/**
 * 장바구니 조회 (유저별)
 * GET /cart/:userId
 */
exports.getCartByUser = async (req, res) => {
  let userId;
  try {
    userId = parseBigIntId(req.params.userId);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  try {
    // 유저의 장바구니 및 아이템 조회
    const cart = await prisma.Cart.findFirst({
      where: { userId },
      include: {
        CartItem: {
          include: {
            Product: {
              include: {
                ProductPrice: true,
                ProductImage: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
            ProductSKU: true,
          },
        },
      },
    });
    if (!cart) {
      return res.status(200).json({ cart: null, items: [] });
    }
    // BigInt → string 변환 후 응답 (CartItem을 items로 매핑)
    const response = {
      ...cart,
      items: cart.CartItem || [],
    };
    delete response.CartItem;
    res.json(convertBigIntToString(response));
  } catch (err) {
    res.status(500).json({ error: "장바구니 조회 실패", details: err.message });
  }
};

/**
 * 장바구니에 상품 추가
 * POST /cart/add
 * body: { userId, productId, optionId, quantity, price, selection }
 */
exports.addToCart = async (req, res) => {
  const { userId, productId, optionId, quantity, price, selection } = req.body;

  // 로그: 요청 바디 출력
  console.log("[addToCart] 요청 바디 전체:", JSON.stringify(req.body, null, 2));

  // prisma가 정의되어 있는지 확인
  if (typeof prisma === "undefined") {
    console.error("[addToCart] prisma is undefined!");
    return res.status(500).json({
      error: "서버 내부 오류",
      details: "prisma 인스턴스가 정의되어 있지 않습니다.",
    });
  }

  try {
    // userId 파싱
    let parsedUserId;
    if (typeof userId === "bigint") {
      parsedUserId = userId;
    } else if (typeof userId === "string") {
      if (!/^\d+$/.test(userId)) {
        return res
          .status(400)
          .json({ error: "userId 형식이 올바르지 않습니다." });
      }
      parsedUserId = BigInt(userId);
    } else if (typeof userId === "number") {
      parsedUserId = BigInt(userId);
    } else {
      return res
        .status(400)
        .json({ error: "userId 타입이 올바르지 않습니다." });
    }
    console.log("[addToCart] userId 파싱 결과:", parsedUserId);

    // 1. prisma 인스턴스가 제대로 import/require 되었는지 확인
    if (typeof prisma === "undefined" || !prisma.Cart) {
      console.error(
        "[addToCart] prisma 또는 prisma.Cart가 정의되어 있지 않습니다."
      );
      return res.status(500).json({
        error: "서버 내부 오류",
        details: "prisma 인스턴스 또는 cart 모델이 정의되어 있지 않습니다.",
      });
    }

    // 2. 유저의 장바구니가 없으면 생성
    let cart;
    try {
      cart = await prisma.Cart.findFirst({
        where: { userId: parsedUserId },
      });
      console.log("[addToCart] cart 조회 결과:", cart);
    } catch (err) {
      console.error("[addToCart] cart 조회 중 에러:", err);
      return res.status(500).json({
        error: "장바구니 조회 중 오류",
        details: err.message,
      });
    }

    if (!cart) {
      cart = await prisma.Cart.create({
        data: { userId: parsedUserId },
      });
      console.log("[addToCart] cart 새로 생성:", cart);
    }

    // selection.mainSelections가 있으면 여러 옵션을 한 번에 추가
    // CartItem의 selectedOptionValue도 저장
    if (
      selection &&
      Array.isArray(selection.mainSelections) &&
      selection.mainSelections.length > 0
    ) {
      const results = [];
      for (const sel of selection.mainSelections) {
        const selOptionId = sel.optionId ? BigInt(sel.optionId) : null;
        const selQuantity = Number(sel.quantity) || 1;

        // 가격 정보는 selectedStock에서 가져오거나, sel.price, req.body.price 순서로 사용
        let selPrice = price;
        if (
          sel.selectedStock &&
          typeof sel.selectedStock.salePrice !== "undefined"
        ) {
          selPrice = Number(sel.selectedStock.salePrice);
        } else if (typeof sel.price !== "undefined") {
          selPrice = Number(sel.price);
        } else {
          selPrice = Number(price);
        }

        // selectedOptionValue는 selectedStock.name 또는 sel.selectedOptionValue, sel.selectedValue, sel.value 순서로 추출
        let selectedOptionValue = null;
        if (sel.selectedStock && typeof sel.selectedStock.name === "string") {
          selectedOptionValue = sel.selectedStock.name;
        } else if (typeof sel.selectedOptionValue === "string") {
          selectedOptionValue = sel.selectedOptionValue;
        } else if (typeof sel.selectedValue === "string") {
          selectedOptionValue = sel.selectedValue;
        } else if (typeof sel.value === "string") {
          selectedOptionValue = sel.value;
        }

        // 동일 상품/옵션/selectedOptionValue가 이미 있으면 수량만 증가
        let item = await prisma.CartItem.findFirst({
          where: {
            cartId: cart.id,
            productId: BigInt(productId),
            optionId: selOptionId,
            selectedOptionValue: selectedOptionValue ?? null,
          },
        });

        if (item) {
          const updated = await prisma.CartItem.update({
            where: { id: item.id },
            data: {
              quantity: item.quantity + selQuantity,
              price: selPrice,
              selectedOptionValue: selectedOptionValue ?? null,
            },
          });
          results.push({
            message: "장바구니 수량 증가",
            item: convertBigIntToString(updated),
            selected: {
              productId: String(productId),
              optionId: sel.optionId ? String(sel.optionId) : null,
              quantity: selQuantity,
              price: selPrice,
              selectedOptionValue: selectedOptionValue ?? null,
            },
          });
        } else {
          const newItem = await prisma.CartItem.create({
            data: {
              cartId: cart.id,
              productId: BigInt(productId),
              optionId: selOptionId,
              quantity: selQuantity,
              price: selPrice,
              selectedOptionValue: selectedOptionValue ?? null,
            },
          });
          results.push({
            message: "장바구니에 추가됨",
            item: convertBigIntToString(newItem),
            selected: {
              productId: String(productId),
              optionId: sel.optionId ? String(sel.optionId) : null,
              quantity: selQuantity,
              price: selPrice,
              selectedOptionValue: selectedOptionValue ?? null,
            },
          });
        }
      }
      return res.json({ results });
    } else {
      // 기존 단일 상품/옵션 추가 로직
      // selectedOptionValue는 selectedStock.name, req.body.selectedOptionValue, selectedValue, value 등에서 추출
      let selectedOptionValue = null;
      if (
        req.body.selectedStock &&
        typeof req.body.selectedStock.name === "string"
      ) {
        selectedOptionValue = req.body.selectedStock.name;
      } else if (typeof req.body.selectedOptionValue === "string") {
        selectedOptionValue = req.body.selectedOptionValue;
      } else if (typeof req.body.selectedValue === "string") {
        selectedOptionValue = req.body.selectedValue;
      } else if (typeof req.body.value === "string") {
        selectedOptionValue = req.body.value;
      }

      let item = await prisma.CartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: BigInt(productId),
          skuId: optionId ? BigInt(optionId) : null,
        },
      });
      if (item) {
        const updated = await prisma.CartItem.update({
          where: { id: item.id },
          data: {
            quantity: item.quantity + Number(quantity),
            price: Number(price),
          },
        });
        return res.json({
          message: "장바구니 수량 증가",
          item: convertBigIntToString(updated),
          selected: {
            productId: String(productId),
            optionId: optionId ? String(optionId) : null,
            quantity: Number(quantity),
            price: Number(price),
            selectedOptionValue: selectedOptionValue ?? null,
          },
        });
      } else {
        const newItem = await prisma.CartItem.create({
          data: {
            cartId: cart.id,
            productId: BigInt(productId),
            skuId: optionId ? BigInt(optionId) : null,
            quantity: Number(quantity),
            price: Number(price),
          },
        });
        return res.json({
          message: "장바구니에 추가됨",
          item: convertBigIntToString(newItem),
          selected: {
            productId: String(productId),
            optionId: optionId ? String(optionId) : null,
            quantity: Number(quantity),
            price: Number(price),
            selectedOptionValue: selectedOptionValue ?? null,
          },
        });
      }
    }
  } catch (err) {
    // BigInt 직렬화 에러를 잡아서 메시지 변경
    console.error("[addToCart] 에러 발생:", err);
    if (
      err &&
      typeof err.message === "string" &&
      err.message.includes("Do not know how to serialize a BigInt")
    ) {
      return res.status(500).json({
        error: "장바구니 추가 실패",
        details: "서버 내부 오류(BigInt 직렬화 문제)",
      });
    }
    res.status(500).json({ error: "장바구니 추가 실패", details: err.message });
  }
};

/**
 * 장바구니 아이템 수량 변경
 * PATCH /cart/item/:itemId
 * body: { quantity }
 */
exports.updateCartItemQuantity = async (req, res) => {
  const itemId = BigInt(req.params.itemId);
  const { quantity } = req.body;
  try {
    const updated = await prisma.CartItem.update({
      where: { id: itemId },
      data: { quantity: Number(quantity) },
    });
    res.json({ message: "수량 변경됨", item: convertBigIntToString(updated) });
  } catch (err) {
    res.status(500).json({ error: "수량 변경 실패", details: err.message });
  }
};

/**
 * 장바구니에서 아이템 삭제
 * DELETE /cart/item/:itemId
 */
exports.removeCartItem = async (req, res) => {
  const itemId = BigInt(req.params.itemId);
  try {
    await prisma.CartItem.delete({ where: { id: itemId } });
    res.json({ message: "장바구니 아이템 삭제됨" });
  } catch (err) {
    res.status(500).json({ error: "삭제 실패", details: err.message });
  }
};

/**
 * 장바구니 전체 비우기 (유저별)
 * DELETE /cart/all/:userId
 */
exports.clearCart = async (req, res) => {
  const userId = BigInt(req.params.userId);
  try {
    const cart = await prisma.Cart.findFirst({ where: { userId } });
    if (!cart) {
      return res.json({ message: "장바구니 없음" });
    }
    await prisma.CartItem.deleteMany({ where: { cartId: cart.id } });
    res.json({ message: "장바구니 비움" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "장바구니 비우기 실패", details: err.message });
  }
};
