const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 취소/반품 테이블이 없으므로 Order 테이블을 활용하여 취소/반품 상태의 주문 생성
async function addCancelReturnData() {
  try {
    console.log('🔄 취소/반품 데이터 추가 시작...');

    // seller1@shop.com 판매자 조회
    const seller = await prisma.sellers.findUnique({
      where: { email: 'seller1@shop.com' }
    });

    if (!seller) {
      throw new Error('seller1@shop.com 판매자를 찾을 수 없습니다.');
    }

    // 테스트 유저 조회
    const testUser = await prisma.users.findUnique({
      where: { email: 'test@user.com' }
    });

    if (!testUser) {
      throw new Error('테스트 유저를 찾을 수 없습니다.');
    }

    // 판매자의 상품들 조회
    const products = await prisma.Product.findMany({
      where: { sellerId: seller.id },
      include: { ProductPrice: true }
    });

    if (products.length === 0) {
      throw new Error('판매자의 상품이 없습니다.');
    }

    // 1. 취소 요청 주문들 생성 (CANCELLED 상태)
    console.log('❌ 취소 주문 데이터 생성 중...');
    const cancelReasons = [
      '고객 단순변심',
      '상품 하자',
      '상품 오배송',
      '배송 지연',
      '재고 부족'
    ];

    for (let i = 1; i <= 12; i++) {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 2) + 1;
      const cancelReason = cancelReasons[Math.floor(Math.random() * cancelReasons.length)];

      // 취소 상태별로 다르게 생성
      let orderStatus, cancelStatus;
      if (i <= 3) {
        orderStatus = 'CANCELLED';
        cancelStatus = 'COMPLETED'; // 취소 완료
      } else if (i <= 6) {
        orderStatus = 'CONFIRMED';
        cancelStatus = 'REQUESTED'; // 취소 요청중
      } else if (i <= 9) {
        orderStatus = 'CANCELLED';
        cancelStatus = 'APPROVED'; // 취소 승인
      } else {
        orderStatus = 'CONFIRMED';
        cancelStatus = 'REJECTED'; // 취소 거부
      }

      await prisma.Order.create({
        data: {
          orderNumber: `CANCEL-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(i).padStart(3, '0')}`,
          userId: testUser.id,
          recipient: '김고객',
          phone: '010-9876-5432',
          postcode: '06234',
          address1: '서울시 강남구 역삼동 123-456',
          address2: '789호',
          deliveryMemo: `취소사유: ${cancelReason}`,
          totalAmount: randomProduct.ProductPrice.salePrice * quantity,
          discountAmount: 0,
          deliveryFee: 0,
          finalAmount: randomProduct.ProductPrice.salePrice * quantity,
          orderStatus: orderStatus,
          paymentStatus: orderStatus === 'CANCELLED' ? 'REFUNDED' : 'COMPLETED',
          deliveryStatus: 'PREPARING',
          paymentMethod: ['CARD', 'KAKAO_PAY', 'NAVER_PAY'][Math.floor(Math.random() * 3)],
          paidAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          OrderItem: {
            create: {
              productId: randomProduct.id,
              quantity: quantity,
              unitPrice: randomProduct.ProductPrice.salePrice,
              totalPrice: randomProduct.ProductPrice.salePrice * quantity,
              productName: randomProduct.displayName,
              skuCode: randomProduct.internalName,
              skuDisplayName: randomProduct.displayName,
              optionSnapshot: {
                cancelReason: cancelReason,
                cancelStatus: cancelStatus,
                cancelRequestedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString()
              }
            }
          }
        }
      });
    }
    console.log('✅ 취소 주문 12개 생성 완료');

    // 2. 반품 요청 주문들 생성 (DELIVERED → 반품처리)
    console.log('🔄 반품 주문 데이터 생성 중...');
    const returnReasons = [
      '상품 불량',
      '배송 중 파손',
      '설명과 다른 상품',
      '사이즈/색상 불만족',
      '고객 변심'
    ];

    for (let i = 1; i <= 15; i++) {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 2) + 1;
      const returnReason = returnReasons[Math.floor(Math.random() * returnReasons.length)];

      // 반품 상태별로 다르게 생성
      let deliveryStatus, returnStatus;
      if (i <= 3) {
        deliveryStatus = 'RETURNED';
        returnStatus = 'COMPLETED'; // 반품 완료
      } else if (i <= 6) {
        deliveryStatus = 'DELIVERED';
        returnStatus = 'REQUESTED'; // 반품 요청
      } else if (i <= 9) {
        deliveryStatus = 'DELIVERED';
        returnStatus = 'APPROVED'; // 반품 승인
      } else if (i <= 12) {
        deliveryStatus = 'DELIVERED';
        returnStatus = 'PICKUP_SCHEDULED'; // 수거 예정
      } else {
        deliveryStatus = 'DELIVERED';
        returnStatus = 'INSPECTING'; // 검수중
      }

      await prisma.Order.create({
        data: {
          orderNumber: `RETURN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(i).padStart(3, '0')}`,
          userId: testUser.id,
          recipient: '김고객',
          phone: '010-9876-5432',
          postcode: '06234',
          address1: '서울시 강남구 역삼동 123-456',
          address2: '789호',
          deliveryMemo: `반품사유: ${returnReason}`,
          totalAmount: randomProduct.ProductPrice.salePrice * quantity,
          discountAmount: 0,
          deliveryFee: 0,
          finalAmount: randomProduct.ProductPrice.salePrice * quantity,
          orderStatus: deliveryStatus === 'RETURNED' ? 'REFUNDED' : 'DELIVERED',
          paymentStatus: deliveryStatus === 'RETURNED' ? 'REFUNDED' : 'COMPLETED',
          deliveryStatus: deliveryStatus,
          paymentMethod: ['CARD', 'KAKAO_PAY', 'NAVER_PAY'][Math.floor(Math.random() * 3)],
          paidAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          OrderItem: {
            create: {
              productId: randomProduct.id,
              quantity: quantity,
              unitPrice: randomProduct.ProductPrice.salePrice,
              totalPrice: randomProduct.ProductPrice.salePrice * quantity,
              productName: randomProduct.displayName,
              skuCode: randomProduct.internalName,
              skuDisplayName: randomProduct.displayName,
              optionSnapshot: {
                returnReason: returnReason,
                returnStatus: returnStatus,
                returnRequestedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
                trackingNumber: returnStatus !== 'REQUESTED' ? `RT${Math.floor(Math.random() * 1000000000000)}` : null
              }
            }
          }
        }
      });
    }
    console.log('✅ 반품 주문 15개 생성 완료');

    // 3. 배송중/배송준비중 상태의 일반 주문들 추가 생성 (배송관리용)
    console.log('🚚 배송관리용 주문 데이터 생성 중...');

    for (let i = 1; i <= 10; i++) {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 2) + 1;

      // 배송 상태별 분배
      let orderStatus, deliveryStatus, trackingNumber = null;
      if (i <= 3) {
        orderStatus = 'CONFIRMED';
        deliveryStatus = 'PREPARING'; // 배송준비중
      } else if (i <= 6) {
        orderStatus = 'SHIPPED';
        deliveryStatus = 'SHIPPED'; // 배송중
        trackingNumber = `CJ${Math.floor(Math.random() * 1000000000000)}`;
      } else {
        orderStatus = 'DELIVERED';
        deliveryStatus = 'DELIVERED'; // 배송완료
        trackingNumber = `CJ${Math.floor(Math.random() * 1000000000000)}`;
      }

      await prisma.Order.create({
        data: {
          orderNumber: `DELIVERY-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(i).padStart(3, '0')}`,
          userId: testUser.id,
          recipient: '김고객',
          phone: '010-9876-5432',
          postcode: '06234',
          address1: '서울시 강남구 역삼동 123-456',
          address2: '789호',
          deliveryMemo: i % 2 === 0 ? '부재시 문앞 배치' : null,
          totalAmount: randomProduct.ProductPrice.salePrice * quantity,
          discountAmount: 0,
          deliveryFee: 0,
          finalAmount: randomProduct.ProductPrice.salePrice * quantity,
          orderStatus: orderStatus,
          paymentStatus: 'COMPLETED',
          deliveryStatus: deliveryStatus,
          paymentMethod: ['CARD', 'KAKAO_PAY', 'NAVER_PAY'][Math.floor(Math.random() * 3)],
          paidAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          OrderItem: {
            create: {
              productId: randomProduct.id,
              quantity: quantity,
              unitPrice: randomProduct.ProductPrice.salePrice,
              totalPrice: randomProduct.ProductPrice.salePrice * quantity,
              productName: randomProduct.displayName,
              skuCode: randomProduct.internalName,
              skuDisplayName: randomProduct.displayName,
              optionSnapshot: {
                deliveryCompany: trackingNumber ? 'CJ대한통운' : null,
                trackingNumber: trackingNumber,
                estimatedDelivery: new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
              }
            }
          }
        }
      });
    }
    console.log('✅ 배송관리용 주문 10개 생성 완료');

    console.log(`
🎉 취소/반품/배송 데이터 추가 완료!

📊 추가된 데이터:
- 취소 관련 주문: 12개
  * 취소완료: 3개
  * 취소요청중: 3개
  * 취소승인: 3개
  * 취소거부: 3개
- 반품 관련 주문: 15개
  * 반품완료: 3개
  * 반품요청: 3개
  * 반품승인: 3개
  * 수거예정: 3개
  * 검수중: 3개
- 배송관리용 주문: 10개
  * 배송준비중: 3개
  * 배송중: 3개
  * 배송완료: 4개

🔍 확인 방법:
- 판매자 대시보드 > 판매관리에서 각 탭의 뱃지 숫자 확인
- 취소관리, 반품관리, 배송관리 페이지에서 상태별 데이터 확인
    `);

  } catch (error) {
    console.error('❌ 취소/반품 데이터 추가 중 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
if (require.main === module) {
  addCancelReturnData()
    .then(() => {
      console.log('✅ 취소/반품 데이터 추가 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 취소/반품 데이터 추가 실패:', error);
      process.exit(1);
    });
}

module.exports = { addCancelReturnData };