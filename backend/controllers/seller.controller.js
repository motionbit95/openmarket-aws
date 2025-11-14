const prisma = require("../config/prisma");
const { convertBigIntToString, parseBigIntId } = require("../utils/bigint");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

const validBankTypes = [
  "KB",
  "SH",
  "HN",
  "WR",
  "IB",
  "NH",
  "KAKAOBANK",
  "KBANK",
  "IBK",
  "SUHYUP",
  "SC",
  "CITI",
  "DG",
  "BS",
  "GJ",
  "JB",
  "JJ",
  "GN",
];

// 전체 판매자 조회
exports.getAllSellers = async (req, res) => {
  try {
    const sellers = await prisma.sellers.findMany();
    res.json(convertBigIntToString(sellers));
  } catch (error) {
    console.error("판매자 조회 실패:", error);
    res.status(500).json({ message: "서버 에러", error });
  }
};

// 특정 판매자 조회
exports.getSellerById = async (req, res) => {
  try {
    const id = parseBigIntId(req.params.id);
    const seller = await prisma.sellers.findUnique({ where: { id } });
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    res.json(convertBigIntToString(seller));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 판매자 생성
exports.createSeller = async (req, res) => {
  const {
    email,
    name,
    shop_name,
    password,
    phone,
    business_number,
    bank_type,
    bank_account,
    address1,
    address2,
    postcode,
    onlinesales_number,
  } = req.body;

  // 필수 필드 검증
  if (!name) {
    return res.status(400).json({ message: "이름은 필수 입력 항목입니다." });
  }

  if (!email) {
    return res.status(400).json({ message: "이메일은 필수 입력 항목입니다." });
  }

  if (bank_type !== undefined && !validBankTypes.includes(bank_type)) {
    return res.status(400).json({ message: "유효하지 않은 bank_type 입니다." });
  }

  try {
    const existingSeller = await prisma.sellers.findUnique({
      where: { email },
    });
    if (existingSeller) {
      return res.status(400).json({ message: "이미 사용 중인 이메일입니다." });
    }

    const newSeller = await prisma.sellers.create({
      data: {
        email,
        name,
        shop_name,
        password,
        phone,
        business_number,
        bank_type,
        bank_account,
        address1,
        address2,
        postcode,
        onlinesales_number,
      },
    });

    res.status(201).json(convertBigIntToString(newSeller));
  } catch (error) {
    console.error("판매자 생성 실패:", error);
    res.status(500).json({ message: "판매자 생성 실패", error });
  }
};

// 판매자 수정
exports.updateSeller = async (req, res) => {
  const id = parseBigIntId(req.params.id);
  const {
    name,
    email,
    shop_name,
    password,
    phone,
    business_number,
    bank_type,
    bank_account,
    address1,
    address2,
    postcode,
    onlinesales_number,
  } = req.body;

  // 필수 필드 검증
  if (!name) {
    return res.status(400).json({ message: "이름은 필수 입력 항목입니다." });
  }

  if (bank_type !== undefined && !validBankTypes.includes(bank_type)) {
    return res.status(400).json({ message: "유효하지 않은 bank_type 입니다." });
  }

  try {
    const updatedSeller = await prisma.sellers.update({
      where: { id },
      data: {
        name,
        email,
        shop_name,
        password,
        phone,
        business_number,
        bank_type,
        bank_account,
        address1,
        address2,
        postcode,
        onlinesales_number,
      },
    });

    res.json(convertBigIntToString(updatedSeller));
  } catch (error) {
    console.error("판매자 수정 실패:", error);
    res.status(500).json({ message: "판매자 수정 실패", error });
  }
};

// 판매자 삭제
exports.deleteSeller = async (req, res) => {
  const id = parseBigIntId(req.params.id);
  try {
    await prisma.sellers.delete({ where: { id } });
    res.json({ message: "판매자 삭제 완료" });
  } catch (error) {
    console.error("판매자 삭제 실패:", error);
    res.status(500).json({ message: "판매자 삭제 실패", error });
  }
};

// 현재 로그인한 판매자 정보 조회
exports.getCurrentSeller = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("[getCurrentSeller] 토큰 없음");
      return res.status(401).json({ message: "토큰이 없습니다." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded?.id) {
      console.log("[getCurrentSeller] 유효하지 않은 토큰 (id 없음)");
      return res
        .status(401)
        .json({ message: "유효하지 않은 토큰입니다. (id 없음)" });
    }

    const seller = await prisma.sellers.findUnique({
      where: { id: parseBigIntId(decoded.id) },
    });

    if (!seller) {
      console.log("[getCurrentSeller] 판매자 정보 없음");
      return res
        .status(404)
        .json({ message: "판매자 정보가 존재하지 않습니다." });
    }

    const { password, ...safeSeller } = convertBigIntToString(seller);
    // 판매자 role 추가
    const sellerWithRole = { ...safeSeller, role: "partner" };
    res.json({ user: sellerWithRole });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      console.log("[getCurrentSeller] JWT 오류:", error.message);
      return res.status(401).json({ message: "토큰이 유효하지 않습니다." });
    }
    if (error.name === "TokenExpiredError") {
      console.log("[getCurrentSeller] 토큰 만료:", error.message);
      return res.status(401).json({ message: "토큰이 만료되었습니다." });
    }
    console.error("현재 판매자 조회 실패:", error);
    res.status(500).json({ message: "서버 에러", error: error.message });
  }
};

