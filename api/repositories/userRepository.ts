import { runQuery, runQueryOne, runInsert } from '../db/database';
import { User, UserProfile, Badge } from '../../shared/types';
import bcrypt from 'bcryptjs';

interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  avatar: string;
  bio: string;
  created_at: string;
}

export const userRepository = {
  async create(username: string, email: string, password: string, avatar?: string): Promise<number> {
    const passwordHash = await bcrypt.hash(password, 10);
    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
    return runInsert(
      'INSERT INTO users (username, email, password_hash, avatar, bio) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, defaultAvatar, '这个人很懒，什么都没写...']
    );
  },

  async findByEmail(email: string): Promise<User | null> {
    const row = await runQueryOne<UserRow>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return row ? mapUser(row) : null;
  },

  async findByUsername(username: string): Promise<User | null> {
    const row = await runQueryOne<UserRow>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return row ? mapUser(row) : null;
  },

  async findById(id: number): Promise<User | null> {
    const row = await runQueryOne<UserRow>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return row ? mapUser(row) : null;
  },

  async findUserProfile(userId: number, currentUserId: number | null): Promise<UserProfile | null> {
    const userRow = await runQueryOne<UserRow>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    if (!userRow) return null;

    const totalCheckInsRow = await runQueryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM check_ins WHERE user_id = ?',
      [userId]
    );

    const followersRow = await runQueryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM friendships WHERE following_id = ?',
      [userId]
    );

    const followingRow = await runQueryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM friendships WHERE follower_id = ?',
      [userId]
    );

    const isFollowingRow = currentUserId ? await runQueryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM friendships WHERE follower_id = ? AND following_id = ?',
      [currentUserId, userId]
    ) : { count: 0 };

    const badges = await runQuery<{
      id: number;
      name: string;
      description: string;
      icon: string;
      requirement: number;
      type: string;
      earned_at: string | null;
    }>(`
      SELECT b.*, ub.earned_at 
      FROM badges b 
      LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
    `, [userId]);

    const streak = await calculateCurrentStreak(userId);

    return {
      ...mapUser(userRow),
      totalCheckIns: totalCheckInsRow?.count || 0,
      currentStreak: streak,
      followersCount: followersRow?.count || 0,
      followingCount: followingRow?.count || 0,
      badges: badges.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        requirement: b.requirement,
        type: b.type as 'streak' | 'total',
        earnedAt: b.earned_at || undefined
      })),
      isFollowing: (isFollowingRow?.count || 0) > 0
    };
  },

  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const rows = await runQuery<UserRow>(
      'SELECT * FROM users WHERE username LIKE ? LIMIT ?',
      [`%${query}%`, limit]
    );
    return rows.map(mapUser);
  },

  async verifyPassword(user: User, password: string): Promise<boolean> {
    const row = await runQueryOne<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = ?',
      [user.id]
    );
    if (!row) return false;
    return bcrypt.compare(password, row.password_hash);
  },

  async updateProfile(userId: number, data: { username?: string; bio?: string; avatar?: string }): Promise<void> {
    const updates: string[] = [];
    const params: unknown[] = [];
    
    if (data.username) {
      updates.push('username = ?');
      params.push(data.username);
    }
    if (data.bio) {
      updates.push('bio = ?');
      params.push(data.bio);
    }
    if (data.avatar) {
      updates.push('avatar = ?');
      params.push(data.avatar);
    }
    
    params.push(userId);
    await runQuery(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
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

async function calculateCurrentStreak(userId: number): Promise<number> {
  const rows = await runQuery<{ created_at: string }>(
    `SELECT DISTINCT DATE(created_at) as created_at 
     FROM check_ins 
     WHERE user_id = ? 
     ORDER BY created_at DESC`,
    [userId]
  );

  if (rows.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < rows.length; i++) {
    const checkinDate = new Date(rows[i].created_at);
    checkinDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (checkinDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (checkinDate < expectedDate) {
      break;
    }
  }

  return streak;
}
