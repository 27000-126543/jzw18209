import client from './client';
import { Badge } from '../../shared/types';

export const badgesApi = {
  getUserBadges: (userId?: number) =>
    client.get<Badge[]>(userId ? `/badges/user/${userId}` : '/badges').then(res => res.data),
};
