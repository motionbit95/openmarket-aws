const express = require("express");
const router = express.Router();
const settlementController = require("../controllers/settlement.controller");

/**
 * @swagger
 * tags:
 *   name: Settlements
 *   description: 정산 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SettlementPeriod:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 정산 기간 ID
 *         periodType:
 *           type: string
 *           enum: [WEEKLY, MONTHLY]
 *           description: 정산 주기 타입
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: 정산 기간 시작일
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: 정산 기간 종료일
 *         settlementDate:
 *           type: string
 *           format: date-time
 *           description: 실제 정산일
 *         status:
 *           type: string
 *           enum: [PREPARING, PROCESSING, COMPLETED, CANCELLED]
 *           description: 정산 기간 상태
 *
 *     Settlement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 정산 ID
 *         settlementPeriodId:
 *           type: string
 *           description: 정산 기간 ID
 *         sellerId:
 *           type: string
 *           description: 판매자 ID
 *         totalOrderAmount:
 *           type: number
 *           description: 총 주문금액
 *         totalCommission:
 *           type: number
 *           description: 총 수수료
 *         totalDeliveryFee:
 *           type: number
 *           description: 총 배송비
 *         finalSettlementAmount:
 *           type: number
 *           description: 최종 정산금액
 *         status:
 *           type: string
 *           enum: [PENDING, CALCULATING, COMPLETED, CANCELLED, ON_HOLD]
 *           description: 정산 상태
 *         settledAt:
 *           type: string
 *           format: date-time
 *           description: 정산 완료일
 *
 *     CommissionPolicy:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 수수료 정책 ID
 *         name:
 *           type: string
 *           description: 정책명
 *         categoryCode:
 *           type: string
 *           description: 적용 카테고리 코드
 *         sellerId:
 *           type: string
 *           description: 적용 판매자 ID
 *         commissionRate:
 *           type: number
 *           description: 수수료율 (%)
 *         effectiveDate:
 *           type: string
 *           format: date-time
 *           description: 적용 시작일
 */

/**
 * @swagger
 * /settlements:
 *   get:
 *     summary: 정산 목록 조회
 *     tags: [Settlements]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED]
 *           default: PENDING
 *         description: 정산 상태 필터
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 판매자명 또는 이메일 검색
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 시작일
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
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
 *         description: 정산 목록 조회 성공
 *       500:
 *         description: 서버 오류
 */
router.get("/", settlementController.getSettlements);

/**
 * @swagger
 * /settlements:
 *   post:
 *     summary: 정산 데이터 생성
 *     tags: [Settlements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settlementPeriodId
 *               - sellerId
 *               - totalOrderAmount
 *               - totalCommission
 *             properties:
 *               settlementPeriodId:
 *                 type: string
 *                 description: 정산 기간 ID
 *               sellerId:
 *                 type: string
 *                 description: 판매자 ID
 *               totalOrderAmount:
 *                 type: number
 *                 description: 총 주문금액
 *               totalCommission:
 *                 type: number
 *                 description: 총 수수료
 *               totalDeliveryFee:
 *                 type: number
 *                 default: 0
 *                 description: 총 배송비
 *               totalRefundAmount:
 *                 type: number
 *                 default: 0
 *                 description: 총 환불금액
 *               totalCancelAmount:
 *                 type: number
 *                 default: 0
 *                 description: 총 취소금액
 *               adjustmentAmount:
 *                 type: number
 *                 default: 0
 *                 description: 조정금액
 *               memo:
 *                 type: string
 *                 description: 메모
 *     responses:
 *       201:
 *         description: 정산 데이터 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/", settlementController.createSettlement);

/**
 * @swagger
 * /settlements/process:
 *   post:
 *     summary: 정산 처리
 *     tags: [Settlements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settlementIds
 *             properties:
 *               settlementIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 처리할 정산 ID 목록
 *               commissionRate:
 *                 type: number
 *                 default: 10
 *                 description: 수수료율 (%)
 *     responses:
 *       200:
 *         description: 정산 처리 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/process", settlementController.processSettlements);

/**
 * @swagger
 * /settlements/complete:
 *   post:
 *     summary: 정산 완료 처리
 *     tags: [Settlements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settlementIds
 *             properties:
 *               settlementIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 완료 처리할 정산 ID 목록
 *     responses:
 *       200:
 *         description: 정산 완료 처리 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/complete", settlementController.completeSettlements);

/**
 * @swagger
 * /settlements/hold:
 *   post:
 *     summary: 정산 보류
 *     tags: [Settlements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settlementIds
 *             properties:
 *               settlementIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 보류할 정산 ID 목록
 *               memo:
 *                 type: string
 *                 description: 보류 사유
 *     responses:
 *       200:
 *         description: 정산 보류 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/hold", settlementController.holdSettlements);

/**
 * @swagger
 * /settlements/unhold:
 *   post:
 *     summary: 정산 보류 해제
 *     tags: [Settlements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settlementIds
 *             properties:
 *               settlementIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 보류 해제할 정산 ID 목록
 *               memo:
 *                 type: string
 *                 description: 해제 사유
 *     responses:
 *       200:
 *         description: 정산 보류 해제 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/unhold", settlementController.unholdSettlements);

/**
 * @swagger
 * /settlements:
 *   delete:
 *     summary: 정산 삭제
 *     tags: [Settlements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settlementIds
 *             properties:
 *               settlementIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 삭제할 정산 ID 목록
 *     responses:
 *       200:
 *         description: 정산 삭제 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.delete("/", settlementController.deleteSettlements);

/**
 * @swagger
 * /settlements/cancel:
 *   post:
 *     summary: 정산 완료 취소
 *     tags: [Settlements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settlementIds
 *             properties:
 *               settlementIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 취소할 정산 ID 목록
 *               memo:
 *                 type: string
 *                 description: 취소 사유
 *     responses:
 *       200:
 *         description: 정산 취소 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/cancel", settlementController.cancelSettlements);

/**
 * @swagger
 * /settlements/periods:
 *   post:
 *     summary: 정산 기간 생성
 *     tags: [Settlements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - periodType
 *               - startDate
 *               - endDate
 *               - settlementDate
 *             properties:
 *               periodType:
 *                 type: string
 *                 enum: [WEEKLY, MONTHLY]
 *                 description: 정산 주기
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: 정산 기간 시작일
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: 정산 기간 종료일
 *               settlementDate:
 *                 type: string
 *                 format: date-time
 *                 description: 실제 정산일
 *     responses:
 *       201:
 *         description: 정산 기간 생성 성공
 *       500:
 *         description: 서버 오류
 */
