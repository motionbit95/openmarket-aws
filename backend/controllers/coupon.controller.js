const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// BigInt 직렬화 함수 (필요 시)
function serializeBigInt(obj) {
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  } else if (obj !== null && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === "bigint") {
        newObj[key] = value.toString();
      } else if (value instanceof Date) {
        newObj[key] = value.toISOString();
      } else if (typeof value === "object") {
        newObj[key] = serializeBigInt(value);
      } else {
        newObj[key] = value;
      }
    }
    return newObj;
  }
  return obj;
}

exports.createCoupon = async (req, res) => {
  try {
    const {
      title,
      content,
      coupon_type,
      discount_amount,
      discount_mode,
      discount_max,
      min_order_amount,
      total_count,
      start_date,
      end_date,
      available_date,
      issued_by,
      validity_type,
      validity_days,
      valid_from,
      valid_to,
      issued_partner_id,
    } = req.body;

    console.log(req.body);

    if (
      !title ||
      !content ||
      coupon_type === undefined ||
      discount_amount === undefined ||
      discount_mode === undefined ||
      total_count === undefined ||
      !start_date ||
      !end_date ||
      !issued_by ||
      !validity_type
    ) {
      return res
        .status(400)
        .json({ message: "필수 필드를 모두 입력해주세요." });
    }

    const coupon = await prisma.coupon.create({
      data: {
        title,
        content,
        coupon_type,
        discount_amount: parseInt(discount_amount),
        discount_mode,
        discount_max: discount_max ? parseInt(discount_max) : null,
        min_order_amount: min_order_amount ? parseInt(min_order_amount) : null,
        total_count: parseInt(total_count),
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        available_date: available_date ? new Date(available_date) : null,
        issued_by,
        issued_partner_id,
        validity_type,
        validity_days: validity_days ? parseInt(validity_days) : null,
        valid_from: valid_from ? new Date(valid_from) : null,
        valid_to: valid_to ? new Date(valid_to) : null,
      },
    });

    res.status(201).json(serializeBigInt(coupon));
  } catch (error) {
    console.error("쿠폰 생성 실패:", error);
    res.status(500).json({ message: "쿠폰 생성 실패" });
  }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const { issued_by } = req.query;

    const coupons = await prisma.coupon.findMany({
      where:
        issued_by && issued_by !== "all"
          ? {
              issued_by: issued_by,
            }
          : undefined,
      orderBy: { createdAt: "desc" },
    });

    res.json(serializeBigInt(coupons));
  } catch (error) {
    console.error("쿠폰 조회 실패:", error);
    res.status(500).json({ message: "쿠폰 조회 실패" });
  }
};

exports.getCouponById = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon)
      return res.status(404).json({ message: "쿠폰을 찾을 수 없습니다." });

    res.json(serializeBigInt(coupon));
  } catch (error) {
    console.error("쿠폰 상세 조회 실패:", error);
    res.status(500).json({ message: "쿠폰 상세 조회 실패" });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const {
      title,
      content,
      coupon_type,
      discount_amount,
      discount_mode,
      discount_max,
      min_order_amount,
      total_count,
      start_date,
      end_date,
      available_date,
      issued_by,
      validity_type,
      validity_days,
      valid_from,
      valid_to,
    } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (coupon_type !== undefined) data.coupon_type = coupon_type;
    if (discount_amount !== undefined)
      data.discount_amount = parseInt(discount_amount);
    if (discount_mode !== undefined) data.discount_mode = discount_mode;
    if (discount_max !== undefined)
      data.discount_max = discount_max ? parseInt(discount_max) : null;
    if (min_order_amount !== undefined)
      data.min_order_amount = min_order_amount
        ? parseInt(min_order_amount)
        : null;
    if (total_count !== undefined) data.total_count = parseInt(total_count);
    if (start_date !== undefined) data.start_date = new Date(start_date);
    if (end_date !== undefined) data.end_date = new Date(end_date);
    if (available_date !== undefined)
      data.available_date = available_date ? new Date(available_date) : null;
    if (issued_by !== undefined) data.issued_by = issued_by;
    if (validity_type !== undefined) data.validity_type = validity_type;
    if (validity_days !== undefined)
      data.validity_days = validity_days ? parseInt(validity_days) : null;
    if (valid_from !== undefined)
      data.valid_from = valid_from ? new Date(valid_from) : null;
    if (valid_to !== undefined)
      data.valid_to = valid_to ? new Date(valid_to) : null;

    const updated = await prisma.coupon.update({
      where: { id },
      data,
    });

    res.json(serializeBigInt(updated));
  } catch (error) {
    console.error("쿠폰 수정 실패:", error);
    res.status(500).json({ message: "쿠폰 수정 실패" });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.coupon.delete({ where: { id } });
    res.json({ message: "쿠폰 삭제 완료" });
  } catch (error) {
    console.error("쿠폰 삭제 실패:", error);
    res.status(500).json({ message: "쿠폰 삭제 실패" });
  }
};

exports.getAllCouponsBySeller = async (req, res) => {
  console.log(req.params.sellerId);
  try {
    const sellerId = req.params.sellerId;
    if (!sellerId) {
      return res.status(400).json({ message: "sellerId가 필요합니다." });
    }

    // issued_by가 'PARTNER'이고, issued_by의 값이 sellerId와 일치하는 쿠폰만 조회
    const coupons = await prisma.coupon.findMany({
      where: {
        issued_partner_id: BigInt(sellerId),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(serializeBigInt(coupons));
  } catch (error) {
    console.error("판매자 쿠폰 목록 조회 실패:", error);
    res.status(500).json({ message: "판매자 쿠폰 목록 조회 실패" });
  }
};

// 사용자가 사용 가능한 쿠폰 목록 조회
exports.getAvailableCouponsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId가 필요합니다." });
    }

    const now = new Date();
    
    // 현재 시간 기준으로 사용 가능한 쿠폰 조회
    const coupons = await prisma.coupon.findMany({
      where: {
        start_date: {
          lte: now
        },
        end_date: {
          gte: now
        },
        // 더 복잡한 사용 가능 여부 로직이 필요하면 여기에 추가
        // 예: 사용자가 이미 사용한 쿠폰 제외, 사용 가능 수량 체크 등
      },
      orderBy: {
        discount_amount: "desc",
      },
    });

    res.json(serializeBigInt(coupons));
  } catch (error) {
    console.error("사용 가능한 쿠폰 목록 조회 실패:", error);
    res.status(500).json({ message: "사용 가능한 쿠폰 목록 조회 실패" });
  }
};
