import client from './client';
import { User, UserProfile, Badge } from '../../shared/types';

export const usersApi = {
  profile: (id: number) =>
    client.get<UserProfile>(`/users/${id}`).then(res => res.data),

  updateProfile: (data: { username?: string; bio?: string; avatar?: string }) =>
    client.put<User>('/users/profile', data).then(res => res.data),

  search: (query: string, limit: number = 10) =>
    client.get<User[]>('/users/search', { params: { q: query, limit } }).then(res => res.data),

  follow: (userId: number) =>
    client.post<{ success: boolean }>(`/users/${userId}/follow`).then(res => res.data),

  unfollow: (userId: number) =>
    client.delete<{ success: boolean }>(`/users/${userId}/unfollow`).then(res => res.data),

  followers: (id: number) =>
    client.get<User[]>(`/users/${id}/followers`).then(res => res.data),

  following: (id: number) =>
    client.get<User[]>(`/users/${id}/following`).then(res => res.data),

  suggested: (limit: number = 5) =>
    client.get<User[]>('/users/suggested', { params: { limit } }).then(res => res.data),

  badges: (id: number) =>
    client.get<Badge[]>(`/users/${id}/badges`).then(res => res.data),
};
