const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 사용자 관련 API
 */

router.get("/stats", userController.getUserGrowthStats);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: 유저 로그인
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: 유저 이메일
 *               password:
 *                 type: string
 *                 description: 유저 비밀번호
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 인증 실패
 */
router.post("/login", userController.loginUser);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: 전체 유저 목록 조회
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 유저 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get("/", userController.getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: 특정 유저 조회
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 유저 ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 유저 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: 유저를 찾을 수 없음
 */
router.get("/:id", userController.getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: 유저 생성
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: 유저 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.post("/", userController.createUser);
/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: 유저 정보 수정
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 유저 ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       200:
 *         description: 유저 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.put("/:id", userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: 유저 삭제
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 유저 ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 유저 삭제 성공
 *       500:
 *         description: 서버 오류
 */
router.delete("/:id", userController.deleteUser);

module.exports = router;
