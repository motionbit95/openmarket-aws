const prisma = require("../config/prisma");
const { convertBigIntToString, parseBigIntId } = require("../utils/bigint");

// 전체 유저 조회
exports.getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;

    // search 파라미터가 있으면 필터링
    const where = search
      ? {
          OR: [
            { user_name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const users = await prisma.users.findMany({
      where,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        user_name: true,
        email: true,
        phone: true,
        mileage: true,
        created_at: true,
        updated_at: true,
        // password는 제외
      },
    });

    res.json(convertBigIntToString(users));
  } catch (error) {
    console.error("유저 조회 실패:", error);
    res.status(500).json({ message: "서버 에러", error: error.message });
  }
};

// 특정 유저 조회
exports.getUserById = async (req, res) => {
  let id;
  try {
    id = parseBigIntId(req.params.id);
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        user_name: true,
        email: true,
        phone: true,
        mileage: true,
        created_at: true,
        updated_at: true,
        // password는 제외
      },
    });
    if (!user)
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    res.json(convertBigIntToString(user));
  } catch (error) {
    res.status(500).json({ message: "서버 에러", error });
  }
};

// 유저 로그인 (JWT 토큰 발행)
const jwt = require("jsonwebtoken");

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 이메일로 유저 찾기
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    // 비밀번호 일치 확인 (여기서는 평문 비교, 실제 서비스에서는 bcrypt 등으로 암호화 필요)
    if (user.password !== password) {
      return res
        .status(401)
        .json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    // JWT 토큰 발행
    const payload = {
      id: user.id.toString ? user.id.toString() : user.id,
      email: user.email,
      user_name: user.user_name,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "secret", {
      expiresIn: "60d",
    });

    // 로그인 성공 (비밀번호 제외하고 반환)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: "로그인 성공",
      user: convertBigIntToString(userWithoutPassword),
      token,
    });
  } catch (error) {
    console.error("유저 로그인 실패:", error);
    res.status(500).json({ message: "유저 로그인 실패", error });
  }
};

// 유저 생성
exports.createUser = async (req, res) => {
  const { user_name, email, password, phone } = req.body;

  try {
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "이미 사용 중인 이메일입니다." });
    }

    const newUser = await prisma.users.create({
      data: {
        user_name,
        email,
        password,
        phone,
      },
      select: {
        id: true,
        user_name: true,
        email: true,
        phone: true,
        mileage: true,
        created_at: true,
        updated_at: true,
        // password는 제외
      },
    });
    res.status(201).json(convertBigIntToString(newUser));
  } catch (error) {
    console.error("유저 생성 실패:", error);
    res.status(500).json({ message: "유저 생성 실패", error });
  }
};

// 유저 수정
exports.updateUser = async (req, res) => {
  let id;
  try {
    id = parseBigIntId(req.params.id);

    // 기존 유저 정보 조회
    const existingUser = await prisma.users.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }

    // 필수 정보 체크: user_name, email, phone (password는 선택사항)
    const requiredFields = ["user_name", "email", "phone"];
    for (const field of requiredFields) {
      if (
        Object.prototype.hasOwnProperty.call(req.body, field) &&
        (req.body[field] === undefined ||
          req.body[field] === null ||
          req.body[field] === "")
      ) {
        return res.status(400).json({ message: `필수 정보 누락: ${field}` });
      }
    }

    // req.body에서 들어온 값만 data에 포함 (undefined/null은 무시)
    // password는 관리자가 수정하지 않으므로 제외
    const allowedFields = [
      "user_name",
      "email",
      "phone",
      "mileage",
    ];
    const data = {};
    for (const field of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(req.body, field) &&
        req.body[field] !== undefined
      ) {
        data[field] = req.body[field];
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "수정할 데이터가 없습니다." });
    }

    // 변경된 필드만 추출
    const changedData = {};
    for (const key of Object.keys(data)) {
      // 기존 값과 다를 때만 포함
      if (data[key] !== existingUser[key]) {
        changedData[key] = data[key];
      }
    }

    if (Object.keys(changedData).length === 0) {
      // 변경된 필드가 없음
      return res.status(200).json(convertBigIntToString(existingUser));
    }

    // 필수 필드가 모두 포함되어 있는지 최종 체크 (변경 데이터에)
    for (const field of requiredFields) {
      if (
        Object.prototype.hasOwnProperty.call(changedData, field) &&
        (changedData[field] === undefined ||
          changedData[field] === null ||
          changedData[field] === "")
      ) {
        return res.status(400).json({ message: `필수 정보 누락: ${field}` });
      }
    }

    const updatedUser = await prisma.users.update({
      where: { id },
      data: changedData,
      select: {
        id: true,
        user_name: true,
        email: true,
        phone: true,
        mileage: true,
        created_at: true,
        updated_at: true,
        // password는 제외
      },
    });
    res.json(convertBigIntToString(updatedUser));
  } catch (error) {
    console.error("유저 수정 실패:", error);
    res.status(500).json({ message: "유저 수정 실패", error });
  }
};

