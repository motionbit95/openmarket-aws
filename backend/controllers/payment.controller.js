const prisma = require("../config/prisma");
const { convertBigIntToString, parseBigIntId } = require("../utils/bigint");
const InicisPayment = require("../utils/inicis");

/**
 * 이니시스 PG 결제 요청 
 * POST /payment/inicis/request
 * 
 * 이니시스 모바일 결제창으로 리다이렉트하기 위한 결제 요청 데이터 생성
 */
exports.requestInicisPayment = async (req, res) => {
  const {
    orderId,
    paymentMethod = "CARD",
    returnUrl,
    notiUrl,
    hppMethod = "2"
  } = req.body;

  try {
    // orderId 로깅 추가
    console.log('받은 orderId:', orderId, 'type:', typeof orderId);
    
    let parsedOrderId;
    try {
      parsedOrderId = parseBigIntId(orderId);
    } catch (e) {
      console.error('OrderId 파싱 실패:', orderId, e.message);
      return res.status(400).json({ 
        error: "유효하지 않은 주문 ID 형식입니다.", 
        orderId: orderId,
        type: typeof orderId 
      });
    }
    
    const inicisPayment = new InicisPayment();

    // 주문 정보 조회
    const order = await prisma.Order.findUnique({
      where: { id: parsedOrderId },
      include: {
        users: true,
        OrderItem: {
          include: {
            Product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
    }

    if (order.paymentStatus !== 'PENDING') {
      return res.status(400).json({ error: "결제 대기 상태가 아닌 주문입니다." });
    }

    // 상품명 구성
    let goodsName;
    if (order.OrderItem.length === 1) {
      goodsName = order.OrderItem[0].productName;
    } else {
      goodsName = `${order.OrderItem[0].productName} 외 ${order.OrderItem.length - 1}건`;
    }

    // 이니시스 테스트 모드용 고정 데이터 사용 (타임스탬프만 현재 시간)
    const currentTimestamp = Date.now().toString();
    const paymentParams = inicisPayment.createPaymentParams({
      orderNumber: 'DemoTest_' + currentTimestamp,
      amount: 1000, // 고정 테스트 금액
      goodsName: '테스트상품',
      buyerName: '테스터',
      returnUrl: returnUrl,
      paymentMethod: paymentMethod,
      notiUrl: notiUrl,
      hppMethod: hppMethod,
      // 추가 테스트 데이터
      buyerTel: '01012345678',
      buyerEmail: 'test@test.com',
      timestamp: currentTimestamp
    });

    // 결제 요청 로그 저장
    await prisma.Order.update({
      where: { id: parsedOrderId },
      data: {
        paymentMethod: paymentMethod
      }
    });

    res.json({
      message: "이니시스 결제 요청 데이터가 생성되었습니다.",
      paymentUrl: inicisPayment.getPaymentUrl(),
      method: "POST",
      charset: "EUC-KR",
      params: paymentParams,
      order: {
        orderNumber: order.orderNumber,
        finalAmount: order.finalAmount,
        goodsName: goodsName
      }
    });

  } catch (error) {
    console.error("이니시스 결제 요청 오류:", error);
    res.status(500).json({ error: "결제 요청 처리에 실패했습니다.", details: error.message });
  }
};

/**
 * 이니시스 결제 결과 처리
 * POST /payment/inicis/callback
 * 
 * 이니시스에서 P_NEXT_URL로 전송하는 결제 결과 처리
 */
exports.handleInicisCallback = async (req, res) => {
  try {
    const inicisPayment = new InicisPayment();
    const { idc_name, P_REQ_URL, P_OID, P_AMT } = req.body;

    // 1. IDC센터코드 검증
    if (!inicisPayment.validateIdcCode(idc_name)) {
      console.error('Invalid IDC center code:', idc_name);
      return res.status(400).json({ 
        error: "유효하지 않은 IDC센터코드입니다.",
        receivedIdcCode: idc_name
      });
    }

    // 2. 승인요청 URL 검증
    if (!inicisPayment.validateReqUrl(P_REQ_URL, idc_name)) {
      console.error('Invalid approval request URL:', P_REQ_URL);
      return res.status(400).json({ 
        error: "승인요청 URL이 유효하지 않습니다.",
        receivedUrl: P_REQ_URL
      });
    }

    // 3. 주문번호로 주문 조회
    const order = await prisma.Order.findFirst({
      where: { orderNumber: P_OID }
    });

    if (!order) {
      return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
    }

    // 4. 결제 결과 파싱
    const paymentResult = inicisPayment.parsePaymentResult(req.body);

    if (paymentResult.success) {
      // 결제 성공 - 금액 검증
      const paidAmount = parseFloat(P_AMT);
      if (Math.abs(order.finalAmount - paidAmount) > 1) {
        return res.status(400).json({
          error: "결제 금액이 일치하지 않습니다.",
          expectedAmount: order.finalAmount,
          paidAmount: paidAmount
        });
      }

      // 결제 승인 처리
      const result = await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'COMPLETED',
            orderStatus: 'CONFIRMED',
            paymentId: paymentResult.tid,
            paidAt: paymentResult.authDate ? 
              new Date(paymentResult.authDate.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')) : 
              new Date()
          }
        });

        // 재고 차감
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: order.id }
        });

        for (const orderItem of orderItems) {
          await tx.product.update({
            where: { id: orderItem.productId },
            data: {
              stockQuantity: {
                decrement: orderItem.quantity
              }
            }
          });
        }

        return updatedOrder;
      });

      res.json({
        success: true,
        message: "결제가 성공적으로 완료되었습니다.",
        order: convertBigIntToString(result),
        payment: paymentResult
      });

    } else {
      // 결제 실패
      await prisma.Order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          orderStatus: 'CANCELLED'
        }
      });

      res.json({
        success: false,
        message: "결제가 실패했습니다.",
        error: paymentResult.message || `결제 실패 (상태코드: ${paymentResult.status})`,
        statusCode: paymentResult.status,
        resultMessage: paymentResult.message
      });
    }

  } catch (error) {
    console.error("이니시스 콜백 처리 오류:", error);
    res.status(500).json({ error: "결제 결과 처리에 실패했습니다.", details: error.message });
  }
};

