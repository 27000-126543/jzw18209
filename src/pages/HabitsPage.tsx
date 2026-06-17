import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Target, Filter, Grid, List } from 'lucide-react';
import { useHabitStore } from '../store/useHabitStore';
import HabitCard from '../components/HabitCard';
import { cn } from '../lib/utils';

const HabitsPage: React.FC = () => {
  const { habits, todayProgress, statistics, fetchHabits, fetchStatistics } = useHabitStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    fetchHabits();
    fetchStatistics();
  }, [fetchHabits, fetchStatistics]);

  const filteredHabits = habits.filter(habit => {
    const progress = todayProgress.find(p => p.habitId === habit.id);
    if (filter === 'pending') return !progress?.completed;
    if (filter === 'completed') return progress?.completed;
    return true;
  });

  const pendingCount = habits.filter(h => {
    const p = todayProgress.find(p => p.habitId === h.id);
    return !p?.completed;
  }).length;

  const completedCount = habits.filter(h => {
    const p = todayProgress.find(p => p.habitId === h.id);
    return p?.completed;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">我的习惯</h1>
          <p className="text-gray-500 text-sm mt-1">
            共 {habits.length} 个习惯，{pendingCount} 个待完成
          </p>
        </div>
        <Link
          to="/habits/create"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          新建习惯
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                filter === 'all'
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              全部 {habits.length}
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                filter === 'pending'
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              待完成 {pendingCount}
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                filter === 'completed'
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              已完成 {completedCount}
            </button>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'list' ? "bg-white shadow-sm" : "text-gray-500"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white shadow-sm" : "text-gray-500"
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {filteredHabits.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-12 h-12 text-emerald-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            {filter === 'all' ? '还没有任何习惯' :
             filter === 'pending' ? '今日习惯已全部完成！' :
             '还没有完成的习惯'}
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all'
              ? '创建第一个习惯，开启你的习惯养成之旅'
              : filter === 'pending'
              ? '继续保持，明天也要加油哦'
              : '打卡完成后会在这里显示'}
          </p>
          {filter === 'all' && (
            <Link
              to="/habits/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
            >
              <Plus className="w-5 h-5" />
              新建习惯
            </Link>
          )}
        </div>
      ) : (
        <div className={cn(
          "space-y-4",
          viewMode === 'grid' && "grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0"
        )}>
          {filteredHabits.map(habit => {
            const progress = todayProgress.find(p => p.habitId === habit.id);
            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                completed={progress?.completed}
                streak={statistics.streaks?.[habit.id] || 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HabitsPage;
