const express = require("express");
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendSystemNotice,
} = require("../controllers/notification.controller");

// 인증 미들웨어가 있다면 import (선택사항)
// const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: 알림 관련 API
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: 사용자 알림 목록 조회
 *     tags: [Notifications]
 *     parameters:
 *       - name: userId
 *         in: query
 *         description: 사용자 ID
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         description: 페이지 번호
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: 페이지당 항목 수
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 알림 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: 알림 ID
 *                       userId:
 *                         type: string
 *                         description: 사용자 ID
 *                       title:
 *                         type: string
 *                         description: 알림 제목
 *                       content:
 *                         type: string
 *                         description: 알림 내용
 *                       type:
 *                         type: string
 *                         description: 알림 타입
 *                       isRead:
 *                         type: boolean
 *                         description: 읽음 여부
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: 생성 시간
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       description: 현재 페이지
 *                     totalPages:
 *                       type: integer
 *                       description: 전체 페이지 수
 *                     totalItems:
 *                       type: integer
 *                       description: 전체 항목 수
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
// 사용자 알림 목록 조회
// router.get('/', authMiddleware, getNotifications);
router.get("/", getNotifications);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: 읽지 않은 알림 개수 조회
 *     tags: [Notifications]
 *     parameters:
 *       - name: userId
 *         in: query
 *         description: 사용자 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 읽지 않은 알림 개수 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 *                   description: 읽지 않은 알림 개수
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
// 읽지 않은 알림 개수 조회
// router.get('/unread-count', authMiddleware, getUnreadCount);
router.get("/unread-count", getUnreadCount);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: 모든 알림을 읽음 처리
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 ID
 *     responses:
 *       200:
 *         description: 모든 알림 읽음 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *                 updatedCount:
 *                   type: integer
 *                   description: 업데이트된 알림 개수
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
// 모든 알림을 읽음 처리
// router.patch('/read-all', authMiddleware, markAllAsRead);
router.patch("/read-all", markAllAsRead);

/**
 * @swagger
 * /notifications/system-notice:
 *   post:
 *     summary: 시스템 공지 발송 (관리자 전용)
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - targetUsers
 *             properties:
 *               title:
 *                 type: string
 *                 description: 공지 제목
 *               content:
 *                 type: string
 *                 description: 공지 내용
 *               targetUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 대상 사용자 ID 배열 (전체 발송시 빈 배열)
 *               type:
 *                 type: string
 *                 description: 알림 타입
 *                 default: "SYSTEM"
 *     responses:
 *       201:
 *         description: 시스템 공지 발송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *                 sentCount:
 *                   type: integer
 *                   description: 발송된 알림 개수
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 */
// 시스템 공지 발송 (관리자 전용)
// router.post('/system-notice', authMiddleware, sendSystemNotice);
router.post("/system-notice", sendSystemNotice);

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: 특정 알림을 읽음 처리
 *     tags: [Notifications]
 *     parameters:
 *       - name: notificationId
 *         in: path
 *         description: 알림 ID
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 ID
 *     responses:
 *       200:
 *         description: 알림 읽음 처리 성공
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
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 알림을 찾을 수 없음
 */
// 특정 알림을 읽음 처리
// router.patch('/:notificationId/read', authMiddleware, markAsRead);
router.patch("/:notificationId/read", markAsRead);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: 특정 알림 삭제
 *     tags: [Notifications]
 *     parameters:
 *       - name: notificationId
 *         in: path
 *         description: 알림 ID
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 ID
 *     responses:
 *       200:
 *         description: 알림 삭제 성공
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
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 알림을 찾을 수 없음
 */
// 특정 알림 삭제
// router.delete('/:notificationId', authMiddleware, deleteNotification);
router.delete("/:notificationId", deleteNotification);

module.exports = router;