/**
 * 이니시스 망취소 요청
 * POST /payment/inicis/net-cancel
 * 
 * 승인결과 전문 처리 중 예외발생 시 망취소 요청
 * 인증TID 기준 10분 이내, 승인TID 기준 1분 이내에만 가능
 */
exports.requestInicisNetCancel = async (req, res) => {
  const { P_TID, P_MID, P_AMT, P_OID, P_REQ_URL, hashKey } = req.body;

  try {
    const inicisPayment = new InicisPayment();

    // 필수 파라미터 검증
    if (!P_TID || !P_MID || !P_AMT || !P_OID || !P_REQ_URL) {
      return res.status(400).json({
        error: "필수 파라미터가 누락되었습니다.",
        required: ["P_TID", "P_MID", "P_AMT", "P_OID", "P_REQ_URL"]
      });
    }

    // 망취소 요청
    const cancelResult = await inicisPayment.requestNetCancel(req.body);

    console.log('망취소 응답:', cancelResult);

    if (cancelResult.P_STATUS === '00') {
      // 망취소 성공 - 주문 상태를 취소로 변경
      const order = await prisma.Order.findFirst({
        where: { orderNumber: P_OID }
      });

      if (order) {
        await prisma.Order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'CANCELLED',
            orderStatus: 'CANCELLED'
          }
        });

        // 재고 복원
        const orderItems = await prisma.OrderItem.findMany({
          where: { orderId: order.id }
        });

        for (const orderItem of orderItems) {
          await prisma.product.update({
            where: { id: orderItem.productId },
            data: {
              stockQuantity: {
                increment: orderItem.quantity
              }
            }
          });
        }
      }

      res.json({
        success: true,
        message: "망취소가 성공적으로 완료되었습니다.",
        result: {
          status: cancelResult.P_STATUS,
          message: cancelResult.P_RMESG1,
          canceledTid: cancelResult.P_TID,
          originalTid: P_TID
        }
      });

    } else {
      // 망취소 실패
      res.json({
        success: false,
        message: "망취소가 실패했습니다.",
        error: {
          status: cancelResult.P_STATUS,
          message: cancelResult.P_RMESG1 || "망취소 처리 중 오류가 발생했습니다."
        }
      });
    }

  } catch (error) {
    console.error("망취소 요청 오류:", error);

    res.status(500).json({ 
      error: "망취소 요청에 실패했습니다.", 
      details: error.message,
      ...(error.code === 'ECONNABORTED' && { reason: "타임아웃" }),
      ...(error.response?.status && { httpStatus: error.response.status })
    });
  }
};

