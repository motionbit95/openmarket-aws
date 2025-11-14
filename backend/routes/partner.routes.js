const express = require("express");
const router = express.Router();
const partnerController = require("../controllers/partner.controller");

/**
 * @swagger
 * tags:
 *   name: Partner
 *   description: 판매자 전용 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PartnerOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 주문 ID
 *         orderNumber:
 *           type: string
 *           description: 주문번호
 *         customer:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *               quantity:
 *                 type: integer
 *               totalPrice:
 *                 type: number
 *         totalAmount:
 *           type: number
 *         orderStatus:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, SHIPPED, DELIVERED, CANCELLED, REFUNDED]
 *         paymentMethod:
 *           type: string
 *         shippingAddress:
 *           type: string
 *         trackingNumber:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// ==================== 주문 관리 ====================

/**
 * @swagger
 * /partner/orders:
 *   get:
 *     summary: 판매자 주문 목록 조회
 *     tags: [Partner]
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: 판매자 ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, SHIPPED, DELIVERED, CANCELLED, REFUNDED]
 *         description: 주문 상태 필터
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 주문번호, 고객명, 상품명 검색
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작일
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료일
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 주문 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PartnerOrder'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       500:
 *         description: 서버 오류
 */
router.get("/orders", partnerController.getPartnerOrders);

// 주문 상태별 개수 조회 - /orders/:orderId보다 먼저 정의해야 함
router.get("/orders/counts", partnerController.getPartnerOrderCounts);

/**
 * @swagger
 * /partner/orders/{orderId}:
 *   get:
 *     summary: 판매자 주문 상세 조회
 *     tags: [Partner]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 주문 ID
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: 판매자 ID
 *     responses:
 *       200:
 *         description: 주문 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/PartnerOrder'
 *       404:
 *         description: 주문을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/orders/:orderId", partnerController.getPartnerOrderDetail);

/**
 * @swagger
 * /partner/orders/{orderId}/status:
 *   patch:
 *     summary: 주문 상태 변경
 *     tags: [Partner]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 주문 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CONFIRMED, PREPARING, SHIPPED, DELIVERED]
 *                 description: 변경할 주문 상태
 *               trackingNumber:
 *                 type: string
 *                 description: 운송장 번호 (배송 시작 시)
 *               deliveryCompany:
 *                 type: string
 *                 description: 택배사 (배송 시작 시)
 *     responses:
 *       200:
 *         description: 주문 상태 변경 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 주문을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.patch("/orders/:orderId/status", partnerController.updateOrderStatus);

// ==================== 배송 관리 ====================

/**
 * @swagger
 * /partner/deliveries:
 *   get:
 *     summary: 판매자 배송 목록 조회
 *     tags: [Partner]
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: 판매자 ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [READY, SHIPPED, IN_TRANSIT, DELIVERED, FAILED]
 *         description: 배송 상태 필터
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 주문번호, 고객명, 운송장번호 검색
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 배송 목록 조회 성공
 *       500:
 *         description: 서버 오류
 */
router.get("/deliveries", partnerController.getPartnerDeliveries);
router.get("/deliveries/counts", partnerController.getPartnerDeliveryCounts);

/**
 * @swagger
 * /partner/deliveries/{orderId}/start:
 *   patch:
 *     summary: 배송 시작
 *     tags: [Partner]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 주문 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackingNumber
 *               - deliveryCompany
 *             properties:
 *               trackingNumber:
 *                 type: string
 *                 description: 운송장 번호
 *               deliveryCompany:
 *                 type: string
 *                 description: 택배사
 *     responses:
 *       200:
 *         description: 배송 시작 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.patch("/deliveries/:orderId/start", partnerController.startDelivery);

/**
 * @swagger
 * /partner/deliveries/{orderId}/tracking:
 *   patch:
 *     summary: 운송장 번호 업데이트
 *     tags: [Partner]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 주문 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackingNumber
 *             properties:
 *               trackingNumber:
 *                 type: string
 *                 description: 새 운송장 번호
 *     responses:
 *       200:
 *         description: 운송장 번호 업데이트 성공
 *       404:
 *         description: 주문을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.patch("/deliveries/:orderId/tracking", partnerController.updateTracking);

// ==================== 취소 관리 ====================

/**
 * @swagger
 * /partner/cancellations:
 *   get:
 *     summary: 판매자 취소 요청 목록 조회
 *     tags: [Partner]
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: 판매자 ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [REQUESTED, APPROVED, PROCESSING, COMPLETED, REJECTED]
 *         description: 취소 상태 필터
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 취소 목록 조회 성공
 *       500:
 *         description: 서버 오류
 */
router.get("/cancellations", partnerController.getPartnerCancellations);
router.get(
  "/cancellations/counts",
  partnerController.getPartnerCancellationCounts
);

