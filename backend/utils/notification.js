const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NotificationService {
  // 알림 생성
  async createNotification(userId, type, title, message, data = null) {
    try {
      const notification = await prisma.userNotification.create({
        data: {
          userId: BigInt(userId),
          type,
          title,
          message,
          data: data ? JSON.stringify(data) : null
        }
      });

      // 실시간 알림 전송 (WebSocket, SSE 등)
      await this.sendRealTimeNotification(userId, notification);

      return notification;
    } catch (error) {
      console.error('알림 생성 오류:', error);
      return null;
    }
  }

  // 사용자의 알림 목록 조회
  async getUserNotifications(userId, { page = 1, limit = 20, isRead = null, type = null }) {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        userId: BigInt(userId)
      };

      if (isRead !== null) {
        where.isRead = isRead;
      }

      if (type) {
        where.type = type;
      }

      const notifications = await prisma.userNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      const totalCount = await prisma.userNotification.count({ where });
      const totalPages = Math.ceil(totalCount / limit);

      return {
        notifications: notifications.map(n => ({
          id: n.id.toString(),
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          data: n.data ? JSON.parse(n.data) : null,
          createdAt: n.createdAt,
          readAt: n.readAt
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('알림 목록 조회 오류:', error);
      return { notifications: [], pagination: {} };
    }
  }

  // 알림 읽음 처리
  async markAsRead(userId, notificationId) {
    try {
      await prisma.userNotification.updateMany({
        where: {
          id: BigInt(notificationId),
          userId: BigInt(userId)
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
      return false;
    }
  }

  // 모든 알림 읽음 처리
  async markAllAsRead(userId) {
    try {
      await prisma.userNotification.updateMany({
        where: {
          userId: BigInt(userId),
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('전체 알림 읽음 처리 오류:', error);
      return false;
    }
  }

  // 읽지 않은 알림 개수 조회
  async getUnreadCount(userId) {
    try {
      const count = await prisma.userNotification.count({
        where: {
          userId: BigInt(userId),
          isRead: false
        }
      });
      return count;
    } catch (error) {
      console.error('읽지 않은 알림 개수 조회 오류:', error);
      return 0;
    }
  }

  // 알림 삭제
  async deleteNotification(userId, notificationId) {
    try {
      await prisma.userNotification.deleteMany({
        where: {
          id: BigInt(notificationId),
          userId: BigInt(userId)
        }
      });
      return true;
    } catch (error) {
      console.error('알림 삭제 오류:', error);
      return false;
    }
  }

  // 실시간 알림 전송 (WebSocket, SSE 등)
  async sendRealTimeNotification(userId, notification) {
    // 여기에 실시간 알림 전송 로직 구현
    // WebSocket, Server-Sent Events, 푸시 알림 등
    console.log(`실시간 알림 전송 - 사용자: ${userId}, 제목: ${notification.title}`);
    
    // 예시: WebSocket 연결이 있다면
    // const ws = this.getWebSocketConnection(userId);
    // if (ws) {
    //   ws.send(JSON.stringify({
    //     type: 'notification',
    //     data: notification
    //   }));
    // }
  }

  // 특정 이벤트별 알림 생성 메서드들
  
  // 주문 상태 변경 알림
  async notifyOrderStatusChange(userId, orderId, oldStatus, newStatus) {
    const statusMessages = {
      CONFIRMED: '주문이 확인되었습니다.',
      PREPARING: '상품을 준비 중입니다.',
      SHIPPED: '배송이 시작되었습니다.',
      DELIVERED: '배송이 완료되었습니다.',
      CANCELLED: '주문이 취소되었습니다.',
      REFUNDED: '환불이 완료되었습니다.'
    };

    const title = '주문 상태 변경';
    const message = statusMessages[newStatus] || `주문 상태가 ${newStatus}로 변경되었습니다.`;
    
    return await this.createNotification(
      userId,
      'ORDER_STATUS_CHANGED',
      title,
      message,
      { orderId, oldStatus, newStatus }
    );
  }

  // 상품 재입고 알림
  async notifyProductRestock(userIds, productId, productName) {
    const title = '상품 재입고';
    const message = `관심상품 '${productName}'이 재입고되었습니다.`;
    
    const notifications = [];
    for (const userId of userIds) {
      const notification = await this.createNotification(
        userId,
        'PRODUCT_RESTOCKED',
        title,
        message,
        { productId, productName }
      );
      notifications.push(notification);
    }
    
    return notifications;
  }

  // 쿠폰 발급 알림
  async notifyCouponIssued(userId, couponId, couponTitle) {
    const title = '쿠폰 발급';
    const message = `새로운 쿠폰 '${couponTitle}'이 발급되었습니다.`;
    
    return await this.createNotification(
      userId,
      'COUPON_ISSUED',
      title,
      message,
      { couponId, couponTitle }
    );
  }

  // 쿠폰 만료 임박 알림
  async notifyCouponExpiring(userId, couponId, couponTitle, expiryDate) {
    const title = '쿠폰 만료 임박';
    const message = `쿠폰 '${couponTitle}'이 곧 만료됩니다. (만료일: ${expiryDate.toLocaleDateString()})`;
    
    return await this.createNotification(
      userId,
      'COUPON_EXPIRING',
      title,
      message,
      { couponId, couponTitle, expiryDate }
    );
  }

  // 가격 하락 알림
  async notifyPriceDrop(userId, productId, productName, oldPrice, newPrice) {
    const title = '관심상품 가격 하락';
    const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
    const message = `'${productName}'의 가격이 ${discount}% 할인되었습니다. (${oldPrice.toLocaleString()}원 → ${newPrice.toLocaleString()}원)`;
    
    return await this.createNotification(
      userId,
      'PRICE_DROP',
      title,
      message,
      { productId, productName, oldPrice, newPrice, discountPercent: discount }
    );
  }

  // 리뷰 작성 요청 알림
  async notifyReviewRequest(userId, orderId, productName) {
    const title = '리뷰 작성 요청';
    const message = `구매하신 '${productName}'에 대한 리뷰를 작성해주세요.`;
    
    return await this.createNotification(
      userId,
      'REVIEW_REQUEST',
      title,
      message,
      { orderId, productName }
    );
  }

  // 문의 답변 알림
  async notifyInquiryAnswered(userId, inquiryId, inquiryTitle) {
    const title = '문의 답변 도착';
    const message = `문의 '${inquiryTitle}'에 대한 답변이 등록되었습니다.`;
    
    return await this.createNotification(
      userId,
      'INQUIRY_ANSWERED',
      title,
      message,
      { inquiryId, inquiryTitle }
    );
  }

  // 시스템 공지 알림
  async notifySystemNotice(userIds, title, message) {
    const notifications = [];
    for (const userId of userIds) {
      const notification = await this.createNotification(
        userId,
        'SYSTEM_NOTICE',
        title,
        message
      );
      notifications.push(notification);
    }
    
    return notifications;
  }

  // 오래된 알림 정리 (배치 작업용)
  async cleanupOldNotifications(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.userNotification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      console.log(`${result.count}개의 오래된 알림이 삭제되었습니다.`);
      return result.count;
    } catch (error) {
      console.error('오래된 알림 정리 오류:', error);
      return 0;
    }
  }
}

module.exports = new NotificationService();