import { runQuery, runQueryOne, runInsert } from '../db/database';
import { User, UserProfile, Badge, ExploreUser, UserStatistics, CheckInFeed } from '../../shared/types';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

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
  },

  async getExploreUsers(currentUserId: number | null, limit: number = 20): Promise<ExploreUser[]> {
    const rows = await runQuery<{
      id: number;
      username: string;
      avatar: string;
      bio: string;
      total_checkins: number;
      is_following: number;
    }>(
      `SELECT u.id, u.username, u.avatar, u.bio,
              (SELECT COUNT(*) FROM check_ins ci WHERE ci.user_id = u.id) as total_checkins,
              EXISTS(SELECT 1 FROM friendships f WHERE f.follower_id = ? AND f.following_id = u.id) as is_following
       FROM users u
       WHERE u.id != ?
       ORDER BY total_checkins DESC
       LIMIT ?`,
      [currentUserId || 0, currentUserId || 0, limit]
    );

    const result: ExploreUser[] = [];
    for (const row of rows) {
      const streak = await calculateCurrentStreak(row.id);
      result.push({
        id: row.id,
        username: row.username,
        avatar: row.avatar,
        bio: row.bio,
        isFollowing: row.is_following === 1,
        currentStreak: streak,
        totalCheckIns: row.total_checkins
      });
    }
    return result;
  },

  async getUserCheckIns(userId: number, currentUserId: number | null, limit: number = 30): Promise<CheckInFeed[]> {
    const rows = await runQuery<{
      id: number;
      user_id: number;
      habit_id: number;
      content: string;
      photos: string;
      mood: number;
      created_at: string;
      username: string;
      avatar: string;
      habit_name: string;
      habit_icon: string;
      likes_count: number;
      comments_count: number;
      is_liked: number;
      is_public: number;
    }>(
      `SELECT ci.*, 
              u.username, u.avatar,
              h.name as habit_name, h.icon as habit_icon, h.is_public,
              (SELECT COUNT(*) FROM likes l WHERE l.checkin_id = ci.id) as likes_count,
              (SELECT COUNT(*) FROM comments c WHERE c.checkin_id = ci.id) as comments_count,
              EXISTS(SELECT 1 FROM likes l WHERE l.checkin_id = ci.id AND l.user_id = ?) as is_liked
       FROM check_ins ci
       JOIN users u ON ci.user_id = u.id
       JOIN habits h ON ci.habit_id = h.id
       WHERE ci.user_id = ?
       AND (h.is_public = 1 OR u.id = ?)
       ORDER BY ci.created_at DESC
       LIMIT ?`,
      [currentUserId || 0, userId, currentUserId || 0, limit]
    );

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      habitId: row.habit_id,
      content: row.content,
      photos: row.photos ? JSON.parse(row.photos) : [],
      mood: row.mood,
      createdAt: row.created_at,
      username: row.username,
      avatar: row.avatar,
      habitName: row.habit_name,
      habitIcon: row.habit_icon,
      likesCount: row.likes_count,
      commentsCount: row.comments_count,
      isLiked: row.is_liked === 1
    }));
  },

  async getUserStats(userId: number, currentUserId: number | null): Promise<UserStatistics | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    const profile = await this.findUserProfile(userId, currentUserId);
    if (!profile) return null;

    const heatmapData = await generateUserHeatmap(userId);
    const longestStreak = await calculateLongestStreak(userId);

    const isFollowingRow = currentUserId ? await runQueryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM friendships WHERE follower_id = ? AND following_id = ?',
      [currentUserId, userId]
    ) : { count: 0 };

    return {
      user: {
        ...user,
        isFollowing: (isFollowingRow?.count || 0) > 0
      },
      currentStreak: profile.currentStreak,
      longestStreak,
      totalCheckIns: profile.totalCheckIns,
      followersCount: profile.followersCount,
      followingCount: profile.followingCount,
      heatmapData
    };
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

async function calculateLongestStreak(userId: number): Promise<number> {
  const rows = await runQuery<{ created_at: string }>(
    `SELECT DISTINCT DATE(created_at) as created_at 
     FROM check_ins 
     WHERE user_id = ? 
     ORDER BY created_at ASC`,
    [userId]
  );

  if (rows.length === 0) return 0;

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < rows.length; i++) {
    const prevDate = dayjs(rows[i - 1].created_at);
    const currDate = dayjs(rows[i].created_at);
    
    if (currDate.diff(prevDate, 'day') === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (currDate.diff(prevDate, 'day') > 1) {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

async function generateUserHeatmap(userId: number): Promise<{ date: string; count: number }[]> {
  const oneYearAgo = dayjs().subtract(1, 'year').format('YYYY-MM-DD');
  
  const rows = await runQuery<{ date: string; count: number }>(
    `SELECT DATE(created_at) as date, COUNT(*) as count 
     FROM check_ins 
     WHERE user_id = ? 
     AND DATE(created_at) >= ?
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [userId, oneYearAgo]
  );

  const heatmapMap = new Map<string, number>();
  for (const row of rows) {
    heatmapMap.set(row.date, row.count);
  }

  const result: { date: string; count: number }[] = [];
  for (let i = 365; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    result.push({ date, count: heatmapMap.get(date) || 0 });
  }
  return result;
}
