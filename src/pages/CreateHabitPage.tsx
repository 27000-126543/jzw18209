import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Clock, Target, Calendar } from 'lucide-react';
import { useHabitStore } from '../store/useHabitStore';
import { cn } from '../lib/utils';

const ICONS = ['📚', '🏃', '🧘', '💪', '🎯', '✍️', '🎨', '🎵', '🌅', '💧', '🥗', '😴'];
const COLORS = [
  '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6',
  '#ec4899', '#f97316', '#06b6d4', '#84cc16', '#6366f1'
];

const PRESET_HABITS = [
  { name: '每天读书30分钟', icon: '📚', frequency: 'daily' as const, targetCount: 1 },
  { name: '每周跑步3次', icon: '🏃', frequency: 'weekly' as const, targetCount: 3 },
  { name: '早起打卡', icon: '🌅', frequency: 'daily' as const, targetCount: 1 },
  { name: '每日冥想10分钟', icon: '🧘', frequency: 'daily' as const, targetCount: 1 },
  { name: '健身锻炼', icon: '💪', frequency: 'weekly' as const, targetCount: 3 },
  { name: '每天喝8杯水', icon: '💧', frequency: 'daily' as const, targetCount: 8 },
];

const CreateHabitPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { createHabit, updateHabit, habits } = useHabitStore();
  const existingHabit = id ? habits.find(h => h.id === parseInt(id)) : null;

  const [formData, setFormData] = useState({
    name: existingHabit?.name || '',
    description: existingHabit?.description || '',
    icon: existingHabit?.icon || '🎯',
    color: existingHabit?.color || '#10b981',
    frequency: existingHabit?.frequency || 'daily',
    targetCount: existingHabit?.targetCount || 1,
    reminderTime: existingHabit?.reminderTime || '08:00',
    deadlineTime: existingHabit?.deadlineTime || '22:00',
    isPublic: existingHabit?.isPublic ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id && existingHabit) {
        await updateHabit(parseInt(id), formData);
      } else {
        await createHabit(formData);
      }
      navigate('/habits');
    } catch (err) {
      console.error('创建习惯失败:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回
      </button>

      <div className="bg-white rounded-3xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {id ? '编辑习惯' : '创建新习惯'}
        </h1>
        <p className="text-gray-500 mb-8">
          设定清晰的目标，让坚持更有方向
        </p>

        {!id && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              快速选择模板
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PRESET_HABITS.map((habit, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({ ...formData, ...habit })}
                  className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-emerald-50 rounded-xl transition-colors text-left"
                >
                  <span className="text-2xl">{habit.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{habit.name}</p>
                    <p className="text-xs text-gray-500">
                      {habit.frequency === 'daily' ? '每日' : '每周'} {habit.targetCount}次
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择图标
            </label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={cn(
                    "w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all",
                    formData.icon === icon
                      ? "bg-emerald-100 ring-2 ring-emerald-500 scale-110"
                      : "bg-gray-50 hover:bg-gray-100"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择颜色
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={cn(
                    "w-10 h-10 rounded-xl transition-all",
                    formData.color === color && "ring-4 ring-emerald-500/30 scale-110"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              习惯名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              placeholder="例如：每天读书30分钟"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              习惯描述（可选）
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none"
              rows={3}
              placeholder="为什么要养成这个习惯？"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  打卡频率
                </div>
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'daily' | 'weekly' })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all bg-white"
              >
                <option value="daily">每日</option>
                <option value="weekly">每周</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  目标次数
                </div>
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.targetCount}
                onChange={(e) => setFormData({ ...formData, targetCount: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  提醒时间
                </div>
              </label>
              <input
                type="time"
                value={formData.reminderTime}
                onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  截止时间
                </div>
              </label>
              <input
                type="time"
                value={formData.deadlineTime}
                onChange={(e) => setFormData({ ...formData, deadlineTime: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-800">公开打卡</p>
              <p className="text-sm text-gray-500">开启后打卡内容会展示在发现广场</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                formData.isPublic ? "bg-emerald-500" : "bg-gray-300"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm",
                  formData.isPublic ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {id ? '保存修改' : '创建习惯'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateHabitPage;
