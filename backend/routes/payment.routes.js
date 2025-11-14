const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: 결제/환불 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 주문 ID
 *         orderNumber:
 *           type: string
 *           description: 주문번호
 *         totalAmount:
 *           type: number
 *           description: 총 주문금액
 *         discountAmount:
 *           type: number
 *           description: 할인금액
 *         deliveryFee:
 *           type: number
 *           description: 배송비
 *         finalAmount:
 *           type: number
 *           description: 최종 결제금액
 *         paymentMethod:
 *           type: string
 *           enum: [CARD, BANK_TRANSFER, VIRTUAL_ACCOUNT, PHONE, KAKAO_PAY, NAVER_PAY, TOSS_PAY]
 *         paymentStatus:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, CANCELLED, REFUNDED]
 */

/**
 * @swagger
 * /payment/approve:
 *   post:
 *     summary: 결제 승인 처리
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - paymentId
 *               - paymentMethod
 *               - paidAmount
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: 주문 ID
 *               paymentId:
 *                 type: string
 *                 description: PG사 결제 ID
 *               paymentMethod:
 *                 type: string
 *                 enum: [CARD, BANK_TRANSFER, VIRTUAL_ACCOUNT, PHONE, KAKAO_PAY, NAVER_PAY, TOSS_PAY]
 *               paidAmount:
 *                 type: number
 *                 description: 실제 결제 금액
 *               paymentData:
 *                 type: object
 *                 description: PG사에서 전달받은 추가 결제 정보
 *     responses:
 *       200:
 *         description: 결제 승인 성공
 *       400:
 *         description: 잘못된 요청 (금액 불일치, 이미 완료된 주문 등)
 *       404:
 *         description: 주문을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post("/approve", paymentController.approvePayment);

/**
 * @swagger
 * /payment/fail:
 *   post:
 *     summary: 결제 실패 처리
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: 주문 ID
 *               failureReason:
 *                 type: string
 *                 description: 실패 사유
 *     responses:
 *       200:
 *         description: 결제 실패 처리 완료
 *       500:
 *         description: 서버 오류
 */
router.post("/fail", paymentController.failPayment);

/**
 * @swagger
 * /payment/refund:
 *   post:
 *     summary: 환불 처리
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - refundAmount
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: 주문 ID
 *               refundAmount:
 *                 type: number
 *                 description: 환불 금액
 *               refundReason:
 *                 type: string
 *                 description: 환불 사유
 *     responses:
 *       200:
 *         description: 환불 처리 완료
 *       400:
 *         description: 잘못된 요청 (환불 불가능한 상태, 금액 오류 등)
 *       404:
 *         description: 주문을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post("/refund", paymentController.refundPayment);

/**
 * @swagger
 * /payment/order/{orderId}:
 *   get:
 *     summary: 결제 정보 조회
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 주문 ID
 *     responses:
 *       200:
 *         description: 결제 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentInfo'
 *       404:
 *         description: 주문을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/order/:orderId", paymentController.getPaymentInfo);

/**
 * @swagger
 * /payment/webhook:
 *   post:
 *     summary: PG사 웹훅 처리
 *     tags: [Payment]
 *     description: PG사에서 결제 상태 변경시 호출하는 웹훅 엔드포인트
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [payment.completed, payment.failed]
 *                 description: 웹훅 타입
 *               data:
 *                 type: object
 *                 description: 웹훅 데이터
 *     responses:
 *       200:
 *         description: 웹훅 처리 완료
 *       400:
 *         description: 지원하지 않는 웹훅 타입
 *       500:
 *         description: 서버 오류
 */
router.post("/webhook", paymentController.handleWebhook);

