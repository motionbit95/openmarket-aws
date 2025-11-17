const prisma = require("../config/prisma");
const { convertBigIntToString, parseBigIntId } = require("../utils/bigint");
const { format } = require("date-fns");

const NOTICE_TYPE_VALUES = ["USER", "SELLER"];

// 공지 + 첨부파일 묶음 반환 함수
async function getNoticeWithAttachments(id) {
  const notice = await prisma.Notice.findUnique({ where: { id } });
  if (!notice) return null;

  const attachments = await prisma.attachments.findMany({
    where: {
      target_type: "notice",
      target_id: id,
    },
  });

  return {
    ...notice,
    attachments,
  };
}

exports.getAllNotices = async (req, res) => {
  try {
    const { noticeType } = req.query;

    const notices = await prisma.Notice.findMany({
      where: noticeType
        ? {
            type: noticeType.toUpperCase(),
          }
        : undefined,

      orderBy: { created_at: "desc" },
    });

    // 모든 공지에 대해 첨부파일을 각각 조회
    // 병렬 처리 (성능 주의, 필요시 페이징 및 join 방식 고민)
    const noticesWithAttachments = await Promise.all(
      notices.map(async (notice) => {
        const attachments = await prisma.attachments.findMany({
          where: {
            target_type: "notice",
            target_id: notice.id,
          },
        });
        return {
          ...notice,
          attachments,
        };
      })
    );

    res.json(convertBigIntToString(noticesWithAttachments));
  } catch (error) {
    console.error("공지 목록 조회 실패:", error);
    res.status(500).json({ message: "공지 목록 조회 실패" });
  }
};

exports.getUserNotice = async (req, res) => {
  try {
    const notices = await prisma.Notice.findMany({
      where: {
        type: "USER",
      },
      orderBy: { created_at: "desc" },
    });

    const noticesWithAttachments = await Promise.all(
      notices.map(async (notice) => {
        const attachments = await prisma.attachments.findMany({
          where: {
            target_type: "notice",
            target_id: notice.id,
          },
        });

        return {
          ...notice,
          created_at: notice.created_at
            ? format(new Date(notice.created_at), "yyyy-MM-dd")
            : null,
          updated_at: notice.updated_at
            ? format(new Date(notice.updated_at), "yyyy-MM-dd")
            : null,
          attachments,
        };
      })
    );

    res.json(convertBigIntToString(noticesWithAttachments));
  } catch (error) {
    console.error("공지 목록 조회 실패:", error);
    res.status(500).json({ message: "공지 목록 조회 실패" });
  }
};

// 타입별 공지사항 조회
exports.getNoticesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const noticeType = type?.toUpperCase();

    if (!NOTICE_TYPE_VALUES.includes(noticeType)) {
      return res.status(400).json({ message: "유효하지 않은 공지 타입입니다." });
    }

    const notices = await prisma.Notice.findMany({
      where: {
        type: noticeType,
      },
      orderBy: [
        { is_pinned: "desc" }, // 고정 공지사항 먼저
        { created_at: "desc" }, // 최신순
      ],
    });

    res.json(convertBigIntToString(notices));
  } catch (error) {
    console.error("타입별 공지 목록 조회 실패:", error);
    res.status(500).json({ message: "타입별 공지 목록 조회 실패" });
  }
};

exports.getNoticeById = async (req, res) => {
  try {
    console.log("받은 ID:", req.params.id, "타입:", typeof req.params.id);
    const id = parseBigIntId(req.params.id);

    // 먼저 공지사항 존재 여부 확인 및 조회수 증가
    const notice = await prisma.Notice.findUnique({
      where: { id },
    });

    if (!notice) {
      return res.status(404).json({ message: "공지 없음" });
    }

    // 조회수 증가 (에러 발생 시 404 반환)
    try {
      await prisma.Notice.update({
        where: { id },
        data: {
          view_count: {
            increment: 1,
          },
        },
      });
    } catch (updateError) {
      // 업데이트 중 레코드가 삭제된 경우
      if (updateError.code === 'P2025') {
        return res.status(404).json({ message: "공지 없음" });
      }
      throw updateError;
    }

    const noticeWithAttachments = await getNoticeWithAttachments(id);

    // getNoticeWithAttachments가 null 반환 시 404
    if (!noticeWithAttachments) {
      return res.status(404).json({ message: "공지 없음" });
    }

    res.json(convertBigIntToString(noticeWithAttachments));
  } catch (error) {
    console.error("공지 조회 실패:", error);
    res.status(500).json({ message: "공지 조회 실패" });
  }
};

exports.createNotice = async (req, res) => {
  let { type, title, content, is_pinned = false } = req.body;
  type = type?.toUpperCase();

  if (!NOTICE_TYPE_VALUES.includes(type)) {
    return res.status(400).json({ message: "유효하지 않은 공지 타입입니다." });
  }

  if (!title || !content) {
    return res.status(400).json({ message: "title과 content는 필수입니다." });
  }

  try {
    const newNotice = await prisma.Notice.create({
      data: { type, title, content, is_pinned },
    });
    res.status(201).json(convertBigIntToString(newNotice));
  } catch (error) {
    console.error("공지 생성 실패:", error);
    res.status(500).json({ message: "공지 생성 실패" });
  }
};

exports.updateNotice = async (req, res) => {
  try {
    const id = parseBigIntId(req.params.id);
    let { type, title, content, is_pinned } = req.body;

    if (type) {
      type = type.toUpperCase();
      if (!NOTICE_TYPE_VALUES.includes(type)) {
        return res
          .status(400)
          .json({ message: "유효하지 않은 공지 타입입니다." });
      }
    }

    const dataToUpdate = {};
    if (type) dataToUpdate.type = type;
    if (title !== undefined) dataToUpdate.title = title;
    if (content !== undefined) dataToUpdate.content = content;
    if (typeof is_pinned === "boolean") dataToUpdate.is_pinned = is_pinned;

    const updated = await prisma.Notice.update({
      where: { id },
      data: dataToUpdate,
    });
    res.json(convertBigIntToString(updated));
  } catch (error) {
    console.error("공지 수정 실패:", error);
    res.status(500).json({ message: "공지 수정 실패" });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const id = parseBigIntId(req.params.id);
    // 첨부파일 삭제
    await prisma.attachments.deleteMany({
      where: { target_type: "notice", target_id: id },
    });

    // 공지 삭제
    await prisma.Notice.delete({ where: { id } });

    res.json({ message: "공지 삭제 완료" });
  } catch (error) {
    console.error("공지 삭제 실패:", error);
    res.status(500).json({ message: "공지 삭제 실패" });
  }
};

exports.getNoticeAttachments = async (req, res) => {
  const { id } = req.params;

  if (!id)
    return res.status(400).json({ error: "Missing notice ID parameter" });

  try {
    const attachments = await prisma.attachments.findMany({
      where: { target_id: parseBigIntId(id) },
      select: {
        id: true,
        filename: true,
        url: true,
        filesize: true,
        created_at: true,
      },
    });

    res.json(convertBigIntToString(attachments)); // convertBigIntToString 함수로 감싸서 반환
  } catch (error) {
    console.error("Failed to fetch attachments:", error);
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
};
