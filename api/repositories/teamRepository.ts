import { runQuery, runQueryOne, runInsert, runUpdate } from '../db/database';
import { Team, TeamDetail, TeamMember, TeamMemberExtended, TeamProgress, TeamExtended, CreateTeamRequest } from '../../shared/types';
import dayjs from 'dayjs';

interface TeamRow {
  id: number;
  name: string;
  description: string;
  habit_id: number | null;
  creator_id: number;
  start_date: string;
  end_date: string;
  max_members: number;
  invite_code: string;
  created_at: string;
}

interface TeamMemberRow {
  id: number;
  team_id: number;
  user_id: number;
  username: string;
  avatar: string;
  joined_at: string;
  today_completed: number;
}

export const teamRepository = {
  async create(creatorId: number, data: CreateTeamRequest): Promise<number> {
    const inviteCode = generateInviteCode();
    return runInsert(
      `INSERT INTO teams (name, description, habit_id, creator_id, start_date, end_date, max_members, invite_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.description, data.targetHabitId, creatorId, data.startDate, data.endDate, data.maxMembers, inviteCode]
    );
  },

  async findById(id: number): Promise<Team | null> {
    const row = await runQueryOne<TeamRow>('SELECT * FROM teams WHERE id = ?', [id]);
    return row ? mapTeam(row) : null;
  },

  async getTeamDetail(teamId: number, userId: number | null): Promise<TeamDetail | null> {
    const team = await this.findById(teamId);
    if (!team) return null;

    const isMember = userId ? await this.isMember(teamId, userId) : false;
    if (!isMember && userId) {
      return null;
    }

    const members = await this.getMembers(teamId);
    const dailyProgress = await this.getDailyProgress(teamId);
    const todayCompleted = members.filter(m => m.todayCompleted).length;

    return {
      ...team,
      members,
      dailyProgress,
      todayCompleted,
      totalMembers: members.length
    };
  },

  async getByUserId(userId: number): Promise<Team[]> {
    const rows = await runQuery<TeamRow>(
      `SELECT t.* FROM teams t 
       JOIN team_members tm ON t.id = tm.team_id 
       WHERE tm.user_id = ? 
       ORDER BY t.created_at DESC`,
      [userId]
    );
    return rows.map(mapTeam);
  },

  async getAllPublic(limit: number = 50): Promise<Team[]> {
    const rows = await runQuery<TeamRow>(
      `SELECT t.* FROM teams t 
       ORDER BY t.created_at DESC 
       LIMIT ?`,
      [limit]
    );
    return rows.map(mapTeam);
  },

  async getRecommended(userId: number, limit: number = 5): Promise<Team[]> {
    const rows = await runQuery<TeamRow>(
      `SELECT t.* FROM teams t 
       WHERE t.id NOT IN (SELECT team_id FROM team_members WHERE user_id = ?)
       AND (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) < t.max_members
       ORDER BY RANDOM() 
       LIMIT ?`,
      [userId, limit]
    );
    return rows.map(mapTeam);
  },

  async joinTeam(teamId: number, userId: number): Promise<boolean> {
    const team = await this.findById(teamId);
    if (!team) return false;

    const memberCount = await runQueryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM team_members WHERE team_id = ?',
      [teamId]
    );

    if ((memberCount?.count || 0) >= team.maxMembers) return false;

    try {
      await runInsert(
        'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
        [teamId, userId]
      );
      return true;
    } catch (error) {
      return false;
    }
  },

  async leaveTeam(teamId: number, userId: number): Promise<boolean> {
    const team = await this.findById(teamId);
    if (!team || team.creatorId === userId) return false;

    const changes = await runUpdate(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, userId]
    );
    return changes > 0;
  },

  async isMember(teamId: number, userId: number): Promise<boolean> {
    const row = await runQueryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, userId]
    );
    return (row?.count || 0) > 0;
  },

  async getMembers(teamId: number): Promise<TeamMember[]> {
    const team = await this.findById(teamId);
    const today = dayjs().format('YYYY-MM-DD');
    const habitId = team?.habitId;

    const rows = await runQuery<TeamMemberRow>(
      `SELECT tm.*, u.username, u.avatar,
              EXISTS(
                SELECT 1 FROM check_ins ci 
                WHERE ci.user_id = tm.user_id 
                AND DATE(ci.created_at) = ?
                ${habitId ? 'AND ci.habit_id = ?' : ''}
              ) as today_completed
       FROM team_members tm 
       JOIN users u ON tm.user_id = u.id 
       WHERE tm.team_id = ? 
       ORDER BY tm.joined_at ASC`,
      habitId ? [today, habitId, teamId] : [today, teamId]
    );

    return rows.map(row => ({
      id: row.id,
      teamId: row.team_id,
      userId: row.user_id,
      username: row.username,
      avatar: row.avatar,
      joinedAt: row.joined_at,
      todayCompleted: row.today_completed === 1
    }));
  },

  async getMembersExtended(teamId: number, currentUserId: number | null): Promise<TeamMemberExtended[]> {
    const team = await this.findById(teamId);
    const today = dayjs().format('YYYY-MM-DD');
    const weekStart = dayjs().startOf('week').format('YYYY-MM-DD');
    const habitId = team?.habitId;

    const baseMembers = await this.getMembers(teamId);
    const result: TeamMemberExtended[] = [];

    for (const member of baseMembers) {
      const streak = await calculateMemberStreak(member.userId, habitId);
      const totalCheckIns = await calculateMemberTotalCheckIns(member.userId, habitId);

      result.push({
        ...member,
        isCurrentUser: currentUserId === member.userId,
        streak,
        totalCheckIns
      });
    }

    return result;
  },

  async getDailyProgress(teamId: number): Promise<{ date: string; completionRate: number }[]> {
    const team = await this.findById(teamId);
    if (!team) return [];

    const habitId = team.habitId;
    const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

    const sql = habitId
      ? `SELECT 
          DATE(ci.created_at) as date,
          COUNT(DISTINCT ci.user_id) as completed,
          (SELECT COUNT(*) FROM team_members WHERE team_id = ?) as total
        FROM check_ins ci
        JOIN team_members tm ON ci.user_id = tm.user_id
        WHERE tm.team_id = ?
        AND ci.habit_id = ?
        AND DATE(ci.created_at) >= ?
        GROUP BY DATE(ci.created_at)
        ORDER BY date ASC`
      : `SELECT 
          DATE(ci.created_at) as date,
          COUNT(DISTINCT ci.user_id) as completed,
          (SELECT COUNT(*) FROM team_members WHERE team_id = ?) as total
        FROM check_ins ci
        JOIN team_members tm ON ci.user_id = tm.user_id
        WHERE tm.team_id = ?
        AND DATE(ci.created_at) >= ?
        GROUP BY DATE(ci.created_at)
        ORDER BY date ASC`;

    const params = habitId
      ? [teamId, teamId, habitId, thirtyDaysAgo]
      : [teamId, teamId, thirtyDaysAgo];

    const rows = await runQuery<{
      date: string;
      completed: number;
      total: number;
    }>(sql, params);

    return rows.map(row => ({
      date: row.date,
      completionRate: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0
    }));
  },

  async getSevenDayProgress(teamId: number): Promise<TeamProgress[]> {
    const team = await this.findById(teamId);
    if (!team) return [];

    const habitId = team.habitId;
    const sevenDaysAgo = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');

    const sql = habitId
      ? `SELECT 
          DATE(ci.created_at) as date,
          COUNT(DISTINCT ci.user_id) as completed,
          (SELECT COUNT(*) FROM team_members WHERE team_id = ?) as total
        FROM check_ins ci
        JOIN team_members tm ON ci.user_id = tm.user_id
        WHERE tm.team_id = ?
        AND ci.habit_id = ?
        AND DATE(ci.created_at) BETWEEN ? AND ?
        GROUP BY DATE(ci.created_at)
        ORDER BY date ASC`
      : `SELECT 
          DATE(ci.created_at) as date,
          COUNT(DISTINCT ci.user_id) as completed,
          (SELECT COUNT(*) FROM team_members WHERE team_id = ?) as total
        FROM check_ins ci
        JOIN team_members tm ON ci.user_id = tm.user_id
        WHERE tm.team_id = ?
        AND DATE(ci.created_at) BETWEEN ? AND ?
        GROUP BY DATE(ci.created_at)
        ORDER BY date ASC`;

    const params = habitId
      ? [teamId, teamId, habitId, sevenDaysAgo, today]
      : [teamId, teamId, sevenDaysAgo, today];

    const rows = await runQuery<{
      date: string;
      completed: number;
      total: number;
    }>(sql, params);

    const progressMap = new Map<string, number>();
    for (const row of rows) {
      progressMap.set(row.date, row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0);
    }

    const result: TeamProgress[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      result.push({
        date,
        completedRate: progressMap.get(date) || 0
      });
    }

    return result;
  },

  async getTeamDetailExtended(teamId: number, userId: number | null): Promise<TeamExtended | null> {
    const team = await this.findById(teamId);
    if (!team) return null;

    const isMember = userId ? await this.isMember(teamId, userId) : false;
    if (!isMember && userId) {
      return null;
    }

    const habitRow = team.habitId
      ? await runQueryOne<{ icon: string; color: string; target_count: number }>(
          'SELECT icon, color, target_count FROM habits WHERE id = ?',
          [team.habitId]
        )
      : null;

    const membersCountRow = await runQueryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM team_members WHERE team_id = ?',
      [teamId]
    );

    const totalCheckInsRow = team.habitId
      ? await runQueryOne<{ count: number }>(
          `SELECT COUNT(*) as count FROM check_ins ci
           JOIN team_members tm ON ci.user_id = tm.user_id
           WHERE tm.team_id = ? AND ci.habit_id = ?`,
          [teamId, team.habitId]
        )
      : await runQueryOne<{ count: number }>(
          `SELECT COUNT(*) as count FROM check_ins ci
           JOIN team_members tm ON ci.user_id = tm.user_id
           WHERE tm.team_id = ?`,
          [teamId]
        );

    const membersExtended = await this.getMembersExtended(teamId, userId);
    const currentStreak = calculateTeamCurrentStreak(membersExtended);

    return {
      ...team,
      icon: habitRow?.icon || 'users',
      color: habitRow?.color || '#6366f1',
      currentStreak,
      totalCheckIns: totalCheckInsRow?.count || 0,
      membersCount: membersCountRow?.count || 0,
      targetCount: habitRow?.target_count || 1,
      endDate: team.endDate
    };
  },

  async findByInviteCode(code: string): Promise<Team | null> {
    const row = await runQueryOne<TeamRow>(
      'SELECT * FROM teams WHERE invite_code = ?',
      [code]
    );
    return row ? mapTeam(row) : null;
  }
};

function mapTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    habitId: row.habit_id,
    creatorId: row.creator_id,
    startDate: row.start_date,
    endDate: row.end_date,
    maxMembers: row.max_members,
    inviteCode: row.invite_code,
    createdAt: row.created_at
  };
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function calculateMemberStreak(userId: number, habitId: number | null): Promise<number> {
  const habitCondition = habitId ? 'AND habit_id = ?' : '';
  const params = habitId ? [userId, habitId] : [userId];

  const rows = await runQuery<{ created_at: string }>(
    `SELECT DISTINCT DATE(created_at) as created_at 
     FROM check_ins 
     WHERE user_id = ? ${habitCondition}
     ORDER BY created_at DESC`,
    params
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

async function calculateMemberTotalCheckIns(userId: number, habitId: number | null): Promise<number> {
  const habitCondition = habitId ? 'AND habit_id = ?' : '';
  const params = habitId ? [userId, habitId] : [userId];

  const row = await runQueryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM check_ins WHERE user_id = ? ${habitCondition}`,
    params
  );
  return row?.count || 0;
}

function calculateTeamCurrentStreak(members: TeamMemberExtended[]): number {
  if (members.length === 0) return 0;
  return Math.min(...members.map(m => m.streak));
}
