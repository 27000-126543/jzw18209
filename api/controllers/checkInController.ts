import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { checkInService } from '../services/checkInService';
import { CheckInRequest, CommentRequest, Badge } from '../../shared/types';

export const checkInController = {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const data = req.body as CheckInRequest;
      const result = await checkInService.createCheckIn(req.userId, data);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : '打卡失败' });
    }
  },

  async feed(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const cursor = parseInt(req.query.cursor as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await checkInService.getFeed(req.userId, cursor, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取动态失败' });
    }
  },

  async explore(req: AuthRequest, res: Response) {
    try {
      const result = await checkInService.getExploreFeed(req.userId || null);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取发现内容失败' });
    }
  },

  async like(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const checkInId = parseInt(req.params.id);
      const result = await checkInService.toggleLike(checkInId, req.userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '操作失败' });
    }
  },

  async comment(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const checkInId = parseInt(req.params.id);
      const data = req.body as CommentRequest;
      const commentId = await checkInService.addComment(checkInId, req.userId, data.content);
      res.json({ id: commentId });
    } catch (error) {
      res.status(400).json({ error: '评论失败' });
    }
  },

  async getComments(req: AuthRequest, res: Response) {
    try {
      const checkInId = parseInt(req.params.id);
      const comments = await checkInService.getComments(checkInId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: '获取评论失败' });
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const checkInId = parseInt(req.params.id);
      const success = await checkInService.deleteCheckIn(checkInId, req.userId);
      if (!success) {
        return res.status(404).json({ error: '记录不存在或无权限' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: '删除失败' });
    }
  }
};