/**
 * 결제 승인 처리
 * POST /payment/approve
 * 
 * 실제 프로덕션에서는 PG사(포트원, 토스페이먼츠 등)의 웹훅이나 
 * 프론트엔드에서 결제 완료 후 호출되는 API
 */
exports.approvePayment = async (req, res) => {
  const {
    orderId,
    paymentId, // PG사에서 제공하는 결제 ID
    paymentMethod,
    paidAmount,
    paymentData // PG사에서 전달받은 추가 결제 정보
  } = req.body;

  try {
    const parsedOrderId = parseBigIntId(orderId);

    // 주문 조회
    const order = await prisma.Order.findUnique({
      where: { id: parsedOrderId },
      include: {
        OrderItem: {
          include: {
            Product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
    }

    // 이미 결제 완료된 주문인지 확인
    if (order.paymentStatus === 'COMPLETED') {
      return res.status(400).json({ error: "이미 결제가 완료된 주문입니다." });
    }

    // 결제 금액 검증
    if (Math.abs(order.finalAmount - paidAmount) > 1) { // 1원 오차 허용
      return res.status(400).json({ 
        error: "결제 금액이 일치하지 않습니다.",
        expectedAmount: order.finalAmount,
        paidAmount: paidAmount
      });
    }

    // 트랜잭션으로 결제 승인 처리
    const result = await prisma.$transaction(async (tx) => {
      // 주문 상태 업데이트
      const updatedOrder = await tx.order.update({
        where: { id: parsedOrderId },
        data: {
          paymentStatus: 'COMPLETED',
          orderStatus: 'CONFIRMED',
          paymentId: paymentId,
          paidAt: new Date()
        }
      });

      // 상품 재고 차감 (실제 프로덕션에서는 재고 관리 로직 필요)
      for (const orderItem of order.OrderItem) {
        await tx.product.update({
          where: { id: orderItem.productId },
          data: {
            stockQuantity: {
              decrement: orderItem.quantity
            }
          }
        });
      }

      return updatedOrder;
    });

    res.json({
      message: "결제가 승인되었습니다.",
      order: convertBigIntToString(result)
    });

  } catch (error) {
    console.error("결제 승인 오류:", error);
    res.status(500).json({ error: "결제 승인 처리에 실패했습니다.", details: error.message });
  }
};

/**
 * 결제 실패 처리
 * POST /payment/fail
 */
exports.failPayment = async (req, res) => {
  const { orderId, failureReason } = req.body;

  try {
    const parsedOrderId = parseBigIntId(orderId);

    const updatedOrder = await prisma.Order.update({
      where: { id: parsedOrderId },
      data: {
        paymentStatus: 'FAILED',
        orderStatus: 'CANCELLED'
      }
    });

    res.json({
      message: "결제 실패 처리가 완료되었습니다.",
      order: convertBigIntToString(updatedOrder)
    });

  } catch (error) {
    console.error("결제 실패 처리 오류:", error);
    res.status(500).json({ error: "결제 실패 처리에 실패했습니다.", details: error.message });
  }
};

/**
 * 환불 처리
 * POST /payment/refund
 */
exports.refundPayment = async (req, res) => {
  const { orderId, refundAmount, refundReason } = req.body;

  try {
    const parsedOrderId = parseBigIntId(orderId);

    // 주문 조회
    const order = await prisma.Order.findUnique({
      where: { id: parsedOrderId },
      include: {
        OrderItem: {
          include: {
            Product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
    }

    if (order.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({ error: "결제가 완료되지 않은 주문은 환불할 수 없습니다." });
    }

    // 환불 금액 검증
    if (refundAmount > order.finalAmount) {
      return res.status(400).json({ error: "환불 금액이 결제 금액을 초과할 수 없습니다." });
    }

    // 트랜잭션으로 환불 처리
    const result = await prisma.$transaction(async (tx) => {
      // 주문 상태 업데이트
      const updatedOrder = await tx.order.update({
        where: { id: parsedOrderId },
        data: {
          paymentStatus: 'REFUNDED',
          orderStatus: 'REFUNDED'
        }
      });

      // 재고 복원
      for (const orderItem of order.OrderItem) {
        await tx.product.update({
          where: { id: orderItem.productId },
          data: {
            stockQuantity: {
              increment: orderItem.quantity
            }
          }
        });
      }

      // 쿠폰 사용 취소 (쿠폰이 사용되었다면)
      if (order.usedCouponId) {
        await tx.userCoupon.updateMany({
          where: {
            userId: order.userId,
            couponId: order.usedCouponId
          },
          data: {
            used: false,
            usedAt: null
          }
        });
      }

      return updatedOrder;
    });

    res.json({
      message: "환불 처리가 완료되었습니다.",
      order: convertBigIntToString(result)
    });

  } catch (error) {
    console.error("환불 처리 오류:", error);
    res.status(500).json({ error: "환불 처리에 실패했습니다.", details: error.message });
  }
};

/**
 * 결제 정보 조회
 * GET /payment/order/:orderId
 */
exports.getPaymentInfo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const parsedOrderId = parseBigIntId(orderId);

    const order = await prisma.Order.findUnique({
      where: { id: parsedOrderId },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        discountAmount: true,
        deliveryFee: true,
        finalAmount: true,
        paymentMethod: true,
        paymentStatus: true,
        paymentId: true,
        paidAt: true,
        createdAt: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
    }

    res.json(convertBigIntToString(order));

  } catch (error) {
    console.error("결제 정보 조회 오류:", error);
    res.status(500).json({ error: "결제 정보 조회에 실패했습니다.", details: error.message });
  }
};

/**
 * PG사 웹훅 처리 (예시)
 * POST /payment/webhook
 * 
 * 실제 구현시에는 각 PG사의 웹훅 스펙에 맞춰 구현
 */
exports.handleWebhook = async (req, res) => {
  try {
    // PG사별 시그니처 검증 로직이 들어가야 함
    const { type, data } = req.body;
    
    switch (type) {
      case 'payment.completed':
        // 결제 완료 웹훅 처리
        await exports.approvePayment({
          body: {
            orderId: data.orderId,
            paymentId: data.paymentId,
            paymentMethod: data.paymentMethod,
            paidAmount: data.paidAmount,
            paymentData: data
          }
        }, res);
        break;
        
      case 'payment.failed':
        // 결제 실패 웹훅 처리
        await exports.failPayment({
          body: {
            orderId: data.orderId,
            failureReason: data.failureReason
          }
        }, res);
        break;
        
      default:
        res.status(400).json({ error: "지원하지 않는 웹훅 타입입니다." });
    }
    
  } catch (error) {
    console.error("웹훅 처리 오류:", error);
    res.status(500).json({ error: "웹훅 처리에 실패했습니다." });
  }
};

module.exports = exports;