/**
 * @swagger
 * /partner/cancellations/{orderId}/process:
 *   patch:
 *     summary: 취소 요청 처리
 *     tags: [Partner]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 주문 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: 취소 승인 또는 거부
 *               reason:
 *                 type: string
 *                 description: 거부 사유 (action이 reject일 때 필수)
 *     responses:
 *       200:
 *         description: 취소 처리 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.patch(
  "/cancellations/:orderId/process",
  partnerController.processCancellation
);

// ==================== 반품 관리 ====================

/**
 * @swagger
 * /partner/returns:
 *   get:
 *     summary: 판매자 반품 요청 목록 조회
 *     tags: [Partner]
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: 판매자 ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [REQUESTED, APPROVED, PICKUP_SCHEDULED, PICKED_UP, INSPECTING, COMPLETED, REJECTED]
 *         description: 반품 상태 필터
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 주문번호, 반품번호, 고객명 검색
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 반품 목록 조회 성공
 *       500:
 *         description: 서버 오류
 */
router.get("/returns", partnerController.getPartnerReturns);
router.get("/returns/counts", partnerController.getPartnerReturnCounts);

/**
 * @swagger
 * /partner/returns/{returnId}/process:
 *   patch:
 *     summary: 반품 요청 처리
 *     tags: [Partner]
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *         description: 반품 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: 반품 승인 또는 거부
 *               reason:
 *                 type: string
 *                 description: 거부 사유 (action이 reject일 때 필수)
 *     responses:
 *       200:
 *         description: 반품 처리 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.patch("/returns/:returnId/process", partnerController.processReturn);

/**
 * @swagger
 * /partner/returns/{returnId}/inspection:
 *   patch:
 *     summary: 검수 시작
 *     tags: [Partner]
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *         description: 반품 ID
 *     responses:
 *       200:
 *         description: 검수 시작 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.patch("/returns/:returnId/inspection", partnerController.startInspection);

/**
 * @swagger
 * /partner/returns/{returnId}/pickup:
 *   patch:
 *     summary: 수거 일정 등록
 *     tags: [Partner]
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *         description: 반품 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupAddress
 *               - pickupDate
 *             properties:
 *               pickupAddress:
 *                 type: string
 *                 description: 수거 주소
 *               pickupDate:
 *                 type: string
 *                 format: date
 *                 description: 수거 예정일
 *     responses:
 *       200:
 *         description: 수거 일정 등록 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.patch("/returns/:returnId/pickup", partnerController.schedulePickup);

/**
 * @swagger
 * /partner/returns/{returnId}/complete:
 *   patch:
 *     summary: 반품 완료 처리
 *     tags: [Partner]
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *         description: 반품 ID
 *     responses:
 *       200:
 *         description: 반품 완료 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.patch("/returns/:returnId/complete", partnerController.completeReturn);

/**
 * @swagger
 * /partner/returns/{returnId}:
 *   get:
 *     summary: 반품 상세 정보 조회
 *     tags: [Partner]
 *     parameters:
 *       - in: path
 *         name: returnId
 *         required: true
 *         schema:
 *           type: string
 *         description: 반품 ID
 *     responses:
 *       200:
 *         description: 반품 상세 정보
 *       404:
 *         description: 반품을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/returns/:returnId", partnerController.getReturnDetail);

// ==================== 정산 관리 ====================

/**
 * @swagger
 * /partner/settlements:
 *   get:
 *     summary: 판매자 정산 목록 조회
 *     tags: [Partner]
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: 판매자 ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CALCULATING, COMPLETED, CANCELLED, ON_HOLD]
 *         description: 정산 상태 필터
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 정산번호 검색
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작일
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료일
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 정산 목록 조회 성공
 *       500:
 *         description: 서버 오류
 */
router.get("/settlements", partnerController.getPartnerSettlements);

/**
 * @swagger
 * /partner/settlements/products:
 *   get:
 *     summary: 상품별 정산 내역 조회
 *     tags: [Partner]
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: 판매자 ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 상품명, SKU 검색
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 카테고리 필터
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [salesAmount, orderCount, settlementAmount, commissionAmount]
 *           default: salesAmount
 *         description: 정렬 기준
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작일
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료일
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 상품별 정산 내역 조회 성공
 *       500:
 *         description: 서버 오류
 */
/**
 * @swagger
 * /partner/settlements/products/{productId}:
 *   get:
 *     summary: 특정 상품의 정산 상세 정보 조회
 *     tags: [Partner]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: 상품 ID
 *       - in: query
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: 판매자 ID
 *     responses:
 *       200:
 *         description: 상품 정산 상세 정보 조회 성공
 *       404:
 *         description: 상품 또는 정산 데이터를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get(
  "/settlements/products/:productId",
  partnerController.getProductSettlementDetail
);

router.get("/settlements/products", partnerController.getProductSettlements);

/**
 * @swagger
 * /partner/settlements/{settlementId}:
 *   get:
 *     summary: 정산 상세 정보 조회
 *     tags: [Partner]
 *     parameters:
 *       - in: path
 *         name: settlementId
 *         required: true
 *         schema:
 *           type: string
 *         description: 정산 ID
 *     responses:
 *       200:
 *         description: 정산 상세 정보
 *       404:
 *         description: 정산을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/settlements/:settlementId", partnerController.getSettlementDetail);

module.exports = router;