// 유저 삭제
exports.deleteUser = async (req, res) => {
  let id;
  try {
    id = parseBigIntId(req.params.id);
    console.log(`[deleteUser] 요청: id=${id}`);
    // 1. 유저가 남긴 리뷰 삭제 (예: review, comment 등)
    // 리뷰 테이블 이름이 review라고 가정, user_id로 연결
    await prisma.review.deleteMany({ where: { userId: id } });

    // 3. 기타 유저가 남긴 데이터가 있다면 여기에 추가

    // 4. 유저 삭제
    await prisma.users.delete({ where: { id } });
    console.log(`[deleteUser] 성공: id=${id}`);
    res.json({ message: "유저 및 관련 리뷰/댓글 삭제 완료" });
  } catch (error) {
    if (error.code === "P2025") {
      // Prisma: An operation failed because it depends on one or more records that were required but not found.
      console.warn(
        `[deleteUser] 삭제할 유저를 찾을 수 없음: id=${req.params.id}`
      );
      return res
        .status(404)
        .json({ message: "삭제할 유저를 찾을 수 없습니다." });
    }
    console.error(`[deleteUser] 실패: id=${req.params.id}, error=`, error);
    res.status(500).json({ message: "유저 삭제 실패", error });
  }
};

// 올해 월별 신규 유저 수 통계 반환
exports.getUserGrowthStats = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();

    // 1월 1일 00:00:00
    const startOfYear = new Date(year, 0, 1, 0, 0, 0);
    // 12월 31일 23:59:59
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // 월별 신규 유저 수 집계
    const usersByMonth = await prisma.users.groupBy({
      by: ["created_at"],
      where: {
        created_at: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      _count: { id: true },
    });

    // 월별로 카운트 집계 (1~12월, 0으로 초기화)
    const monthlyCounts = Array(12).fill(0);
    usersByMonth.forEach((item) => {
      const month = item.created_at.getMonth(); // 0~11
      monthlyCounts[month] += item._count.id;
    });

    // 전체 합계
    const total = monthlyCounts.reduce((a, b) => a + b, 0);

    // percent 계산 (예시: 전월 대비 증감률, 없으면 0)
    let percent = 0;
    if (
      monthlyCounts.length >= 2 &&
      monthlyCounts[monthlyCounts.length - 2] > 0
    ) {
      const prev = monthlyCounts[monthlyCounts.length - 2];
      const curr = monthlyCounts[monthlyCounts.length - 1];
      percent = ((curr - prev) / prev) * 100;
    }

    // 카테고리(월) 라벨
    const categories = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    res.json({
      id: "user-growth",
      title: "소비자 이용자수",
      percent: Number(percent.toFixed(1)),
      total,
      chart: {
        categories: categories,
        series: monthlyCounts,
      },
    });
  } catch (error) {
    console.error("유저 증가수 통계 조회 실패:", error);
    res.status(500).json({ message: "유저 증가수 통계 조회 실패", error });
  }
};
