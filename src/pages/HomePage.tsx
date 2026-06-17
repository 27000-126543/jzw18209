import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Target, Calendar, Award, Plus, TrendingUp, Sparkles } from 'lucide-react';
import { useFeedStore } from '../store/useFeedStore';
import { useHabitStore } from '../store/useHabitStore';
import { useAuthStore } from '../store/useAuthStore';
import CheckInCard from '../components/CheckInCard';
import StatCard from '../components/StatCard';
import HeatmapCalendar from '../components/HeatmapCalendar';
import HabitCard from '../components/HabitCard';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const HomePage: React.FC = () => {
  const { feed, loading, fetchFeed } = useFeedStore();
  const { habits, todayProgress, statistics, fetchHabits, fetchStatistics, fetchHeatmapData } = useHabitStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchFeed();
    fetchHabits();
    fetchStatistics();
  }, [fetchFeed, fetchHabits, fetchStatistics]);

  const completedCount = todayProgress.filter(p => p.completed).length;
  const totalCount = habits.length;
  const todayProgressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const pendingHabits = habits.filter(h => {
    const progress = todayProgress.find(p => p.habitId === h.id);
    return !progress?.completed;
  }).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-emerald-100">你好，{user?.username}！</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">
            {todayProgressPercent === 100
              ? '🎉 太棒了！今日任务全部完成'
              : todayProgressPercent > 0
              ? `继续加油，还有 ${totalCount - completedCount} 个习惯待打卡`
              : '今天还没有打卡，开始第一个吧！'
            }
          </h1>
          <p className="text-emerald-100 text-sm">
            坚持每一天，成就更好的自己
          </p>

          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-emerald-100">今日进度</span>
              <span className="text-lg font-bold">{todayProgressPercent}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                style={{ width: `${todayProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="连续打卡"
          value={statistics.currentStreak || 0}
          suffix="天"
          icon={<Flame className="w-6 h-6" />}
          color="#f97316"
        />
        <StatCard
          title="本月完成率"
          value={statistics.monthlyRate || 0}
          suffix="%"
          icon={<TrendingUp className="w-6 h-6" />}
          color="#8b5cf6"
        />
        <StatCard
          title="历史总打卡"
          value={statistics.totalCheckIns || 0}
          suffix="次"
          icon={<Calendar className="w-6 h-6" />}
          color="#3b82f6"
        />
        <StatCard
          title="获得徽章"
          value={statistics.badgesCount || 0}
          suffix="个"
          icon={<Award className="w-6 h-6" />}
          color="#f59e0b"
        />
      </div>

      {pendingHabits.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-500" />
              待打卡习惯
            </h2>
            <Link
              to="/habits/create"
              className="flex items-center gap-1 text-sm text-emerald-600 font-medium hover:text-emerald-700"
            >
              <Plus className="w-4 h-4" />
              新建习惯
            </Link>
          </div>
          <div className="space-y-3">
            {pendingHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                streak={statistics.streaks?.[habit.id] || 0}
              />
            ))}
          </div>
        </div>
      )}

      <HeatmapCalendar data={statistics.heatmapData || []} />

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          好友动态
        </h2>

        {loading && feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p>加载中...</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">还没有动态</h3>
            <p className="text-gray-500 mb-6">关注更多好友或创建第一个打卡来查看动态</p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/explore"
                className="px-6 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors"
              >
                去发现
              </Link>
              <Link
                to="/habits/create"
                className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                新建习惯
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {feed.map(item => (
              <CheckInCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
