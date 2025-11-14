const express = require("express");
const router = express.Router();
const couponController = require("../controllers/coupon.controller");

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: 쿠폰 관리 API
 */

router.get("/seller/:sellerId", couponController.getAllCouponsBySeller);
router.get("/seller/:sellerId/all", couponController.getAllCouponsBySeller);

// 사용자가 사용 가능한 쿠폰 목록 조회
router.get(
  "/user/:userId/available",
  couponController.getAvailableCouponsByUser
);

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: 쿠폰 생성
 *     tags: [Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - coupon_type
 *               - discount_amount
 *               - total_count
 *               - start_date
 *               - end_date
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               coupon_type:
 *                 type: string
 *               discount_amount:
 *                 type: integer
 *               discount_max:
 *                 type: integer
 *                 nullable: true
 *               min_order_amount:
 *                 type: integer
 *                 nullable: true
 *               total_count:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               available_date:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       201:
 *         description: 쿠폰 생성 성공
 *       400:
 *         description: 필수 필드 누락
 *       500:
 *         description: 서버 에러
 */
router.post("/", couponController.createCoupon);

/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: 모든 쿠폰 조회
 *     tags: [Coupons]
 *     responses:
 *       200:
 *         description: 쿠폰 목록
 *       500:
 *         description: 서버 에러
 */
router.get("/", couponController.getAllCoupons);

/**
 * @swagger
 * /coupons/{id}:
 *   get:
 *     summary: 쿠폰 상세 조회
 *     tags: [Coupons]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 쿠폰 ID (BigInt 문자열)
 *     responses:
 *       200:
 *         description: 쿠폰 상세 정보
 *       404:
 *         description: 쿠폰을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
router.get("/:id", couponController.getCouponById);

/**
 * @swagger
 * /coupons/{id}:
 *   put:
 *     summary: 쿠폰 수정
 *     tags: [Coupons]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 쿠폰 ID (BigInt 문자열)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               coupon_type:
 *                 type: string
 *               discount_amount:
 *                 type: integer
 *               discount_max:
 *                 type: integer
 *                 nullable: true
 *               min_order_amount:
 *                 type: integer
 *                 nullable: true
 *               total_count:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               available_date:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       200:
 *         description: 쿠폰 수정 성공
 *       400:
 *         description: 유효하지 않은 입력값
 *       500:
 *         description: 서버 에러
 */
router.put("/:id", couponController.updateCoupon);

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     summary: 쿠폰 삭제
 *     tags: [Coupons]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 쿠폰 ID (BigInt 문자열)
 *     responses:
 *       200:
 *         description: 쿠폰 삭제 성공
 *       500:
 *         description: 서버 에러
 */
router.delete("/:id", couponController.deleteCoupon);

module.exports = router;
