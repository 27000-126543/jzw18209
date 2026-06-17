import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, LogOut, Edit, Target, Users, Bell, Moon, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useHabitStore } from '../store/useHabitStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { badgesApi } from '../api/badges';
import { Badge } from '../../shared/types';
import StatCard from '../components/StatCard';
import HeatmapCalendar from '../components/HeatmapCalendar';
import BadgeWall from '../components/BadgeWall';
import { Flame, Calendar, Award } from 'lucide-react';
import { useState } from 'react';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { statistics, fetchStatistics } = useHabitStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    fetchStatistics();
    fetchUnreadCount();
    loadBadges();
  }, [fetchStatistics, fetchUnreadCount]);

  const loadBadges = async () => {
    try {
      const res = await badgesApi.getUserBadges(0);
      setBadges(res.data);
    } catch (err) {
      console.error('加载徽章失败:', err);
    }
  };

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout();
      navigate('/login');
    }
  };

  const menuItems = [
    { icon: Users, label: '我的关注', path: '/followings' },
    { icon: Bell, label: '消息通知', path: '/messages', badge: unreadCount },
    { icon: Target, label: '我的习惯', path: '/habits' },
    { icon: Award, label: '徽章墙', path: '/badges' },
    { icon: Moon, label: '深色模式', toggle: true },
    { icon: Settings, label: '设置', path: '/settings' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600" />
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16">
            <div className="flex items-end gap-6">
              <img
                src={user?.avatar}
                alt={user?.username}
                className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover"
              />
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-800">{user?.username}</h1>
                <p className="text-gray-500 mt-1">{user?.email}</p>
                {user?.bio && (
                  <p className="text-gray-600 mt-2">{user.bio}</p>
                )}
              </div>
            </div>
            <Link
              to="/profile/edit"
              className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <Edit className="w-4 h-4" />
              编辑资料
            </Link>
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
          icon={<Target className="w-6 h-6" />}
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
          value={badges.filter(b => b.earnedAt).length}
          suffix="个"
          icon={<Award className="w-6 h-6" />}
          color="#f59e0b"
        />
      </div>

      {statistics.heatmapData && (
        <HeatmapCalendar data={statistics.heatmapData} />
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">我的徽章</h2>
        {badges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            还没有获得任何徽章，继续努力！
          </div>
        ) : (
          <BadgeWall badges={badges.slice(0, 6)} />
        )}
        {badges.length > 6 && (
          <Link
            to="/badges"
            className="flex items-center justify-center gap-2 mt-4 text-emerald-600 font-medium text-sm hover:text-emerald-700"
          >
            查看全部徽章
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {menuItems.map((item, idx) => (
          item.path ? (
            <Link
              key={idx}
              to={item.path}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-800">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          ) : (
            <div
              key={idx}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-800">{item.label}</span>
              </div>
              <div className="w-12 h-7 rounded-full bg-gray-200 relative">
                <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          )
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-4 bg-white text-red-600 rounded-2xl hover:bg-red-50 transition-colors shadow-sm"
      >
        <LogOut className="w-5 h-5" />
        退出登录
      </button>
    </div>
  );
};

export default ProfilePage;
