import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Trophy, Target, Flame, ChevronRight } from 'lucide-react';
import { teamsApi } from '../api';
import { Team } from '../../shared/types';
import { Loader2 } from 'lucide-react';
import { formatDate } from '../utils/date';
import { cn } from '../lib/utils';

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'joined' | 'all'>('joined');

  useEffect(() => {
    loadTeams();
  }, [tab]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      if (tab === 'all') {
        const data = await teamsApi.recommended(20);
        setTeams(data);
      } else {
        const data = await teamsApi.getTeams(false);
        setTeams(data);
      }
    } catch (err) {
      console.error('加载队伍列表失败:', err);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">队伍挑战</h1>
          <p className="text-gray-500 text-sm mt-1">加入队伍，一起坚持更有动力</p>
        </div>
        <Link
          to="/teams/create"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          创建队伍
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-1.5 shadow-sm">
        <div className="flex">
          <button
            onClick={() => setTab('joined')}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
              tab === 'joined'
                ? "bg-emerald-500 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            我加入的
          </button>
          <button
            onClick={() => setTab('all')}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
              tab === 'all'
                ? "bg-emerald-500 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            全部队伍
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p>加载中...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            {tab === 'joined' ? '还没有加入任何队伍' : '暂无公开队伍'}
          </h3>
          <p className="text-gray-500 mb-6">
            {tab === 'joined'
              ? '创建或加入一个队伍，和小伙伴们一起坚持'
              : '创建第一个公开队伍，邀请更多人加入'}
          </p>
          <Link
            to="/teams/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            创建队伍
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => {
            const t = team as any;
            return (
              <Link
                key={team.id}
                to={`/teams/${team.id}`}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white"
                      style={{ backgroundColor: t.color || '#10b981' }}
                    >
                      {t.icon || '🎯'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        创建于 {formatDate(team.createdAt)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                </div>

                {team.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {t.membersCount || t.totalMembers || 0} 人
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {t.targetCount || 30} 天挑战
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <Flame className="w-4 h-4" />
                    {t.currentStreak || 0} 天
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
