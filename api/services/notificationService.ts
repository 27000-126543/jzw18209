import { notificationRepository } from '../repositories/notificationRepository';
import { Notification } from '../../shared/types';

export const notificationService = {
  async getNotifications(userId: number, limit: number = 50, type?: Notification['type']) {
    return notificationRepository.getByUserId(userId, limit, type);
  },

  async getUnreadCount(userId: number, type?: Notification['type']): Promise<number> {
    return notificationRepository.getUnreadCount(userId, type);
  },

  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    return notificationRepository.markAsRead(notificationId, userId);
  },

  async markAllAsRead(userId: number, type?: Notification['type']): Promise<number> {
    return notificationRepository.markAllAsRead(userId, type);
  },

  async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
    return notificationRepository.delete(notificationId, userId);
  }
};
