import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { authService } from '../services/authService';
import { RegisterRequest, LoginRequest } from '../../shared/types';

export const authController = {
  async register(req: AuthRequest, res: Response) {
    try {
      const data = req.body as RegisterRequest;
      const result = await authService.register(data);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : '注册失败' });
    }
  },

  async login(req: AuthRequest, res: Response) {
    try {
      const data = req.body as LoginRequest;
      const result = await authService.login(data);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : '登录失败' });
    }
  },

  async me(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: '未授权' });
      }
      const user = await authService.getCurrentUser(req.userId);
      res.json(user);
    } catch (error) {
      res.status(404).json({ error: '用户不存在' });
    }
  }
};
