import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, Flame, Calendar, Award, BarChart3, Target, XCircle, Activity } from 'lucide-react';
import { useHabitStore } from '../store/useHabitStore';
import HeatmapCalendar from '../components/HeatmapCalendar';
import StatCard from '../components/StatCard';
import { formatDate, formatTime } from '../utils/date';
import { cn } from '../lib/utils';

const HabitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { habits, currentHabit, recentCheckIns, trendData, fetchHabitDetail, deleteHabit, fetchCheckIns, fetchTrend } = useHabitStore();

  useEffect(() => {
    if (id) {
      fetchHabitDetail(parseInt(id));
      fetchCheckIns(parseInt(id));
      fetchTrend(parseInt(id));
    }
  }, [id, fetchHabitDetail, fetchCheckIns, fetchTrend]);

  const habit = habits.find(h => h.id === parseInt(id || '')) || currentHabit;
  const habitStats = currentHabit ? {
    currentStreak: currentHabit.currentStreak,
    longestStreak: currentHabit.longestStreak,
    monthlyRate: currentHabit.monthlyCompletionRate,
    totalCount: currentHabit.totalCheckIns,
    heatmapData: currentHabit.heatmapData,
  } : null;
  const displayCheckIns = currentHabit?.checkInHistory || recentCheckIns;

  if (!habit) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">习惯不存在</p>
        <button
          onClick={() => navigate('/habits')}
          className="mt-4 text-emerald-600 hover:text-emerald-700"
        >
          返回列表
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm('确定要删除这个习惯吗？所有打卡记录也会被删除。')) {
      await deleteHabit(parseInt(id || ''));
      navigate('/habits');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>
        <div className="flex items-center gap-2">
          <Link
            to={`/habits/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Edit className="w-4 h-4" />
            编辑
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
        </div>
      </div>

      <div
        className="rounded-3xl p-8 text-white relative overflow-hidden"
        style={{ backgroundColor: habit.color }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl">
                {habit.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{habit.name}</h1>
                {habit.description && (
                  <p className="text-white/80 mt-2">{habit.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-white/70">
                  <span>{habit.frequency === 'daily' ? '每日' : '每周'} {habit.targetCount}次</span>
                  <span>·</span>
                  <span>提醒 {habit.reminderTime}</span>
                  <span>·</span>
                  <span>截止 {habit.deadlineTime}</span>
                </div>
              </div>
            </div>
            <Link
              to={`/habits/${id}/checkin`}
              className="px-6 py-3 bg-white text-emerald-600 font-medium rounded-xl hover:bg-white/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              打卡
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="当前连续"
          value={habitStats?.currentStreak || 0}
          suffix="天"
          icon={<Flame className="w-6 h-6" />}
          color="#f97316"
        />
        <StatCard
          title="最长连续"
          value={habitStats?.longestStreak || 0}
          suffix="天"
          icon={<Award className="w-6 h-6" />}
          color="#8b5cf6"
        />
        <StatCard
          title="本月完成率"
          value={habitStats?.monthlyRate || 0}
          suffix="%"
          icon={<BarChart3 className="w-6 h-6" />}
          color="#3b82f6"
        />
        <StatCard
          title="总打卡次数"
          value={habitStats?.totalCount || 0}
          suffix="次"
          icon={<Calendar className="w-6 h-6" />}
          color="#10b981"
        />
      </div>

      {habitStats?.heatmapData && (
        <HeatmapCalendar data={habitStats.heatmapData} color={habit.color} />
      )}

      {trendData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="30天总打卡"
              value={trendData.totalCheckIns}
              suffix="次"
              icon={<Activity className="w-6 h-6" />}
              color="#3b82f6"
            />
            <StatCard
              title="目标达成天数"
              value={trendData.achievedDays}
              suffix="天"
              icon={<Target className="w-6 h-6" />}
              color="#10b981"
            />
            <StatCard
              title="漏打天数"
              value={trendData.missedDays}
              suffix="天"
              icon={<XCircle className="w-6 h-6" />}
              color="#ef4444"
            />
            <StatCard
              title="日均次数"
              value={trendData.averagePerDay}
              suffix="次"
              icon={<BarChart3 className="w-6 h-6" />}
              color="#8b5cf6"
            />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">近30天趋势</h2>
            <div className="relative h-48 flex items-end gap-1">
              {trendData.dailyData.map((day, index) => {
                const maxCount = Math.max(...trendData.dailyData.map(d => d.count), 1);
                const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                const isSelected = selectedDate === day.date;
                const isToday = day.date === new Date().toISOString().split('T')[0];
                
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center cursor-pointer group"
                    onClick={() => setSelectedDate(isSelected ? null : day.date)}
                  >
                    <div className="w-full flex flex-col items-center justify-end h-40">
                      <div
                        className={cn(
                          "w-full rounded-t-md transition-all duration-200",
                          day.targetMet ? "bg-emerald-500" : "bg-gray-300",
                          isSelected && "ring-2 ring-offset-2 ring-emerald-500",
                          "hover:opacity-80"
                        )}
                        style={{
                          height: `${Math.max(heightPercent, 4)}%`,
                          minHeight: day.count > 0 ? '8px' : '2px'
                        }}
                        title={`${day.date}: ${day.count}次${day.targetMet ? ' (达标)' : ''}`}
                      />
                    </div>
                    {(index % 5 === 0 || isToday) && (
                      <span className="text-xs text-gray-400 mt-1">
                        {isToday ? '今天' : day.date.slice(5)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-sm text-gray-500">达标</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-300" />
                <span className="text-sm text-gray-500">未达标</span>
              </div>
            </div>
          </div>

          {selectedDate && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  {formatDate(selectedDate)} 打卡记录
                </h2>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              {(() => {
                const dayCheckIns = displayCheckIns.filter(
                  c => formatDate(c.createdAt) === selectedDate
                );
                if (dayCheckIns.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      当天没有打卡记录
                    </div>
                  );
                }
                return (
                  <div className="space-y-4">
                    {dayCheckIns.map(checkIn => (
                      <div
                        key={checkIn.id}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: habit.color }}
                        >
                          {habit.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800">
                              {formatTime(checkIn.createdAt)}
                            </span>
                            {checkIn.mood && (
                              <span className="text-lg">
                                {['😢', '😕', '😐', '😊', '🤩'][checkIn.mood - 1]}
                              </span>
                            )}
                          </div>
                          {checkIn.content && (
                            <p className="text-sm text-gray-600">{checkIn.content}</p>
                          )}
                          {checkIn.photos && checkIn.photos.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {checkIn.photos.slice(0, 3).map((photo, idx) => (
                                <img
                                  key={idx}
                                  src={photo}
                                  alt=""
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">最近打卡记录</h2>
        {displayCheckIns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            还没有打卡记录，来完成第一次打卡吧！
          </div>
        ) : (
          <div className="space-y-4">
            {displayCheckIns.slice(0, 10).map(checkIn => (
              <div
                key={checkIn.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: habit.color }}
                >
                  {habit.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">
                      {formatDate(checkIn.createdAt)}
                    </span>
                    {checkIn.mood && (
                      <span className="text-lg">
                        {['😢', '😕', '😐', '😊', '🤩'][checkIn.mood - 1]}
                      </span>
                    )}
                  </div>
                  {checkIn.content && (
                    <p className="text-sm text-gray-600 line-clamp-2">{checkIn.content}</p>
                  )}
                  {checkIn.photos && checkIn.photos.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {checkIn.photos.slice(0, 3).map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitDetailPage;
