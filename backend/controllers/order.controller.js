const prisma = require("../config/prisma");
const { convertBigIntToString, parseBigIntId } = require("../utils/bigint");

// 주문번호 생성 함수
function generateOrderNumber() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.getTime().toString().slice(-6);
  return `ORDER-${dateStr}-${timeStr}`;
}

/**
 * 전체 주문 목록 조회 (관리자용)
 * GET /orders
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 필터 조건 생성
    const where = {};

    if (status && status !== 'all') {
      where.orderStatus = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { recipient: { contains: search } },
        { users: { user_name: { contains: search } } },
        { users: { email: { contains: search } } },
        { OrderItem: { some: { Product: { displayName: { contains: search } } } } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orders = await prisma.Order.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            user_name: true,
            email: true,
          }
        },
        OrderItem: {
          include: {
            Product: {
              select: {
                id: true,
                displayName: true,
              }
            }
          }
        }
      }
    });

    const total = await prisma.Order.count({ where });

    res.json({
      orders: convertBigIntToString(orders),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("전체 주문 조회 실패:", error);
    res.status(500).json({ message: "서버 에러", error: error.message });
  }
};

/**
 * 장바구니에서 주문 생성
 * POST /orders/create-from-cart
 */
exports.createOrderFromCart = async (req, res) => {
  const { userId, addressId, paymentMethod, deliveryMemo, usedCouponId } =
    req.body;

  try {
    // 사용자 ID 파싱
    const parsedUserId = parseBigIntId(userId);

    // 배송지 정보 조회
    let parsedAddressId;
    try {
      parsedAddressId = parseBigIntId(addressId);
    } catch (e) {
      return res.status(400).json({ error: "유효하지 않은 배송지 ID입니다." });
    }

    const address = await prisma.userAddress.findUnique({
      where: { id: parsedAddressId },
    });

    if (!address || address.userId !== parsedUserId) {
      return res.status(404).json({ error: "배송지를 찾을 수 없습니다." });
    }

    // 장바구니 조회
    const cart = await prisma.cart.findFirst({
      where: { userId: parsedUserId },
      include: {
        items: {
          include: {
            product: {
              include: {
                prices: true,
              },
            },
            sku: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "장바구니가 비어있습니다." });
    }

    // 쿠폰 검증 및 할인금액 계산
    let usedCoupon = null;
    let discountAmount = 0;

    if (usedCouponId) {
      const parsedCouponId = parseBigIntId(usedCouponId);

      // 사용자가 보유한 쿠폰인지 확인
      const userCoupon = await prisma.userCoupon.findFirst({
        where: {
          userId: parsedUserId,
          couponId: parsedCouponId,
          used: false,
        },
        include: {
          coupon: true,
        },
      });

      if (!userCoupon) {
        return res.status(400).json({ error: "사용할 수 없는 쿠폰입니다." });
      }

      usedCoupon = userCoupon.coupon;

      // 쿠폰 유효성 검증 (만료일 등)
      const now = new Date();
      if (usedCoupon.valid_to && now > usedCoupon.valid_to) {
        return res.status(400).json({ error: "만료된 쿠폰입니다." });
      }
    }

    // 주문 금액 계산
    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const unitPrice = cartItem.price;
      const totalPrice = unitPrice * cartItem.quantity;
      totalAmount += totalPrice;

      orderItems.push({
        productId: cartItem.productId,
        skuId: cartItem.skuId,
        quantity: cartItem.quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        productName: cartItem.product.displayName,
      });
    }

    // 쿠폰 할인 계산
    if (usedCoupon) {
      if (
        usedCoupon.min_order_amount &&
        totalAmount < usedCoupon.min_order_amount
      ) {
        return res.status(400).json({
          error: `최소 주문금액 ${usedCoupon.min_order_amount}원 이상이어야 합니다.`,
        });
      }

      if (usedCoupon.discount_mode === "amount") {
        discountAmount = usedCoupon.discount_amount;
      } else if (usedCoupon.discount_mode === "percent") {
        discountAmount = Math.floor(
          totalAmount * (usedCoupon.discount_amount / 100)
        );
        if (
          usedCoupon.discount_max &&
          discountAmount > usedCoupon.discount_max
        ) {
          discountAmount = usedCoupon.discount_max;
        }
      }
    }

    // 배송비 계산 (임시로 3000원 고정, 추후 상품별 배송비 로직 추가)
    const deliveryFee = totalAmount >= 30000 ? 0 : 3000;

    const finalAmount = totalAmount - discountAmount + deliveryFee;

    // 주문번호 생성
    const orderNumber = generateOrderNumber();

    // 트랜잭션으로 주문 생성
    const result = await prisma.$transaction(async (tx) => {
      // 주문 생성
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: parsedUserId,
          recipient: address.recipient,
          phone: address.phone,
          postcode: address.postcode,
          address1: address.address1,
          address2: address.address2,
          deliveryMemo,
          totalAmount,
          discountAmount,
          deliveryFee,
          finalAmount,
          paymentMethod,
          usedCouponId: usedCoupon ? parseBigIntId(usedCouponId) : null,
          orderItems: {
            create: orderItems,
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
              sku: true,
            },
          },
        },
      });

      // 쿠폰 사용 처리
      if (usedCoupon) {
        await tx.userCoupon.updateMany({
          where: {
            userId: parsedUserId,
            couponId: parseBigIntId(usedCouponId),
          },
          data: {
            used: true,
            usedAt: new Date(),
          },
        });
      }

      // 장바구니 비우기
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });

    res.status(201).json({
      message: "주문이 생성되었습니다.",
      order: convertBigIntToString(result),
    });
  } catch (error) {
    console.error("주문 생성 오류:", error);
    res
      .status(500)
      .json({ error: "주문 생성에 실패했습니다.", details: error.message });
  }
};

