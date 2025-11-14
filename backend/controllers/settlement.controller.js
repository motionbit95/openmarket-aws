const prisma = require("../config/prisma");
const { convertBigIntToString, parseBigIntId } = require("../utils/bigint");

/**
 * 정산 목록 조회
 * GET /settlements
 */
exports.getSettlements = async (req, res) => {
  try {
    const {
      status = "PENDING",
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const where = {
      ...(status && { status }),
      ...(search && {
        sellers: {
          OR: [{ name: { contains: search } }, { email: { contains: search } }],
        },
      }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const settlements = await prisma.settlement.findMany({
      where,
      include: {
        sellers: {
          select: {
            id: true,
            name: true,
            email: true,
            bank_type: true,
            bank_account: true,
            depositor_name: true,
          },
        },
        SettlementPeriod: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            settlementDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    const total = await prisma.settlement.count({ where });

    // 데이터 변환
    const transformedSettlements = settlements.map((settlement) => {
      const converted = convertBigIntToString(settlement);
      return {
        ...converted,
        sellerName: settlement.sellers?.name || "-",
        sellerEmail: settlement.sellers?.email || "-",
        salesAmount: settlement.totalOrderAmount || 0,
        commissionAmount: settlement.totalCommission || 0,
        commissionRate: settlement.commissionRate || 10,
        settlementAmount: settlement.finalSettlementAmount || 0,
        startDate:
          settlement.SettlementPeriod?.startDate || settlement.createdAt,
        endDate: settlement.SettlementPeriod?.endDate || settlement.createdAt,
      };
    });

    res.json({
      settlements: transformedSettlements,
      data: transformedSettlements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Settlement list fetch error:", error);
    res.status(500).json({
      error: "정산 목록 조회 중 오류가 발생했습니다.",
      details: error.message,
    });
  }
};

/**
 * 정산 처리
 * POST /settlements/process
 */
exports.processSettlements = async (req, res) => {
  try {
    const { settlementIds, commissionRate = 10 } = req.body;

    if (!settlementIds || settlementIds.length === 0) {
      return res
        .status(400)
        .json({ error: "처리할 정산 항목을 선택해주세요." });
    }

    const parsedIds = settlementIds.map((id) => parseBigIntId(id));

    // 정산 대기 상태인 항목만 처리
    const settlements = await prisma.settlement.findMany({
      where: {
        id: { in: parsedIds },
        status: "PENDING",
        settledAt: null, // 아직 완료되지 않은 항목만
      },
      include: {
        sellers: true,
      },
    });

    if (settlements.length === 0) {
      return res
        .status(400)
        .json({ error: "처리 가능한 정산 항목이 없습니다." });
    }

    // 정산 처리
    await prisma.$transaction(async (tx) => {
      for (const settlement of settlements) {
        // 수수료 재계산
        const salesAmount = settlement.totalOrderAmount || 0;
        const newCommissionAmount = salesAmount * (commissionRate / 100);
        const newSettlementAmount = salesAmount - newCommissionAmount;

        await tx.settlement.update({
          where: { id: settlement.id },
          data: {
            status: "CALCULATING",
            totalCommission: newCommissionAmount,
            finalSettlementAmount: newSettlementAmount,
            commissionRate: commissionRate,
            updatedAt: new Date(),
          },
        });
      }
    });

    res.json({
      message: `${settlements.length}개 정산 항목이 처리되었습니다.`,
      processedCount: settlements.length,
    });
  } catch (error) {
    console.error("Settlement processing error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "정산 처리 중 오류가 발생했습니다.",
      details: error.message,
    });
  }
};

/**
 * 정산 완료 처리
 * POST /settlements/complete
 */
exports.completeSettlements = async (req, res) => {
  try {
    const { settlementIds } = req.body;

    if (!settlementIds || settlementIds.length === 0) {
      return res
        .status(400)
        .json({ error: "완료 처리할 정산 항목을 선택해주세요." });
    }

    const parsedIds = settlementIds.map((id) => parseBigIntId(id));

    // 정산 처리중 상태인 항목만 완료 처리
    const settlements = await prisma.settlement.findMany({
      where: {
        id: { in: parsedIds },
        status: "CALCULATING",
      },
    });

    if (settlements.length === 0) {
      return res
        .status(400)
        .json({ error: "완료 처리 가능한 정산 항목이 없습니다." });
    }

    // 정산 완료 처리
    await prisma.$transaction(async (tx) => {
      for (const settlement of settlements) {
        await tx.settlement.update({
          where: { id: settlement.id },
          data: {
            status: "COMPLETED",
            settledAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    });

    res.json({
      message: `${settlements.length}개 정산 항목이 완료되었습니다.`,
      completedCount: settlements.length,
    });
  } catch (error) {
    console.error("Settlement completion error:", error);
    res.status(500).json({ error: "정산 완료 처리 중 오류가 발생했습니다." });
  }
};

/**
 * 정산 기간 생성
 * POST /settlements/periods
 */
exports.createSettlementPeriod = async (req, res) => {
  try {
    const { periodType, startDate, endDate, settlementDate } = req.body;

    const period = await prisma.settlementPeriod.create({
      data: {
        periodType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        settlementDate: new Date(settlementDate),
        status: "PREPARING",
        updatedAt: new Date(),
      },
    });

    res.status(201).json({
      message: "정산 기간이 생성되었습니다.",
      period: convertBigIntToString(period),
    });
  } catch (error) {
    console.error("정산 기간 생성 오류:", error);
    res.status(500).json({
      error: "정산 기간 생성에 실패했습니다.",
      details: error.message,
    });
  }
};

/**
 * 정산 데이터 생성
 * POST /settlements
 */
exports.createSettlement = async (req, res) => {
  try {
    const {
      settlementPeriodId,
      sellerId,
      totalOrderAmount,
      totalCommission,
      totalDeliveryFee = 0,
      totalRefundAmount = 0,
      totalCancelAmount = 0,
      adjustmentAmount = 0,
      memo = null,
    } = req.body;

    if (
      !settlementPeriodId ||
      !sellerId ||
      !totalOrderAmount ||
      !totalCommission
    ) {
      return res.status(400).json({
        error: "필수 필드가 누락되었습니다.",
      });
    }

    const finalSettlementAmount =
      totalOrderAmount -
      totalCommission -
      totalDeliveryFee -
      totalRefundAmount -
      totalCancelAmount +
      adjustmentAmount;

    const settlement = await prisma.settlement.create({
      data: {
        settlementPeriodId: parseBigIntId(settlementPeriodId),
        sellerId: parseBigIntId(sellerId),
        totalOrderAmount,
        totalCommission,
        totalDeliveryFee,
        totalRefundAmount,
        totalCancelAmount,
        adjustmentAmount,
        finalSettlementAmount,
        commissionRate: (totalCommission / totalOrderAmount) * 100,
        status: "PENDING",
        memo,
        updatedAt: new Date(),
      },
      include: {
        sellers: {
          select: {
            id: true,
            name: true,
            email: true,
            bank_type: true,
            bank_account: true,
            depositor_name: true,
          },
        },
        SettlementPeriod: true,
      },
    });

    res.status(201).json({
      message: "정산 데이터가 생성되었습니다.",
      settlement: convertBigIntToString(settlement),
    });
  } catch (error) {
    console.error("정산 데이터 생성 오류:", error);
    res.status(500).json({
      error: "정산 데이터 생성에 실패했습니다.",
      details: error.message,
    });
  }
};

/**
 * 정산 계산 실행
 * POST /settlements/calculate/:periodId
 */
exports.calculateSettlement = async (req, res) => {
  try {
    const { periodId } = req.params;
    const parsedPeriodId = parseBigIntId(periodId);

    // 정산 기간 조회
    const period = await prisma.settlementPeriod.findUnique({
      where: { id: parsedPeriodId },
    });

    if (!period) {
      return res.status(404).json({ error: "정산 기간을 찾을 수 없습니다." });
    }

    if (period.status !== "PREPARING") {
      return res.status(400).json({ error: "이미 처리된 정산 기간입니다." });
    }

    // 정산 기간 상태 변경
    await prisma.settlementPeriod.update({
      where: { id: parsedPeriodId },
      data: { status: "PROCESSING" },
    });

    // 해당 기간의 완료된 주문들 조회 (Product와 Seller 정보 포함)
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: period.startDate,
          lte: period.endDate,
        },
        paymentStatus: "COMPLETED",
        orderStatus: {
          in: ["DELIVERED", "CONFIRMED"], // 정산 대상 상태
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                prices: true,
              },
            },
          },
        },
      },
    });

    // 판매자별로 주문 그룹핑
    const sellerOrderMap = new Map();

    for (const order of orders) {
      for (const orderItem of order.orderItems) {
        // Product에서 sellerId를 가져와야 함 (스키마에 sellerId가 있다고 가정)
        const sellerId = orderItem.product.sellerId;

        if (!sellerOrderMap.has(sellerId.toString())) {
          sellerOrderMap.set(sellerId.toString(), {
            sellerId: sellerId,
            orders: [],
            totalAmount: 0,
          });
        }

        const sellerData = sellerOrderMap.get(sellerId.toString());
        sellerData.orders.push({
          order,
          orderItem,
        });
        sellerData.totalAmount += orderItem.totalPrice;
      }
    }

    // 각 판매자별 정산 생성
    const settlements = [];
    for (const [sellerIdStr, sellerData] of sellerOrderMap) {
      const sellerId = parseBigIntId(sellerIdStr);

      // 기본 수수료율 조회 (카테고리별/판매자별 정책이 있으면 그것을 사용)
      const commissionRate = await getCommissionRate(sellerId);

      let totalOrderAmount = 0;
      let totalCommission = 0;
      let totalDeliveryFee = 0;
      const settlementItems = [];

      for (const { order, orderItem } of sellerData.orders) {
        const commissionAmount = orderItem.totalPrice * (commissionRate / 100);
        const deliveryFee = 0; // 배송비 로직은 필요에 따라 구현
        const settlementAmount =
          orderItem.totalPrice - commissionAmount - deliveryFee;

        totalOrderAmount += orderItem.totalPrice;
        totalCommission += commissionAmount;
        totalDeliveryFee += deliveryFee;

        settlementItems.push({
          orderId: order.id,
          orderItemId: orderItem.id,
          productName: orderItem.productName,
          skuCode: orderItem.skuCode,
          quantity: orderItem.quantity,
          unitPrice: orderItem.unitPrice,
          totalPrice: orderItem.totalPrice,
          commissionRate,
          commissionAmount,
          deliveryFee,
          settlementAmount,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
        });
      }

      const finalSettlementAmount =
        totalOrderAmount - totalCommission - totalDeliveryFee;

      // 정산 생성
      const settlement = await prisma.settlement.create({
        data: {
          settlementPeriodId: parsedPeriodId,
          sellerId,
          totalOrderAmount,
          totalCommission,
          totalDeliveryFee,
          totalRefundAmount: 0,
          totalCancelAmount: 0,
          finalSettlementAmount,
          status: "PENDING",
          SettlementItem: {
            create: settlementItems,
          },
        },
        include: {
          sellers: true,
          SettlementItem: true,
        },
      });

      settlements.push(settlement);
    }

    // 정산 기간 상태 완료로 변경
    await prisma.settlementPeriod.update({
      where: { id: parsedPeriodId },
      data: { status: "COMPLETED" },
    });

    res.json({
      message: "정산 계산이 완료되었습니다.",
      period: convertBigIntToString(period),
      settlementCount: settlements.length,
      settlements: convertBigIntToString(settlements),
    });
  } catch (error) {
    console.error("정산 계산 오류:", error);

    // 오류 시 정산 기간 상태 되돌리기
    try {
      await prisma.settlementPeriod.update({
        where: { id: parseBigIntId(req.params.periodId) },
        data: { status: "PREPARING" },
      });
    } catch (rollbackError) {
      console.error("상태 롤백 실패:", rollbackError);
    }

    res
      .status(500)
      .json({ error: "정산 계산에 실패했습니다.", details: error.message });
  }
};

/**
 * 판매자별 정산 내역 조회
 * GET /settlements/seller/:sellerId
 */
exports.getSellerSettlements = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const parsedSellerId = parseBigIntId(sellerId);

    const where = { sellerId: parsedSellerId };
    if (status) {
      where.status = status;
    }

    const settlements = await prisma.settlement.findMany({
      where,
      include: {
        SettlementPeriod: true,
        SettlementItem: {
          take: 5, // 미리보기용으로 최대 5개만
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    const total = await prisma.settlement.count({ where });

    res.json({
      settlements: convertBigIntToString(settlements),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("정산 내역 조회 오류:", error);
    res.status(500).json({
      error: "정산 내역 조회에 실패했습니다.",
      details: error.message,
    });
  }
};

/**
 * 정산 상세 조회
 * GET /settlements/:settlementId
 */
exports.getSettlementById = async (req, res) => {
  try {
    const { settlementId } = req.params;
    const parsedSettlementId = parseBigIntId(settlementId);

    const settlement = await prisma.settlement.findUnique({
      where: { id: parsedSettlementId },
      include: {
        sellers: {
          select: {
            id: true,
            name: true,
            shop_name: true,
            bank_type: true,
            bank_account: true,
            depositor_name: true,
          },
        },
        SettlementPeriod: true,
        SettlementItem: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!settlement) {
      return res.status(404).json({ error: "정산 내역을 찾을 수 없습니다." });
    }

    res.json({
      settlement: convertBigIntToString(settlement),
    });
  } catch (error) {
    console.error("정산 상세 조회 오류:", error);
    res.status(500).json({
      error: "정산 상세 조회에 실패했습니다.",
      details: error.message,
    });
  }
};

/**
 * 정산 보류
 * POST /settlements/hold
 */
exports.holdSettlements = async (req, res) => {
  try {
    const { settlementIds, memo } = req.body;

    if (
      !settlementIds ||
      !Array.isArray(settlementIds) ||
      settlementIds.length === 0
    ) {
      return res.status(400).json({
        error: "정산 ID 목록이 필요합니다.",
      });
    }

    const parsedIds = settlementIds.map((id) => parseBigIntId(id));

    // 보류할 정산들이 존재하는지 확인
    const settlements = await prisma.settlement.findMany({
      where: {
        id: { in: parsedIds },
        status: { in: ["PENDING", "CALCULATING"] }, // 대기 또는 처리중 상태만 보류 가능
      },
      include: {
        sellers: true,
      },
    });

    if (settlements.length === 0) {
      return res.status(400).json({
        error: "보류할 수 있는 정산이 없습니다.",
      });
    }

    // 정산 상태를 ON_HOLD로 변경
    await prisma.$transaction(async (tx) => {
      for (const settlement of settlements) {
        await tx.settlement.update({
          where: { id: settlement.id },
          data: {
            status: "ON_HOLD",
            settledAt: null,
            memo: memo || settlement.memo,
            updatedAt: new Date(),
          },
        });
      }
    });

    res.json({
      message: `${settlements.length}개의 정산이 보류되었습니다.`,
      heldCount: settlements.length,
    });
  } catch (error) {
    console.error("정산 보류 오류:", error);
    res.status(500).json({
      error: "정산 보류에 실패했습니다.",
      details: error.message,
    });
  }
};

/**
 * 정산 보류 해제
 * POST /settlements/unhold
 */
exports.unholdSettlements = async (req, res) => {
  try {
    const { settlementIds, memo } = req.body;

    if (
      !settlementIds ||
      !Array.isArray(settlementIds) ||
      settlementIds.length === 0
    ) {
      return res.status(400).json({
        error: "정산 ID 목록이 필요합니다.",
      });
    }

    const parsedIds = settlementIds.map((id) => parseBigIntId(id));

    // 보류 해제할 정산들이 존재하는지 확인
    const settlements = await prisma.settlement.findMany({
      where: {
        id: { in: parsedIds },
        status: "ON_HOLD", // 보류 상태만 해제 가능
      },
      include: {
        sellers: true,
      },
    });

    if (settlements.length === 0) {
      return res.status(400).json({
        error: "보류 해제할 수 있는 정산이 없습니다.",
      });
    }

    // 정산 상태를 PENDING으로 변경
    await prisma.$transaction(async (tx) => {
      for (const settlement of settlements) {
        await tx.settlement.update({
          where: { id: settlement.id },
          data: {
            status: "PENDING",
            settledAt: null,
            memo: memo || settlement.memo,
            updatedAt: new Date(),
          },
        });
      }
    });

    res.json({
      message: `${settlements.length}개의 정산 보류가 해제되었습니다.`,
      unheldCount: settlements.length,
    });
  } catch (error) {
    console.error("정산 보류 해제 오류:", error);
    res.status(500).json({
      error: "정산 보류 해제에 실패했습니다.",
      details: error.message,
    });
  }
};

/**
 * 정산 삭제
 * DELETE /settlements
 */
exports.deleteSettlements = async (req, res) => {
  try {
    const { settlementIds } = req.body;

    if (
      !settlementIds ||
      !Array.isArray(settlementIds) ||
      settlementIds.length === 0
    ) {
      return res.status(400).json({
        error: "정산 ID 목록이 필요합니다.",
      });
    }

    const parsedIds = settlementIds.map((id) => parseBigIntId(id));

    // 삭제할 정산들이 존재하는지 확인
    const settlements = await prisma.settlement.findMany({
      where: {
        id: { in: parsedIds },
        status: { in: ["PENDING", "ON_HOLD"] }, // 대기 또는 보류 상태만 삭제 가능
      },
      include: {
        sellers: true,
      },
    });

    if (settlements.length === 0) {
      return res.status(400).json({
        error: "삭제할 수 있는 정산이 없습니다.",
      });
    }

    // 정산 삭제
    await prisma.$transaction(async (tx) => {
      for (const settlement of settlements) {
        await tx.settlement.delete({
          where: { id: settlement.id },
        });
      }
    });

    res.json({
      message: `${settlements.length}개의 정산이 삭제되었습니다.`,
      deletedCount: settlements.length,
    });
  } catch (error) {
    console.error("정산 삭제 오류:", error);
    res.status(500).json({
      error: "정산 삭제에 실패했습니다.",
      details: error.message,
    });
  }
};

/**
 * 정산 완료 취소
 * POST /settlements/cancel
 */
exports.cancelSettlements = async (req, res) => {
  try {
    const { settlementIds, memo } = req.body;

    if (
      !settlementIds ||
      !Array.isArray(settlementIds) ||
      settlementIds.length === 0
    ) {
      return res.status(400).json({
        error: "정산 ID 목록이 필요합니다.",
      });
    }

    const parsedIds = settlementIds.map((id) => parseBigIntId(id));

    // 취소할 정산들이 존재하는지 확인
    const settlements = await prisma.settlement.findMany({
      where: {
        id: { in: parsedIds },
        status: "COMPLETED", // 완료 상태만 취소 가능
      },
      include: {
        sellers: true,
      },
    });

    if (settlements.length === 0) {
      return res.status(400).json({
        error: "취소할 수 있는 정산이 없습니다.",
      });
    }

    // 정산 상태를 CANCELLED로 변경
    await prisma.$transaction(async (tx) => {
      for (const settlement of settlements) {
        await tx.settlement.update({
          where: { id: settlement.id },
          data: {
            status: "CANCELLED",
            settledAt: null, // 취소 시 settledAt을 null로 설정
            memo: memo || settlement.memo,
            updatedAt: new Date(),
          },
        });
      }
    });

    res.json({
      message: `${settlements.length}개의 정산이 취소되었습니다.`,
      cancelledCount: settlements.length,
    });
  } catch (error) {
    console.error("정산 취소 오류:", error);
    res.status(500).json({
      error: "정산 취소에 실패했습니다.",
      details: error.message,
    });
  }
};

/**
 * 정산 상태 변경
 * PATCH /settlements/:settlementId/status
 */
exports.updateSettlementStatus = async (req, res) => {
  try {
    const { settlementId } = req.params;
    const { status, memo } = req.body;
    const parsedSettlementId = parseBigIntId(settlementId);

    const updateData = { status };
    if (memo) updateData.memo = memo;

    // settledAt 설정 로직
    if (status === "COMPLETED") {
      updateData.settledAt = new Date();
    } else if (
      status === "PENDING" ||
      status === "CALCULATING" ||
      status === "CANCELLED" ||
      status === "ON_HOLD"
    ) {
      updateData.settledAt = null;
    }

    const settlement = await prisma.settlement.update({
      where: { id: parsedSettlementId },
      data: updateData,
      include: {
        sellers: true,
        SettlementPeriod: true,
      },
    });

    res.json({
      message: "정산 상태가 업데이트되었습니다.",
      settlement: convertBigIntToString(settlement),
    });
  } catch (error) {
    console.error("정산 상태 업데이트 오류:", error);
    res.status(500).json({
      error: "정산 상태 업데이트에 실패했습니다.",
      details: error.message,
    });
  }
};

/**
 * 수수료 정책 조회/생성
 * GET/POST /settlements/commission-policies
 */
exports.getCommissionPolicies = async (req, res) => {
  try {
    const policies = await prisma.commissionPolicy.findMany({
      where: { isActive: true },
      include: {
        sellers: {
          select: { id: true, name: true, shop_name: true },
        },
      },
      orderBy: { effectiveDate: "desc" },
    });

    res.json(convertBigIntToString(policies));
  } catch (error) {
    res.status(500).json({
      error: "수수료 정책 조회에 실패했습니다.",
      details: error.message,
    });
  }
};

exports.createCommissionPolicy = async (req, res) => {
  try {
    const {
      name,
      categoryCode,
      sellerId,
      commissionRate,
      minAmount,
      maxAmount,
      effectiveDate,
      endDate,
    } = req.body;

    const policy = await prisma.commissionPolicy.create({
      data: {
        name,
        categoryCode,
        sellerId: sellerId ? parseBigIntId(sellerId) : null,
        commissionRate: parseFloat(commissionRate),
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        effectiveDate: new Date(effectiveDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    res.status(201).json({
      message: "수수료 정책이 생성되었습니다.",
      policy: convertBigIntToString(policy),
    });
  } catch (error) {
    console.error("수수료 정책 생성 오류:", error);
    res.status(500).json({
      error: "수수료 정책 생성에 실패했습니다.",
      details: error.message,
    });
  }
};

/**
 * 수수료율 조회 헬퍼 함수
 */
async function getCommissionRate(sellerId, categoryCode = null) {
  // 판매자별 정책 우선 조회
  let policy = await prisma.commissionPolicy.findFirst({
    where: {
      sellerId: sellerId,
      isActive: true,
      effectiveDate: { lte: new Date() },
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
    },
    orderBy: { effectiveDate: "desc" },
  });

  // 카테고리별 정책 조회
  if (!policy && categoryCode) {
    policy = await prisma.commissionPolicy.findFirst({
      where: {
        categoryCode: categoryCode,
        sellerId: null,
        isActive: true,
        effectiveDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      orderBy: { effectiveDate: "desc" },
    });
  }

  // 기본 정책 조회
  if (!policy) {
    policy = await prisma.commissionPolicy.findFirst({
      where: {
        categoryCode: null,
        sellerId: null,
        isActive: true,
        effectiveDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      orderBy: { effectiveDate: "desc" },
    });
  }

  return policy ? policy.commissionRate : 5.0; // 기본 수수료 5%
}

/**
 * 상품별 정산 내역 조회
 * GET /settlements/seller/:sellerId/products
 */
exports.getSellerProductSettlements = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = "totalPrice",
      search,
      category,
      startDate,
      endDate,
    } = req.query;
    const parsedSellerId = parseBigIntId(sellerId);

    // 정산 아이템들을 상품별로 그룹핑하여 집계
    const settlementItems = await prisma.settlementItem.findMany({
      where: {
        Settlement: {
          sellerId: parsedSellerId,
          ...(startDate &&
            endDate && {
              SettlementPeriod: {
                startDate: { gte: new Date(startDate) },
                endDate: { lte: new Date(endDate) },
              },
            }),
        },
        ...(search && {
          OR: [
            { productName: { contains: search } },
            { skuCode: { contains: search } },
          ],
        }),
      },
      include: {
        Settlement: {
          include: {
            SettlementPeriod: true,
          },
        },
      },
    });

    // 상품별로 그룹핑하여 집계
    const productMap = new Map();

    settlementItems.forEach((item) => {
      const productKey = item.productName + (item.skuCode || "");

      if (!productMap.has(productKey)) {
        // Generate random product image
        const randomImageNumber = Math.floor(Math.random() * 24) + 1;
        const productImage = `/assets/images/mock/m-product/product-${randomImageNumber}.webp`;

        productMap.set(productKey, {
          id: item.id,
          product: {
            id: item.skuCode
              ? item.skuCode.replace(/[^a-zA-Z0-9]/g, "")
              : `prod_${item.id}`,
            name: item.productName,
            sku: item.skuCode,
            price: item.unitPrice,
            category: category || "생활용품",
            image: productImage,
          },
          period: {
            startDate: item.Settlement.SettlementPeriod.startDate,
            endDate: item.Settlement.SettlementPeriod.endDate,
          },
          orderCount: 0,
          totalQuantity: 0,
          salesAmount: 0,
          commissionAmount: 0,
          settlementAmount: 0,
          returnCount: 0,
          returnAmount: 0,
          avgOrderValue: 0,
          commissionRate: item.commissionRate * 100, // Convert to percentage
        });
      }

      const productData = productMap.get(productKey);
      productData.orderCount += 1;
      productData.totalQuantity += item.quantity;
      productData.salesAmount += item.totalPrice;
      productData.commissionAmount += item.commissionAmount;
      productData.settlementAmount += item.settlementAmount;
      productData.avgOrderValue =
        productData.salesAmount / productData.orderCount;
    });

    // Map을 배열로 변환
    let productSettlements = Array.from(productMap.values());

    // 정렬
    productSettlements.sort((a, b) => {
      switch (sortBy) {
        case "orderCount":
          return b.orderCount - a.orderCount;
        case "settlementAmount":
          return b.settlementAmount - a.settlementAmount;
        case "commissionAmount":
          return b.commissionAmount - a.commissionAmount;
        default: // salesAmount
          return b.salesAmount - a.salesAmount;
      }
    });

    // 페이지네이션
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = productSettlements.slice(startIndex, endIndex);

    res.json({
      success: true,
      productSettlements: convertBigIntToString(paginatedResults),
      pagination: {
        total: productSettlements.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(productSettlements.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("상품별 정산 내역 조회 오류:", error);
    res.status(500).json({
      error: "상품별 정산 내역 조회에 실패했습니다.",
      details: error.message,
    });
  }
};

module.exports = exports;
