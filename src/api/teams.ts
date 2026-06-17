import client from './client';
import { CreateTeamRequest, Team, TeamDetail } from '../../shared/types';

export const teamsApi = {
  create: (data: CreateTeamRequest) =>
    client.post<{ id: number }>('/teams', data).then(res => res.data),

  list: () =>
    client.get<Team[]>('/teams').then(res => res.data),

  detail: (id: number) =>
    client.get<TeamDetail>(`/teams/${id}`).then(res => res.data),

  join: (id: number) =>
    client.post<{ success: boolean }>(`/teams/${id}/join`).then(res => res.data),

  leave: (id: number) =>
    client.post<{ success: boolean }>(`/teams/${id}/leave`).then(res => res.data),

  recommended: (limit: number = 5) =>
    client.get<Team[]>('/teams/recommended', { params: { limit } }).then(res => res.data),

  joinByCode: (code: string) =>
    client.post<{ success: boolean; teamId: number }>('/teams/join-by-code', { code }).then(res => res.data),
};
