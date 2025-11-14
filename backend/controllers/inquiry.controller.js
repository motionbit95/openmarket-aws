const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function serializeBigInt(obj) {
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  } else if (obj !== null && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      const val = obj[key];
      if (typeof val === "bigint") {
        newObj[key] = val.toString();
      } else if (val instanceof Date) {
        newObj[key] = val.toISOString();
      } else if (typeof val === "object") {
        newObj[key] = serializeBigInt(val);
      } else {
        newObj[key] = val;
      }
    }
    return newObj;
  }
  return obj;
}

exports.getAllInquiries = async (req, res) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 각 문의에 대해 senderInfo 추가
    const inquiriesWithSenderInfo = await Promise.all(
      inquiries.map(async (inquiry) => {
        let senderInfo = null;
        const senderTypeLower = String(inquiry.senderType).toLowerCase();

        if (senderTypeLower === "user") {
          senderInfo = await prisma.users.findUnique({
            where: { id: BigInt(inquiry.senderId) },
            select: {
              id: true,
              user_name: true,
              email: true,
            },
          });
        } else if (senderTypeLower === "seller") {
          senderInfo = await prisma.sellers.findUnique({
            where: { id: BigInt(inquiry.senderId) },
            select: {
              id: true,
              name: true,
              shop_name: true,
              email: true,
            },
          });
        }

        return {
          ...inquiry,
          senderInfo,
        };
      })
    );

    res.json(serializeBigInt(inquiriesWithSenderInfo));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch inquiries" });
  }
};

exports.getInquiryById = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing id parameter" });

  try {
    // 1. 문의 기본 정보 조회
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: BigInt(id) },
    });

    if (!inquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    // 2. senderType에 따라 senderId로 추가 정보 조회
    let senderInfo = null;
    const senderTypeLower = String(inquiry.senderType).toLowerCase();

    if (senderTypeLower === "user") {
      senderInfo = await prisma.users.findUnique({
        where: { id: BigInt(inquiry.senderId) },
        select: {
          id: true,
          user_name: true,
          email: true,
          // 필요한 필드 추가
        },
      });
    } else if (senderTypeLower === "seller") {
      senderInfo = await prisma.sellers.findUnique({
        where: { id: BigInt(inquiry.senderId) },
        select: {
          id: true,
          name: true,
          shop_name: true,
          email: true,
          // 필요한 필드 추가
        },
      });
    }

    // 3. 응답에 병합하여 리턴
    res.json(
      serializeBigInt({
        ...inquiry,
        senderInfo,
      })
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch inquiry" });
  }
};

exports.createInquiry = async (req, res) => {
  const { senderId, senderType, title, content, status, productId } = req.body;

  if (!senderId || !senderType || !title || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const newInquiry = await prisma.inquiry.create({
      data: {
        senderId: BigInt(senderId),
        senderType,
        title,
        content,
        status: status || "접수",
        ...(productId && { productId: BigInt(productId) }), // productId가 있으면 포함
      },
    });
    res.status(201).json(serializeBigInt(newInquiry));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create inquiry" });
  }
};

exports.updateInquiry = async (req, res) => {
  const { id } = req.params;
  const { senderId, senderType, title, content, status, productId } = req.body;
  if (!id) return res.status(400).json({ error: "Missing id parameter" });

  try {
    const updatedInquiry = await prisma.inquiry.update({
      where: { id: BigInt(id) },
      data: {
        senderId: senderId !== undefined ? BigInt(senderId) : undefined,
        senderType,
        title,
        content,
        status,
        ...(productId !== undefined && { productId: productId ? BigInt(productId) : null }),
      },
    });
    res.json(serializeBigInt(updatedInquiry));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update inquiry" });
  }
};

exports.deleteInquiry = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing id parameter" });

  try {
    await prisma.inquiry.delete({
      where: { id: BigInt(id) },
    });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete inquiry" });
  }
};

exports.answerInquiry = async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  console.log(id, answer);

  if (!id || !answer) {
    return res.status(400).json({ error: "문의 ID와 답변은 필수입니다." });
  }

  try {
    const updatedInquiry = await prisma.inquiry.update({
      where: { id: BigInt(id) },
      data: {
        answer,
        answeredAt: new Date(),
        status: "답변완료", // 답변 시 상태를 답변완료로
      },
    });

    res.json(serializeBigInt(updatedInquiry));
  } catch (error) {
    console.error("답변 등록 실패:", error);
    res.status(500).json({ error: "Failed to answer inquiry" });
  }
};