/**
 * @swagger
 * /payment/inicis/request:
 *   post:
 *     summary: 이니시스 PG 결제 요청
 *     tags: [Payment]
 *     description: 이니시스 모바일 결제창으로 리다이렉트하기 위한 결제 요청 데이터 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - returnUrl
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: 주문 ID
 *               paymentMethod:
 *                 type: string
 *                 enum: [CARD, VIRTUAL_ACCOUNT, PHONE, BANK_TRANSFER]
 *                 default: CARD
 *                 description: 결제 수단
 *               returnUrl:
 *                 type: string
 *                 description: 결제 완료 후 리턴 URL (P_NEXT_URL)
 *               notiUrl:
 *                 type: string
 *                 description: 가상계좌 입금통보 URL (가상계좌 결제시 필수)
 *               hppMethod:
 *                 type: string
 *                 enum: ["1", "2"]
 *                 default: "2"
 *                 description: 휴대폰결제 상품유형 (1:컨텐츠, 2:실물)
 *               mid:
 *                 type: string
 *                 description: 상점 ID (환경변수 INICIS_MID 사용 시 생략 가능)
 *     responses:
 *       200:
 *         description: 이니시스 결제 요청 데이터 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 paymentUrl:
 *                   type: string
 *                   description: 이니시스 결제 URL
 *                 method:
 *                   type: string
 *                   description: HTTP 메서드 (POST)
 *                 charset:
 *                   type: string
 *                   description: 문자셋 (EUC-KR)
 *                 params:
 *                   type: object
 *                   description: 이니시스 결제 요청 파라미터
 *                   properties:
 *                     P_INI_PAYMENT:
 *                       type: string
 *                       description: 요청지불수단
 *                     P_MID:
 *                       type: string
 *                       description: 상점아이디
 *                     P_OID:
 *                       type: string
 *                       description: 주문번호
 *                     P_AMT:
 *                       type: number
 *                       description: 결제금액
 *                     P_GOODS:
 *                       type: string
 *                       description: 상품명
 *                     P_UNAME:
 *                       type: string
 *                       description: 구매자명
 *                     P_NEXT_URL:
 *                       type: string
 *                       description: 결과수신 URL
 *                     P_RESERVED:
 *                       type: string
 *                       description: 예약필드
 *                 order:
 *                   type: object
 *                   description: 주문 정보
 *       400:
 *         description: 결제 대기 상태가 아닌 주문
 *       404:
 *         description: 주문을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post("/inicis/request", paymentController.requestInicisPayment);

/**
 * @swagger
 * /payment/inicis/callback:
 *   post:
 *     summary: 이니시스 결제 결과 처리
 *     tags: [Payment]
 *     description: 이니시스에서 P_NEXT_URL로 전송하는 결제 결과 처리
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               P_STATUS:
 *                 type: string
 *                 description: 결제상태 (00:성공, 기타:실패)
 *               P_RMESG1:
 *                 type: string
 *                 description: 결과메시지
 *               P_TID:
 *                 type: string
 *                 description: 인증거래번호 (성공시에만 전달)
 *               P_OID:
 *                 type: string
 *                 description: 주문번호
 *               P_AMT:
 *                 type: string
 *                 description: 거래금액
 *               P_AUTH_DT:
 *                 type: string
 *                 description: 승인일시
 *               P_AUTH_NO:
 *                 type: string
 *                 description: 승인번호
 *               P_TYPE:
 *                 type: string
 *                 description: 결제수단
 *               P_UNAME:
 *                 type: string
 *                 description: 구매자명
 *               P_MID:
 *                 type: string
 *                 description: 상점아이디
 *               P_GOODS:
 *                 type: string
 *                 description: 상품명
 *               P_FN_NM:
 *                 type: string
 *                 description: 카드사명/은행명
 *               P_FN_CD:
 *                 type: string
 *                 description: 카드사코드/은행코드
 *               idc_name:
 *                 type: string
 *                 enum: [fc, ks, stg]
 *                 description: IDC센터코드
 *               P_REQ_URL:
 *                 type: string
 *                 description: 승인요청 URL (IDC센터코드와 비교검증 필요)
 *               P_NOTI:
 *                 type: string
 *                 description: 가맹점 임의 데이터
 *               P_NOTEURL:
 *                 type: string
 *                 description: 가맹점 전달 P_NOTI_URL
 *               P_NEXT_URL:
 *                 type: string
 *                 description: 가맹점 전달 P_NEXT_URL
 *               P_MNAME:
 *                 type: string
 *                 description: 가맹점명
 *               # 신용카드 전용 파라미터
 *               P_CARD_NUM:
 *                 type: string
 *                 description: 신용카드번호
 *               P_CARD_INTEREST:
 *                 type: string
 *                 description: 상점부담 무이자 할부여부
 *               P_RMESG2:
 *                 type: string
 *                 description: 카드 할부기간
 *               CARD_CorpFlag:
 *                 type: string
 *                 enum: ["0", "1", "9"]
 *                 description: 카드구분 (0:개인카드, 1:법인카드, 9:구분불가)
 *               P_CARD_CHECKFLAG:
 *                 type: string
 *                 enum: ["0", "1", "2"]
 *                 description: 카드종류 (0:신용카드, 1:체크카드, 2:기프트카드)
 *               P_CARD_PRTC_CODE:
 *                 type: string
 *                 enum: ["0", "1"]
 *                 description: 부분취소 가능여부
 *               # 가상계좌 전용 파라미터
 *               P_VACT_NUM:
 *                 type: string
 *                 description: 가상계좌번호
 *               P_VACT_BANK_CODE:
 *                 type: string
 *                 description: 입금은행코드
 *               P_VACT_NAME:
 *                 type: string
 *                 description: 예금주명
 *               P_VACT_DATE:
 *                 type: string
 *                 description: 입금기한일자 [YYYYMMDD]
 *               P_VACT_TIME:
 *                 type: string
 *                 description: 입금기한시각 [hhmmss]
 *               # 휴대폰 전용 파라미터
 *               P_HPP_NUM:
 *                 type: string
 *                 description: 휴대폰번호
 *               P_HPP_CORP:
 *                 type: string
 *                 description: 휴대폰통신사
 *               # 현금영수증 파라미터
 *               P_CSHR_CODE:
 *                 type: string
 *                 description: 현금영수증 결과코드
 *               P_CSHR_MSG:
 *                 type: string
 *                 description: 현금영수증 결과메시지
 *               P_CSHR_AMT:
 *                 type: number
 *                 description: 현금영수증 총 금액
 *               P_CSHR_TYPE:
 *                 type: string
 *                 enum: ["0", "1"]
 *                 description: 용도구분 (0:소득공제, 1:지출증빙)
 *     responses:
 *       200:
 *         description: 결제 결과 처리 완료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 결제 성공 여부
 *                 message:
 *                   type: string
 *                   description: 처리 결과 메시지
 *                 order:
 *                   type: object
 *                   description: 주문 정보 (성공시)
 *                 payment:
 *                   type: object
 *                   description: 결제 정보 (결제 수단별로 다른 필드 포함)
 *                   properties:
 *                     tid:
 *                       type: string
 *                       description: 거래번호
 *                     merchantId:
 *                       type: string
 *                       description: 상점아이디
 *                     orderNumber:
 *                       type: string
 *                       description: 주문번호
 *                     amount:
 *                       type: string
 *                       description: 거래금액
 *                     paymentMethod:
 *                       type: string
 *                       description: 지불수단
 *                     authDate:
 *                       type: string
 *                       description: 승인일자
 *                     buyerName:
 *                       type: string
 *                       description: 구매자명
 *                     card:
 *                       type: object
 *                       description: 신용카드 결제시 포함
 *                       properties:
 *                         authNo:
 *                           type: string
 *                           description: 승인번호
 *                         cardNumber:
 *                           type: string
 *                           description: 카드번호
 *                         cardName:
 *                           type: string
 *                           description: 카드사명
 *                         cardType:
 *                           type: string
 *                           description: 카드종류
 *                     virtualAccount:
 *                       type: object
 *                       description: 가상계좌 결제시 포함
 *                       properties:
 *                         accountNumber:
 *                           type: string
 *                           description: 가상계좌번호
 *                         bankName:
 *                           type: string
 *                           description: 은행명
 *                         depositorName:
 *                           type: string
 *                           description: 예금주명
 *                         expireDate:
 *                           type: string
 *                           description: 입금기한일자
 *                     cashReceipt:
 *                       type: object
 *                       description: 현금영수증 정보 (발행시 포함)
 *                       properties:
 *                         resultCode:
 *                           type: string
 *                           description: 현금영수증 결과코드
 *                         totalAmount:
 *                           type: number
 *                           description: 현금영수증 총 금액
 *       400:
 *         description: 결제 금액 불일치
 *       404:
 *         description: 주문을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post("/inicis/callback", paymentController.handleInicisCallback);

/**
 * @swagger
 * /payment/inicis/net-cancel:
 *   post:
 *     summary: 이니시스 망취소 요청
 *     tags: [Payment]
 *     description: |
 *       승인결과 전문 처리 중 예외발생 시 망취소 요청
 *       
 *       **주의사항:**
 *       - 인증TID 기준 10분 이내, 승인TID 기준 1분 이내에만 가능
 *       - 망취소를 일반 결제취소 용도로 사용하지 마십시오
 *       - 망취소요청URL HOST 값을 절대로 고정으로 사용하지 마십시오
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - P_TID
 *               - P_MID
 *               - P_AMT
 *               - P_OID
 *               - P_REQ_URL
 *             properties:
 *               P_TID:
 *                 type: string
 *                 description: 인증결과로 전달된 인증TID (INIMX_AUTH, INIMX_AISP 등으로 시작)
 *                 example: "INIMX_AUTHStdPayTid0000001234567890"
 *               P_MID:
 *                 type: string
 *                 description: 결제요청 시 설정한 P_MID 값
 *                 example: "INIpayTest"
 *               P_AMT:
 *                 type: string
 *                 description: 결제요청 시 설정한 P_AMT 값
 *                 example: "10000"
 *               P_OID:
 *                 type: string
 *                 description: 결제요청 시 설정한 P_OID 값
 *                 example: "ORDER-20250909-001"
 *               P_REQ_URL:
 *                 type: string
 *                 description: 승인결과에서 전달받은 P_REQ_URL (HOST 추출용)
 *                 example: "https://mobile.inicis.com/smart/payment/"
 *               hashKey:
 *                 type: string
 *                 description: HASH 생성용 키 (선택사항, 환경변수 INICIS_HASH_KEY 사용 가능)
 *           example:
 *             P_TID: "INIMX_AUTHStdPayTid0000001234567890"
 *             P_MID: "INIpayTest"
 *             P_AMT: "10000"
 *             P_OID: "ORDER-20250909-001"
 *             P_REQ_URL: "https://mobile.inicis.com/smart/payment/"
 *     responses:
 *       200:
 *         description: 망취소 요청 처리 완료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 망취소 성공 여부
 *                 message:
 *                   type: string
 *                   description: 처리 결과 메시지
 *                 result:
 *                   type: object
 *                   description: 망취소 성공시 포함
 *                   properties:
 *                     status:
 *                       type: string
 *                       description: 결과코드 (00:성공)
 *                     message:
 *                       type: string
 *                       description: 결과메시지
 *                     canceledTid:
 *                       type: string
 *                       description: 취소된 거래의 승인TID
 *                     originalTid:
 *                       type: string
 *                       description: 원본 인증TID
 *                 error:
 *                   type: object
 *                   description: 망취소 실패시 포함
 *                   properties:
 *                     status:
 *                       type: string
 *                       description: 오류 상태코드
 *                     message:
 *                       type: string
 *                       description: 오류 메시지
 *             examples:
 *               success:
 *                 summary: 망취소 성공
 *                 value:
 *                   success: true
 *                   message: "망취소가 성공적으로 완료되었습니다."
 *                   result:
 *                     status: "00"
 *                     message: "성공"
 *                     canceledTid: "StdPayTid0000001234567890"
 *                     originalTid: "INIMX_AUTHStdPayTid0000001234567890"
 *               failure:
 *                 summary: 망취소 실패
 *                 value:
 *                   success: false
 *                   message: "망취소가 실패했습니다."
 *                   error:
 *                     status: "01"
 *                     message: "취소 가능시간이 경과되었습니다."
 *       400:
 *         description: 필수 파라미터 누락
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "필수 파라미터가 누락되었습니다."
 *                 required:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["P_TID", "P_MID", "P_AMT", "P_OID", "P_REQ_URL"]
 *       500:
 *         description: 서버 오류 또는 통신 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "망취소 요청에 실패했습니다."
 *                 details:
 *                   type: string
 *                   example: "Network timeout"
 *                 reason:
 *                   type: string
 *                   example: "타임아웃"
 *                 httpStatus:
 *                   type: number
 *                   example: 404
 */
router.post("/inicis/net-cancel", paymentController.requestInicisNetCancel);

module.exports = router;
