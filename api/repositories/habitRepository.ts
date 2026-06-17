import { runQuery, runQueryOne, runInsert, runUpdate } from '../db/database';
import { Habit, HabitDetail, CheckIn, CreateHabitRequest } from '../../shared/types';
import dayjs from 'dayjs';

interface HabitRow {
  id: number;
  user_id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  frequency: string;
  target_count: number;
  reminder_time: string;
  deadline_time: string;
  is_public: number;
  created_at: string;
}

interface CheckInRow {
  id: number;
  user_id: number;
  habit_id: number;
  content: string;
  photos: string;
  mood: number;
  created_at: string;
}

export const habitRepository = {
  async create(userId: number, data: CreateHabitRequest): Promise<number> {
    return runInsert(
      `INSERT INTO habits (user_id, name, description, icon, color, frequency, target_count, reminder_time, deadline_time, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.name, data.description, data.icon, data.color, data.frequency, data.targetCount, data.reminderTime, data.deadlineTime, data.isPublic ? 1 : 0]
    );
  },

  async findByUserId(userId: number): Promise<Habit[]> {
    const rows = await runQuery<HabitRow>(
      'SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows.map(mapHabit);
  },

  async findById(id: number): Promise<Habit | null> {
    const row = await runQueryOne<HabitRow>(
      'SELECT * FROM habits WHERE id = ?',
      [id]
    );
    return row ? mapHabit(row) : null;
  },

  async getTodayProgress(userId: number): Promise<{ habitId: number; completed: boolean }[]> {
    const today = dayjs().format('YYYY-MM-DD');
    const rows = await runQuery<{ habit_id: number; completed: number }>(
      `SELECT h.id as habit_id, 
              CASE WHEN EXISTS (
                SELECT 1 FROM check_ins ci 
                WHERE ci.habit_id = h.id 
                AND ci.user_id = h.user_id
                AND DATE(ci.created_at) = ?
              ) THEN 1 ELSE 0 END as completed
       FROM habits h WHERE h.user_id = ?`,
      [today, userId]
    );
    return rows.map(r => ({ habitId: r.habit_id, completed: r.completed === 1 }));
  },

  async getHabitDetail(habitId: number, userId: number): Promise<HabitDetail | null> {
    const habit = await this.findById(habitId);
    if (!habit || habit.userId !== userId) return null;

    const totalCheckInsRow = await runQueryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM check_ins WHERE habit_id = ? AND user_id = ?',
      [habitId, userId]
    );

    const currentStreak = await calculateStreak(habitId, userId);
    const longestStreak = await calculateLongestStreak(habitId, userId);
    const monthlyCompletionRate = await calculateMonthlyRate(habitId, userId);

    const checkInHistory = await runQuery<CheckInRow>(
      'SELECT * FROM check_ins WHERE habit_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 30',
      [habitId, userId]
    );

    const heatmapData = await generateHeatmapData(habitId, userId);

    return {
      ...habit,
      currentStreak,
      longestStreak,
      monthlyCompletionRate,
      totalCheckIns: totalCheckInsRow?.count || 0,
      checkInHistory: checkInHistory.map(mapCheckIn),
      heatmapData
    };
  },

  async update(habitId: number, userId: number, data: Partial<CreateHabitRequest>): Promise<boolean> {
    const habit = await this.findById(habitId);
    if (!habit || habit.userId !== userId) return false;

    const updates: string[] = [];
    const params: unknown[] = [];

    if (data.name) { updates.push('name = ?'); params.push(data.name); }
    if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }
    if (data.icon) { updates.push('icon = ?'); params.push(data.icon); }
    if (data.color) { updates.push('color = ?'); params.push(data.color); }
    if (data.frequency) { updates.push('frequency = ?'); params.push(data.frequency); }
    if (data.targetCount) { updates.push('target_count = ?'); params.push(data.targetCount); }
    if (data.reminderTime) { updates.push('reminder_time = ?'); params.push(data.reminderTime); }
    if (data.deadlineTime) { updates.push('deadline_time = ?'); params.push(data.deadlineTime); }
    if (data.isPublic !== undefined) { updates.push('is_public = ?'); params.push(data.isPublic ? 1 : 0); }

    params.push(habitId, userId);

    const changes = await runUpdate(
      `UPDATE habits SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );

    return changes > 0;
  },

  async delete(habitId: number, userId: number): Promise<boolean> {
    const habit = await this.findById(habitId);
    if (!habit || habit.userId !== userId) return false;

    await runUpdate('DELETE FROM check_ins WHERE habit_id = ?', [habitId]);
    const changes = await runUpdate('DELETE FROM habits WHERE id = ?', [habitId]);
    return changes > 0;
  }
};

function mapHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    frequency: row.frequency as 'daily' | 'weekly',
    targetCount: row.target_count,
    reminderTime: row.reminder_time,
    deadlineTime: row.deadline_time,
    isPublic: row.is_public === 1,
    createdAt: row.created_at
  };
}

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

async function calculateStreak(habitId: number, userId: number): Promise<number> {
  const rows = await runQuery<{ created_at: string }>(
    `SELECT DISTINCT DATE(created_at) as created_at 
     FROM check_ins 
     WHERE habit_id = ? AND user_id = ? 
     ORDER BY created_at DESC`,
    [habitId, userId]
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

async function calculateLongestStreak(habitId: number, userId: number): Promise<number> {
  const rows = await runQuery<{ created_at: string }>(
    `SELECT DISTINCT DATE(created_at) as created_at 
     FROM check_ins 
     WHERE habit_id = ? AND user_id = ? 
     ORDER BY created_at ASC`,
    [habitId, userId]
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

async function calculateMonthlyRate(habitId: number, userId: number): Promise<number> {
  const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD');
  const today = dayjs().format('YYYY-MM-DD');
  
  const totalDays = dayjs().diff(dayjs().startOf('month'), 'day') + 1;
  
  const completedDaysRow = await runQueryOne<{ count: number }>(
    `SELECT COUNT(DISTINCT DATE(created_at)) as count 
     FROM check_ins 
     WHERE habit_id = ? AND user_id = ? 
     AND DATE(created_at) BETWEEN ? AND ?`,
    [habitId, userId, startOfMonth, today]
  );

  const completedDays = completedDaysRow?.count || 0;
  return Math.round((completedDays / totalDays) * 100);
}

async function generateHeatmapData(habitId: number, userId: number): Promise<{ date: string; count: number }[]> {
  const oneYearAgo = dayjs().subtract(1, 'year').format('YYYY-MM-DD');
  
  const rows = await runQuery<{ date: string; count: number }>(
    `SELECT DATE(created_at) as date, COUNT(*) as count 
     FROM check_ins 
     WHERE habit_id = ? AND user_id = ? 
     AND DATE(created_at) >= ?
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [habitId, userId, oneYearAgo]
  );

  return rows.map(row => ({
    date: row.date,
    count: row.count
  }));
}
