import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Target, Calendar, Award, Plus, LogOut, Crown } from 'lucide-react';
import { teamsApi } from '../api/teams';
import { Team, TeamMember, TeamProgress } from '../../shared/types';
import { Loader2 } from 'lucide-react';
import { formatDate } from '../utils/date';
import { cn } from '../lib/utils';

const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [progress, setProgress] = useState<TeamProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (id) {
      loadTeamData(parseInt(id));
    }
  }, [id]);

  const loadTeamData = async (teamId: number) => {
    setLoading(true);
    try {
      const [teamRes, membersRes, progressRes] = await Promise.all([
        teamsApi.getTeamById(teamId),
        teamsApi.getTeamMembers(teamId),
        teamsApi.getTeamProgress(teamId)
      ]);
      
      setTeam(teamRes.data);
      setMembers(membersRes.data);
      setProgress(progressRes.data);
      setIsJoined(membersRes.data.some(m => m.isCurrentUser));
    } catch (err) {
      console.error('加载队伍信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!id) return;
    try {
      await teamsApi.joinTeam(parseInt(id));
      loadTeamData(parseInt(id));
    } catch (err) {
      console.error('加入队伍失败:', err);
    }
  };

  const handleLeave = async () => {
    if (!id) return;
    if (window.confirm('确定要退出队伍吗？')) {
      try {
        await teamsApi.leaveTeam(parseInt(id));
        navigate('/teams');
      } catch (err) {
        console.error('退出队伍失败:', err);
      }
    }
  };

  if (loading || !team) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>加载中...</p>
      </div>
    );
  }

  const todayProgress = progress[0] || null;
  const completedCount = members.filter(m => m.todayCompleted).length;
  const completionRate = members.length > 0 ? Math.round((completedCount / members.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回
      </button>

      <div
        className="rounded-3xl p-8 text-white relative overflow-hidden"
        style={{ backgroundColor: team.color || '#10b981' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl">
                {team.icon || '🎯'}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{team.name}</h1>
                {team.description && (
                  <p className="text-white/80 mt-2">{team.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-white/70">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {members.length} 名成员
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {team.targetCount} 天挑战
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    到 {formatDate(team.endDate || team.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {isJoined ? (
                <button
                  onClick={handleLeave}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  退出队伍
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  className="px-6 py-3 bg-white text-emerald-600 font-medium rounded-xl hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  加入队伍
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">今日完成</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {completedCount}/{members.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Target className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{completionRate}% 完成率</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">队伍连续</p>
              <p className="text-2xl font-bold text-orange-500 mt-2">
                {team.currentStreak || 0} 天
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Award className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">总完成次数</p>
              <p className="text-2xl font-bold text-purple-500 mt-2">
                {team.totalCheckIns || 0} 次
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">成员排行榜</h2>
        {members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无成员
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, idx) => (
              <div
                key={member.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl transition-colors",
                  member.todayCompleted ? "bg-emerald-50" : "bg-gray-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {idx === 0 ? (
                      <Crown className="w-5 h-5 text-yellow-500" />
                    ) : idx === 1 ? (
                      <span className="text-gray-400 font-bold">2</span>
                    ) : idx === 2 ? (
                      <span className="text-gray-400 font-bold">3</span>
                    ) : (
                      <span className="text-gray-400">{idx + 1}</span>
                    )}
                  </div>
                  <img
                    src={member.avatar}
                    alt={member.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-800">
                      {member.username}
                      {member.isCurrentUser && (
                        <span className="ml-2 text-xs text-emerald-600">（我）</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      连续 {member.streak} 天 · {member.totalCheckIns} 次打卡
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  member.todayCompleted
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-gray-100 text-gray-500"
                )}>
                  {member.todayCompleted ? '已打卡' : '待打卡'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isJoined && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">近7天进度</h2>
          <div className="grid grid-cols-7 gap-2">
            {progress.slice(0, 7).reverse().map((day, idx) => (
              <div key={idx} className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  {formatDate(day.date, 'MM/DD')}
                </p>
                <div className="aspect-square rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: day.completedRate >= 80 ? '#10b98120' :
                                    day.completedRate >= 50 ? '#f59e0b20' : '#ef444420',
                    color: day.completedRate >= 80 ? '#10b981' :
                           day.completedRate >= 50 ? '#f59e0b' : '#ef4444'
                  }}
                >
                  {day.completedRate}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetailPage;
