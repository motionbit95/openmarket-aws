const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// 테스트 데이터 생성 함수
async function seedSellerData() {
  try {
    console.log('🌱 판매자 데이터 시딩 시작...');

    // 1. seller1@shop.com 계정 확인/생성
    let seller = await prisma.sellers.findUnique({
      where: { email: 'seller1@shop.com' }
    });

    if (!seller) {
      console.log('📝 seller1@shop.com 계정 생성 중...');
      const hashedPassword = await bcrypt.hash('password123', 10);

      seller = await prisma.sellers.create({
        data: {
          name: '김판매',
          email: 'seller1@shop.com',
          shop_name: '김판매 스토어',
          password: hashedPassword,
          phone: '010-1234-5678',
          business_number: '123-45-67890',
          bank_type: 'KB',
          bank_account: '123456789012',
          depositor_name: '김판매',
          ceo_name: '김판매',
          email_verified: true,
          address1: '서울시 강남구 테헤란로 123',
          address2: '456호',
          postcode: '06234',
          onlinesales_number: '2023-서울강남-0123'
        }
      });
      console.log('✅ 판매자 계정 생성 완료:', seller.email);
    } else {
      console.log('✅ 기존 판매자 계정 확인:', seller.email);
    }

    // 2. 테스트 유저 생성 (주문을 위해)
    let testUser = await prisma.users.findUnique({
      where: { email: 'test@user.com' }
    });

    if (!testUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser = await prisma.users.create({
        data: {
          user_name: '김고객',
          email: 'test@user.com',
          password: hashedPassword,
          phone: '010-9876-5432',
          mileage: 5000,
          updated_at: new Date()
        }
      });
      console.log('✅ 테스트 유저 생성 완료:', testUser.email);
    }

    // 3. 상품 생성
    console.log('📦 상품 생성 중...');
    const products = [];

    const productData = [
      {
        displayName: '스마트폰 케이스',
        internalName: 'smartphone-case-001',
        keywords: '케이스,스마트폰,보호케이스',
        categoryCode: 'PHONE_ACCESSORIES',
        brand: '프리미엄케이스',
        manufacturer: '케이스메이커',
        description: '고급 실리콘 재질의 스마트폰 보호케이스입니다.',
        originalPrice: 25000,
        salePrice: 19900,
        stockQuantity: 150
      },
      {
        displayName: '무선 이어폰',
        internalName: 'wireless-earphone-001',
        keywords: '이어폰,무선,블루투스',
        categoryCode: 'AUDIO',
        brand: '사운드테크',
        manufacturer: '오디오메이커',
        description: '고음질 무선 블루투스 이어폰입니다.',
        originalPrice: 89000,
        salePrice: 79000,
        stockQuantity: 80
      },
      {
        displayName: '노트북 파우치',
        internalName: 'laptop-pouch-001',
        keywords: '파우치,노트북,가방',
        categoryCode: 'COMPUTER_ACCESSORIES',
        brand: '테크백',
        manufacturer: '백메이커',
        description: '15인치 노트북을 안전하게 보호하는 파우치입니다.',
        originalPrice: 35000,
        salePrice: 29900,
        stockQuantity: 120
      }
    ];

    for (const productInfo of productData) {
      const product = await prisma.Product.create({
        data: {
          sellerId: seller.id,
          displayName: productInfo.displayName,
          internalName: productInfo.internalName,
          keywords: productInfo.keywords,
          categoryCode: productInfo.categoryCode,
          brand: productInfo.brand,
          manufacturer: productInfo.manufacturer,
          taxIncluded: true,
          saleStatus: 'ON_SALE',
          displayStatus: 'DISPLAYED',
          stockQuantity: productInfo.stockQuantity,
          description: productInfo.description,
          isSingleProduct: true,
          updatedAt: new Date(),
          ProductPrice: {
            create: {
              originalPrice: productInfo.originalPrice,
              salePrice: productInfo.salePrice,
              discountRate: ((productInfo.originalPrice - productInfo.salePrice) / productInfo.originalPrice * 100),
              flexzonePrice: productInfo.salePrice
            }
          },
          ProductDelivery: {
            create: {
              originAddress: '서울시 강남구',
              deliveryMethod: '택배',
              isBundle: false,
              isIslandAvailable: false,
              courier: 'CJ대한통운',
              deliveryFeeType: 'FREE',
              deliveryFee: 0,
              deliveryTime: '1-2일',
              conditionalFreeMinAmount: 30000
            }
          },
          ProductReturn: {
            create: {
              returnAddress: '서울시 강남구 테헤란로 123',
              initialShippingFee: 3000,
              returnShippingFee: 3000,
              exchangeShippingFee: 6000
            }
          }
        }
      });
      products.push(product);
    }
    console.log(`✅ ${products.length}개 상품 생성 완료`);

    // 4. 주문 데이터 생성
    console.log('🛒 주문 데이터 생성 중...');
    const orders = [];

    const orderStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'];
    const paymentMethods = ['CARD', 'KAKAO_PAY', 'NAVER_PAY'];
    const deliveryStatuses = ['PREPARING', 'SHIPPED', 'DELIVERED'];

    for (let i = 1; i <= 25; i++) {
      const orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const deliveryStatus = deliveryStatuses[Math.floor(Math.random() * deliveryStatuses.length)];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;

      // ProductPrice 정보 가져오기
      const productWithPrice = await prisma.Product.findUnique({
        where: { id: randomProduct.id },
        include: { ProductPrice: true }
      });

      const order = await prisma.Order.create({
        data: {
          orderNumber: `ORDER-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(i).padStart(3, '0')}`,
          userId: testUser.id,
          recipient: '김고객',
          phone: '010-9876-5432',
          postcode: '06234',
          address1: '서울시 강남구 역삼동 123-456',
          address2: '789호',
          deliveryMemo: i % 3 === 0 ? '문 앞에 놓아주세요' : null,
          totalAmount: productWithPrice.ProductPrice.salePrice * quantity,
          discountAmount: 0,
          deliveryFee: 0,
          finalAmount: productWithPrice.ProductPrice.salePrice * quantity,
          orderStatus: orderStatus,
          paymentStatus: orderStatus === 'PENDING' ? 'PENDING' : 'COMPLETED',
          deliveryStatus: deliveryStatus,
          paymentMethod: paymentMethod,
          paidAt: orderStatus !== 'PENDING' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          OrderItem: {
            create: {
              productId: productWithPrice.id,
              quantity: quantity,
              unitPrice: productWithPrice.ProductPrice.salePrice,
              totalPrice: productWithPrice.ProductPrice.salePrice * quantity,
              productName: productWithPrice.displayName,
              skuCode: productWithPrice.internalName,
              skuDisplayName: productWithPrice.displayName
            }
          }
        },
        include: {
          OrderItem: true
        }
      });
      orders.push(order);
    }
    console.log(`✅ ${orders.length}개 주문 생성 완료`);

    // 5. 정산 기간 및 정산 데이터 생성
    console.log('💰 정산 데이터 생성 중...');

    // 정산 기간 생성 (지난 달, 이번 달)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);

    const lastMonthEnd = new Date(lastMonth);
    lastMonthEnd.setMonth(lastMonthEnd.getMonth() + 1);
    lastMonthEnd.setDate(0);

    const thisMonth = new Date();
    thisMonth.setDate(1);

    const thisMonthEnd = new Date(thisMonth);
    thisMonthEnd.setMonth(thisMonthEnd.getMonth() + 1);
    thisMonthEnd.setDate(0);

    // 지난 달 정산 기간
    const lastPeriod = await prisma.SettlementPeriod.create({
      data: {
        periodType: 'MONTHLY',
        startDate: lastMonth,
        endDate: lastMonthEnd,
        settlementDate: new Date(thisMonth.getTime() + 5 * 24 * 60 * 60 * 1000), // 이번 달 5일
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });

    // 이번 달 정산 기간
    const thisPeriod = await prisma.SettlementPeriod.create({
      data: {
        periodType: 'MONTHLY',
        startDate: thisMonth,
        endDate: thisMonthEnd,
        settlementDate: new Date(thisMonth.getTime() + 35 * 24 * 60 * 60 * 1000), // 다음 달 5일
        status: 'PREPARING',
        updatedAt: new Date()
      }
    });

    // 완료된 주문들에 대한 정산 데이터 생성
    const completedOrders = orders.filter(order => order.orderStatus === 'DELIVERED');
    if (completedOrders.length > 0) {
      const totalOrderAmount = completedOrders.reduce((sum, order) => sum + order.finalAmount, 0);
      const commissionRate = 0.05; // 5% 수수료
      const totalCommission = totalOrderAmount * commissionRate;
      const finalSettlementAmount = totalOrderAmount - totalCommission;

      const settlement = await prisma.Settlement.create({
        data: {
          settlementPeriodId: lastPeriod.id,
          sellerId: seller.id,
          totalOrderAmount: totalOrderAmount,
          totalCommission: totalCommission,
          totalDeliveryFee: 0,
          totalRefundAmount: 0,
          totalCancelAmount: 0,
          adjustmentAmount: 0,
          finalSettlementAmount: finalSettlementAmount,
          status: 'COMPLETED',
          settledAt: lastPeriod.settlementDate,
          memo: '정상 정산 완료',
          updatedAt: new Date()
        }
      });

      // 정산 항목들 생성
      for (const order of completedOrders) {
        for (const item of order.OrderItem) {
          await prisma.SettlementItem.create({
            data: {
              settlementId: settlement.id,
              orderId: order.id,
              orderItemId: item.id,
              productName: item.productName,
              skuCode: item.skuCode,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              commissionRate: commissionRate * 100,
              commissionAmount: item.totalPrice * commissionRate,
              deliveryFee: 0,
              settlementAmount: item.totalPrice * (1 - commissionRate),
              orderStatus: order.orderStatus,
              paymentStatus: order.paymentStatus
            }
          });
        }
      }
    }

    console.log('✅ 정산 데이터 생성 완료');

    // 6. 리뷰 데이터 생성
    console.log('⭐ 리뷰 데이터 생성 중...');
    const deliveredOrders = orders.filter(order => order.orderStatus === 'DELIVERED');

    for (let i = 0; i < Math.min(5, deliveredOrders.length); i++) {
      const order = deliveredOrders[i];
      const orderItem = order.OrderItem[0];

      await prisma.Review.create({
        data: {
          productId: orderItem.productId,
          userId: testUser.id,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5점
          content: [
            '정말 좋은 상품이에요! 배송도 빠르고 품질도 만족합니다.',
            '기대했던 것보다 훨씬 좋네요. 추천합니다!',
            '가격 대비 품질이 우수해요. 재구매 의사 있습니다.',
            '포장도 깔끔하고 상품도 설명과 일치해요.',
            '빠른 배송과 좋은 품질에 만족합니다.'
          ][i],
          updatedAt: new Date()
        }
      });
    }
    console.log('✅ 리뷰 데이터 생성 완료');

    console.log(`
🎉 데이터 시딩 완료!

📊 생성된 데이터:
- 판매자: ${seller.email}
- 상품: ${products.length}개
- 주문: ${orders.length}개
- 정산 기간: 2개
- 정산 내역: 1개 (완료된 주문 기준)
- 리뷰: ${Math.min(5, deliveredOrders.length)}개

🔍 확인 방법:
- 프론트엔드에서 seller1@shop.com / password123 로 로그인
- 판매자 대시보드에서 각 메뉴 확인
    `);

  } catch (error) {
    console.error('❌ 시딩 중 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
if (require.main === module) {
  seedSellerData()
    .then(() => {
      console.log('✅ 시딩 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 시딩 실패:', error);
      process.exit(1);
    });
}

module.exports = { seedSellerData };