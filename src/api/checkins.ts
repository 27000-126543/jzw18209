import client from './client';
import { CheckInRequest, FeedResponse, ExploreResponse, Comment, CheckInFeed, ExploreUser, UserStatistics } from '../../shared/types';

export const checkInsApi = {
  create: (data: CheckInRequest) =>
    client.post<{ checkInId: number; newBadge: { id: number; name: string; icon: string } | null; currentCount: number; targetCount: number; completed: boolean }>('/checkins', data).then(res => res.data),

  feed: (cursor: number = 0, limit: number = 20) =>
    client.get<FeedResponse>('/checkins/feed', { params: { cursor, limit } }).then(res => res.data),

  publicFeed: (hot?: boolean, habitId?: number, keyword?: string) =>
    client.get<CheckInFeed[]>('/checkins/explore', { 
      params: { 
        sortBy: hot ? 'popular' : 'latest',
        ...(habitId ? { habitId } : {}),
        ...(keyword ? { keyword } : {})
      } 
    }).then(res => res.data),

  exploreUsers: () =>
    client.get<ExploreUser[]>('/checkins/explore/users').then(res => res.data),

  userCheckIns: (userId: number) =>
    client.get<CheckInFeed[]>(`/checkins/user/${userId}`).then(res => res.data),

  userStats: (userId: number) =>
    client.get<UserStatistics>(`/checkins/user/${userId}/stats`).then(res => res.data),

  explore: () =>
    client.get<ExploreResponse>('/checkins/explore').then(res => res.data),

  like: (id: number) =>
    client.post<{ liked: boolean; likesCount: number }>(`/checkins/${id}/like`).then(res => res.data),

  comment: (id: number, content: string) =>
    client.post<{ id: number }>(`/checkins/${id}/comments`, { content }).then(res => res.data),

  getComments: (id: number) =>
    client.get<Comment[]>(`/checkins/${id}/comments`).then(res => res.data),

  delete: (id: number) =>
    client.delete<{ success: boolean }>(`/checkins/${id}`).then(res => res.data),
};
