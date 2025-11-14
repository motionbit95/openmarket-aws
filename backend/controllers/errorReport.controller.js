const prisma = require("../config/prisma");

// BigInt를 문자열로 변환해 JSON 직렬화 문제 해결
function convertBigIntToString(obj) {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(
    JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

// 문자열이 숫자로만 이루어졌는지 확인 후 BigInt 변환, 유효하지 않으면 예외 발생
function safeBigInt(value) {
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value);
  }
  throw new Error("Invalid BigInt value");
}

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

exports.createErrorReport = async (req, res) => {
  try {
    const {
      reporter_id,
      reporter_type,
      category,
      title,
      content,
      status = "접수",
    } = req.body;

    const report = await prisma.ErrorReport.create({
      data: {
        reporter_id: safeBigInt(reporter_id.toString()),
        reporter_type,
        category,
        title,
        content,
        status,
      },
    });

    res.status(201).json(convertBigIntToString(report));
  } catch (error) {
    console.error("에러 리포트 생성 실패:", error);
    res.status(500).json({ message: "에러 리포트 생성 실패" });
  }
};

exports.getAllErrorReports = async (req, res) => {
  try {
    const filters = {};

    if (req.query.status) filters.status = req.query.status;
    if (req.query.reporter_type)
      filters.reporter_type = req.query.reporter_type;
    if (req.query.reporter_id)
      filters.reporter_id = safeBigInt(req.query.reporter_id);

    // 카테고리 필터 - 단일 또는 다중 지원
    if (req.query.category) {
      // 쉼표로 구분된 여러 카테고리 지원
      const categories = req.query.category.split(',').map(c => c.trim());
      if (categories.length > 1) {
        filters.category = { in: categories };
      } else {
        filters.category = categories[0];
      }
    }

    const reports = await prisma.ErrorReport.findMany({
      where: filters,
      orderBy: { created_at: "desc" },
    });

    const reportsWithReporterInfo = await Promise.all(
      reports.map(async (report) => {
        let reporterInfo = null;

        if (report.reporter_type === "user") {
          reporterInfo = await prisma.users.findUnique({
            where: { id: BigInt(report.reporter_id) },
            select: {
              id: true,
              user_name: true,
              email: true,
              // 필요한 필드 추가
            },
          });
        } else if (report.reporter_type === "seller") {
          reporterInfo = await prisma.sellers.findUnique({
            where: { id: BigInt(report.reporter_id) },
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
          ...report,
          reporterInfo,
        };
      })
    );

    res.json(convertBigIntToString(reportsWithReporterInfo));
  } catch (error) {
    console.error("에러 리포트 조회 실패:", error);
    res.status(500).json({ message: "에러 리포트 조회 실패" });
  }
};

exports.getErrorReportById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: "ID 파라미터가 필요합니다." });
    }
    const id = safeBigInt(req.params.id);

    const report = await prisma.ErrorReport.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(convertBigIntToString(report));
  } catch (error) {
    console.error("에러 리포트 상세 조회 실패:", error);
    res.status(500).json({ message: "에러 리포트 상세 조회 실패" });
  }
};

exports.updateErrorReport = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: "ID 파라미터가 필요합니다." });
    }
    const id = safeBigInt(req.params.id);

    const updateData = { ...req.body, updated_at: new Date() };

    // reporter_id가 있으면 BigInt로 변환
    if (updateData.reporter_id !== undefined) {
      updateData.reporter_id = safeBigInt(updateData.reporter_id.toString());
    }

    const updated = await prisma.ErrorReport.update({
      where: { id },
      data: updateData,
    });

    res.json(convertBigIntToString(updated));
  } catch (error) {
    console.error("에러 리포트 수정 실패:", error);
    res.status(500).json({ message: "에러 리포트 수정 실패" });
  }
};

exports.deleteErrorReport = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: "ID 파라미터가 필요합니다." });
    }
    const id = safeBigInt(req.params.id);

    await prisma.ErrorReport.delete({
      where: { id },
    });

    res.json({ message: "Report deleted" });
  } catch (error) {
    console.error("에러 리포트 삭제 실패:", error);
    res.status(500).json({ message: "에러 리포트 삭제 실패" });
  }
};

exports.answerErrorReport = async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  if (!id || !answer) {
    return res.status(400).json({ error: "문의 ID와 답변은 필수입니다." });
  }

  try {
    const updatedInquiry = await prisma.ErrorReport.update({
      where: { id: BigInt(id) },
      data: {
        answer,
        answeredAt: new Date(),
        status: "완료", // 답변 시 상태를 완료로
      },
    });

    res.json(serializeBigInt(updatedInquiry));
  } catch (error) {
    console.error("답변 등록 실패:", error);
    res.status(500).json({ error: "Failed to answer inquiry" });
  }
};

exports.getErrorReportAttatchments = async (req, res) => {
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

    res.json(serializeBigInt(attachments)); // serializeBigInt 함수로 감싸서 반환
  } catch (error) {
    console.error("Failed to fetch attachments:", error);
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
};

exports.getErrorReportBySeller = async (req, res) => {
  console.log("[getErrorReportBySeller] Called with params:", req.params);
  try {
    const { sellerId, type } = req.params;
    console.log("[getErrorReportBySeller] sellerId:", sellerId, "type:", type);

    if (!sellerId) {
      return res.status(400).json({ error: "Missing sellerId parameter" });
    }

    // 필터 객체 생성
    const where = {
      reporter_type: "seller",
      reporter_id: BigInt(sellerId),
    };

    // type(카테고리) 파라미터가 있으면 추가
    if (type) {
      where.category = type;
    }

    const reports = await prisma.ErrorReport.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    // reporterInfo 추가 (getAllErrorReports 참고)
    const reportsWithReporterInfo = await Promise.all(
      reports.map(async (report) => {
        let reporterInfo = null;

        // 판매자 정보만 조회
        reporterInfo = await prisma.sellers.findUnique({
          where: { id: BigInt(report.reporter_id) },
          select: {
            id: true,
            shop_name: true,
            email: true,
            name: true,
            // 필요한 필드 추가
          },
        });

        return {
          ...report,
          reporterInfo,
        };
      })
    );

    res.json(convertBigIntToString(reportsWithReporterInfo));
  } catch (error) {
    console.error("판매자 에러 리포트 목록 조회 실패:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);
    res.status(500).json({ message: "판매자 에러 리포트 목록 조회 실패", error: error.message });
  }
};
