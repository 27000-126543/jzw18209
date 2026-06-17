import client from './client';
import { CreateHabitRequest, HabitListResponse, HabitDetail, HabitStatistics, TodayProgress, CheckIn } from '../../shared/types';

export const habitsApi = {
  create: (data: CreateHabitRequest) =>
    client.post<{ id: number }>('/habits', data).then(res => res.data),

  list: () =>
    client.get<HabitListResponse>('/habits').then(res => res.data),

  detail: (id: number) =>
    client.get<HabitDetail>(`/habits/${id}`).then(res => res.data),

  update: (id: number, data: Partial<CreateHabitRequest>) =>
    client.put<{ success: boolean }>(`/habits/${id}`, data).then(res => res.data),

  delete: (id: number) =>
    client.delete<{ success: boolean }>(`/habits/${id}`).then(res => res.data),

  statistics: () =>
    client.get<HabitStatistics>('/habits/statistics').then(res => res.data),

  progress: () =>
    client.get<TodayProgress[]>('/habits/progress').then(res => res.data),

  getCheckIns: (habitId: number) =>
    client.get<CheckIn[]>(`/habits/${habitId}/checkins`).then(res => res.data),
};
