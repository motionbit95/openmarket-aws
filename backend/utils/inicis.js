const crypto = require("crypto");
const axios = require("axios");

/**
 * KG이니시스 결제 유틸리티 클래스
 */
class InicisPayment {
  constructor() {
    this.mid = process.env.INICIS_MID;
    this.hashKey = process.env.INICIS_HASH_KEY;
    this.env = process.env.INICIS_ENV || 'test';
    this.paymentUrl = this.env === 'production' 
      ? process.env.INICIS_PAYMENT_URL_PRODUCTION
      : process.env.INICIS_PAYMENT_URL_TEST;
  }

  /**
   * 결제 요청 파라미터 생성
   * @param {Object} orderData 주문 정보
   * @returns {Object} 이니시스 결제 요청 파라미터
   */
  createPaymentParams(orderData) {
    const {
      orderNumber,
      amount,
      goodsName,
      buyerName,
      returnUrl,
      paymentMethod = 'CARD',
      notiUrl,
      hppMethod = '2',
      buyerTel,
      buyerEmail,
      timestamp
    } = orderData;

    const params = {
      P_INI_PAYMENT: this.mapPaymentMethod(paymentMethod),
      P_MID: this.mid,
      P_OID: orderNumber,
      P_AMT: Math.floor(amount).toString(),
      P_GOODS: goodsName.substring(0, 40),
      P_UNAME: buyerName,
      P_NEXT_URL: returnUrl,
      P_RESERVED: "centerCd=Y"
    };

    // 추가 구매자 정보
    if (buyerTel) {
      params.P_MOBILE = buyerTel;
    }
    if (buyerEmail) {
      params.P_EMAIL = buyerEmail;
    }

    // 가상계좌 결제시 입금통보 URL 추가
    if (paymentMethod === 'VIRTUAL_ACCOUNT' && notiUrl) {
      params.P_NOTI_URL = notiUrl;
      params.P_RESERVED += `&noti=${notiUrl}`;
    }

    // 휴대폰 결제시 상품유형 추가
    if (paymentMethod === 'PHONE') {
      params.P_HPP_METHOD = hppMethod;
    }

    return params;
  }

  /**
   * 결제 수단 매핑
   * @param {string} method 내부 결제 수단 코드
   * @returns {string} 이니시스 결제 수단 코드
   */
  mapPaymentMethod(method) {
    const methodMap = {
      'CARD': 'CARD',
      'VIRTUAL_ACCOUNT': 'VBANK',
      'BANK_TRANSFER': 'REAL',
      'PHONE': 'HPP'
    };
    return methodMap[method] || 'CARD';
  }

  /**
   * 망취소용 HASH 생성
   * @param {string} amount 결제금액
   * @param {string} orderNumber 주문번호
   * @param {string} timestamp 타임스탬프
   * @returns {string} SHA512 해시값
   */
  generateHash(amount, orderNumber, timestamp) {
    if (!this.hashKey) {
      return null;
    }
    const data = amount + orderNumber + timestamp + this.hashKey;
    return crypto.createHash('sha512').update(data, 'utf8').digest('base64');
  }

