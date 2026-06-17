import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Camera, Image, Send, Smile, X } from 'lucide-react';
import { useHabitStore } from '../store/useHabitStore';
import { cn } from '../lib/utils';
import { formatDate } from '../utils/date';

const CheckInPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { habits, checkIn } = useHabitStore();
  const habit = habits.find(h => h.id === parseInt(id || ''));

  const [content, setContent] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moods = [
    { value: 1, emoji: '😢', label: '很差' },
    { value: 2, emoji: '😕', label: '一般' },
    { value: 3, emoji: '😐', label: '还行' },
    { value: 4, emoji: '😊', label: '不错' },
    { value: 5, emoji: '🤩', label: '很棒' },
  ];

  const handleAddPhoto = () => {
    const fakePhotos = [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop',
    ];
    const randomPhoto = fakePhotos[Math.floor(Math.random() * fakePhotos.length)];
    if (photos.length < 9) {
      setPhotos([...photos, randomPhoto]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await checkIn(parseInt(id), {
        content: content.trim() || undefined,
        mood: mood || undefined,
        photos: photos.length > 0 ? photos : undefined
      });
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/habits');
      }, 1500);
    } catch (err: any) {
      console.error('打卡失败:', err);
      const errorMessage = err.response?.data?.message || err.message || '打卡失败';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!habit) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">习惯不存在</p>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <span className="text-5xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">打卡成功！</h2>
        <p className="text-gray-500">继续保持，你离目标更近了一步</p>
        <div className="mt-4 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-sm">
          {formatDate(new Date())} · {habit.name}
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white"
            style={{ backgroundColor: habit.color }}
          >
            {habit.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{habit.name}</h1>
            <p className="text-gray-500 text-sm">{formatDate(new Date())} 打卡</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-800 mb-2">{error}</p>
                <div className="text-sm text-red-600 space-y-1">
                  <p>当前时间：{new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p>截止时间：{habit.deadlineTime || '23:59'}</p>
                </div>
                <p className="text-sm text-red-500 mt-2">别灰心，明天继续加油！💪</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              今天的心情怎么样？
            </label>
            <div className="flex justify-between max-w-md">
              {moods.map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMood(item.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                    mood === item.value
                      ? "bg-emerald-50 ring-2 ring-emerald-500 scale-110"
                      : "hover:bg-gray-50"
                  )}
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <span className="text-xs text-gray-500">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              记录一下今天的收获（可选）
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none"
              rows={4}
              placeholder="今天完成得怎么样？有什么心得想要记录下来吗？"
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {content.length}/500
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              添加照片（最多9张，可选）
            </label>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-square">
                  <img
                    src={photo}
                    alt=""
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < 9 && (
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs">添加照片</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-800">公开打卡</p>
              <p className="text-sm text-gray-500">开启后会展示在动态中</p>
            </div>
            <div className="w-12 h-7 rounded-full bg-emerald-500 relative">
              <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full shadow-sm" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-4 rounded-xl font-medium text-white transition-all duration-300 flex items-center justify-center gap-2",
              isSubmitting
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30"
            )}
          >
            <Send className="w-5 h-5" />
            {isSubmitting ? '打卡中...' : '完成打卡'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CheckInPage;
