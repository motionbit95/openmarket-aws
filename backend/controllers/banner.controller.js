const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// BigInt 필드를 문자열로 변환하는 재귀 함수
function serializeBigInt(obj) {
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  } else if (obj !== null && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      if (typeof obj[key] === "bigint") {
        newObj[key] = obj[key].toString();
      } else if (typeof obj[key] === "object") {
        newObj[key] = serializeBigInt(obj[key]);
      } else {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  }
  return obj;
}

exports.createBanner = async (req, res) => {
  try {
    const { attachmentId, url, ownerType, ownerId } = req.body;

    if (!attachmentId || !url || !ownerType || !ownerId) {
      return res.status(400).json({ message: "모든 필드를 입력해주세요." });
    }

    const banner = await prisma.banners.create({
      data: {
        attachmentId: BigInt(attachmentId),
        url,
        ownerType,
        ownerId,
      },
    });

    res.status(201).json(serializeBigInt(banner));
  } catch (error) {
    console.error("배너 생성 실패:", error);
    res.status(500).json({ message: "배너 생성 실패" });
  }
};

// 특정 seller의 배너만 조회하는 예제
exports.getBannersBySeller = async (req, res) => {
  try {
    // sellerId는 query 또는 params로 받을 수 있음. 여기서는 query로 예시
    const { sellerId } = req.query;

    if (!sellerId) {
      return res.status(400).json({ message: "sellerId가 필요합니다." });
    }

    // ownerType이 SELLER이고, ownerId가 sellerId인 배너만 조회
    const banners = await prisma.banners.findMany({
      where: {
        ownerType: "SELLER",
        ownerId: sellerId,
      },
      orderBy: { createdAt: "desc" },
    });

    // attachmentId 목록 추출
    const attachmentIds = banners.map((b) => b.attachmentId).filter(Boolean);

    // attachment url 조회
    const attachments = await prisma.attachments.findMany({
      where: { id: { in: attachmentIds } },
      select: { id: true, url: true },
    });

    // id -> url 매핑
    const attachmentMap = new Map(
      attachments.map(({ id, url }) => [id.toString(), url])
    );

    // 배너에 attachmentUrl 추가
    const bannersWithUrl = banners.map((banner) => ({
      ...banner,
      attachmentUrl: banner.attachmentId
        ? attachmentMap.get(banner.attachmentId.toString()) || null
        : null,
    }));

    res.json(serializeBigInt(bannersWithUrl));
  } catch (error) {
    console.error("특정 seller 배너 조회 실패:", error);
    res.status(500).json({ message: "특정 seller 배너 조회 실패" });
  }
};

exports.getAllBanners = async (req, res) => {
  try {
    const { ownerType } = req.query;

    const allowedTypes = ["ADVERTISER", "SELLER"];
    const where = {};

    // 유효한 ownerType만 조건에 추가
    if (ownerType && allowedTypes.includes(ownerType)) {
      where.ownerType = ownerType;
    }

    // 배너 조회
    const banners = await prisma.banners.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // attachmentId 목록 추출
    const attachmentIds = banners.map((b) => b.attachmentId).filter(Boolean);

    // attachment url 조회
    const attachments = await prisma.attachments.findMany({
      where: { id: { in: attachmentIds } },
      select: { id: true, url: true },
    });

    // id -> url 매핑
    const attachmentMap = new Map(
      attachments.map(({ id, url }) => [id.toString(), url])
    );

    // 배너에 attachmentUrl 추가
    const bannersWithUrl = banners.map((banner) => ({
      ...banner,
      attachmentUrl: banner.attachmentId
        ? attachmentMap.get(banner.attachmentId.toString()) || null
        : null,
    }));

    res.json(serializeBigInt(bannersWithUrl));
  } catch (error) {
    console.error("배너 조회 실패:", error);
    res.status(500).json({ message: "배너 조회 실패" });
  }
};

exports.getBannerById = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const banner = await prisma.banners.findUnique({ where: { id } });

    if (!banner)
      return res.status(404).json({ message: "배너를 찾을 수 없습니다." });

    let attachment = null;
    if (banner.attachmentId) {
      attachment = await prisma.attachments.findUnique({
        where: { id: banner.attachmentId },
        select: { url: true }, // url만 조회
      });
    }

    res.json(serializeBigInt({ ...banner, attachment }));
  } catch (error) {
    console.error("배너 상세 조회 실패:", error);
    res.status(500).json({ message: "배너 상세 조회 실패" });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const { attachmentId, url, ownerType, ownerId } = req.body;

    const data = {};
    if (attachmentId !== undefined) data.attachmentId = BigInt(attachmentId);
    if (url !== undefined) data.url = url;
    if (ownerType !== undefined) data.ownerType = ownerType;
    if (ownerId !== undefined) data.ownerId = ownerId;

    const updated = await prisma.banners.update({
      where: { id },
      data,
    });

    res.json(serializeBigInt(updated));
  } catch (error) {
    console.error("배너 수정 실패:", error);
    res.status(500).json({ message: "배너 수정 실패" });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.banners.delete({ where: { id } });
    res.json({ message: "배너 삭제 완료" });
  } catch (error) {
    console.error("배너 삭제 실패:", error);
    res.status(500).json({ message: "배너 삭제 실패" });
  }
};
