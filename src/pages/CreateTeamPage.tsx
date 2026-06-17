import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, Target, Calendar, Loader2, Check } from 'lucide-react';
import { teamsApi, habitsApi } from '../api';
import { cn } from '../lib/utils';
import { formatDate } from '../utils/date';

const CreateTeamPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [habits, setHabits] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetHabitId: null as number | null,
    startDate: formatDate(new Date().toISOString(), 'YYYY-MM-DD'),
    endDate: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), 'YYYY-MM-DD'),
    maxMembers: 10
  });

  React.useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const res = await habitsApi.list();
      setHabits(res.habits || []);
    } catch (err) {
      console.error('加载习惯列表失败:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('请输入队伍名称');
      return;
    }

    setLoading(true);
    try {
      const res = await teamsApi.create({
        name: formData.name,
        description: formData.description,
        targetHabitId: formData.targetHabitId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        maxMembers: formData.maxMembers
      });
      navigate(`/teams/${res.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || '创建队伍失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const colors = ['#10b981', '#8b5cf6', '#f97316', '#3b82f6', '#ec4899', '#f59e0b', '#ef4444', '#14b8a6'];
  const icons = ['🎯', '🔥', '💪', '🏃', '📚', '🧘', '💤', '🥗'];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回
      </button>

      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8" />
            <h1 className="text-2xl font-bold">创建新队伍</h1>
          </div>
          <p className="text-white/80">
            创建队伍，邀请好友一起坚持习惯
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            队伍名称 *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例如：30天早起挑战"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            maxLength={30}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            队伍描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="描述一下队伍的目标和规则..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            绑定习惯（可选）
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, targetHabitId: null })}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                formData.targetHabitId === null
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">不绑定</span>
                {formData.targetHabitId === null && <Check className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-xs text-gray-500 mt-1">自由打卡模式</p>
            </button>
            {habits.map(habit => (
              <button
                key={habit.id}
                type="button"
                onClick={() => setFormData({ ...formData, targetHabitId: habit.id })}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  formData.targetHabitId === habit.id
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{habit.icon}</span>
                    <span className="font-medium text-gray-800 truncate">{habit.name}</span>
                  </div>
                  {formData.targetHabitId === habit.id && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {habit.frequency === 'daily' ? '每日' : '每周'} · {habit.targetCount}次
                </p>
              </button>
            ))}
          </div>
          {habits.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              还没有习惯？<Link to="/habits/create" className="text-emerald-600 hover:underline">先去创建一个</Link>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              开始日期
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              结束日期
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            最大成员数：{formData.maxMembers} 人
          </label>
          <input
            type="range"
            min={2}
            max={100}
            value={formData.maxMembers}
            onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                创建队伍
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTeamPage;
