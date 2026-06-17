import { teamRepository } from '../repositories/teamRepository';
import { CreateTeamRequest, TeamDetail } from '../../shared/types';

export const teamService = {
  async createTeam(creatorId: number, data: CreateTeamRequest): Promise<number> {
    const teamId = await teamRepository.create(creatorId, data);
    await teamRepository.joinTeam(teamId, creatorId);
    return teamId;
  },

  async getTeamDetail(teamId: number, userId: number | null): Promise<TeamDetail | null> {
    return teamRepository.getTeamDetail(teamId, userId);
  },

  async getUserTeams(userId: number) {
    return teamRepository.getByUserId(userId);
  },

  async getRecommendedTeams(userId: number, limit: number = 5) {
    return teamRepository.getRecommended(userId, limit);
  },

  async joinTeam(teamId: number, userId: number): Promise<boolean> {
    return teamRepository.joinTeam(teamId, userId);
  },

  async leaveTeam(teamId: number, userId: number): Promise<boolean> {
    return teamRepository.leaveTeam(teamId, userId);
  },

  async joinTeamByInviteCode(code: string, userId: number): Promise<number | null> {
    const team = await teamRepository.findByInviteCode(code);
    if (!team) return null;
    
    const success = await teamRepository.joinTeam(team.id, userId);
    return success ? team.id : null;
  }
};
