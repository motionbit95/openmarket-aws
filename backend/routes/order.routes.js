const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: 주문 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 주문 ID
 *         orderNumber:
 *           type: string
 *           description: 주문번호
 *         userId:
 *           type: string
 *           description: 사용자 ID
 *         recipient:
 *           type: string
 *           description: 수령인
 *         phone:
 *           type: string
 *           description: 연락처
 *         address1:
 *           type: string
 *           description: 기본주소
 *         address2:
 *           type: string
 *           description: 상세주소
 *         totalAmount:
 *           type: number
 *           description: 총 주문금액
 *         finalAmount:
 *           type: number
 *           description: 최종 결제금액
 *         orderStatus:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, SHIPPED, DELIVERED, CANCELLED, REFUNDED]
 *         paymentStatus:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, CANCELLED, REFUNDED]
 *         paymentMethod:
 *           type: string
 *           enum: [CARD, BANK_TRANSFER, VIRTUAL_ACCOUNT, PHONE, KAKAO_PAY, NAVER_PAY, TOSS_PAY]
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: 전체 주문 목록 조회 (관리자용)
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 주문 상태 필터
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어 (주문번호, 수령인)
 *     responses:
 *       200:
 *         description: 주문 목록 조회 성공
 *       500:
 *         description: 서버 오류
 */
router.get("/", orderController.getAllOrders);

/**
 * @swagger
 * /orders/create-from-cart:
 *   post:
 *     summary: 장바구니에서 주문 생성
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - addressId
 *               - paymentMethod
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 ID
 *               addressId:
 *                 type: string
 *                 description: 배송지 ID
 *               paymentMethod:
 *                 type: string
 *                 enum: [CARD, BANK_TRANSFER, VIRTUAL_ACCOUNT, PHONE, KAKAO_PAY, NAVER_PAY, TOSS_PAY]
 *                 description: 결제 방법
 *               deliveryMemo:
 *                 type: string
 *                 description: 배송 메모
 *               usedCouponId:
 *                 type: string
 *                 description: 사용할 쿠폰 ID
 *     responses:
 *       201:
 *         description: 주문 생성 성공
 *       400:
 *         description: 잘못된 요청 (장바구니 비어있음, 유효하지 않은 쿠폰 등)
 *       500:
 *         description: 서버 오류
 */
router.post("/create-from-cart", orderController.createOrderFromCart);

// Flutter 앱 호환성을 위한 별칭 라우트
router.post("/", orderController.createOrderFromCart);
router.post("/direct", orderController.createDirectOrder);
router.post("/:orderId/cancel", orderController.cancelOrder);

/**
 * @swagger
 * /orders/user/{userId}:
 *   get:
 *     summary: 사용자의 주문 목록 조회
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 주문 목록
 *       500:
 *         description: 서버 오류
 */
router.get("/user/:userId", orderController.getUserOrders);

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: 특정 주문 상세 조회
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 주문 ID
 *     responses:
 *       200:
 *         description: 주문 상세 정보
 *       404:
 *         description: 주문을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/:orderId", orderController.getOrderById);

/**
 * @swagger
 * /orders/{orderId}/status:
 *   patch:
 *     summary: 주문 상태 업데이트
 *     tags: [Orders]
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
 *             properties:
 *               orderStatus:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, PREPARING, SHIPPED, DELIVERED, CANCELLED, REFUNDED]
 *               paymentStatus:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, FAILED, CANCELLED, REFUNDED]
 *               deliveryStatus:
 *                 type: string
 *                 enum: [PREPARING, SHIPPED, DELIVERED, RETURNED]
 *     responses:
 *       200:
 *         description: 주문 상태 업데이트 성공
 *       500:
 *         description: 서버 오류
 */
router.patch("/:orderId/status", orderController.updateOrderStatus);

/**
 * @swagger
 * /orders/{orderId}/cancel:
 *   patch:
 *     summary: 주문 취소
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 주문 ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 취소 사유
 *     responses:
 *       200:
 *         description: 주문 취소 성공
 *       400:
 *         description: 취소할 수 없는 주문
 *       404:
 *         description: 주문을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.patch("/:orderId/cancel", orderController.cancelOrder);

module.exports = router;
