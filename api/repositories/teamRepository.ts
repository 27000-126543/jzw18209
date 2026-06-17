import { runQuery, runQueryOne, runInsert, runUpdate } from '../db/database';
import { Team, TeamDetail, TeamMember, CreateTeamRequest } from '../../shared/types';
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
    const today = dayjs().format('YYYY-MM-DD');
    const rows = await runQuery<TeamMemberRow>(
      `SELECT tm.*, u.username, u.avatar,
              EXISTS(
                SELECT 1 FROM check_ins ci 
                WHERE ci.user_id = tm.user_id 
                AND DATE(ci.created_at) = ?
              ) as today_completed
       FROM team_members tm 
       JOIN users u ON tm.user_id = u.id 
       WHERE tm.team_id = ? 
       ORDER BY tm.joined_at ASC`,
      [today, teamId]
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

  async getDailyProgress(teamId: number): Promise<{ date: string; completionRate: number }[]> {
    const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
    const rows = await runQuery<{
      date: string;
      completed: number;
      total: number;
    }>(
      `SELECT 
        DATE(ci.created_at) as date,
        COUNT(DISTINCT ci.user_id) as completed,
        (SELECT COUNT(*) FROM team_members WHERE team_id = ?) as total
      FROM check_ins ci
      JOIN team_members tm ON ci.user_id = tm.user_id
      WHERE tm.team_id = ?
      AND DATE(ci.created_at) >= ?
      GROUP BY DATE(ci.created_at)
      ORDER BY date ASC`,
      [teamId, teamId, thirtyDaysAgo]
    );

    return rows.map(row => ({
      date: row.date,
      completionRate: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0
    }));
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