  /**
   * 망취소 요청
   * @param {Object} cancelData 취소 데이터
   * @returns {Promise<Object>} 취소 결과
   */
  async requestNetCancel(cancelData) {
    const { P_TID, P_MID, P_AMT, P_OID, P_REQ_URL } = cancelData;
    
    // P_REQ_URL에서 HOST 추출
    const reqUrl = new URL(P_REQ_URL);
    const netCancelUrl = `${reqUrl.protocol}//${reqUrl.host}/smart/payNetCancel.ini`;
    
    // 타임스탬프 생성
    const P_TIMESTAMP = Date.now().toString();
    
    // HASH 값 생성
    const P_CHKFAKE = this.generateHash(P_AMT, P_OID, P_TIMESTAMP);
    
    const params = new URLSearchParams({
      P_TID,
      P_MID: P_MID || this.mid,
      P_AMT,
      P_OID,
      ...(P_TIMESTAMP && { P_TIMESTAMP }),
      ...(P_CHKFAKE && { P_CHKFAKE })
    });

    try {
      const response = await axios.post(netCancelUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 30000
      });

      // 응답 파싱
      const responseParams = new URLSearchParams(response.data);
      return {
        P_STATUS: responseParams.get('P_STATUS'),
        P_RMESG1: responseParams.get('P_RMESG1'),
        P_TID: responseParams.get('P_TID')
      };
    } catch (error) {
      throw new Error(`망취소 요청 실패: ${error.message}`);
    }
  }

  /**
   * IDC 센터코드 검증
   * @param {string} idcName IDC 센터코드
   * @returns {boolean} 유효성 여부
   */
  validateIdcCode(idcName) {
    const validCodes = ['fc', 'ks', 'stg'];
    return validCodes.includes(idcName);
  }

  /**
   * 승인요청 URL 검증
   * @param {string} reqUrl 승인요청 URL
   * @param {string} idcName IDC 센터코드
   * @returns {boolean} 유효성 여부
   */
  validateReqUrl(reqUrl, idcName) {
    if (!reqUrl) {
      return false;
    }

    const expectedUrls = {
      'fc': 'https://mobile.inicis.com/smart/payment/',
      'ks': 'https://mobile.inicis.com/smart/payment/',
      'stg': 'https://stgmobile.inicis.com/smart/payment/'
    };

    return reqUrl.startsWith(expectedUrls[idcName]);
  }

  /**
   * 결제 결과 데이터 파싱
   * @param {Object} callbackData 이니시스 콜백 데이터
   * @returns {Object} 파싱된 결제 정보
   */
  parsePaymentResult(callbackData) {
    const {
      P_STATUS, P_RMESG1, P_TID, P_MID, P_OID, P_AMT, P_TYPE,
      P_AUTH_DT, P_AUTH_NO, P_UNAME, P_MNAME, P_NOTI,
      // 신용카드
      P_CARD_NUM, P_CARD_INTEREST, P_RMESG2, P_FN_CD1, P_FN_NM,
      CARD_CorpFlag, P_CARD_CHECKFLAG, P_CARD_PRTC_CODE,
      P_CARD_USEPOINT, P_COUPONFLAG, P_COUPON_DISCOUNT,
      P_CARD_APPLPRICE, P_CARD_COUPON_PRICE, P_SRC_CODE,
      // 가상계좌
      P_VACT_NUM, P_VACT_BANK_CODE, P_VACT_NAME, P_VACT_DATE, P_VACT_TIME,
      // 휴대폰
      P_HPP_NUM, P_HPP_CORP,
      // 현금영수증
      P_CSHR_CODE, P_CSHR_MSG, P_CSHR_AMT, P_CSHR_TYPE, P_CSHR_DT, P_CSHR_AUTH_NO
    } = callbackData;

    const result = {
      success: P_STATUS === "00",
      status: P_STATUS,
      message: P_RMESG1,
      
      // 공통 정보
      tid: P_TID,
      merchantId: P_MID,
      orderNumber: P_OID,
      amount: P_AMT,
      paymentMethod: P_TYPE,
      authDate: P_AUTH_DT,
      buyerName: P_UNAME,
      merchantName: P_MNAME,
      notiData: P_NOTI
    };

    // 결제 수단별 정보 추가
    if (P_TYPE === 'CARD') {
      result.card = {
        authNo: P_AUTH_NO,
        cardNumber: P_CARD_NUM,
        isInterestFree: P_CARD_INTEREST === "1",
        installmentPeriod: P_RMESG2,
        cardCode: P_FN_CD1,
        cardName: P_FN_NM,
        cardType: P_CARD_CHECKFLAG === "0" ? "신용카드" : 
                 P_CARD_CHECKFLAG === "1" ? "체크카드" : "기프트카드",
        cardCorpFlag: CARD_CorpFlag === "0" ? "개인카드" : 
                     CARD_CorpFlag === "1" ? "법인카드" : "구분불가",
        partialCancelAvailable: P_CARD_PRTC_CODE === "1",
        pointUsed: P_CARD_USEPOINT,
        couponUsed: P_COUPONFLAG === "1",
        couponDiscount: P_COUPON_DISCOUNT,
        actualCardAmount: P_CARD_APPLPRICE,
        cardCouponAmount: P_CARD_COUPON_PRICE,
        simplePayCode: P_SRC_CODE
      };
    }

    if (P_TYPE === 'VBANK') {
      result.virtualAccount = {
        accountNumber: P_VACT_NUM,
        bankCode: P_VACT_BANK_CODE,
        bankName: P_FN_NM,
        depositorName: P_VACT_NAME,
        expireDate: P_VACT_DATE,
        expireTime: P_VACT_TIME
      };
    }

    if (P_TYPE === 'HPP') {
      result.phone = {
        phoneNumber: P_HPP_NUM,
        carrier: P_HPP_CORP,
        bankCode: P_FN_CD1,
        bankName: P_FN_NM
      };
    }

    if (P_TYPE === 'REAL') {
      result.bankTransfer = {
        bankCode: P_FN_CD1,
        bankName: P_FN_NM
      };
    }

    // 현금영수증 정보
    if (P_CSHR_CODE) {
      result.cashReceipt = {
        resultCode: P_CSHR_CODE,
        resultMessage: P_CSHR_MSG,
        totalAmount: P_CSHR_AMT,
        type: P_CSHR_TYPE === "0" ? "소득공제" : "지출증빙",
        issueDate: P_CSHR_DT,
        authNumber: P_CSHR_AUTH_NO
      };
    }

    return result;
  }

  /**
   * 결제 URL 반환
   * @returns {string} 결제 URL
   */
  getPaymentUrl() {
    return this.paymentUrl;
  }
}

module.exports = InicisPayment;