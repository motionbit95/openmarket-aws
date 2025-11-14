const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: 장바구니 API
 */

/**
 * @swagger
 * /cart/{userId}:
 *   get:
 *     summary: 사용자별 장바구니 조회
 *     tags: [Cart]
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: 사용자 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 장바구니 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: 장바구니 ID
 *                 userId:
 *                   type: string
 *                   description: 사용자 ID
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: 장바구니 아이템 ID
 *                       productId:
 *                         type: string
 *                         description: 상품 ID
 *                       quantity:
 *                         type: integer
 *                         description: 수량
 *                       price:
 *                         type: number
 *                         description: 가격
 *       404:
 *         description: 장바구니를 찾을 수 없음
 */
router.get("/:userId", cartController.getCartByUser);

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: 장바구니에 상품 추가
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *               - quantity
 *               - price
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 ID
 *               productId:
 *                 type: string
 *                 description: 상품 ID
 *               skuId:
 *                 type: string
 *                 description: SKU ID (옵션 상품인 경우)
 *               quantity:
 *                 type: integer
 *                 description: 수량
 *               price:
 *                 type: number
 *                 description: 가격
 *     responses:
 *       200:
 *         description: 상품 추가 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *                 item:
 *                   type: object
 *                   description: 추가된 장바구니 아이템
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/add", cartController.addToCart);

/**
 * @swagger
 * /cart/item/{itemId}:
 *   patch:
 *     summary: 장바구니 아이템 수량 변경
 *     tags: [Cart]
 *     parameters:
 *       - name: itemId
 *         in: path
 *         description: 장바구니 아이템 ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: 변경할 수량
 *     responses:
 *       200:
 *         description: 수량 변경 성공
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
 *         description: 장바구니 아이템을 찾을 수 없음
 */
router.patch("/item/:itemId", cartController.updateCartItemQuantity);

/**
 * @swagger
 * /cart/item/{itemId}:
 *   delete:
 *     summary: 장바구니에서 아이템 삭제
 *     tags: [Cart]
 *     parameters:
 *       - name: itemId
 *         in: path
 *         description: 장바구니 아이템 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 아이템 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *       404:
 *         description: 장바구니 아이템을 찾을 수 없음
 */
router.delete("/item/:itemId", cartController.removeCartItem);

/**
 * @swagger
 * /cart/all/{userId}:
 *   delete:
 *     summary: 사용자별 장바구니 전체 비우기
 *     tags: [Cart]
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: 사용자 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 장바구니 비우기 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *       404:
 *         description: 장바구니를 찾을 수 없음
 */
router.delete("/all/:userId", cartController.clearCart);

module.exports = router;
