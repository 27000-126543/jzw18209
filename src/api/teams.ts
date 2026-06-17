import client from './client';
import { CreateTeamRequest, TeamDetail, TeamExtended, TeamProgress, TeamMemberExtended } from '../../shared/types';

export const teamsApi = {
  create: (data: CreateTeamRequest) =>
    client.post<{ id: number }>('/teams', data).then(res => res.data),

  getTeams: (includeAll?: boolean) =>
    client.get<TeamExtended[]>('/teams', { params: includeAll ? { includeAll } : undefined }).then(res => res.data),

  getTeamById: (id: number) =>
    client.get<TeamDetail>(`/teams/${id}`).then(res => res.data),

  getTeamProgress: (id: number) =>
    client.get<TeamProgress[]>(`/teams/${id}/progress`).then(res => res.data),

  getTeamMembers: (id: number) =>
    client.get<TeamMemberExtended[]>(`/teams/${id}/members`).then(res => res.data),

  joinTeam: (id: number) =>
    client.post<{ success: boolean }>(`/teams/${id}/join`).then(res => res.data),

  leaveTeam: (id: number) =>
    client.post<{ success: boolean }>(`/teams/${id}/leave`).then(res => res.data),

  recommended: (limit: number = 5) =>
    client.get<TeamExtended[]>('/teams/recommended', { params: { limit } }).then(res => res.data),

  joinByCode: (code: string) =>
    client.post<{ success: boolean; teamId: number }>('/teams/join-by-code', { code }).then(res => res.data),
};
