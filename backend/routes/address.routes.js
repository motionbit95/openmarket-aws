const express = require("express");
const router = express.Router();
const addressController = require("../controllers/address.controller");

/**
 * @swagger
 * tags:
 *   name: Address
 *   description: 배송지 주소 관리 API
 */

/**
 * @swagger
 * /address:
 *   get:
 *     summary: 전체 배송지 목록 조회
 *     tags: [Address]
 *     parameters:
 *       - name: userId
 *         in: query
 *         description: 사용자 ID (필터링용)
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 배송지 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: 배송지 ID
 *                   userId:
 *                     type: string
 *                     description: 사용자 ID
 *                   recipient:
 *                     type: string
 *                     description: 수령인
 *                   phone:
 *                     type: string
 *                     description: 연락처
 *                   postcode:
 *                     type: string
 *                     description: 우편번호
 *                   address1:
 *                     type: string
 *                     description: 기본주소
 *                   address2:
 *                     type: string
 *                     description: 상세주소
 *                   isDefault:
 *                     type: boolean
 *                     description: 기본 배송지 여부
 *                   memo:
 *                     type: string
 *                     description: 배송 메모
 *       400:
 *         description: 잘못된 요청
 */
// 전체 배송지 목록 조회 (userId로 필터 가능)
router.get("/", addressController.getAllAddresses);

/**
 * @swagger
 * /address/user/{userId}:
 *   get:
 *     summary: 특정 사용자의 배송지 목록 조회
 *     tags: [Address]
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: 사용자 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 사용자별 배송지 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: 배송지 ID
 *                   recipient:
 *                     type: string
 *                     description: 수령인
 *                   phone:
 *                     type: string
 *                     description: 연락처
 *                   postcode:
 *                     type: string
 *                     description: 우편번호
 *                   address1:
 *                     type: string
 *                     description: 기본주소
 *                   address2:
 *                     type: string
 *                     description: 상세주소
 *                   isDefault:
 *                     type: boolean
 *                     description: 기본 배송지 여부
 *                   memo:
 *                     type: string
 *                     description: 배송 메모
 *       400:
 *         description: 잘못된 사용자 ID
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
// 특정 유저의 배송지 목록 조회
router.get("/user/:userId", addressController.getAddressesByUserId);

/**
 * @swagger
 * /address/{id}:
 *   get:
 *     summary: 특정 배송지 조회
 *     tags: [Address]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 배송지 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 배송지 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: 배송지 ID
 *                 userId:
 *                   type: string
 *                   description: 사용자 ID
 *                 recipient:
 *                   type: string
 *                   description: 수령인
 *                 phone:
 *                   type: string
 *                   description: 연락처
 *                 postcode:
 *                   type: string
 *                   description: 우편번호
 *                 address1:
 *                   type: string
 *                   description: 기본주소
 *                 address2:
 *                   type: string
 *                   description: 상세주소
 *                 isDefault:
 *                   type: boolean
 *                   description: 기본 배송지 여부
 *                 memo:
 *                   type: string
 *                   description: 배송 메모
 *       400:
 *         description: 잘못된 배송지 ID
 *       404:
 *         description: 배송지를 찾을 수 없음
 */
// 특정 배송지 조회
router.get("/:id", addressController.getAddressById);

/**
 * @swagger
 * /address:
 *   post:
 *     summary: 배송지 생성
 *     tags: [Address]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - recipient
 *               - phone
 *               - postcode
 *               - address1
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 ID
 *               recipient:
 *                 type: string
 *                 description: 수령인
 *               phone:
 *                 type: string
 *                 description: 연락처
 *               postcode:
 *                 type: string
 *                 description: 우편번호
 *               address1:
 *                 type: string
 *                 description: 기본주소
 *               address2:
 *                 type: string
 *                 description: 상세주소
 *               isDefault:
 *                 type: boolean
 *                 description: 기본 배송지 여부
 *               memo:
 *                 type: string
 *                 description: 배송 메모
 *     responses:
 *       201:
 *         description: 배송지 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: 생성된 배송지 ID
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
// 배송지 생성
router.post("/", addressController.createAddress);

/**
 * @swagger
 * /address/{id}:
 *   put:
 *     summary: 배송지 수정
 *     tags: [Address]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 배송지 ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipient:
 *                 type: string
 *                 description: 수령인
 *               phone:
 *                 type: string
 *                 description: 연락처
 *               postcode:
 *                 type: string
 *                 description: 우편번호
 *               address1:
 *                 type: string
 *                 description: 기본주소
 *               address2:
 *                 type: string
 *                 description: 상세주소
 *               isDefault:
 *                 type: boolean
 *                 description: 기본 배송지 여부
 *               memo:
 *                 type: string
 *                 description: 배송 메모
 *     responses:
 *       200:
 *         description: 배송지 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 배송지를 찾을 수 없음
 */
// 배송지 수정
router.put("/:id", addressController.updateAddress);

/**
 * @swagger
 * /address/{id}:
 *   delete:
 *     summary: 배송지 삭제
 *     tags: [Address]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 배송지 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 배송지 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *       400:
 *         description: 잘못된 배송지 ID
 *       404:
 *         description: 배송지를 찾을 수 없음
 */
// 배송지 삭제
router.delete("/:id", addressController.deleteAddress);

module.exports = router;
