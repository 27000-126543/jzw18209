import client from './client';
import { CreateHabitRequest, HabitListResponse, HabitDetail } from '../../shared/types';

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

  progress: () =>
    client.get<{ habitId: number; completed: boolean }[]>('/habits/progress').then(res => res.data),
};
