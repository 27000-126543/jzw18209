import client from './client';
import { Notification } from '../../shared/types';

export const notificationsApi = {
  list: (limit: number = 50) =>
    client.get<Notification[]>('/notifications', { params: { limit } }).then(res => res.data),

  unreadCount: () =>
    client.get<{ count: number }>('/notifications/unread-count').then(res => res.data),

  markRead: (id: number) =>
    client.post<{ success: boolean }>(`/notifications/${id}/read`).then(res => res.data),

  markAllRead: () =>
    client.post<{ count: number }>('/notifications/read-all').then(res => res.data),

  delete: (id: number) =>
    client.delete<{ success: boolean }>(`/notifications/${id}`).then(res => res.data),
};
