const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ==================== 주문 관리 ====================

/**
 * 판매자 주문 목록 조회
 */
const getPartnerOrders = async (req, res) => {
  try {
    const {
      sellerId,
      status,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "판매자 ID는 필수입니다.",
      });
    }

    console.log("🔍 [getPartnerOrders] sellerId:", sellerId);

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 검색 조건 구성
    const whereConditions = {
      OrderItem: {
        some: {
          Product: {
            sellerId: BigInt(sellerId),
          },
        },
      },
    };

    console.log("🔍 [getPartnerOrders] whereConditions:", JSON.stringify(whereConditions, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    // 주문 상태 필터
    if (status) {
      whereConditions.orderStatus = status;
    }

    // 날짜 범위 필터
    if (startDate && endDate) {
      whereConditions.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // 검색어 필터 (주문번호, 고객명, 상품명)
    if (search) {
      whereConditions.OR = [
        { orderNumber: { contains: search } },
        { user: { user_name: { contains: search } } },
        {
          OrderItem: {
            some: {
              productName: { contains: search },
            },
          },
        },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereConditions,
        include: {
          users: {
            select: {
              id: true,
              user_name: true,
              email: true,
              phone: true,
            },
          },
          OrderItem: {
            where: {
              Product: {
                sellerId: BigInt(sellerId),
              },
            },
            include: {
              Product: {
                select: {
                  id: true,
                  displayName: true,
                  ProductImage: {
                    where: { isMain: true },
                    take: 1,
                  },
                },
              },
              ProductSKU: true,
            },
          },
          Delivery: true,
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: parseInt(limit),
      }),
      prisma.order.count({ where: whereConditions }),
    ]);

    // 데이터 변환
    const transformedOrders = orders.map((order) => ({
      id: order.id.toString(),
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      customer: {
        name: order.users?.user_name,
        email: order.users?.email,
        phone: order.users?.phone || order.phone,
      },
      items: (order.OrderItem || []).map((item) => ({
        product: {
          name: item.productName,
          price: item.unitPrice,
          image: item.Product?.ProductImage?.[0]?.url,
        },
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        options: item.optionSnapshot || {},
      })),
      totalAmount: (order.OrderItem || []).reduce(
        (sum, item) => sum + item.totalPrice,
        0
      ),
      paymentMethod: order.paymentMethod,
      status: order.orderStatus,
      shippingAddress: `${order.address1}${
        order.address2 ? " " + order.address2 : ""
      }`,
      trackingNumber: order.Delivery?.trackingNumber || null,
      deliveryCompany: order.Delivery?.deliveryCompany || null,
      deliveryStatus: order.Delivery?.status || order.deliveryStatus,
      estimatedDelivery: order.Delivery?.estimatedDeliveryDate,
    }));

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    console.log(`🔍 [getPartnerOrders] 조회 결과: ${transformedOrders.length}개 주문, 총 ${totalCount}개`);

    res.json({
      success: true,
      orders: transformedOrders,
      total: totalCount,
      page: parseInt(page),
      totalPages,
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("판매자 주문 목록 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 판매자 주문 상세 조회
 */
const getPartnerOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { sellerId } = req.query;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "판매자 ID는 필수입니다.",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: BigInt(orderId) },
      include: {
        users: {
          select: {
            id: true,
            user_name: true,
            email: true,
            phone: true,
          },
        },
        OrderItem: {
          where: {
            Product: {
              sellerId: BigInt(sellerId),
            },
          },
          include: {
            Product: {
              select: {
                id: true,
                displayName: true,
                description: true,
                ProductImage: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
            ProductSKU: true,
          },
        },
        Delivery: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "주문을 찾을 수 없습니다.",
      });
    }

    // 해당 판매자의 상품이 포함된 주문인지 확인
    if (!order.OrderItem || order.OrderItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: "해당 주문에 판매자의 상품이 없습니다.",
      });
    }

    // 데이터 변환
    const transformedOrder = {
      id: order.id.toString(),
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      customer: {
        name: order.users?.user_name,
        email: order.users?.email,
        phone: order.users?.phone || order.phone,
      },
      items: (order.OrderItem || []).map((item) => ({
        id: item.id.toString(),
        product: {
          id: item.Product?.id?.toString(),
          name: item.productName,
          description: item.Product?.description,
          price: item.unitPrice,
          image: item.Product?.ProductImage?.[0]?.url,
        },
        quantity: item.quantity,
        price: item.unitPrice,
        totalPrice: item.totalPrice,
        sku: item.ProductSKU,
        options: item.optionSnapshot || {},
      })),
      totalAmount: (order.OrderItem || []).reduce(
        (sum, item) => sum + item.totalPrice,
        0
      ),
      paymentMethod: order.paymentMethod,
      status: order.orderStatus,
      shippingAddress: `${order.address1}${
        order.address2 ? " " + order.address2 : ""
      }`,
      trackingNumber: order.Delivery?.trackingNumber || null,
      deliveryCompany: order.Delivery?.deliveryCompany || null,
      deliveryStatus: order.Delivery?.status || order.deliveryStatus,
      estimatedDelivery: order.Delivery?.estimatedDeliveryDate,
    };

    res.json({
      success: true,
      order: transformedOrder,
    });
  } catch (error) {
    console.error("판매자 주문 상세 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 주문 상태 변경
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, deliveryCompany } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "상태는 필수입니다.",
      });
    }

    const updateData = {
      orderStatus: status,
      updatedAt: new Date(),
    };

    // 배송 시작 시 배송 상태도 함께 업데이트
    if (status === "SHIPPED") {
      updateData.deliveryStatus = "SHIPPED";
      // 추후 배송 테이블 구현 시 운송장 정보 저장
    }

    const updatedOrder = await prisma.order.update({
      where: { id: BigInt(orderId) },
      data: updateData,
      include: {
        user: {
          select: {
            user_name: true,
            email: true,
          },
        },
      },
    });

    // TODO: 주문 상태 변경 알림 발송

    res.json({
      success: true,
      message: "주문 상태가 변경되었습니다.",
      order: {
        id: updatedOrder.id.toString(),
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.orderStatus,
        customer: {
          name: updatedOrder.user.user_name,
          email: updatedOrder.user.email,
        },
      },
    });
  } catch (error) {
    console.error("주문 상태 변경 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

// ==================== 배송 관리 ====================

/**
 * 판매자 배송 목록 조회
 */
const getPartnerDeliveries = async (req, res) => {
  try {
    const { sellerId, status, search, page = 1, limit = 10 } = req.query;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "판매자 ID는 필수입니다.",
      });
    }

    // 입력값 검증
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "유효한 페이지 번호를 입력해주세요.",
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 10000) {
      return res.status(400).json({
        success: false,
        message: "페이지 크기는 1-10000 사이여야 합니다.",
      });
    }

    const offset = (pageNum - 1) * limitNum;
    let sellerIdBigInt;

    try {
      sellerIdBigInt = BigInt(sellerId);
      if (sellerIdBigInt <= 0) {
        throw new Error("Invalid seller ID");
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 판매자 ID입니다.",
      });
    }

    // 배송 상태별 주문 조회 - 스키마의 실제 enum 값들과 일치
    const statusMapping = {
      PREPARING: ["CONFIRMED", "PREPARING"], // 배송준비중
      IN_TRANSIT: ["SHIPPED"], // 배송중
      DELIVERED: ["DELIVERED"], // 배송완료
      RETURNED: null, // 배송실패/반품은 deliveryStatus로 처리
    };

    const whereConditions = {
      OrderItem: {
        some: {
          Product: {
            sellerId: sellerIdBigInt,
          },
        },
      },
    };

    // 상태별 조건 설정
    console.log(
      "배송 목록 조회 - status:",
      status,
      "statusMapping:",
      statusMapping[status]
    );

    if (status === "RETURNED") {
      // 배송실패/반품은 deliveryStatus로 처리
      whereConditions.deliveryStatus = "RETURNED";
    } else if (status && statusMapping[status]) {
      // statusMapping에 정의된 상태만 사용
      const orderStatuses = statusMapping[status];
      whereConditions.orderStatus = { in: orderStatuses };
    }
    // status가 없거나 매핑되지 않은 경우 모든 주문 조회

    // 검색어 필터
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      whereConditions.OR = [
        { orderNumber: { contains: searchTerm } },
        { users: { user_name: { contains: searchTerm } } },
        { Delivery: { trackingNumber: { contains: searchTerm } } },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereConditions,
        include: {
          users: {
            select: {
              user_name: true,
              phone: true,
            },
          },
          OrderItem: {
            where: {
              Product: {
                sellerId: sellerIdBigInt,
              },
            },
            include: {
              Product: {
                select: {
                  displayName: true,
                },
              },
            },
          },
          Delivery: {
            select: {
              trackingNumber: true,
              deliveryCompany: true,
              status: true,
              estimatedDeliveryDate: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limitNum,
      }),
      prisma.order.count({ where: whereConditions }),
    ]);

    const deliveries = orders.map((order, index) => {
      // 배송 상태 결정 로직 개선
      let deliveryStatus;

      // 1순위: Delivery 테이블의 status (배송 정보가 있는 경우 - 가장 정확)
      if (order.Delivery?.status) {
        deliveryStatus = order.Delivery.status;
      }
      // 2순위: Order의 deliveryStatus
      else if (order.deliveryStatus) {
        deliveryStatus = order.deliveryStatus;
      }
      // 3순위: orderStatus 기반 추론
      else if (
        order.orderStatus === "CONFIRMED" ||
        order.orderStatus === "PREPARING"
      ) {
        deliveryStatus = "PREPARING";
      } else if (order.orderStatus === "SHIPPED") {
        deliveryStatus = "IN_TRANSIT";
      } else if (order.orderStatus === "DELIVERED") {
        deliveryStatus = "DELIVERED";
      } else if (order.orderStatus === "CANCELLED") {
        deliveryStatus = "RETURNED";
      }

      // 상태 정규화
      // 1. SHIPPED를 IN_TRANSIT로 통일 (배송중)
      if (deliveryStatus === "SHIPPED") {
        deliveryStatus = "IN_TRANSIT";
      }

      // 2. CANCELLED 주문은 RETURNED로 표시 (배송실패/반품)
      if (order.orderStatus === "CANCELLED") {
        deliveryStatus = "RETURNED";
      }

      // 디버깅 (처음 5개만)
      if (index < 5) {
        console.log(`\n[주문 ${index}] 배송 상태 변환:`);
        console.log("  - order.Delivery?.status:", order.Delivery?.status);
        console.log("  - order.deliveryStatus:", order.deliveryStatus);
        console.log("  - order.orderStatus:", order.orderStatus);
        console.log("  - 최종 deliveryStatus:", deliveryStatus);
      }

      return {
        id: order.id.toString(),
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customer: {
          name: order.users?.user_name,
          phone: order.users?.phone || order.phone,
        },
        items: order.OrderItem.map((item) => ({
          product: { name: item.Product?.displayName || "상품명 없음" },
          quantity: item.quantity,
        })),
        totalAmount: order.finalAmount,
        shippingAddress: `${order.address1 || ""}${
          order.address2 ? " " + order.address2 : ""
        }`,
        trackingNumber: order.Delivery?.trackingNumber || null,
        deliveryCompany: order.Delivery?.deliveryCompany || null,
        deliveryStatus: deliveryStatus,
        orderStatus: order.orderStatus,
        estimatedDelivery:
          order.Delivery?.estimatedDeliveryDate ||
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      };
    });

    res.json({
      success: true,
      deliveries,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
    });
  } catch (error) {
    console.error("판매자 배송 목록 조회 오류:", error);

    // Prisma 에러 처리
    if (error.code === "P2023") {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 데이터 형식입니다.",
      });
    }

    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 배송 시작
 */
const startDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, deliveryCompany } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "주문 ID는 필수입니다.",
      });
    }

    if (!trackingNumber || !deliveryCompany) {
      return res.status(400).json({
        success: false,
        message: "운송장 번호와 택배사는 필수입니다.",
      });
    }

    // 유효한 orderId인지 확인
    const orderIdBigInt = BigInt(orderId);
    if (orderIdBigInt <= 0) {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 주문 ID입니다.",
      });
    }

    // 트랜잭션으로 주문 상태 변경과 배송 정보 저장을 함께 처리
    const result = await prisma.$transaction(async (tx) => {
      // 주문이 존재하는지 먼저 확인
      const existingOrder = await tx.order.findUnique({
        where: { id: orderIdBigInt },
      });

      if (!existingOrder) {
        throw new Error("ORDER_NOT_FOUND");
      }

      // 이미 배송이 시작된 상태인지 확인
      if (
        existingOrder.orderStatus === "SHIPPED" ||
        existingOrder.orderStatus === "DELIVERED"
      ) {
        throw new Error("ALREADY_SHIPPED");
      }

      // 주문 상태를 배송중으로 변경
      const updatedOrder = await tx.order.update({
        where: { id: orderIdBigInt },
        data: {
          orderStatus: "SHIPPED",
          deliveryStatus: "SHIPPED",
          updatedAt: new Date(),
        },
      });

      // 배송 정보 저장 (upsert 사용해서 이미 있으면 업데이트, 없으면 생성)
      const delivery = await tx.delivery.upsert({
        where: { orderId: orderIdBigInt },
        create: {
          orderId: orderIdBigInt,
          trackingNumber,
          deliveryCompany,
          status: "SHIPPED",
          estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2일 후
          updatedAt: new Date(),
        },
        update: {
          trackingNumber,
          deliveryCompany,
          status: "SHIPPED",
          updatedAt: new Date(),
        },
      });

      return { order: updatedOrder, delivery };
    });

    // TODO: 고객에게 배송 시작 알림 발송

    res.json({
      success: true,
      message: "배송이 시작되었습니다.",
      delivery: {
        orderId: orderId,
        trackingNumber,
        deliveryCompany,
        status: "SHIPPED",
      },
    });
  } catch (error) {
    console.error("배송 시작 오류:", error);

    // 비즈니스 로직 에러 처리
    if (error.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "해당 주문을 찾을 수 없습니다.",
      });
    }

    if (error.message === "ALREADY_SHIPPED") {
      return res.status(400).json({
        success: false,
        message: "이미 배송이 시작되었거나 완료된 주문입니다.",
      });
    }

    // Prisma 에러 처리
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "해당 주문을 찾을 수 없습니다.",
      });
    }

    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "중복된 운송장 번호입니다.",
      });
    }

    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 운송장 번호 업데이트
 */
const updateTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "주문 ID는 필수입니다.",
      });
    }

    if (!trackingNumber || trackingNumber.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "유효한 운송장 번호는 필수입니다.",
      });
    }

    // 유효한 orderId인지 확인
    const orderIdBigInt = BigInt(orderId);
    if (orderIdBigInt <= 0) {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 주문 ID입니다.",
      });
    }

    // 배송 정보 테이블에서 운송장 번호 업데이트
    const delivery = await prisma.delivery.update({
      where: { orderId: orderIdBigInt },
      data: {
        trackingNumber: trackingNumber.trim(),
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "운송장 번호가 업데이트되었습니다.",
      orderId,
      trackingNumber: trackingNumber.trim(),
    });
  } catch (error) {
    console.error("운송장 번호 업데이트 오류:", error);

    // 배송 정보가 없는 경우
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message:
          "해당 주문의 배송 정보를 찾을 수 없습니다. 먼저 배송을 시작해주세요.",
      });
    }

    // 중복된 운송장 번호
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "이미 사용 중인 운송장 번호입니다.",
      });
    }

    // 잘못된 데이터 타입 에러
    if (error.code === "P2023") {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 주문 ID입니다.",
      });
    }

    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

// ==================== 취소/반품 관리 ====================

/**
 * 판매자 취소 요청 목록 조회
 */