/**
 * 사용자의 주문 목록 조회
 * GET /orders/user/:userId
 */
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseBigIntId(userId);

    const orders = await prisma.order.findMany({
      where: { userId: parsedUserId },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(convertBigIntToString(orders));
  } catch (error) {
    res
      .status(500)
      .json({ error: "주문 목록 조회 실패", details: error.message });
  }
};

/**
 * 특정 주문 상세 조회
 * GET /orders/:orderId
 */
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const parsedOrderId = parseBigIntId(orderId);

    const order = await prisma.order.findUnique({
      where: { id: parsedOrderId },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
          },
        },
        usedCoupon: true,
        user: {
          select: {
            id: true,
            user_name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
    }

    res.json(convertBigIntToString(order));
  } catch (error) {
    res.status(500).json({ error: "주문 조회 실패", details: error.message });
  }
};

/**
 * 주문 상태 업데이트
 * PATCH /orders/:orderId/status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus, deliveryStatus } = req.body;
    const parsedOrderId = parseBigIntId(orderId);

    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (deliveryStatus) updateData.deliveryStatus = deliveryStatus;

    // 결제 완료시 결제일시 업데이트
    if (paymentStatus === "COMPLETED") {
      updateData.paidAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parsedOrderId },
      data: updateData,
      include: {
        orderItems: true,
      },
    });

    res.json({
      message: "주문 상태가 업데이트되었습니다.",
      order: convertBigIntToString(updatedOrder),
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "주문 상태 업데이트 실패", details: error.message });
  }
};

/**
 * 주문 취소
 * PATCH /orders/:orderId/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const parsedOrderId = parseBigIntId(orderId);

    const order = await prisma.order.findUnique({
      where: { id: parsedOrderId },
    });

    if (!order) {
      return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
    }

    // 취소 가능한 상태인지 확인
    if (
      order.orderStatus === "DELIVERED" ||
      order.orderStatus === "CANCELLED"
    ) {
      return res.status(400).json({ error: "취소할 수 없는 주문입니다." });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parsedOrderId },
      data: {
        orderStatus: "CANCELLED",
        paymentStatus:
          order.paymentStatus === "COMPLETED" ? "CANCELLED" : "CANCELLED",
      },
    });

    res.json({
      message: "주문이 취소되었습니다.",
      order: convertBigIntToString(updatedOrder),
    });
  } catch (error) {
    res.status(500).json({ error: "주문 취소 실패", details: error.message });
  }
};

/**
 * 바로 주문 생성
 * POST /orders/direct
 */
exports.createDirectOrder = async (req, res) => {
  const { userId, productId, skuId, quantity, addressId, paymentMethod, deliveryMemo, couponId } = req.body;

  try {
    // 사용자 ID 파싱
    const parsedUserId = parseBigIntId(userId);

    // 배송지 정보 조회
    let parsedAddressId;
    try {
      parsedAddressId = parseBigIntId(addressId);
    } catch (e) {
      return res.status(400).json({ error: "유효하지 않은 배송지 ID입니다." });
    }

    const address = await prisma.userAddress.findUnique({
      where: { id: parsedAddressId },
    });

    if (!address || address.userId !== parsedUserId) {
      return res.status(404).json({ error: "배송지를 찾을 수 없습니다." });
    }

    // 상품 정보 조회
    const product = await prisma.product.findUnique({
      where: { id: parseBigIntId(productId) },
      include: {
        prices: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: "상품을 찾을 수 없습니다." });
    }

    // 재고 확인
    if (product.stockQuantity < quantity) {
      return res.status(400).json({ error: "재고가 부족합니다." });
    }

    // 가격 계산
    const unitPrice = product.prices?.[0]?.price || product.basePrice || 25000;
    const totalPrice = unitPrice * quantity;
    const deliveryFee = totalPrice >= 50000 ? 0 : 3000;

    // 주문 생성
    const orderNumber = generateOrderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: parsedUserId,
        recipient: address.recipient,
        phone: address.phone,
        postcode: address.postcode,
        address1: address.address1,
        address2: address.address2,
        deliveryMemo: deliveryMemo || null,
        totalAmount: totalPrice,
        discountAmount: 0,
        deliveryFee,
        finalAmount: totalPrice + deliveryFee,
        orderStatus: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod,
        usedCouponId: couponId ? parseBigIntId(couponId) : null,
      },
    });

    // 주문 아이템 생성
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: parseBigIntId(productId),
        skuId: skuId ? parseBigIntId(skuId) : null,
        quantity,
        unitPrice,
        totalPrice,
        productName: product.displayName,
      },
    });

    // 재고 차감
    await prisma.product.update({
      where: { id: parseBigIntId(productId) },
      data: {
        stockQuantity: {
          decrement: quantity,
        },
      },
    });

    // 주문 정보 다시 조회 (관련 데이터 포함)
    const createdOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        orderItems: {
          include: {
            product: true,
            sku: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "주문이 생성되었습니다.",
      order: convertBigIntToString(createdOrder),
    });
  } catch (error) {
    console.error("바로 주문 생성 실패:", error);
    res.status(500).json({ error: "주문 생성 실패", details: error.message });
  }
};

module.exports = exports;
