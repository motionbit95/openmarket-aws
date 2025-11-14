const prisma = require("../config/prisma");
const { convertBigIntToString, parseBigIntId } = require("../utils/bigint");

// ✅ 리뷰 생성
exports.createReview = async (req, res) => {
  try {
    const { productId, userId, rating, content, images } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId가 필요합니다." });
    }
    if (!productId) {
      return res.status(400).json({ message: "productId가 필요합니다." });
    }

    const userIdBigInt = parseBigIntId(userId);

    const ratingInt = parseInt(rating, 10);
    if (isNaN(ratingInt)) {
      return res.status(400).json({ message: "rating은 숫자여야 합니다." });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: userIdBigInt,
        rating: ratingInt,
        content,
        images: images?.length
          ? {
              create: images,
            }
          : undefined,
      },
      include: { images: true },
    });

    console.log(review);

    res.status(201).json(convertBigIntToString(review));
  } catch (error) {
    console.error("createReview error:", error);
    res.status(500).json({ message: "리뷰 등록 오류" });
  }
};

// ✅ 특정 상품의 리뷰 목록
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, user_name: true } },
        images: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(convertBigIntToString(reviews));
  } catch (error) {
    console.error("getReviewsByProduct error:", error);
    res.status(500).json({ message: "리뷰 목록 조회 오류" });
  }
};

// ✅ 리뷰 단건 조회
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: { images: true, user: true },
    });

    if (!review) {
      return res.status(404).json({ message: "리뷰를 찾을 수 없습니다" });
    }

    res.json(convertBigIntToString(review));
  } catch (error) {
    console.error("getReviewById error:", error);
    res.status(500).json({ message: "리뷰 조회 오류" });
  }
};

// ✅ 리뷰 수정
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, content, images } = req.body;

    // 이미지가 있으면 기존 삭제 후 새로 생성, 없으면 그냥 수정만
    if (images && images.length) {
      await prisma.reviewImage.deleteMany({ where: { reviewId: id } });
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        rating,
        content,
        images: images && images.length ? { create: images } : undefined,
      },
      include: { images: true },
    });

    res.json(convertBigIntToString(review));
  } catch (error) {
    console.error("updateReview error:", error);
    res.status(500).json({ message: "리뷰 수정 오류" });
  }
};

// ✅ 리뷰 삭제
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$transaction([
      prisma.reviewImage.deleteMany({ where: { reviewId: id } }),
      prisma.review.delete({ where: { id } }),
    ]);

    res.json({ message: "리뷰가 성공적으로 삭제되었습니다" });
  } catch (error) {
    console.error("deleteReview error:", error);
    res.status(500).json({ message: "리뷰 삭제 오류" });
  }
};

exports.getAllReviewsBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const sellerIdBigInt = parseBigIntId(sellerId);

    const reviews = await prisma.review.findMany({
      where: {
        Product: {
          sellerId: sellerIdBigInt,
        },
      },
      include: {
        Product: {
          select: {
            id: true,
            displayName: true,
            ProductImage: true,
            categoryCode: true,
          },
        },
        users: { select: { id: true, user_name: true } },
        ReviewImage: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(convertBigIntToString(reviews));
  } catch (error) {
    console.error("getAllReviewsBySeller error:", error);
    res.status(500).json({ message: "판매자 리뷰 조회 오류" });
  }
};

exports.getReviewAttachments = async (req, res) => {
  const { id } = req.params;

  if (!id)
    return res.status(400).json({ error: "Missing review ID parameter" });

  try {
    const reviewImages = await prisma.reviewImage.findMany({
      where: { reviewId: parseBigIntId(id) },
      select: {
        id: true,
        url: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    res.json(convertBigIntToString(reviewImages));
  } catch (error) {
    console.error("Failed to fetch review images:", error);
    res.status(500).json({ error: "Failed to fetch review images" });
  }
};
