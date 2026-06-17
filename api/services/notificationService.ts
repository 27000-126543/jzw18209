import { notificationRepository } from '../repositories/notificationRepository';

export const notificationService = {
  async getNotifications(userId: number, limit: number = 50) {
    return notificationRepository.getByUserId(userId, limit);
  },

  async getUnreadCount(userId: number): Promise<number> {
    return notificationRepository.getUnreadCount(userId);
  },

  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    return notificationRepository.markAsRead(notificationId, userId);
  },

  async markAllAsRead(userId: number): Promise<number> {
    return notificationRepository.markAllAsRead(userId);
  },

  async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
    return notificationRepository.delete(notificationId, userId);
  }
};
