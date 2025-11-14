const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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

// id 파싱 유틸
function parseId(idStr, res) {
  try {
    return BigInt(idStr);
  } catch {
    res.status(400).json({ message: "유효하지 않은 ID입니다." });
    return null;
  }
}

// 첨부파일 병합 유틸
async function withAttachments(userGuide) {
  const attachments = await prisma.attachments.findMany({
    where: {
      target_type: "user-guide",
      target_id: userGuide.id,
    },
  });

  return {
    ...userGuide,
    attachments,
  };
}

// 📌 CREATE
exports.createUserGuide = async (req, res) => {
  try {
    const { type, title, content, is_pinned = false } = req.body;

    if (!type || !title || !content) {
      return res
        .status(400)
        .json({ message: "type, title, content는 필수입니다." });
    }

    const newGuide = await prisma.UserGuide.create({
      data: { type, title, content, is_pinned },
    });

    const fullGuide = await withAttachments(newGuide);

    res.status(201).json(convertBigIntToString(fullGuide));
  } catch (error) {
    console.error("UserGuide 생성 실패:", error);
    res.status(500).json({ message: "UserGuide 생성 실패" });
  }
};

// 📌 READ - 전체 목록
exports.getAllUserGuides = async (req, res) => {
  try {
    const guides = await prisma.UserGuide.findMany({
      orderBy: [{ is_pinned: "desc" }, { created_at: "desc" }],
    });

    const withAll = await Promise.all(guides.map(withAttachments));

    res.json(convertBigIntToString(withAll));
  } catch (error) {
    console.error("UserGuide 목록 조회 실패:", error);
    res.status(500).json({ message: "UserGuide 목록 조회 실패" });
  }
};

// 📌 READ - 단일 조회
exports.getUserGuideById = async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;

  try {
    const guide = await prisma.UserGuide.findUnique({ where: { id } });
    if (!guide) return res.status(404).json({ message: "UserGuide 없음" });

    const fullGuide = await withAttachments(guide);

    res.json(convertBigIntToString(fullGuide));
  } catch (error) {
    console.error("UserGuide 조회 실패:", error);
    res.status(500).json({ message: "UserGuide 조회 실패" });
  }
};

// 📌 UPDATE
exports.updateUserGuide = async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;

  const { type, title, content, is_pinned } = req.body;

  try {
    const guide = await prisma.UserGuide.findUnique({ where: { id } });
    if (!guide) return res.status(404).json({ message: "UserGuide 없음" });

    const updated = await prisma.UserGuide.update({
      where: { id },
      data: {
        type: type ?? guide.type,
        title: title ?? guide.title,
        content: content ?? guide.content,
        is_pinned: is_pinned ?? guide.is_pinned,
        updated_at: new Date(),
      },
    });

    const fullGuide = await withAttachments(updated);

    res.json(convertBigIntToString(fullGuide));
  } catch (error) {
    console.error("UserGuide 수정 실패:", error);
    res.status(500).json({ message: "UserGuide 수정 실패" });
  }
};

// 📌 DELETE
exports.deleteUserGuide = async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;

  try {
    await prisma.UserGuide.delete({ where: { id } });
    res.json({ message: "UserGuide 삭제 완료" });
  } catch (error) {
    console.error("UserGuide 삭제 실패:", error);
    res.status(500).json({ message: "UserGuide 삭제 실패" });
  }
};

exports.getGuideAttachments = async (req, res) => {
  const { id } = req.params;
  if (!id)
    return res.status(400).json({ error: "Missing inquiry ID parameter" });

  try {
    const attachments = await prisma.attachments.findMany({
      where: { target_id: BigInt(id) },
      select: {
        id: true,
        filename: true,
        url: true,
        filesize: true,
        created_at: true,
      },
    });

    res.json(convertBigIntToString(attachments)); // serializeBigInt 함수로 감싸서 반환
  } catch (error) {
    console.error("Failed to fetch attachments:", error);
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
};
