import { userRepository } from '../repositories/userRepository';
import { friendshipRepository } from '../repositories/friendshipRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { UserProfile } from '../../shared/types';

export const userService = {
  async getUserProfile(userId: number, currentUserId: number | null): Promise<UserProfile | null> {
    return userRepository.findUserProfile(userId, currentUserId);
  },

  async updateProfile(userId: number, data: { username?: string; bio?: string; avatar?: string }) {
    if (data.username) {
      const existing = await userRepository.findByUsername(data.username);
      if (existing && existing.id !== userId) {
        throw new Error('该用户名已被使用');
      }
    }
    await userRepository.updateProfile(userId, data);
    return userRepository.findById(userId);
  },

  async searchUsers(query: string, limit: number = 10) {
    return userRepository.searchUsers(query, limit);
  },

  async follow(followerId: number, followingId: number): Promise<boolean> {
    const result = await friendshipRepository.follow(followerId, followingId);
    if (result) {
      const follower = await userRepository.findById(followerId);
      if (follower) {
        await notificationRepository.create(
          followingId,
          'follow',
          `${follower.username} 关注了你`,
          followerId
        );
      }
    }
    return result;
  },

  async unfollow(followerId: number, followingId: number): Promise<boolean> {
    return friendshipRepository.unfollow(followerId, followingId);
  },

  async getFollowers(userId: number) {
    return friendshipRepository.getFollowers(userId);
  },

  async getFollowing(userId: number) {
    return friendshipRepository.getFollowing(userId);
  },

  async getSuggestedUsers(userId: number, limit: number = 5) {
    return friendshipRepository.getSuggestedUsers(userId, limit);
  },

  async getUserBadges(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('用户不存在');
    
    const profile = await userRepository.findUserProfile(userId, userId);
    return profile?.badges || [];
  }
};
