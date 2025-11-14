const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * BigInt를 안전하게 JSON으로 변환하는 헬퍼 함수
 */
function safeJson(obj) {
  return JSON.parse(
    JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

/**
 * userId, productId 유효성 검사 및 BigInt 변환
 */
function parseBigIntId(id, name, res) {
  try {
    return BigInt(id);
  } catch {
    res.status(400).json({
      message: `ID 형식 오류`,
      error: `userId와 productId는 숫자여야 합니다`,
    });
    return null;
  }
}

/**
 * 관심상품(좋아요) 추가
 * POST /user-like-products
 * body: { userId, productId }
 */
exports.addLike = async (req, res) => {
  const { userId, productId } = req.body;
  const userIdBigInt = parseBigIntId(userId, "userId", res);
  const productIdBigInt = parseBigIntId(productId, "productId", res);
  if (userIdBigInt === null || productIdBigInt === null) return;

  try {
    // 이미 좋아요가 있는지 확인
    // 배포 환경에서 findUnique의 복합키 사용이 안 되는 경우를 대비해 findFirst로 대체
    const exists = await prisma.userLikeProduct.findFirst({
      where: {
        userId: userIdBigInt,
        productId: productIdBigInt,
      },
    });

    if (exists) {
      // 이미 추가되어 있으면 해제(삭제)
      await prisma.userLikeProduct.deleteMany({
        where: {
          userId: userIdBigInt,
          productId: productIdBigInt,
        },
      });
      return res.status(200).json({ message: "관심상품에서 삭제되었습니다." });
    }

    const like = await prisma.userLikeProduct.create({
      data: {
        userId: userIdBigInt,
        productId: productIdBigInt,
      },
    });

    res.status(201).json(safeJson(like));
  } catch (err) {
    res
      .status(500)
      .json({ message: "관심상품 추가 중 오류 발생", error: err.message });
  }
};

/**
 * 관심상품(좋아요) 삭제
 * DELETE /user-like-products
 * body: { userId, productId }
 */
exports.removeLike = async (req, res) => {
  const { userId, productId } = req.body;
  const userIdBigInt = parseBigIntId(userId, "userId", res);
  const productIdBigInt = parseBigIntId(productId, "productId", res);
  if (userIdBigInt === null || productIdBigInt === null) return;

  try {
    const deleted = await prisma.userLikeProduct.deleteMany({
      where: {
        userId: userIdBigInt,
        productId: productIdBigInt,
      },
    });
    if (deleted.count === 0) {
      return res.status(404).json({ message: "관심상품에 존재하지 않습니다." });
    }
    res.status(200).json({ message: "관심상품에서 삭제되었습니다." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "관심상품 삭제 중 오류 발생", error: err.message });
  }
};

/**
 * 특정 유저의 관심상품 전체 삭제
 * DELETE /user-like-products/all/:userId
 */
exports.removeAllLikes = async (req, res) => {
  const { userId } = req.params;
  const userIdBigInt = parseBigIntId(userId, "userId", res);
  if (userIdBigInt === null) return;

  try {
    const deleted = await prisma.userLikeProduct.deleteMany({
      where: {
        userId: userIdBigInt,
      },
    });
    res.status(200).json({
      message: "관심상품 전체가 삭제되었습니다.",
      deletedCount: deleted.count,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "관심상품 전체 삭제 중 오류 발생", error: err.message });
  }
};

/**
 * 특정 유저의 관심상품 리스트 조회
 * GET /user-like-products/:userId
 */
exports.getUserLikes = async (req, res) => {
  const { userId } = req.params;
  const userIdBigInt = parseBigIntId(userId, "userId", res);
  if (userIdBigInt === null) return;

  try {
    const likes = await prisma.userLikeProduct.findMany({
      where: { userId: userIdBigInt },
      select: { productId: true },
      orderBy: { createdAt: "desc" },
    });
    // productId만 배열로 반환 (string 변환)
    const productIds = likes.map((like) => like.productId.toString());
    res.status(200).json(productIds);
  } catch (err) {
    res
      .status(500)
      .json({ message: "관심상품 조회 중 오류 발생", error: err.message });
  }
};

exports.getUserLikesProducts = async (req, res) => {
  const { userId } = req.params;
  const userIdBigInt = parseBigIntId(userId, "userId", res);
  if (userIdBigInt === null) return;

  try {
    // 관심상품 productId 목록 조회
    const likes = await prisma.userLikeProduct.findMany({
      where: { userId: userIdBigInt },
      select: { productId: true },
      orderBy: { createdAt: "desc" },
    });

    const productIds = likes.map((like) => like.productId);

    // 해당 productId의 상품 정보 조회
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        prices: true,
        images: true,
        delivery: true,
      },
    });

    // productIds 순서대로 정렬 (관심상품 등록순)
    const productMap = new Map(products.map((p) => [p.id.toString(), p]));
    const sortedProducts = productIds
      .map((id) => productMap.get(id.toString()))
      .filter(Boolean);

    // BigInt 직렬화 문제 방지
    const safeProducts = JSON.parse(
      JSON.stringify(sortedProducts, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.status(200).json(safeProducts);
  } catch (err) {
    // BigInt 직렬화 오류 메시지 강제 반환
    if (
      err &&
      typeof err.message === "string" &&
      err.message.includes("Do not know how to serialize a BigInt")
    ) {
      return res.status(500).json({
        message: "관심상품 조회 중 오류 발생",
        error: "Do not know how to serialize a BigInt",
      });
    }
    res
      .status(500)
      .json({ message: "관심상품 조회 중 오류 발생", error: err.message });
  }
};

/**
 * 관심상품(좋아요) 단건 조회
 * GET /user-like-products/:userId/:productId
 */
exports.getLike = async (req, res) => {
  const { userId, productId } = req.params;
  const userIdBigInt = parseBigIntId(userId, "userId", res);
  const productIdBigInt = parseBigIntId(productId, "productId", res);
  if (userIdBigInt === null || productIdBigInt === null) return;

  try {
    const like = await prisma.userLikeProduct.findUnique({
      where: {
        userId_productId: {
          userId: userIdBigInt,
          productId: productIdBigInt,
        },
      },
    });

    if (!like) {
      return res.status(404).json({ message: "관심상품이 아닙니다." });
    }

    res.status(200).json(safeJson(like));
  } catch (err) {
    res
      .status(500)
      .json({ message: "관심상품 단건 조회 중 오류 발생", error: err.message });
  }
};

/**
 * 상품별 좋아요 수 조회
 * GET /user-like-products/count/:productId
 */
exports.getProductLikeCount = async (req, res) => {
  const { productId } = req.params;
  const productIdBigInt = parseBigIntId(productId, "productId", res);
  if (productIdBigInt === null) return;

  try {
    // count와 productId를 함께 반환 (count만 반환하는 것보다 확장성 ↑)
    const [count, product] = await Promise.all([
      prisma.userLikeProduct.count({
        where: { productId: productIdBigInt },
      }),
      prisma.product.findUnique({
        where: { id: productIdBigInt },
        // 'name' 필드가 Product 모델에 없으므로 select에서 제외
        select: { id: true },
      }),
    ]);
    if (!product) {
      return res
        .status(404)
        .json({ message: "해당 상품이 존재하지 않습니다." });
    }
    res.status(200).json({
      productId: product.id.toString(),
      // productName: product.name, // name 필드가 없으므로 반환하지 않음
      likeCount: count,
    });
  } catch (err) {
    res.status(500).json({
      message: "상품별 좋아요 수 조회 중 오류 발생",
      error: err.message,
    });
  }
};
