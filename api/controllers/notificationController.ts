import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/notificationService';
import { Notification } from '../../shared/types';

export const notificationController = {
  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const limit = parseInt(req.query.limit as string) || 50;
      const type = req.query.type as Notification['type'] | undefined;
      const result = await notificationService.getNotifications(req.userId, limit, type);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取通知失败' });
    }
  },

  async unreadCount(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const type = req.query.type as Notification['type'] | undefined;
      const count = await notificationService.getUnreadCount(req.userId, type);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: '获取未读数量失败' });
    }
  },

  async markRead(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const notificationId = parseInt(req.params.id);
      const success = await notificationService.markAsRead(notificationId, req.userId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: '标记失败' });
    }
  },

  async markAllRead(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const type = req.query.type as Notification['type'] | undefined;
      const count = await notificationService.markAllAsRead(req.userId, type);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: '标记失败' });
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const notificationId = parseInt(req.params.id);
      const success = await notificationService.deleteNotification(notificationId, req.userId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: '删除失败' });
    }
  }
};
