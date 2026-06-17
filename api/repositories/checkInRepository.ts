import { runQuery, runQueryOne, runInsert, runUpdate } from '../db/database';
import { CheckIn, CheckInFeed, CheckInRequest } from '../../shared/types';
import dayjs from 'dayjs';

interface CheckInRow {
  id: number;
  user_id: number;
  habit_id: number;
  content: string;
  photos: string;
  mood: number;
  created_at: string;
}

interface CheckInFeedRow extends CheckInRow {
  username: string;
  avatar: string;
  habit_name: string;
  habit_icon: string;
  likes_count: number;
  comments_count: number;
  is_liked: number;
}

export const checkInRepository = {
  async create(userId: number, data: CheckInRequest): Promise<number> {
    const photosJson = data.photos ? JSON.stringify(data.photos) : null;
    return runInsert(
      'INSERT INTO check_ins (user_id, habit_id, content, photos, mood) VALUES (?, ?, ?, ?, ?)',
      [userId, data.habitId, data.content || null, photosJson, data.mood || null]
    );
  },

  async findById(id: number): Promise<CheckIn | null> {
    const row = await runQueryOne<CheckInRow>(
      'SELECT * FROM check_ins WHERE id = ?',
      [id]
    );
    return row ? mapCheckIn(row) : null;
  },

  async getFeed(userId: number, cursor: number = 0, limit: number = 20): Promise<{ checkIns: CheckInFeed[]; nextCursor: number }> {
    const rows = await runQuery<CheckInFeedRow>(
      `SELECT ci.*, 
              u.username, u.avatar,
              h.name as habit_name, h.icon as habit_icon,
              (SELECT COUNT(*) FROM likes l WHERE l.checkin_id = ci.id) as likes_count,
              (SELECT COUNT(*) FROM comments c WHERE c.checkin_id = ci.id) as comments_count,
              EXISTS(SELECT 1 FROM likes l WHERE l.checkin_id = ci.id AND l.user_id = ?) as is_liked
       FROM check_ins ci
       JOIN users u ON ci.user_id = u.id
       JOIN habits h ON ci.habit_id = h.id
       WHERE ci.user_id IN (
         SELECT following_id FROM friendships WHERE follower_id = ?
       ) OR ci.user_id = ?
       ORDER BY ci.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, userId, limit, cursor]
    );

    const nextCursor = rows.length === limit ? cursor + limit : 0;

    return {
      checkIns: rows.map(mapCheckInFeed),
      nextCursor
    };
  },

  async getExploreFeed(
    userId: number | null,
    options: {
      habitId?: number;
      keyword?: string;
      sortBy: 'latest' | 'popular';
    }
  ): Promise<CheckInFeed[]> {
    const { habitId, keyword, sortBy } = options;
    
    const whereClauses: string[] = ['h.is_public = 1'];
    const params: unknown[] = [userId || 0];

    if (habitId) {
      whereClauses.push('ci.habit_id = ?');
      params.push(habitId);
    }

    if (keyword) {
      whereClauses.push('(ci.content LIKE ? OR h.name LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const orderBy = sortBy === 'popular' 
      ? 'likes_count DESC, ci.created_at DESC' 
      : 'ci.created_at DESC';

    const rows = await runQuery<CheckInFeedRow>(
      `SELECT ci.*, 
              u.username, u.avatar,
              h.name as habit_name, h.icon as habit_icon,
              (SELECT COUNT(*) FROM likes l WHERE l.checkin_id = ci.id) as likes_count,
              (SELECT COUNT(*) FROM comments c WHERE c.checkin_id = ci.id) as comments_count,
              EXISTS(SELECT 1 FROM likes l WHERE l.checkin_id = ci.id AND l.user_id = ?) as is_liked
       FROM check_ins ci
       JOIN users u ON ci.user_id = u.id
       JOIN habits h ON ci.habit_id = h.id
       WHERE ${whereClauses.join(' AND ')}
       ORDER BY ${orderBy}
       LIMIT 50`,
      params
    );

    return rows.map(mapCheckInFeed);
  },

  async toggleLike(checkInId: number, userId: number): Promise<{ liked: boolean; likesCount: number }> {
    const existing = await runQueryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM likes WHERE checkin_id = ? AND user_id = ?',
      [checkInId, userId]
    );

    if (existing?.count) {
      await runUpdate('DELETE FROM likes WHERE checkin_id = ? AND user_id = ?', [checkInId, userId]);
      const countRow = await runQueryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM likes WHERE checkin_id = ?',
        [checkInId]
      );
      return { liked: false, likesCount: countRow?.count || 0 };
    } else {
      await runInsert('INSERT INTO likes (checkin_id, user_id) VALUES (?, ?)', [checkInId, userId]);
      const countRow = await runQueryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM likes WHERE checkin_id = ?',
        [checkInId]
      );
      return { liked: true, likesCount: countRow?.count || 0 };
    }
  },

  async addComment(checkInId: number, userId: number, content: string): Promise<number> {
    return runInsert(
      'INSERT INTO comments (checkin_id, user_id, content) VALUES (?, ?, ?)',
      [checkInId, userId, content]
    );
  },

  async getComments(checkInId: number): Promise<{
    id: number;
    userId: number;
    username: string;
    avatar: string;
    content: string;
    createdAt: string;
  }[]> {
    const rows = await runQuery<{
      id: number;
      checkin_id: number;
      user_id: number;
      username: string;
      avatar: string;
      content: string;
      created_at: string;
    }>(
      `SELECT c.*, u.username, u.avatar 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.checkin_id = ? 
       ORDER BY c.created_at ASC`,
      [checkInId]
    );

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      avatar: row.avatar,
      content: row.content,
      createdAt: row.created_at
    }));
  },

  async delete(checkInId: number, userId: number): Promise<boolean> {
    const checkIn = await this.findById(checkInId);
    if (!checkIn || checkIn.userId !== userId) return false;

    await runUpdate('DELETE FROM likes WHERE checkin_id = ?', [checkInId]);
    await runUpdate('DELETE FROM comments WHERE checkin_id = ?', [checkInId]);
    const changes = await runUpdate('DELETE FROM check_ins WHERE id = ?', [checkInId]);
    return changes > 0;
  },

  async checkTodayCompleted(habitId: number, userId: number): Promise<boolean> {
    const today = dayjs().format('YYYY-MM-DD');
    const row = await runQueryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM check_ins WHERE habit_id = ? AND user_id = ? AND DATE(created_at) = ?',
      [habitId, userId, today]
    );
    return (row?.count || 0) > 0;
  }
};

function mapCheckIn(row: CheckInRow): CheckIn {
  return {
    id: row.id,
    userId: row.user_id,
    habitId: row.habit_id,
    content: row.content,
    photos: row.photos ? JSON.parse(row.photos) : [],
    mood: row.mood,
    createdAt: row.created_at
  };
}

function mapCheckInFeed(row: CheckInFeedRow): CheckInFeed {
  return {
    ...mapCheckIn(row),
    username: row.username,
    avatar: row.avatar,
    habitName: row.habit_name,
    habitIcon: row.habit_icon,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    isLiked: row.is_liked === 1
  };
}