const getPartnerCancellations = async (req, res) => {
  try {
    // TODO: 취소 요청 테이블 구현 후 실제 데이터 조회

    res.json({
      success: true,
      cancellations: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });
  } catch (error) {
    console.error("판매자 취소 목록 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 취소 요청 처리
 */
const processCancellation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, reason } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "올바른 처리 방법을 선택해주세요.",
      });
    }

    if (action === "reject" && !reason) {
      return res.status(400).json({
        success: false,
        message: "거부 시 사유는 필수입니다.",
      });
    }

    // TODO: 취소 요청 처리 로직 구현

    res.json({
      success: true,
      message: `취소 요청이 ${
        action === "approve" ? "승인" : "거부"
      }되었습니다.`,
      orderId,
      action,
      reason,
    });
  } catch (error) {
    console.error("취소 요청 처리 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 판매자 반품 요청 목록 조회
 */
const getPartnerReturns = async (req, res) => {
  try {
    // TODO: 반품 요청 테이블 구현 후 실제 데이터 조회

    res.json({
      success: true,
      returns: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });
  } catch (error) {
    console.error("판매자 반품 목록 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 반품 요청 처리 (승인/거부)
 */
const processReturn = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { action, reason } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "올바른 처리 방법을 선택해주세요.",
      });
    }

    if (action === "reject" && !reason) {
      return res.status(400).json({
        success: false,
        message: "거부 시 사유는 필수입니다.",
      });
    }

    // 반품 승인 시 APPROVED 상태로, 거부 시 REJECTED 상태로 변경
    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    // 주문 조회
    const order = await prisma.order.findUnique({
      where: { id: BigInt(returnId) },
      include: {
        OrderItem: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "주문을 찾을 수 없습니다.",
      });
    }

    // 모든 주문 아이템의 optionSnapshot에 반품 상태 저장
    for (const item of order.OrderItem) {
      const currentSnapshot = item.optionSnapshot || {};
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          optionSnapshot: {
            ...currentSnapshot,
            returnStatus: newStatus,
            returnProcessedAt: new Date().toISOString(),
            returnRejectReason: action === "reject" ? reason : null,
          },
        },
      });
    }

    res.json({
      success: true,
      message: `반품 요청이 ${
        action === "approve" ? "승인" : "거부"
      }되었습니다.`,
      returnId,
      action,
      status: newStatus,
      reason,
    });
  } catch (error) {
    console.error("반품 요청 처리 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 검수 시작 (PICKUP_SCHEDULED -> INSPECTING)
 */
const startInspection = async (req, res) => {
  try {
    const { returnId } = req.params;

    // 주문 조회
    const order = await prisma.order.findUnique({
      where: { id: BigInt(returnId) },
      include: {
        OrderItem: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "주문을 찾을 수 없습니다.",
      });
    }

    // 모든 주문 아이템의 optionSnapshot에 검수 시작 상태 저장
    for (const item of order.OrderItem) {
      const currentSnapshot = item.optionSnapshot || {};
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          optionSnapshot: {
            ...currentSnapshot,
            returnStatus: "INSPECTING",
            inspectionStartedAt: new Date().toISOString(),
          },
        },
      });
    }

    res.json({
      success: true,
      message: "검수가 시작되었습니다.",
      returnId,
      status: "INSPECTING",
    });
  } catch (error) {
    console.error("검수 시작 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 수거 일정 등록 (APPROVED -> PICKUP_SCHEDULED)
 */
const schedulePickup = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { pickupAddress, pickupDate, pickupCourier, pickupTrackingNumber, pickupMemo } = req.body;

    console.log('수거 일정 등록 요청:', {
      returnId,
      pickupAddress,
      pickupDate,
      pickupCourier,
      pickupTrackingNumber,
      pickupMemo
    });

    if (!pickupDate) {
      return res.status(400).json({
        success: false,
        message: "수거 예정일은 필수입니다.",
      });
    }

    // 주문 조회
    const order = await prisma.order.findUnique({
      where: { id: BigInt(returnId) },
      include: {
        OrderItem: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "주문을 찾을 수 없습니다.",
      });
    }

    // 모든 주문 아이템의 optionSnapshot에 수거 일정 정보 저장
    for (const item of order.OrderItem) {
      const currentSnapshot = item.optionSnapshot || {};
      const updatedSnapshot = {
        ...currentSnapshot,
        returnStatus: "PICKUP_SCHEDULED",
        pickupScheduledAt: new Date().toISOString(),
        pickupDate,
        pickupAddress: pickupAddress || null,
        pickupCourier: pickupCourier || null,
        pickupTrackingNumber: pickupTrackingNumber || null,
        pickupMemo: pickupMemo || null,
      };

      console.log('저장할 optionSnapshot:', updatedSnapshot);

      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          optionSnapshot: updatedSnapshot,
        },
      });
    }

    console.log('수거 일정 등록 완료');

    res.json({
      success: true,
      message: "수거 일정이 등록되었습니다.",
      returnId,
      status: "PICKUP_SCHEDULED",
      pickupAddress,
      pickupDate,
      pickupCourier,
      pickupTrackingNumber,
      pickupMemo,
    });
  } catch (error) {
    console.error("수거 일정 등록 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 반품 완료 처리 (INSPECTING -> COMPLETED)
 */
const completeReturn = async (req, res) => {
  try {
    const { returnId } = req.params;

    // 주문 조회
    const order = await prisma.order.findUnique({
      where: { id: BigInt(returnId) },
      include: {
        OrderItem: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "주문을 찾을 수 없습니다.",
      });
    }

    // 모든 주문 아이템의 optionSnapshot에 반품 완료 상태 저장
    for (const item of order.OrderItem) {
      const currentSnapshot = item.optionSnapshot || {};
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          optionSnapshot: {
            ...currentSnapshot,
            returnStatus: "COMPLETED",
            returnCompletedAt: new Date().toISOString(),
          },
        },
      });
    }

    // 주문 상태를 RETURNED로, 결제 상태를 CANCELLED로 변경 (환불 처리)
    await prisma.order.update({
      where: { id: BigInt(returnId) },
      data: {
        orderStatus: "RETURNED",
        paymentStatus: "CANCELLED", // 결제 취소 (카드 승인 취소)
      },
    });

    res.json({
      success: true,
      message: "반품이 완료되고 결제가 취소되었습니다.",
      returnId,
      status: "COMPLETED",
      refundProcessed: true,
    });
  } catch (error) {
    console.error("반품 완료 처리 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 반품 상세 정보 조회
 */
const getReturnDetail = async (req, res) => {
  try {
    const { returnId } = req.params;

    // TODO: 반품 상세 정보 조회 로직 구현

    res.json({
      success: true,
      returnDetail: {
        id: returnId,
        // 상세 정보 추가
      },
    });
  } catch (error) {
    console.error("반품 상세 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

// ==================== 정산 관리 ====================

/**
 * 판매자 정산 목록 조회
 */
const getPartnerSettlements = async (req, res) => {
  try {
    const {
      sellerId,
      status,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "판매자 ID는 필수입니다.",
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereConditions = {
      sellerId: BigInt(sellerId),
    };

    if (status) {
      whereConditions.status = status;
    }

    if (startDate && endDate) {
      whereConditions.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [settlements, totalCount] = await Promise.all([
      prisma.settlement.findMany({
        where: whereConditions,
        include: {
          SettlementPeriod: true,
          sellers: {
            select: {
              name: true,
              email: true,
              bank_type: true,
              bank_account: true,
              depositor_name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: parseInt(limit),
      }),
      prisma.settlement.count({ where: whereConditions }),
    ]);

    const transformedSettlements = settlements.map((settlement) => ({
      id: settlement.id.toString(),
      settlementNumber: `SET-${settlement.id}`,
      period: {
        startDate: settlement.SettlementPeriod?.startDate || null,
        endDate: settlement.SettlementPeriod?.endDate || null,
      },
      salesAmount: settlement.totalOrderAmount,
      commissionRate: 10, // 추후 실제 수수료율 계산
      commissionAmount: settlement.totalCommission,
      settlementAmount: settlement.finalSettlementAmount,
      status: settlement.status,
      processedAt: settlement.settledAt,
      createdAt: settlement.createdAt,
      bankAccount: {
        bank: settlement.sellers?.bank_type || null,
        accountNumber: settlement.sellers?.bank_account || null,
        holder: settlement.sellers?.depositor_name || null,
      },
      orderCount: 0, // 추후 실제 주문 수 계산
    }));

    res.json({
      success: true,
      settlements: transformedSettlements,
      total: totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error("판매자 정산 목록 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 상품별 정산 내역 조회
 */
const getProductSettlements = async (req, res) => {
  try {
    const {
      sellerId,
      search,
      category,
      sortBy = "salesAmount",
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "판매자 ID는 필수입니다.",
      });
    }

    // 실제 DB에서 상품별 정산 데이터 조회
    const whereConditions = {};

    // 판매자별 필터링
    const settlementWhere = {
      sellerId: BigInt(sellerId),
    };

    // 기간 필터링
    if (startDate && endDate) {
      settlementWhere.SettlementPeriod = {
        startDate: { gte: new Date(startDate) },
        endDate: { lte: new Date(endDate) },
      };
    }

    // 정산 아이템들 조회 (상품별로 그룹화)
    const settlementItems = await prisma.settlementItem.findMany({
      include: {
        Settlement: {
          include: {
            SettlementPeriod: true,
            sellers: true,
          },
        },
      },
      where: {
        Settlement: settlementWhere,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 상품별로 그룹화하여 정산 데이터 집계
    const productSettlementsMap = new Map();

    for (const item of settlementItems) {
      const productKey = item.productName;

      if (!productSettlementsMap.has(productKey)) {
        // 상품 정보 조회 (SKU를 기반으로)
        let product = null;
        if (item.skuCode) {
          const sku = await prisma.productSKU.findFirst({
            where: { skuCode: item.skuCode },
            include: {
              Product: {
                include: {
                  ProductPrice: true,
                  ProductImage: true,
                },
              },
            },
          });
          product = sku?.Product;

          // 디버깅: 상품 정보 로그
          if (product) {
            console.log(`📦 상품 정보 조회 성공:`, {
              productName: item.productName,
              skuCode: item.skuCode,
              hasProductImage: !!product.ProductImage,
              imageCount: product.ProductImage?.length || 0,
              images: product.ProductImage?.map((img) => ({
                url: img.url,
                isMain: img.isMain,
              })),
            });
          } else {
            console.log(`⚠️ 상품 정보 조회 실패:`, {
              productName: item.productName,
              skuCode: item.skuCode,
            });
          }
        }

        // 기본 상품 정보 (DB에서 찾지 못한 경우)
        if (!product) {
          product = {
            id: Math.floor(Math.random() * 1000000), // 임시 ID
            displayName: item.productName,
            ProductPrice: { salePrice: item.unitPrice },
            ProductImage: [
              {
                url: `https://via.placeholder.com/150?text=No+Image`,
                isMain: true,
              },
            ],
            categoryCode: "ELECTRONICS",
          };
        }

        // 이미지 URL 결정 로직 개선
        let imageUrl = `https://via.placeholder.com/150?text=No+Image`;
        if (product.ProductImage && Array.isArray(product.ProductImage)) {
          // 1순위: isMain이 true인 이미지
          const mainImage = product.ProductImage.find((img) => img.isMain);
          if (mainImage?.url) {
            imageUrl = mainImage.url;
          }
          // 2순위: 첫 번째 이미지
          else if (product.ProductImage[0]?.url) {
            imageUrl = product.ProductImage[0].url;
          }
        }

        productSettlementsMap.set(productKey, {
          id: product.id,
          product: {
            id: product.id,
            name: item.productName,
            sku: item.skuCode,
            image: imageUrl,
            category: product.categoryCode || "전자제품",
            price: product.ProductPrice?.salePrice || item.unitPrice,
          },
          salesAmount: 0,
          commissionAmount: 0,
          settlementAmount: 0,
          orderCount: 0,
          totalQuantity: 0,
          avgOrderValue: 0,
          returnCount: 0,
          returnAmount: 0,
          commissionRate: item.commissionRate,
          period: {
            startDate: item.Settlement?.SettlementPeriod?.startDate || null,
            endDate: item.Settlement?.SettlementPeriod?.endDate || null,
          },
          items: [],
        });
      }

      const productData = productSettlementsMap.get(productKey);
      productData.salesAmount += item.totalPrice;
      productData.commissionAmount += item.commissionAmount;
      productData.settlementAmount += item.settlementAmount;
      productData.orderCount += 1;
      productData.totalQuantity += item.quantity;

      // 반품 여부 확인 (orderStatus로 판단)
      if (item.orderStatus === "RETURNED" || item.orderStatus === "REFUNDED") {
        productData.returnCount += 1;
        productData.returnAmount += item.totalPrice;
      }

      productData.items.push(item);
    }

    // Map을 배열로 변환하고 평균 주문금액 계산
    let productSettlements = Array.from(productSettlementsMap.values()).map(
      (item) => {
        item.avgOrderValue =
          item.orderCount > 0
            ? Math.round(item.salesAmount / item.orderCount)
            : 0;
        delete item.items; // 불필요한 items 제거
        return item;
      }
    );

    // 필터링 적용
    if (search) {
      productSettlements = productSettlements.filter(
        (item) =>
          item.product.name.toLowerCase().includes(search.toLowerCase()) ||
          (item.product.sku &&
            item.product.sku.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (category) {
      productSettlements = productSettlements.filter(
        (item) => item.product.category === category
      );
    }

    // 정렬 적용
    productSettlements.sort((a, b) => {
      if (sortBy === "salesAmount") return b.salesAmount - a.salesAmount;
      if (sortBy === "orderCount") return b.orderCount - a.orderCount;
      if (sortBy === "settlementAmount")
        return b.settlementAmount - a.settlementAmount;
      if (sortBy === "commissionAmount")
        return b.commissionAmount - a.commissionAmount;
      return 0;
    });

    // 페이지네이션 적용
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = productSettlements.slice(startIndex, endIndex);
    const totalPages = Math.ceil(productSettlements.length / limit);

    // 디버깅: 첫 번째 상품의 이미지 정보 로그
    if (paginatedData.length > 0) {
      console.log("📸 첫 번째 상품 이미지 정보:", {
        productName: paginatedData[0].product.name,
        imageUrl: paginatedData[0].product.image,
      });
    }

    res.json({
      success: true,
      productSettlements: paginatedData,
      total: productSettlements.length,
      page: parseInt(page),
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("상품별 정산 내역 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 특정 상품의 정산 상세 정보 조회
 */
const getProductSettlementDetail = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sellerId } = req.query;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "판매자 ID는 필수입니다.",
      });
    }

    // 상품 정보 조회 (ID 또는 상품명으로)
    let product = null;

    // 먼저 ID로 조회 시도
    if (productId && !isNaN(productId)) {
      product = await prisma.product.findUnique({
        where: { id: BigInt(productId) },
        include: {
          ProductPrice: true,
          ProductImage: true,
        },
      });
    }

    // ID로 찾지 못한 경우, 정산 아이템에서 상품명으로 상품 찾기
    if (!product) {
      const settlementItem = await prisma.settlementItem.findFirst({
        where: {
          Settlement: {
            sellerId: BigInt(sellerId),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (settlementItem) {
        // 상품명으로 상품 찾기
        product = await prisma.product.findFirst({
          where: {
            displayName: settlementItem.productName,
            sellerId: BigInt(sellerId),
          },
          include: {
            ProductPrice: true,
            ProductImage: true,
          },
        });
      }
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "상품을 찾을 수 없습니다.",
      });
    }

    // 해당 상품의 정산 아이템들 조회
    const settlementItems = await prisma.settlementItem.findMany({
      where: {
        productName: product.displayName,
        Settlement: {
          sellerId: BigInt(sellerId),
        },
      },
      include: {
        Settlement: {
          include: {
            SettlementPeriod: true,
            sellers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (settlementItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "해당 상품의 정산 데이터를 찾을 수 없습니다.",
      });
    }

    // 정산 데이터 집계
    const totalSalesAmount = settlementItems.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0
    );
    const totalCommissionAmount = settlementItems.reduce(
      (sum, item) => sum + (item.commissionAmount || 0),
      0
    );
    const totalSettlementAmount = settlementItems.reduce(
      (sum, item) => sum + (item.settlementAmount || 0),
      0
    );
    const totalOrderCount = settlementItems.length;
    const totalQuantity = settlementItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    const avgOrderValue =
      totalOrderCount > 0 ? totalSalesAmount / totalOrderCount : 0;

    // 최신 정산 기간 정보
    const latestSettlement = settlementItems[0].Settlement;
    const commissionRate = latestSettlement.commissionRate || 10;

    // 주문 상세 정보 생성
    const orders = settlementItems.map((item, index) => ({
      id: `ORD-${item.id}`,
      orderDate: item.createdAt,
      customerName: `고객${index + 1}`,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalAmount: item.totalPrice,
      paymentMethod: "카드결제",
      status: "배송완료",
    }));

    const productSettlementData = {
      product: {
        id: product.id.toString(),
        name: product.displayName,
        sku: `SKU-${product.id}`,
        category: product.categoryCode || "ELECTRONICS",
        image:
          product.ProductImage?.[0]?.url ||
          `https://via.placeholder.com/150?text=No+Image`,
        price: product.ProductPrice?.[0]?.salePrice || 0,
      },
      period: {
        startDate: latestSettlement.SettlementPeriod.startDate,
        endDate: latestSettlement.SettlementPeriod.endDate,
      },
      salesAmount: totalSalesAmount,
      commissionAmount: totalCommissionAmount,
      settlementAmount: totalSettlementAmount,
      commissionRate: commissionRate,
      orderCount: totalOrderCount,
      totalQuantity: totalQuantity,
      avgOrderValue: avgOrderValue,
      returnCount: 0,
      returnAmount: 0,
      status: latestSettlement.status,
      orders: orders,
    };

    res.json({
      success: true,
      productSettlement: productSettlementData,
    });
  } catch (error) {
    console.error("상품 정산 상세 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 정산 상세 정보 조회
 */
const getSettlementDetail = async (req, res) => {
  try {
    const { settlementId } = req.params;

    const settlement = await prisma.settlement.findUnique({
      where: { id: BigInt(settlementId) },
      include: {
        SettlementPeriod: true,
        sellers: {
          select: {
            name: true,
            email: true,
            bank_type: true,
            bank_account: true,
            depositor_name: true,
          },
        },
        SettlementItem: {
          include: {
            // TODO: 주문 정보 포함
          },
        },
      },
    });

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "정산 정보를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      settlement: {
        id: settlement.id.toString(),
        period: {
          startDate: settlement.SettlementPeriod?.startDate || null,
          endDate: settlement.SettlementPeriod?.endDate || null,
        },
        salesAmount: settlement.totalOrderAmount,
        commissionAmount: settlement.totalCommission,
        settlementAmount: settlement.finalSettlementAmount,
        status: settlement.status,
        seller: settlement.sellers,
        items: settlement.SettlementItem,
      },
    });
  } catch (error) {
    console.error("정산 상세 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

// ==================== 카운트 함수들 ====================

/**
 * 주문 상태별 개수 조회
 */
const getPartnerOrderCounts = async (req, res) => {
  try {
    const { sellerId } = req.query;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "판매자 ID는 필수입니다.",
      });
    }

    // 판매자별 주문 상태별 개수 조회
    const whereConditions = {
      OrderItem: {
        some: {
          Product: {
            sellerId: BigInt(sellerId),
          },
        },
      },
    };

    const [orders, statusCounts] = await Promise.all([
      prisma.Order.count({ where: whereConditions }),
      prisma.Order.groupBy({
        by: ["orderStatus"],
        where: whereConditions,
        _count: { id: true },
      }),
    ]);

    const counts = {
      total: orders,
      paid: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    // 상태별 카운트를 객체로 변환 (대문자 -> 소문자로 변환)
    statusCounts.forEach((item) => {
      const status = item.orderStatus.toLowerCase();
      counts[status] = item._count.id;
    });

    res.json({
      success: true,
      counts,
    });
  } catch (error) {
    console.error("주문 상태별 개수 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 배송 상태별 개수 조회
 */
const getPartnerDeliveryCounts = async (req, res) => {
  try {
    const { sellerId } = req.query;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "판매자 ID는 필수입니다.",
      });
    }

    let sellerIdBigInt;
    try {
      sellerIdBigInt = BigInt(sellerId);
      if (sellerIdBigInt <= 0) {
        throw new Error("Invalid seller ID");
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 판매자 ID입니다.",
      });
    }

    // 판매자별 배송 상태별 개수 조회
    const whereConditions = {
      OrderItem: {
        some: {
          Product: {
            sellerId: sellerIdBigInt,
          },
        },
      },
    };

    // 배송 상태별 주문 매핑 - 배송 목록 조회와 동일한 로직 사용
    const [preparing, shipped, delivered, failed] = await Promise.all([
      // 배송준비중: CONFIRMED, PREPARING 상태의 주문
      prisma.Order.count({
        where: {
          ...whereConditions,
          orderStatus: { in: ["CONFIRMED", "PREPARING"] },
        },
      }),
      // 배송중: SHIPPED 상태의 주문
      prisma.Order.count({
        where: {
          ...whereConditions,
          orderStatus: "SHIPPED",
        },
      }),
      // 배송완료: DELIVERED 상태의 주문
      prisma.Order.count({
        where: {
          ...whereConditions,
          orderStatus: "DELIVERED",
        },
      }),
      // 배송 실패 상태는 deliveryStatus로 확인 (RETURNED)
      prisma.Order.count({
        where: {
          ...whereConditions,
          deliveryStatus: "RETURNED",
        },
      }),
    ]);

    const counts = {
      preparing: preparing,
      delayed: 0, // 현재는 지연 상태를 추적하지 않음
      shipped: shipped,
      delivered: delivered,
      failed: failed,
    };

    res.json({
      success: true,
      counts,
    });
  } catch (error) {
    console.error("배송 상태별 개수 조회 오류:", error);

    // Prisma 에러 처리
    if (error.code === "P2023") {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 데이터 형식입니다.",
      });
    }

    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 취소 상태별 개수 조회
 */
const getPartnerCancellationCounts = async (req, res) => {
  try {
    const { sellerId } = req.query;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "판매자 ID는 필수입니다.",
      });
    }

    // 판매자별 취소 상태별 개수 조회
    const whereConditions = {
      OrderItem: {
        some: {
          Product: {
            sellerId: BigInt(sellerId),
          },
        },
      },
      orderStatus: "CANCELLED", // 취소된 주문만
    };

    const cancelled = await prisma.Order.count({ where: whereConditions });

    // 취소 상태는 현재 데이터 구조에서 CANCELLED로 통합되어 있으므로
    // 세부 상태는 추후 별도 테이블 구현 시 구분
    const counts = {
      requested: 0, // 취소 요청
      approved: 0, // 취소 승인
      processing: 0, // 취소 처리중
      completed: cancelled, // 취소 완료
      rejected: 0, // 취소 거부
    };

    res.json({
      success: true,
      counts,
    });
  } catch (error) {
    console.error("취소 상태별 개수 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 반품 상태별 개수 조회
 */
const getPartnerReturnCounts = async (req, res) => {
  try {
    const { sellerId } = req.query;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "판매자 ID는 필수입니다.",
      });
    }

    // 판매자별 반품 상태별 개수 조회
    const whereConditions = {
      OrderItem: {
        some: {
          Product: {
            sellerId: BigInt(sellerId),
          },
        },
      },
    };

    const [returned, refunded] = await Promise.all([
      prisma.Order.count({
        where: {
          ...whereConditions,
          deliveryStatus: "RETURNED",
        },
      }),
      prisma.Order.count({
        where: {
          ...whereConditions,
          orderStatus: "REFUNDED",
        },
      }),
    ]);

    // 반품 상태는 현재 데이터 구조에서 RETURNED/REFUNDED로 구분
    // 세부 상태는 추후 별도 테이블 구현 시 구분
    const counts = {
      requested: 0, // 반품 요청
      approved: 0, // 반품 승인
      pickupScheduled: 0, // 수거 예정
      processing: 0, // 검수 중
      completed: returned + refunded, // 반품 완료
      rejected: 0, // 반품 거부
    };

    res.json({
      success: true,
      counts,
    });
  } catch (error) {
    console.error("반품 상태별 개수 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

module.exports = {
  // 주문 관리
  getPartnerOrders,
  getPartnerOrderDetail,
  getPartnerOrderCounts,
  updateOrderStatus,

  // 배송 관리
  getPartnerDeliveries,
  getPartnerDeliveryCounts,
  startDelivery,
  updateTracking,

  // 취소/반품 관리
  getPartnerCancellations,
  getPartnerCancellationCounts,
  processCancellation,
  getPartnerReturns,
  getPartnerReturnCounts,
  processReturn,
  startInspection,
  schedulePickup,
  completeReturn,
  getReturnDetail,

  // 정산 관리
  getPartnerSettlements,
  getProductSettlements,
  getProductSettlementDetail,
  getSettlementDetail,
};
