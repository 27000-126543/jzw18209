import { runQuery, runQueryOne, runInsert, runUpdate } from '../db/database';
import { Notification } from '../../shared/types';

interface NotificationRow {
  id: number;
  user_id: number;
  type: string;
  content: string;
  related_id: number | null;
  is_read: number;
  created_at: string;
}

export const notificationRepository = {
  async create(
    userId: number,
    type: Notification['type'],
    content: string,
    relatedId: number | null = null
  ): Promise<number> {
    return runInsert(
      'INSERT INTO notifications (user_id, type, content, related_id) VALUES (?, ?, ?, ?)',
      [userId, type, content, relatedId]
    );
  },

  async getByUserId(userId: number, limit: number = 50, type?: Notification['type']): Promise<Notification[]> {
    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    const params: unknown[] = [userId];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const rows = await runQuery<NotificationRow>(sql, params);
    return rows.map(mapNotification);
  },

  async getUnreadCount(userId: number, type?: Notification['type']): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0';
    const params: unknown[] = [userId];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    const row = await runQueryOne<{ count: number }>(sql, params);
    return row?.count || 0;
  },

  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    const changes = await runUpdate(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return changes > 0;
  },

  async markAllAsRead(userId: number, type?: Notification['type']): Promise<number> {
    let sql = 'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0';
    const params: unknown[] = [userId];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    return runUpdate(sql, params);
  },

  async delete(notificationId: number, userId: number): Promise<boolean> {
    const changes = await runUpdate(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return changes > 0;
  },

  async sendMotivationIfMissed(userId: number, habitName: string): Promise<void> {
    const motivations = [
      `今天的"${habitName}"打卡还没完成哦！明天继续加油，不要让之前的努力白费！`,
      `嘿，今天的"${habitName}"打卡错过了。不过没关系，明天重新开始，你可以的！`,
      `"${habitName}"今天没打卡？偶尔的休息是为了更好的出发，明天记得回来！`,
      `坚持"${habitName}"不容易，今天错过了但别放弃，明天继续冲！`
    ];
    const content = motivations[Math.floor(Math.random() * motivations.length)];
    await this.create(userId, 'motivation', content);
  }
};

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as Notification['type'],
    content: row.content,
    relatedId: row.related_id,
    isRead: row.is_read === 1,
    createdAt: row.created_at
  };
}