// 판매자 로그인
exports.signInSeller = async (req, res) => {
  const { email, password } = req.body;

  try {
    const seller = await prisma.sellers.findUnique({ where: { email } });

    // Handle both hashed and plain text passwords
    let isValidPassword = false;

    if (!seller) {
      return res
        .status(401)
        .json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    // Check if password is hashed (starts with $2a$, $2b$, or $2y$) or plain text
    if (seller.password.startsWith("$2") && seller.password.length > 50) {
      // Password is hashed, use bcrypt
      isValidPassword = await bcrypt.compare(password, seller.password);
    } else {
      // Password is plain text
      isValidPassword = seller.password === password;
    }

    if (!isValidPassword) {
      return res
        .status(401)
        .json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const token = jwt.sign({ id: seller.id.toString() }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token });
  } catch (error) {
    console.error("판매자 로그인 실패:", error);
    res.status(500).json({ message: "서버 에러", error });
  }
};

// 판매자 회원가입
exports.signUpSeller = async (req, res) => {
  const {
    email,
    name,
    shop_name,
    password,
    phone,
    business_number,
    bank_type,
    bank_account,
    address1,
    address2,
    postcode,
    onlinesales_number,
    mode, // "additional"이면 추가정보 입력 모드
  } = req.body;

  console.log(req.body);

  if (bank_type !== undefined && !validBankTypes.includes(bank_type)) {
    return res.status(400).json({ message: "유효하지 않은 bank_type 입니다." });
  }

  try {
    const existingSeller = await prisma.sellers.findUnique({
      where: { email },
    });

    if (mode === "additional") {
      // 추가정보 입력 모드: 기존 판매자 정보 수정
      if (!existingSeller) {
        return res.status(404).json({
          message: "[AUTH_006] 해당 이메일의 판매자 정보가 존재하지 않습니다.",
        });
      }

      // 비밀번호는 수정하지 않음 (원하면 req.body에 password 포함)
      const updatedSeller = await prisma.sellers.update({
        where: { email },
        data: {
          name,
          shop_name,
          phone,
          business_number,
          bank_type,
          bank_account,
          address1,
          address2,
          postcode,
          onlinesales_number,
          // password: password, // 필요시 주석 해제
        },
      });

      // 토큰 발급 (기존 seller id 사용)
      const token = jwt.sign({ id: updatedSeller.id.toString() }, JWT_SECRET, {
        expiresIn: "7d",
      });

      const { password: _, ...safeSeller } =
        convertBigIntToString(updatedSeller);

      return res.status(200).json({ seller: safeSeller, token });
    } else {
      // 회원가입 모드: 신규 생성
      if (existingSeller) {
        return res
          .status(400)
          .json({ message: "[AUTH_005] 이미 사용 중인 이메일입니다." });
      }

      const newSeller = await prisma.sellers.create({
        data: {
          email,
          name,
          shop_name,
          password,
          phone,
          business_number,
          bank_type,
          bank_account,
          address1,
          address2,
          postcode,
          onlinesales_number,
        },
      });

      // 토큰 발급
      const token = jwt.sign({ id: newSeller.id.toString() }, JWT_SECRET, {
        expiresIn: "7d",
      });

      // 비밀번호는 응답에서 제외
      const { password: _, ...safeSeller } = convertBigIntToString(newSeller);

      return res.status(201).json({ seller: safeSeller, token });
    }
  } catch (error) {
    console.error("판매자 회원가입/추가정보 입력 실패:", error);
    res.status(500).json({ message: "서버 에러", error });
  }
};

exports.getSellerAttachments = async (req, res) => {
  const { id } = req.params;

  if (!id)
    return res.status(400).json({ error: "Missing seller ID parameter" });

  try {
    const attachments = await prisma.attachments.findMany({
      where: {
        target_type: "seller",
        target_id: parseBigIntId(id)
      },
      select: {
        id: true,
        filename: true,
        url: true,
        filesize: true,
        created_at: true,
      },
    });

    res.json(convertBigIntToString(attachments));
  } catch (error) {
    console.error("Failed to fetch seller attachments:", error);
    res.status(500).json({ error: "Failed to fetch seller attachments" });
  }
};

// 판매자 ID 찾기 (이름과 휴대폰 번호로 이메일 검색)
exports.findSellerEmail = async (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res
      .status(400)
      .json({ message: "이름과 휴대폰 번호를 입력해주세요." });
  }

  try {
    const seller = await prisma.sellers.findFirst({
      where: {
        name: name.trim(),
        phone: phone.trim(),
      },
      select: {
        email: true,
        created_at: true,
      },
    });

    if (!seller) {
      return res.status(404).json({
        message: "입력하신 정보와 일치하는 판매자 계정을 찾을 수 없습니다.",
      });
    }

    res.json({
      message: "아이디 찾기 완료",
      seller: {
        email: seller.email,
        createdAt: seller.created_at.toISOString().split("T")[0], // YYYY-MM-DD 형식
      },
    });
  } catch (error) {
    console.error("판매자 ID 찾기 실패:", error);
    res.status(500).json({ message: "서버 에러", error: error.message });
  }
};

exports.getSellerGrowthStats = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();

    // 1월 1일 00:00:00
    const startOfYear = new Date(year, 0, 1, 0, 0, 0);
    // 12월 31일 23:59:59
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // 월별 신규 판매자 수 집계
    const sellersByMonth = await prisma.sellers.groupBy({
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
    sellersByMonth.forEach((item) => {
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
      id: "seller-growth",
      title: "판매자 이용자수",
      percent: Number(percent.toFixed(1)),
      total,
      chart: {
        categories: categories,
        series: monthlyCounts,
      },
    });
  } catch (error) {
    console.error("판매자 증가수 통계 조회 실패:", error);
    res.status(500).json({ message: "판매자 증가수 통계 조회 실패", error });
  }
};
