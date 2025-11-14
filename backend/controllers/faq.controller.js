const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { format } = require("date-fns");

// bigint → string 변환 유틸
function convertBigIntToString(data) {
  if (Array.isArray(data)) return data.map(convertBigIntToString);
  if (data && typeof data === "object") {
    for (const key in data) {
      if (typeof data[key] === "bigint") {
        data[key] = data[key].toString();
      }
    }
  }
  return data;
}

// ID 파싱
function parseId(idStr, res) {
  try {
    return BigInt(idStr);
  } catch {
    res.status(400).json({ message: "유효하지 않은 ID입니다." });
    return null;
  }
}

// CREATE
exports.createFAQ = async (req, res) => {
  try {
    const { type, title, content } = req.body;
    if (!type || !title || !content) {
      return res
        .status(400)
        .json({ message: "type, title, content는 필수입니다." });
    }

    const newFaq = await prisma.fAQ.create({
      data: { type, title, content },
    });

    res.status(201).json(convertBigIntToString(newFaq));
  } catch (error) {
    console.error("FAQ 생성 실패:", error);
    res.status(500).json({ message: "FAQ 생성 실패" });
  }
};

// READ - 전체 목록
exports.getAllFAQs = async (req, res) => {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: { created_at: "desc" },
    });

    res.json(convertBigIntToString(faqs));
  } catch (error) {
    console.error("FAQ 목록 조회 실패:", error);
    res.status(500).json({ message: "FAQ 목록 조회 실패" });
  }
};

exports.getUserFAQs = async (req, res) => {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: {
        type: "USER",
      },
      orderBy: { created_at: "desc" },
    });

    const formattedFaqs = faqs.map((faq) => ({
      ...faq,
      created_at: faq.created_at
        ? format(new Date(faq.created_at), "yyyy-MM-dd")
        : null,
      updated_at: faq.updated_at
        ? format(new Date(faq.updated_at), "yyyy-MM-dd")
        : null,
    }));

    res.json(convertBigIntToString(formattedFaqs));
  } catch (error) {
    console.error("FAQ 목록 조회 실패:", error);
    res.status(500).json({ message: "FAQ 목록 조회 실패" });
  }
};

// READ - 단일 조회
exports.getFAQById = async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;

  try {
    const faq = await prisma.fAQ.findUnique({ where: { id } });
    if (!faq) return res.status(404).json({ message: "FAQ 없음" });

    res.json(convertBigIntToString(faq));
  } catch (error) {
    console.error("FAQ 조회 실패:", error);
    res.status(500).json({ message: "FAQ 조회 실패" });
  }
};

// UPDATE
exports.updateFAQ = async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;

  const { type, title, content } = req.body;

  try {
    const existing = await prisma.fAQ.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "FAQ 없음" });

    const updated = await prisma.fAQ.update({
      where: { id },
      data: {
        type: type ?? existing.type,
        title: title ?? existing.title,
        content: content ?? existing.content,
      },
    });

    res.json(convertBigIntToString(updated));
  } catch (error) {
    console.error("FAQ 수정 실패:", error);
    res.status(500).json({ message: "FAQ 수정 실패" });
  }
};

// DELETE
exports.deleteFAQ = async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;

  try {
    await prisma.fAQ.delete({ where: { id } });
    res.json({ message: "FAQ 삭제 완료" });
  } catch (error) {
    console.error("FAQ 삭제 실패:", error);
    res.status(500).json({ message: "FAQ 삭제 실패" });
  }
};
