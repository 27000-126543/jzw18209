import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { userService } from '../services/userService';
import { ExploreUser, UserStatistics, CheckInFeed } from '../../shared/types';

export const userController = {
  async profile(req: AuthRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const result = await userService.getUserProfile(userId, req.userId || null);
      if (!result) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取用户信息失败' });
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const data = req.body;
      const result = await userService.updateProfile(req.userId, data);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : '更新失败' });
    }
  },

  async search(req: AuthRequest, res: Response) {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await userService.searchUsers(query, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '搜索失败' });
    }
  },

  async follow(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const followingId = parseInt(req.params.userId);
      const success = await userService.follow(req.userId, followingId);
      res.json({ success });
    } catch (error) {
      res.status(400).json({ error: '关注失败' });
    }
  },

  async unfollow(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const followingId = parseInt(req.params.userId);
      const success = await userService.unfollow(req.userId, followingId);
      res.json({ success });
    } catch (error) {
      res.status(400).json({ error: '取消关注失败' });
    }
  },

  async followers(req: AuthRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const result = await userService.getFollowers(userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取粉丝列表失败' });
    }
  },

  async following(req: AuthRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const result = await userService.getFollowing(userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取关注列表失败' });
    }
  },

  async suggested(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const limit = parseInt(req.query.limit as string) || 5;
      const result = await userService.getSuggestedUsers(req.userId, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取推荐用户失败' });
    }
  },

  async badges(req: AuthRequest, res: Response) {
    try {
      const idParam = parseInt(req.params.id);
      const userId = idParam === 0 ? (req.userId || 0) : idParam;
      if (!userId) return res.status(401).json({ error: '未授权' });
      const result = await userService.getUserBadges(userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取徽章失败' });
    }
  },

  async explore(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await userService.exploreUsers(req.userId || null, limit) as ExploreUser[];
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取发现用户失败' });
    }
  },

  async checkins(req: AuthRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 30;
      const result = await userService.getUserCheckIns(userId, req.userId || null, limit) as CheckInFeed[];
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取用户打卡记录失败' });
    }
  },

  async stats(req: AuthRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const result = await userService.getUserStats(userId, req.userId || null) as UserStatistics | null;
      if (!result) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取用户统计失败' });
    }
  }
};
