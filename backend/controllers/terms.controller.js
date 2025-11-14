const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 전체 약관 조회
exports.getAllTerms = async (req, res) => {
  try {
    // 1. type별 가장 최신 약관만 추출
    const types = await prisma.terms.findMany({
      distinct: ["type"],
      orderBy: [{ type: "asc" }, { created_at: "desc" }],
    });

    res.json(types);
  } catch (error) {
    console.error("약관 조회 실패:", error);
    res.status(500).json({ message: "서버 에러", error });
  }
};

// 타입별 최신 약관 조회
exports.getLatestTermsByType = async (req, res) => {
  const { type } = req.params;

  try {
    const latestTerms = await prisma.terms.findFirst({
      where: { type },
      orderBy: { effective_date: "desc" },
    });
    if (!latestTerms)
      return res.status(404).json({ message: "약관을 찾을 수 없습니다." });
    res.json(latestTerms);
  } catch (error) {
    console.error("약관 조회 실패:", error);
    res.status(500).json({ message: "서버 에러", error });
  }
};

// ID로 약관 조회
exports.getTermsById = async (req, res) => {
  const { id } = req.params;
  try {
    const terms = await prisma.terms.findUnique({ where: { id } });
    if (!terms)
      return res.status(404).json({ message: "약관을 찾을 수 없습니다." });
    res.json(terms);
  } catch (error) {
    console.error("약관 조회 실패:", error);
    res.status(500).json({ message: "서버 에러", error });
  }
};

// 약관 생성
exports.createTerms = async (req, res) => {
  const { type, title, content, effective_date } = req.body;
  try {
    const newTerms = await prisma.terms.create({
      data: {
        type: type.toUpperCase(),
        title,
        content,
        effective_date: new Date(effective_date),
      },
    });
    res.status(201).json(newTerms);
  } catch (error) {
    console.error("약관 생성 실패:", error);
    res.status(500).json({ message: "약관 생성 실패", error });
  }
};

// 약관 수정
exports.updateTerms = async (req, res) => {
  const { id } = req.params;
  const { title, content, effective_date } = req.body;
  try {
    // 먼저 존재 확인
    const existing = await prisma.terms.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "약관을 찾을 수 없습니다." });

    const updatedTerms = await prisma.terms.update({
      where: { id },
      data: {
        title,
        content,
        effective_date: new Date(effective_date),
      },
    });
    res.json(updatedTerms);
  } catch (error) {
    console.error("약관 수정 실패:", error);
    res.status(500).json({ message: "약관 수정 실패", error });
  }
};

// 약관 삭제
exports.deleteTerms = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.terms.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "약관을 찾을 수 없습니다." });

    await prisma.terms.delete({ where: { id } });
    res.json({ message: "약관 삭제 완료" });
  } catch (error) {
    console.error("약관 삭제 실패:", error);
    res.status(500).json({ message: "약관 삭제 실패", error });
  }
};
