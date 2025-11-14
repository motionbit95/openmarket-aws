const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const fs = require("fs");
const prisma = require("../config/prisma");

const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@gmail.com";
const EMAIL_USER = process.env.EMAIL_USER || "your_gmail@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "your_gmail_app_password";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 인증/이메일 관련 API
 */

// 이메일 인증 코드 발송 (구글 이메일로 보냄)
/**
 * @swagger
 * /auth/send-verification:
 *   post:
 *     summary: 이메일 인증 코드 발송
 *     description: 입력한 이메일로 6자리 인증 코드를 발송합니다. 코드 유효기간은 5분입니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: 인증 코드 발송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 인증 코드가 이메일로 발송되었습니다.
 *       400:
 *         description: 이메일이 필요합니다.
 *       500:
 *         description: 이메일 발송 실패
 */
router.post("/send-verification", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "이메일이 필요합니다." });
  }

  // 6자리 랜덤 코드 생성
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // nodemailer transporter 설정 (구글 Gmail)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const path = require("path");
  const htmlTemplate = fs.readFileSync(
    path.join(__dirname, "../config/email-template.html"),
    "utf8"
  );
  const emailHtml = htmlTemplate.replace("{{CODE}}", code); // code는 6자리 인증번호

  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: "이메일 인증 코드",
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);

    // Prisma에 인증 코드와 만료시간 저장 (upsert)
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5분 후 만료
    await prisma.emailVerification.upsert({
      where: { email: email },
      update: { code: code, expires: expires },
      create: { email: email, code: code, expires: expires },
    });

    res.json({ message: "인증 코드가 이메일로 발송되었습니다." });
  } catch (error) {
    console.error("[AUTH_007] 이메일 발송 실패:", error);
    res.status(500).json({ message: "[AUTH_007] 이메일 발송 실패", error });
  }
});

// 이메일 인증 코드 검증
/**
 * @swagger
 * /auth/verify-code:
 *   post:
 *     summary: 이메일 인증 코드 검증
 *     description: 이메일과 인증 코드를 검증하여 판매자 이메일 인증을 완료합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *             required:
 *               - email
 *               - code
 *     responses:
 *       200:
 *         description: 인증 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 이메일 인증 성공
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: 이메일과 코드가 필요합니다.
 *       500:
 *         description: 서버 에러 또는 만료/불일치
 */
router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: "이메일과 코드가 필요합니다." });
  }

  try {
    // Prisma에서 인증 코드 조회
    const record = await prisma.emailVerification.findUnique({
      where: { email },
    });

    if (!record || record.code !== code || new Date() > record.expires) {
      throw new Error("[AUTH_008] 인증 코드가 올바르지 않거나 만료되었습니다.");
    }

    // seller의 email_verified 필드를 true로 업데이트
    await prisma.sellers.updateMany({
      where: { email },
      data: { email_verified: true },
    });

    // 인증 성공 시 코드 삭제(1회성)
    await prisma.emailVerification.delete({
      where: { email },
    });

    res.json({ message: "이메일 인증 성공", success: true });
  } catch (error) {
    res.status(500).json({ message: "서버 에러", error: error.message });
  }
});

/**
 * @swagger
 * /auth/email/status:
 *   get:
 *     summary: 이메일 인증 상태 조회
 *     description: Bearer 토큰으로 판매자 이메일 인증 여부를 조회합니다.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 인증 상태 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email_verified:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: 인증 토큰 필요 또는 유효하지 않음
 *       404:
 *         description: 판매자 정보를 찾을 수 없음
 */
router.get("/email/status", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "인증 토큰이 필요합니다." });
  }
  const token = authHeader.split(" ")[1];

  console.log(token);
  const jwt = require("jsonwebtoken");
  // prisma는 이미 상단에서 require로 가져옴
  const JWT_SECRET = process.env.JWT_SECRET || "secret";

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const sellerId = decoded.id;
    const seller = await prisma.sellers.findUnique({
      where: { id: BigInt(sellerId) },
      select: { email_verified: true },
    });
    if (!seller) {
      return res
        .status(404)
        .json({ message: "판매자 정보를 찾을 수 없습니다." });
    }

    console.log(seller.email_verified);
    res.json({ email_verified: seller.email_verified });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
    res.status(500).json({ message: "서버 에러", error: error.message });
  }
});

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: 토큰 갱신
 *     description: 유효한 토큰을 새로운 토큰으로 갱신합니다.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: 인증 토큰 필요 또는 유효하지 않음
 *       500:
 *         description: 서버 오류
 */
router.post("/refresh-token", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "인증 토큰이 필요합니다." });
  }

  const token = authHeader.split(" ")[1];
  const jwt = require("jsonwebtoken");
  const JWT_SECRET = process.env.JWT_SECRET || "secret";

  try {
    // Verify the current token (even if expired, we can still extract user info)
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        // Token is expired, but we can still decode it to get user info
        decoded = jwt.decode(token);
      } else {
        throw error;
      }
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }

    // Issue a new token with the same payload
    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token: newToken });
  } catch (error) {
    console.error("토큰 갱신 실패:", error);
    res.status(401).json({ message: "토큰 갱신에 실패했습니다." });
  }
});

module.exports = router;
