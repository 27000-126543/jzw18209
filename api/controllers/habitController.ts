import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { habitService } from '../services/habitService';
import { CreateHabitRequest } from '../../shared/types';

export const habitController = {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const data = req.body as CreateHabitRequest;
      const habitId = await habitService.createHabit(req.userId, data);
      res.json({ id: habitId });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : '创建习惯失败' });
    }
  },

  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const result = await habitService.getHabits(req.userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取习惯列表失败' });
    }
  },

  async detail(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const habitId = parseInt(req.params.id);
      const result = await habitService.getHabitDetail(habitId, req.userId);
      if (!result) {
        return res.status(404).json({ error: '习惯不存在' });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取习惯详情失败' });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const habitId = parseInt(req.params.id);
      const data = req.body as Partial<CreateHabitRequest>;
      const success = await habitService.updateHabit(habitId, req.userId, data);
      if (!success) {
        return res.status(404).json({ error: '习惯不存在或无权限' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: '更新习惯失败' });
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const habitId = parseInt(req.params.id);
      const success = await habitService.deleteHabit(habitId, req.userId);
      if (!success) {
        return res.status(404).json({ error: '习惯不存在或无权限' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: '删除习惯失败' });
    }
  },

  async progress(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const result = await habitService.getTodayProgress(req.userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取进度失败' });
    }
  }
};
