import { runQuery, runQueryOne, runInsert, runUpdate } from '../db/database';
import { User } from '../../shared/types';

interface FriendshipRow {
  id: number;
  follower_id: number;
  following_id: number;
  created_at: string;
}

interface UserRow {
  id: number;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  created_at: string;
}

export const friendshipRepository = {
  async follow(followerId: number, followingId: number): Promise<boolean> {
    if (followerId === followingId) return false;
    
    try {
      await runInsert(
        'INSERT INTO friendships (follower_id, following_id) VALUES (?, ?)',
        [followerId, followingId]
      );
      return true;
    } catch (error) {
      return false;
    }
  },

  async unfollow(followerId: number, followingId: number): Promise<boolean> {
    const changes = await runUpdate(
      'DELETE FROM friendships WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );
    return changes > 0;
  },

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const row = await runQueryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM friendships WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );
    return (row?.count || 0) > 0;
  },

  async getFollowers(userId: number): Promise<User[]> {
    const rows = await runQuery<UserRow>(
      `SELECT u.* FROM users u 
       JOIN friendships f ON u.id = f.follower_id 
       WHERE f.following_id = ? 
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows.map(mapUser);
  },

  async getFollowing(userId: number): Promise<User[]> {
    const rows = await runQuery<UserRow>(
      `SELECT u.* FROM users u 
       JOIN friendships f ON u.id = f.following_id 
       WHERE f.follower_id = ? 
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows.map(mapUser);
  },

  async getFollowerCount(userId: number): Promise<number> {
    const row = await runQueryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM friendships WHERE following_id = ?',
      [userId]
    );
    return row?.count || 0;
  },

  async getFollowingCount(userId: number): Promise<number> {
    const row = await runQueryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM friendships WHERE follower_id = ?',
      [userId]
    );
    return row?.count || 0;
  },

  async getSuggestedUsers(userId: number, limit: number = 5): Promise<User[]> {
    const rows = await runQuery<UserRow>(
      `SELECT u.* FROM users u 
       WHERE u.id != ? 
       AND u.id NOT IN (SELECT following_id FROM friendships WHERE follower_id = ?)
       ORDER BY RANDOM() 
       LIMIT ?`,
      [userId, userId, limit]
    );
    return rows.map(mapUser);
  }
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatar: row.avatar,
    bio: row.bio,
    createdAt: row.created_at
  };
}
