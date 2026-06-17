import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { habitService } from '../services/habitService';
import { CreateHabitRequest, HabitStatistics, UserStatistics } from '../../shared/types';
import { getUserStatistics } from '../repositories/habitRepository';

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
  },

  async statistics(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const result = await getUserStatistics(req.userId) as HabitStatistics;
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取统计数据失败' });
    }
  },

  async checkins(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const habitId = parseInt(req.params.id);
      const detail = await habitService.getHabitDetail(habitId, req.userId);
      if (!detail) {
        return res.status(404).json({ error: '习惯不存在' });
      }
      res.json(detail.checkInHistory);
    } catch (error) {
      res.status(500).json({ error: '获取打卡记录失败' });
    }
  },

  async userStats(req: AuthRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const stats = await getUserStatistics(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: '获取用户统计失败' });
    }
  },

  async trend(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const habitId = parseInt(req.params.id);
      const days = parseInt(req.query.days as string) || 30;
      const result = await habitService.getHabitTrend(habitId, req.userId, days);
      if (!result) {
        return res.status(404).json({ error: '习惯不存在' });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取趋势数据失败' });
    }
  },

  async publicTypes(req: AuthRequest, res: Response) {
    try {
      const types = await habitService.getPublicHabitTypes();
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: '获取公开习惯类型失败' });
    }
  }
};