exports.getInquiryAttachments = async (req, res) => {
  const { id } = req.params;

  if (!id)
    return res.status(400).json({ error: "Missing inquiry ID parameter" });

  try {
    const attachments = await prisma.attachment.findMany({
      where: {
        target_id: BigInt(id),
        target_type: "inquiry",
      },
      select: {
        id: true,
        filename: true,
        url: true,
        filesize: true,
        created_at: true,
      },
    });

    res.json(serializeBigInt(attachments));
  } catch (error) {
    console.error("Failed to fetch attachments:", error);
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
};

exports.getAllInquiryBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ error: "Missing sellerId parameter" });
    }

    // 해당 판매자가 받은 모든 문의 조회 (상품 문의 등)
    const inquiries = await prisma.inquiry.findMany({
      where: {
        // Product의 sellerId가 일치하는 문의만 조회
        Product: {
          sellerId: BigInt(sellerId),
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        Product: {
          select: {
            id: true,
            displayName: true,
            internalName: true,
            ProductImage: true,
            categoryCode: true,
          },
        },
      },
    });

    // 각 문의에 대해 senderInfo 추가
    const inquiriesWithSenderInfo = await Promise.all(
      inquiries.map(async (inquiry) => {
        let senderInfo = null;
        const senderTypeLower = String(inquiry.senderType).toLowerCase();

        if (senderTypeLower === "user") {
          senderInfo = await prisma.users.findUnique({
            where: { id: BigInt(inquiry.senderId) },
            select: {
              id: true,
              user_name: true,
              email: true,
            },
          });
        } else if (senderTypeLower === "seller") {
          senderInfo = await prisma.sellers.findUnique({
            where: { id: BigInt(inquiry.senderId) },
            select: {
              id: true,
              name: true,
              shop_name: true,
              email: true,
            },
          });
        }
        return {
          ...inquiry,
          senderInfo,
        };
      })
    );

    res.json(serializeBigInt(inquiriesWithSenderInfo));
  } catch (error) {
    console.error("판매자 문의 조회 실패:", error);
    res.status(500).json({ error: "판매자 문의 조회 실패" });
  }
};

exports.getAllInquiryBySellerToAdmin = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ error: "Missing sellerId parameter" });
    }

    // senderId가 sellerId이고 senderType이 'seller'인 문의만 조회 (product 정보 없음)
    // senderType은 대소문자 구분 없이 처리
    const inquiries = await prisma.inquiry.findMany({
      where: {
        senderId: BigInt(sellerId),
        OR: [
          { senderType: "seller" },
          { senderType: "SELLER" },
          { senderType: "Seller" },
        ],
      },
      orderBy: { createdAt: "desc" },
      // product 정보는 포함하지 않음
    });

    // 각 문의에 대해 senderInfo 추가
    const inquiriesWithSenderInfo = await Promise.all(
      inquiries.map(async (inquiry) => {
        let senderInfo = null;
        // senderType은 seller로 고정되어 있으므로 seller만 조회
        senderInfo = await prisma.sellers.findUnique({
          where: { id: BigInt(inquiry.senderId) },
          select: {
            id: true,
            name: true,
            shop_name: true,
            email: true,
          },
        });
        return {
          ...inquiry,
          senderInfo,
        };
      })
    );

    res.json(serializeBigInt(inquiriesWithSenderInfo));
  } catch (error) {
    console.error("판매자 문의 조회 실패:", error);
    res.status(500).json({ error: "판매자 문의 조회 실패" });
  }
};

exports.getLatelyInquires = async (req, res) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5, // 최근 5개만 조회
    });

    // senderType에 따라 user 또는 seller 테이블에서 사용자 정보 조회
    const inquiriesWithSenderInfo = await Promise.all(
      inquiries.map(async (inquiry) => {
        let senderInfo = null;
        const senderTypeLower = String(inquiry.senderType).toLowerCase();

        if (senderTypeLower === "user") {
          senderInfo = await prisma.users.findUnique({
            where: { id: BigInt(inquiry.senderId) },
            select: {
              id: true,
              user_name: true,
              email: true,
              // 필요한 필드 추가
            },
          });
        } else if (senderTypeLower === "seller") {
          senderInfo = await prisma.sellers.findUnique({
            where: { id: BigInt(inquiry.senderId) },
            select: {
              id: true,
              name: true,
              shop_name: true,
              email: true,
              // 필요한 필드 추가
            },
          });
        }

        return {
          ...inquiry,
          senderInfo,
        };
      })
    );

    res.json(serializeBigInt(inquiriesWithSenderInfo));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch inquiries" });
  }
};

// senderType이 user일 때 senderId에 따른 Inquiry만 조회 (신규 함수)
exports.getInquiriesByUserId = async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId parameter" });
  }
  try {
    const inquiries = await prisma.inquiry.findMany({
      where: {
        senderType: "user",
        senderId: BigInt(userId),
      },
      orderBy: { createdAt: "desc" },
    });

    // 각 문의에 대해 senderInfo 추가
    const inquiriesWithSenderInfo = await Promise.all(
      inquiries.map(async (inquiry) => {
        let senderInfo = null;
        const senderTypeLower = String(inquiry.senderType).toLowerCase();

        if (senderTypeLower === "user") {
          senderInfo = await prisma.users.findUnique({
            where: { id: BigInt(inquiry.senderId) },
            select: {
              id: true,
              user_name: true,
              email: true,
              // 필요한 필드 추가
            },
          });
        } else if (senderTypeLower === "seller") {
          senderInfo = await prisma.sellers.findUnique({
            where: { id: BigInt(inquiry.senderId) },
            select: {
              id: true,
              name: true,
              shop_name: true,
              email: true,
            },
          });
        }

        return {
          ...inquiry,
          senderInfo,
        };
      })
    );

    res.json(serializeBigInt(inquiriesWithSenderInfo));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user inquiries" });
  }
};
