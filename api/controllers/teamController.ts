import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { teamService } from '../services/teamService';
import { CreateTeamRequest } from '../../shared/types';

export const teamController = {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const data = req.body as CreateTeamRequest;
      const teamId = await teamService.createTeam(req.userId, data);
      res.json({ id: teamId });
    } catch (error) {
      res.status(400).json({ error: '创建队伍失败' });
    }
  },

  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const result = await teamService.getUserTeams(req.userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取队伍列表失败' });
    }
  },

  async detail(req: AuthRequest, res: Response) {
    try {
      const teamId = parseInt(req.params.id);
      const result = await teamService.getTeamDetail(teamId, req.userId || null);
      if (!result) {
        return res.status(404).json({ error: '队伍不存在或无权限' });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取队伍详情失败' });
    }
  },

  async join(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const teamId = parseInt(req.params.id);
      const success = await teamService.joinTeam(teamId, req.userId);
      if (!success) {
        return res.status(400).json({ error: '加入失败，队伍可能已满或已加入' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: '加入失败' });
    }
  },

  async leave(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const teamId = parseInt(req.params.id);
      const success = await teamService.leaveTeam(teamId, req.userId);
      if (!success) {
        return res.status(400).json({ error: '离开失败，队长不能离开队伍' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: '离开失败' });
    }
  },

  async recommended(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const limit = parseInt(req.query.limit as string) || 5;
      const result = await teamService.getRecommendedTeams(req.userId, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '获取推荐队伍失败' });
    }
  },

  async joinByCode(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ error: '未授权' });
      const code = req.body.code as string;
      const teamId = await teamService.joinTeamByInviteCode(code, req.userId);
      if (!teamId) {
        return res.status(400).json({ error: '邀请码无效' });
      }
      res.json({ success: true, teamId });
    } catch (error) {
      res.status(400).json({ error: '加入失败' });
    }
  }
};
