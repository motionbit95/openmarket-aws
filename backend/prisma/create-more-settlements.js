const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");

const prisma = new PrismaClient();

async function createMoreSettlementData() {
  console.log("🏦 추가 정산 데이터 생성 시작...");

  try {
    // 기존 판매자들 가져오기
    const sellers = await prisma.sellers.findMany();
    console.log(`📊 총 ${sellers.length}명의 판매자 발견`);

    if (sellers.length === 0) {
      console.log("❌ 판매자가 없습니다. 먼저 기본 데이터를 생성해주세요.");
      return;
    }

    // 여러 정산 기간 생성 (최근 6개월)
    const settlementPeriods = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const settlementDate = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        5
      );

      const period = await prisma.settlementPeriod.create({
        data: {
          periodType: "MONTHLY",
          startDate,
          endDate,
          settlementDate,
          status: i < 2 ? "COMPLETED" : i < 4 ? "PROCESSING" : "PREPARING",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      settlementPeriods.push(period);
      console.log(
        `✅ 정산 기간 생성: ${startDate.toISOString().split("T")[0]} ~ ${
          endDate.toISOString().split("T")[0]
        }`
      );
    }

    // 각 판매자별로 정산 데이터 생성
    for (const seller of sellers) {
      for (let i = 0; i < 4; i++) {
        // 각 판매자당 4개월치 정산 데이터
        const period = settlementPeriods[i];

        // 랜덤한 매출 데이터 생성
        const totalOrderAmount = faker.number.int({
          min: 500000,
          max: 5000000,
        });
        const commissionRate = faker.number.float({
          min: 3,
          max: 8,
          fractionDigits: 1,
        });
        const totalCommission = Math.floor(
          totalOrderAmount * (commissionRate / 100)
        );
        const totalDeliveryFee = faker.number.int({ min: 0, max: 50000 });
        const totalRefundAmount = faker.number.int({ min: 0, max: 100000 });
        const totalCancelAmount = faker.number.int({ min: 0, max: 50000 });
        const adjustmentAmount = faker.number.int({ min: -10000, max: 10000 });

        const finalSettlementAmount =
          totalOrderAmount -
          totalCommission -
          totalDeliveryFee -
          totalRefundAmount -
          totalCancelAmount +
          adjustmentAmount;

        // 정산 상태 결정
        let status = "PENDING";
        let settledAt = null;

        if (i < 2) {
          status = "COMPLETED";
          settledAt = new Date(
            period.settlementDate.getTime() +
              faker.number.int({ min: 0, max: 3 }) * 24 * 60 * 60 * 1000
          );
        } else if (i === 2) {
          status = "CALCULATING";
        } else {
          status = "PENDING";
        }

        const settlement = await prisma.settlement.create({
          data: {
            settlementPeriodId: period.id,
            sellerId: seller.id,
            totalOrderAmount,
            totalCommission,
            totalDeliveryFee,
            totalRefundAmount,
            totalCancelAmount,
            adjustmentAmount,
            finalSettlementAmount,
            commissionRate,
            status,
            settledAt,
            memo: status === "COMPLETED" ? "정산 완료" : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // 정산 아이템 생성 (3-8개)
        const itemCount = faker.number.int({ min: 3, max: 8 });
        const productNames = [
          "프리미엄 무선 이어폰",
          "스마트 워치 밴드",
          "USB-C 멀티허브",
          "무선 충전기",
          "블루투스 스피커",
          "스마트폰 케이스",
          "태블릿 스탠드",
          "게이밍 마우스",
          "키보드",
          "모니터 암",
        ];

        for (let j = 0; j < itemCount; j++) {
          const productName = faker.helpers.arrayElement(productNames);
          const quantity = faker.number.int({ min: 1, max: 20 });
          const unitPrice = faker.number.int({ min: 10000, max: 200000 });
          const totalPrice = quantity * unitPrice;
          const itemCommissionRate = faker.number.float({
            min: 3,
            max: 8,
            fractionDigits: 1,
          });
          const commissionAmount = Math.floor(
            totalPrice * (itemCommissionRate / 100)
          );
          const deliveryFee = faker.number.int({ min: 0, max: 3000 });
          const settlementAmount = totalPrice - commissionAmount - deliveryFee;

          await prisma.settlementItem.create({
            data: {
              settlementId: settlement.id,
              orderId: BigInt(faker.number.int({ min: 1000, max: 9999 })),
              orderItemId: BigInt(faker.number.int({ min: 2000, max: 9999 })),
              productName,
              skuCode: `SKU${faker.number.int({ min: 1000, max: 9999 })}`,
              quantity,
              unitPrice,
              totalPrice,
              commissionRate: itemCommissionRate,
              commissionAmount,
              deliveryFee,
              settlementAmount,
              orderStatus: faker.helpers.arrayElement([
                "DELIVERED",
                "SHIPPED",
                "PREPARING",
              ]),
              paymentStatus: "PAID",
              createdAt: new Date(),
            },
          });
        }

        console.log(
          `✅ 정산 데이터 생성: ${seller.name} - ${
            period.startDate.toISOString().split("T")[0]
          } (${status})`
        );
      }
    }

    console.log("🎉 추가 정산 데이터 생성 완료!");
  } catch (error) {
    console.error("❌ 정산 데이터 생성 중 오류:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  createMoreSettlementData().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { createMoreSettlementData };
