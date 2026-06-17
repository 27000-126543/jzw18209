import { teamRepository } from '../repositories/teamRepository';
import { CreateTeamRequest, TeamDetail, Team, TeamProgress, TeamMemberExtended, TeamExtended, TeamContribution, ContributionPeriod, CheckIn } from '../../shared/types';

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

  async getAllPublicTeams(limit: number = 50): Promise<Team[]> {
    return teamRepository.getAllPublic(limit);
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
  },

  async getTeamProgress(teamId: number): Promise<TeamProgress[]> {
    return teamRepository.getSevenDayProgress(teamId);
  },

  async getTeamMembers(teamId: number, currentUserId: number | null): Promise<TeamMemberExtended[]> {
    return teamRepository.getMembersExtended(teamId, currentUserId);
  },

  async getTeamDetailExtended(teamId: number, userId: number | null): Promise<TeamExtended | null> {
    return teamRepository.getTeamDetailExtended(teamId, userId);
  },

  async getTeamContributions(teamId: number, period: ContributionPeriod, currentUserId: number | null): Promise<TeamContribution[]> {
    return teamRepository.getTeamContributions(teamId, period, currentUserId);
  },

  async getMemberTeamCheckIns(teamId: number, userId: number): Promise<CheckIn[]> {
    return teamRepository.getMemberTeamCheckIns(teamId, userId);
  }
};
