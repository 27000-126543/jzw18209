import { runQuery, runQueryOne, runInsert } from '../db/database';
import { Badge } from '../../shared/types';

interface BadgeRow {
  id: number;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: string;
}

interface UserBadgeRow extends BadgeRow {
  earned_at: string | null;
}

export const badgeRepository = {
  async getAll(): Promise<Badge[]> {
    const rows = await runQuery<BadgeRow>('SELECT * FROM badges ORDER BY requirement ASC');
    return rows.map(mapBadge);
  },

  async getByUser(userId: number): Promise<Badge[]> {
    const rows = await runQuery<UserBadgeRow>(
      `SELECT b.*, ub.earned_at 
       FROM badges b 
       LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
       ORDER BY b.requirement ASC`,
      [userId]
    );
    return rows.map(row => ({
      ...mapBadge(row),
      earnedAt: row.earned_at || undefined
    }));
  },

  async checkAndAwardStreakBadge(userId: number, streak: number): Promise<Badge | null> {
    const earnedBadges = await runQuery<{ badge_id: number }>(
      'SELECT badge_id FROM user_badges WHERE user_id = ?',
      [userId]
    );
    const earnedIds = earnedBadges.map(b => b.badge_id);

    const badgeRow = await runQueryOne<BadgeRow>(
      `SELECT * FROM badges 
       WHERE type = 'streak' 
       AND requirement <= ?
       AND id NOT IN (${earnedIds.length > 0 ? earnedIds.join(',') : '0'})
       ORDER BY requirement DESC 
       LIMIT 1`,
      [streak]
    );

    if (badgeRow) {
      await runInsert(
        'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
        [userId, badgeRow.id]
      );
      return mapBadge(badgeRow);
    }
    return null;
  },

  async checkAndAwardTotalBadge(userId: number, habitName: string, total: number): Promise<Badge | null> {
    const earnedBadges = await runQuery<{ badge_id: number }>(
      'SELECT badge_id FROM user_badges WHERE user_id = ?',
      [userId]
    );
    const earnedIds = earnedBadges.map(b => b.badge_id);

    let badgeType: string | null = null;
    if (habitName.includes('早起') || habitName.includes('起床')) {
      badgeType = 'sunrise';
    } else if (habitName.includes('健身') || habitName.includes('跑步') || habitName.includes('运动')) {
      badgeType = 'dumbbell';
    } else if (habitName.includes('阅读') || habitName.includes('读书')) {
      badgeType = 'book-open';
    }

    if (!badgeType) return null;

    const badgeRow = await runQueryOne<BadgeRow>(
      `SELECT * FROM badges 
       WHERE type = 'total' 
       AND icon = ?
       AND requirement <= ?
       AND id NOT IN (${earnedIds.length > 0 ? earnedIds.join(',') : '0'})
       ORDER BY requirement DESC 
       LIMIT 1`,
      [badgeType, total]
    );

    if (badgeRow) {
      await runInsert(
        'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
        [userId, badgeRow.id]
      );
      return mapBadge(badgeRow);
    }
    return null;
  },

  async getById(id: number): Promise<Badge | null> {
    const row = await runQueryOne<BadgeRow>('SELECT * FROM badges WHERE id = ?', [id]);
    return row ? mapBadge(row) : null;
  }
};

function mapBadge(row: BadgeRow): Badge {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    requirement: row.requirement,
    type: row.type as 'streak' | 'total'
  };
}
