import { runQuery, runQueryOne, runInsert, runUpdate } from '../db/database';
import { Habit, HabitDetail, CheckIn, CreateHabitRequest, TodayProgress } from '../../shared/types';
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

  async getTodayProgress(userId: number): Promise<TodayProgress[]> {
    const today = dayjs();
    const weekStart = today.startOf('week').format('YYYY-MM-DD');
    const todayStr = today.format('YYYY-MM-DD');

    const habits = await this.findByUserId(userId);
    const result: TodayProgress[] = [];

    for (const habit of habits) {
      let dateStart: string;
      let dateEnd: string;

      if (habit.frequency === 'weekly') {
        dateStart = weekStart;
        dateEnd = today.endOf('week').format('YYYY-MM-DD');
      } else {
        dateStart = todayStr;
        dateEnd = todayStr;
      }

      const countRow = await runQueryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM check_ins 
         WHERE habit_id = ? AND user_id = ? 
         AND DATE(created_at) BETWEEN ? AND ?`,
        [habit.id, userId, dateStart, dateEnd]
      );

      const currentCount = countRow?.count || 0;
      const targetCount = habit.targetCount;
      const completed = currentCount >= targetCount;
      const completionRate = Math.min(100, Math.round((currentCount / targetCount) * 100));

      result.push({
        habitId: habit.id,
        completed,
        currentCount,
        targetCount,
        completionRate
      });
    }

    return result;
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
  const habit = await runQueryOne<{ frequency: string; target_count: number }>(
    'SELECT frequency, target_count FROM habits WHERE id = ?',
    [habitId]
  );
  if (!habit) return 0;

  const startOfMonth = dayjs().startOf('month');
  const today = dayjs();
  const startOfMonthStr = startOfMonth.format('YYYY-MM-DD');
  const todayStr = today.format('YYYY-MM-DD');

  if (habit.frequency === 'weekly') {
    const totalWeeks = Math.ceil((today.diff(startOfMonth, 'day') + 1) / 7);
    const checkInsRow = await runQueryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM check_ins 
       WHERE habit_id = ? AND user_id = ? 
       AND DATE(created_at) BETWEEN ? AND ?`,
      [habitId, userId, startOfMonthStr, todayStr]
    );
    const targetTotal = totalWeeks * habit.target_count;
    if (targetTotal === 0) return 0;
    return Math.min(100, Math.round(((checkInsRow?.count || 0) / targetTotal) * 100));
  } else {
    const totalDays = today.diff(startOfMonth, 'day') + 1;
    const targetCount = habit.target_count;
    const totalTarget = totalDays * targetCount;

    const completedCountRow = await runQueryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM check_ins 
       WHERE habit_id = ? AND user_id = ? 
       AND DATE(created_at) BETWEEN ? AND ?`,
      [habitId, userId, startOfMonthStr, todayStr]
    );
    const completedCount = completedCountRow?.count || 0;
    if (totalTarget === 0) return 0;
    return Math.min(100, Math.round((completedCount / totalTarget) * 100));
  }
}

export async function getUserStatistics(userId: number) {
  const habits = await runQuery<HabitRow>(
    'SELECT * FROM habits WHERE user_id = ?',
    [userId]
  );

  let totalCheckIns = 0;
  let maxCurrentStreak = 0;
  let maxLongestStreak = 0;
  let completedTargets = 0;
  const streaks: Record<number, number> = {};
  const heatmapMap = new Map<string, number>();

  for (const habit of habits) {
    const streak = await calculateStreak(habit.id, userId);
    const longestStreak = await calculateLongestStreak(habit.id, userId);
    const detail = await habitRepository.getHabitDetail(habit.id, userId);
    
    streaks[habit.id] = streak;
    maxCurrentStreak = Math.max(maxCurrentStreak, streak);
    maxLongestStreak = Math.max(maxLongestStreak, longestStreak);
    totalCheckIns += detail?.totalCheckIns || 0;
    
    const progress = await habitRepository.getTodayProgress(userId);
    const habitProgress = progress.find(p => p.habitId === habit.id);
    if (habitProgress?.completed) completedTargets++;

    const heatmap = detail?.heatmapData || [];
    for (const item of heatmap) {
      heatmapMap.set(item.date, (heatmapMap.get(item.date) || 0) + item.count);
    }
  }

  const heatmapData: { date: string; count: number }[] = [];
  for (let i = 370; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    heatmapData.push({ date, count: heatmapMap.get(date) || 0 });
  }

  const totalDays = dayjs().diff(dayjs().startOf('month'), 'day') + 1;
  const todayProgress = await habitRepository.getTodayProgress(userId);
  const dailyHabits = habits.filter(h => h.frequency === 'daily');
  const monthlyRate = dailyHabits.length > 0
    ? Math.round((completedTargets / dailyHabits.length) * (todayProgress.filter(p => p.habitId !== undefined && habits.find(h => h.id === p.habitId)?.frequency === 'daily').length / totalDays) * 100)
    : 0;

  const badgesRow = await runQueryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM user_badges WHERE user_id = ?',
    [userId]
  );

  return {
    currentStreak: maxCurrentStreak,
    longestStreak: maxLongestStreak,
    monthlyRate: Math.min(100, monthlyRate),
    totalCheckIns,
    badgesCount: badgesRow?.count || 0,
    heatmapData,
    streaks
  };
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
