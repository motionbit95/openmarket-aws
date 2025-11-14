const notificationService = require('../utils/notification');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [ORDER_STATUS_CHANGED, PAYMENT_COMPLETED, SHIPPING_STARTED, DELIVERY_COMPLETED, PRODUCT_RESTOCKED, COUPON_ISSUED, COUPON_EXPIRING, REVIEW_REQUEST, PRICE_DROP, NEW_PRODUCT, INQUIRY_ANSWERED, SYSTEM_NOTICE]
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         isRead:
 *           type: boolean
 *         data:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         readAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: 사용자 알림 목록 조회
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: 읽음 상태 필터 (true: 읽음, false: 안읽음)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 알림 타입 필터
 *     responses:
 *       200:
 *         description: 알림 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     pagination:
 *                       type: object
 *       401:
 *         description: 인증 필요
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const {
      page = 1,
      limit = 20,
      isRead = null,
      type = null
    } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      isRead: isRead !== null ? isRead === 'true' : null,
      type
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('알림 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '알림 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: 읽지 않은 알림 개수 조회
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 읽지 않은 알림 개수
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     unreadCount:
 *                       type: integer
 *       401:
 *         description: 인증 필요
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const unreadCount = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('읽지 않은 알림 개수 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '읽지 않은 알림 개수 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: 특정 알림을 읽음 처리
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 알림 ID
 *     responses:
 *       200:
 *         description: 읽음 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: 인증 필요
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const success = await notificationService.markAsRead(userId, notificationId);

    if (success) {
      res.json({
        success: true,
        message: '알림을 읽음 처리했습니다.'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '알림을 찾을 수 없습니다.'
      });
    }
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: '알림 읽음 처리 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: 모든 알림을 읽음 처리
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 전체 읽음 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: 인증 필요
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const success = await notificationService.markAllAsRead(userId);

    if (success) {
      res.json({
        success: true,
        message: '모든 알림을 읽음 처리했습니다.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '전체 읽음 처리 중 오류가 발생했습니다.'
      });
    }
  } catch (error) {
    console.error('전체 알림 읽음 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: '전체 읽음 처리 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: 특정 알림 삭제
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 알림 ID
 *     responses:
 *       200:
 *         description: 알림 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: 인증 필요
 */
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const success = await notificationService.deleteNotification(userId, notificationId);

    if (success) {
      res.json({
        success: true,
        message: '알림이 삭제되었습니다.'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '알림을 찾을 수 없습니다.'
      });
    }
  } catch (error) {
    console.error('알림 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '알림 삭제 중 오류가 발생했습니다.'
    });
  }
};

// 관리자용 - 시스템 공지 발송
/**
 * @swagger
 * /notifications/system-notice:
 *   post:
 *     summary: 시스템 공지 발송 (관리자 전용)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *                 description: 공지 제목
 *               message:
 *                 type: string
 *                 description: 공지 내용
 *               targetUserIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 대상 사용자 ID 목록 (비어있으면 전체 사용자)
 *     responses:
 *       200:
 *         description: 시스템 공지 발송 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
const sendSystemNotice = async (req, res) => {
  try {
    const userRole = req.user?.role; // 권한 확인 필요
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }

    const { title, message, targetUserIds = [] } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: '제목과 내용은 필수입니다.'
      });
    }

    let userIds = targetUserIds;
    if (userIds.length === 0) {
      // 전체 사용자에게 발송
      const allUsers = await prisma.user.findMany({
        select: { id: true }
      });
      userIds = allUsers.map(user => user.id.toString());
    }

    const notifications = await notificationService.notifySystemNotice(
      userIds,
      title,
      message
    );

    res.json({
      success: true,
      message: `${notifications.length}명의 사용자에게 시스템 공지를 발송했습니다.`
    });
  } catch (error) {
    console.error('시스템 공지 발송 오류:', error);
    res.status(500).json({
      success: false,
      message: '시스템 공지 발송 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendSystemNotice
};