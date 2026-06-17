import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Target, Calendar, Award, Plus, LogOut, Crown, Medal, X, Flame, CheckCircle2 } from 'lucide-react';
import { teamsApi } from '../api';
import { TeamDetail, TeamProgress, TeamContribution, ContributionPeriod, CheckIn, TeamExtended } from '../../shared/types';
import { Loader2 } from 'lucide-react';
import { formatDate, formatRelativeTime } from '../utils/date';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/useAuthStore';
import { useTeamStore } from '../store/useTeamStore';

const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [progress, setProgress] = useState<TeamProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [period, setPeriod] = useState<ContributionPeriod>('today');

  const {
    contributions,
    memberCheckIns,
    contributionsLoading,
    checkInsLoading,
    showCheckInModal,
    selectedMemberId,
    fetchContributions,
    fetchMemberCheckIns,
    setShowCheckInModal,
  } = useTeamStore();

  const loadTeamData = useCallback(async (teamId: number) => {
    setLoading(true);
    try {
      const [teamRes, progressRes] = await Promise.all([
        teamsApi.getTeamById(teamId),
        teamsApi.getTeamProgress(teamId)
      ]);

      const membersWithExtra = teamRes.members.map((m, idx) => ({
        ...m,
        id: m.id || idx,
        userId: m.userId || idx,
        teamId,
        username: m.username || '',
        avatar: m.avatar || '',
        joinedAt: m.joinedAt || teamRes.createdAt,
        todayCompleted: m.todayCompleted || false,
        isCurrentUser: user ? m.userId === user.id : false,
        streak: 0,
        totalCheckIns: 0
      }));

      setTeam(teamRes);
      setProgress(progressRes);
      setIsJoined(membersWithExtra.some(m => m.isCurrentUser));
    } catch (err) {
      console.error('加载队伍信息失败:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (id) {
      loadTeamData(parseInt(id));
    }
  }, [id, loadTeamData]);

  useEffect(() => {
    if (id) {
      fetchContributions(parseInt(id), period);
    }
  }, [id, period, fetchContributions]);

  const handlePeriodChange = (newPeriod: ContributionPeriod) => {
    setPeriod(newPeriod);
  };

  const handleMemberClick = (contribution: TeamContribution) => {
    if (id) {
      fetchMemberCheckIns(parseInt(id), contribution.userId);
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-gray-400 font-bold">{rank + 1}</span>;
    }
  };

  const getSelectedMemberInfo = () => {
    return contributions.find(c => c.userId === selectedMemberId);
  };

  if (loading || !team) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>加载中...</p>
      </div>
    );
  }
  
  const completedCount = team.members.filter(m => {
    if (team.habitId) {
      return m.todayCompleted;
    }
    return m.todayCompleted;
  }).length;
  
  const completionRate = team.members.length > 0 ? Math.round((completedCount / team.members.length) * 100) : 0;

  const teamExtended = team as TeamDetail & Partial<TeamExtended>;

  const periodTabs: { key: ContributionPeriod; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '本周' },
    { key: 'month', label: '本月' },
  ];

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
        style={{ backgroundColor: teamExtended.color || '#10b981' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl">
                {teamExtended.icon || '🎯'}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{team.name}</h1>
                {team.description && (
                  <p className="text-white/80 mt-2">{team.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-white/70">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {team.members.length} 名成员
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {teamExtended.targetCount || 30} 天挑战
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
                {completedCount}/{team.members.length}
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
                {teamExtended.currentStreak || 0} 天
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
                {teamExtended.totalCheckIns || 0} 次
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">成员排行榜</h2>
          <div className="flex bg-gray-100 rounded-xl p-1">
            {periodTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handlePeriodChange(tab.key)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                  period === tab.key
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {contributionsLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-sm">加载中...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(contributions || []).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无成员数据
            </div>
          ) : (
            (contributions || []).map((contribution, idx) => {
              const avatar = contribution.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
              const username = contribution.username || '匿名用户';
              const checkInCount = contribution.checkInCount ?? 0;
              const streak = contribution.streak ?? 0;
              const achievedDays = contribution.achievedDays ?? 0;
              const isCurrentUser = contribution.userId === user?.id;
              
              return (
                <div
                  key={contribution.userId}
                  onClick={() => handleMemberClick(contribution)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer",
                    "hover:shadow-md hover:scale-[1.01]",
                    idx < 3 ? "bg-gradient-to-r from-amber-50 to-orange-50" : "bg-gray-50 hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {getRankIcon(idx)}
                    </div>
                    <img
                      src={avatar}
                      alt={username}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                    <div>
                      <p className="font-medium text-gray-800">
                        {username}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-emerald-600">（我）</span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {checkInCount} 次打卡
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-orange-500" />
                          连续 {streak} 天
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          达标 {achievedDays} 天
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">
                      {checkInCount}
                    </p>
                    <p className="text-xs text-gray-400">次</p>
                  </div>
                </div>
              );
            })
          )}
          </div>
        )}
      </div>

      {isJoined && progress.length > 0 && (
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

      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {(() => {
                  const memberInfo = getSelectedMemberInfo();
                  if (!memberInfo) {
                    return (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                        <div>
                          <h3 className="font-bold text-gray-800">加载中...</h3>
                          <p className="text-xs text-gray-500">队伍绑定习惯的打卡记录</p>
                        </div>
                      </div>
                    );
                  }
                  const avatar = memberInfo.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
                  const username = memberInfo.username || '匿名用户';
                  return (
                    <>
                      <img
                        src={avatar}
                        alt={username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-gray-800">
                          {username} 的打卡记录
                        </h3>
                        <p className="text-xs text-gray-500">
                          队伍绑定习惯的打卡记录
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {checkInsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p>加载中...</p>
                </div>
              ) : memberCheckIns.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无打卡记录</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {memberCheckIns.map((checkIn) => (
                    <CheckInItem key={checkIn.id} checkIn={checkIn} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckInItem: React.FC<{ checkIn: CheckIn }> = ({ checkIn }) => {
  const moodEmojis = ['😢', '😕', '😐', '😊', '🤩'];

  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">
          {formatRelativeTime(checkIn.createdAt)}
        </span>
        {checkIn.mood && (
          <span className="text-xl">{moodEmojis[checkIn.mood - 1]}</span>
        )}
      </div>
      {checkIn.content && (
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
          {checkIn.content}
        </p>
      )}
      {checkIn.photos && checkIn.photos.length > 0 && (
        <div className={cn(
          "mt-3 grid gap-2",
          checkIn.photos.length === 1 ? "grid-cols-1" : checkIn.photos.length === 2 ? "grid-cols-2" : "grid-cols-3"
        )}>
          {checkIn.photos.map((photo, idx) => (
            <img
              key={idx}
              src={photo}
              alt=""
              className="w-full aspect-square object-cover rounded-xl"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamDetailPage;