router.post("/periods", settlementController.createSettlementPeriod);

/**
 * @swagger
 * /settlements/commission-policies:
 *   get:
 *     summary: 수수료 정책 목록 조회
 *     tags: [Settlements]
 *     responses:
 *       200:
 *         description: 수수료 정책 목록
 *       500:
 *         description: 서버 오류
 *   post:
 *     summary: 수수료 정책 생성
 *     tags: [Settlements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - commissionRate
 *               - effectiveDate
 *             properties:
 *               name:
 *                 type: string
 *                 description: 정책명
 *               categoryCode:
 *                 type: string
 *                 description: 적용 카테고리 코드
 *               sellerId:
 *                 type: string
 *                 description: 적용 판매자 ID
 *               commissionRate:
 *                 type: number
 *                 description: 수수료율 (%)
 *               minAmount:
 *                 type: number
 *                 description: 최소 수수료 금액
 *               maxAmount:
 *                 type: number
 *                 description: 최대 수수료 금액
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *                 description: 적용 시작일
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: 적용 종료일
 *     responses:
 *       201:
 *         description: 수수료 정책 생성 성공
 *       500:
 *         description: 서버 오류
 */
router.get("/commission-policies", settlementController.getCommissionPolicies);
router.post(
  "/commission-policies",
  settlementController.createCommissionPolicy
);

/**
 * @swagger
 * /settlements/calculate/{periodId}:
 *   post:
 *     summary: 정산 계산 실행
 *     tags: [Settlements]
 *     parameters:
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema:
 *           type: string
 *         description: 정산 기간 ID
 *     responses:
 *       200:
 *         description: 정산 계산 완료
 *       400:
 *         description: 잘못된 요청 (이미 처리된 기간)
 *       404:
 *         description: 정산 기간을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post("/calculate/:periodId", settlementController.calculateSettlement);

/**
 * @swagger
 * /settlements/seller/{sellerId}:
 *   get:
 *     summary: 판매자별 정산 내역 조회
 *     tags: [Settlements]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: 판매자 ID
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CALCULATING, COMPLETED, CANCELLED, ON_HOLD]
 *         description: 정산 상태 필터
 *     responses:
 *       200:
 *         description: 정산 내역 목록
 *       500:
 *         description: 서버 오류
 */
router.get("/seller/:sellerId", settlementController.getSellerSettlements);

/**
 * @swagger
 * /settlements/seller/{sellerId}/products:
 *   get:
 *     summary: 판매자별 상품별 정산 내역 조회
 *     tags: [Settlements]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: 판매자 ID
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [salesAmount, orderCount, settlementAmount, commissionAmount]
 *           default: salesAmount
 *         description: 정렬 기준
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
 *     responses:
 *       200:
 *         description: 상품별 정산 내역 목록
 *       500:
 *         description: 서버 오류
 */
router.get(
  "/seller/:sellerId/products",
  settlementController.getSellerProductSettlements
);

/**
 * @swagger
 * /settlements/{settlementId}/status:
 *   patch:
 *     summary: 정산 상태 변경
 *     tags: [Settlements]
 *     parameters:
 *       - in: path
 *         name: settlementId
 *         required: true
 *         schema:
 *           type: string
 *         description: 정산 ID
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
 *                 enum: [PENDING, CALCULATING, COMPLETED, CANCELLED, ON_HOLD]
 *                 description: 변경할 상태
 *               memo:
 *                 type: string
 *                 description: 메모
 *     responses:
 *       200:
 *         description: 정산 상태 업데이트 성공
 *       500:
 *         description: 서버 오류
 */
router.patch(
  "/:settlementId/status",
  settlementController.updateSettlementStatus
);

/**
 * @swagger
 * /settlements/{settlementId}:
 *   get:
 *     summary: 정산 상세 조회
 *     tags: [Settlements]
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
router.get("/:settlementId", settlementController.getSettlementById);

module.exports = router;
