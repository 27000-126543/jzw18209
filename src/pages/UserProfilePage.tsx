import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserCheck, Users, Target, Flame, Calendar, Award } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { usersApi, badgesApi, checkInsApi } from '../api';
import { CheckInFeed, Badge, UserProfile, UserStatistics } from '../../shared/types';
import CheckInCard from '../components/CheckInCard';
import HeatmapCalendar from '../components/HeatmapCalendar';
import StatCard from '../components/StatCard';
import BadgeWall from '../components/BadgeWall';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userCheckIns, setUserCheckIns] = useState<CheckInFeed[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checkins' | 'badges'>('checkins');

  useEffect(() => {
    if (id) {
      loadUserProfile(parseInt(id));
    }
  }, [id]);

  const loadUserProfile = async (userId: number) => {
    setLoading(true);
    try {
      const [profile, userBadges] = await Promise.all([
        usersApi.profile(userId),
        badgesApi.getUserBadges(userId)
      ]);
      
      setUserProfile(profile);
      setIsFollowing((profile as any).isFollowing || false);
      setBadges(userBadges);
      
      setUserStats({
        user: profile,
        currentStreak: (profile as any).currentStreak || 0,
        longestStreak: (profile as any).longestStreak || 0,
        totalCheckIns: (profile as any).totalCheckIns || 0,
        followersCount: profile.followersCount || 0,
        followingCount: profile.followingCount || 0,
        heatmapData: (profile as any).heatmapData || []
      });
      
      setUserCheckIns((profile as any).recentCheckIns || []);
    } catch (err) {
      console.error('加载用户信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!id) return;
    try {
      await usersApi.follow(parseInt(id));
      setIsFollowing(true);
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          followersCount: (userProfile.followersCount || 0) + 1
        });
      }
    } catch (err) {
      console.error('关注失败:', err);
    }
  };

  const handleUnfollow = async () => {
    if (!id) return;
    try {
      await usersApi.unfollow(parseInt(id));
      setIsFollowing(false);
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          followersCount: Math.max(0, (userProfile.followersCount || 1) - 1)
        });
      }
    } catch (err) {
      console.error('取消关注失败:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>加载中...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">用户不存在</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-emerald-600 hover:underline"
        >
          返回
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === parseInt(id || '');

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回
      </button>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600" />
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16">
            <div className="flex items-end gap-6">
              <img
                src={userProfile.avatar}
                alt={userProfile.username}
                className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover"
              />
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-800">
                  {userProfile.username}
                </h1>
                {userProfile.bio && (
                  <p className="text-gray-500 mt-1">{userProfile.bio}</p>
                )}
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              {!isOwnProfile && (
                <button
                  onClick={isFollowing ? handleUnfollow : handleFollow}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all",
                    isFollowing
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30"
                  )}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      已关注
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      关注
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-8 mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">
                关注 <span className="font-semibold text-gray-800">{userProfile.followingCount || 0}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">
                粉丝 <span className="font-semibold text-gray-800">{userProfile.followersCount || 0}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="连续打卡"
          value={userStats?.currentStreak || 0}
          suffix="天"
          icon={<Flame className="w-6 h-6" />}
          color="#f97316"
        />
        <StatCard
          title="最长连续"
          value={userStats?.longestStreak || 0}
          suffix="天"
          icon={<Award className="w-6 h-6" />}
          color="#8b5cf6"
        />
        <StatCard
          title="总打卡次数"
          value={userStats?.totalCheckIns || 0}
          suffix="次"
          icon={<Calendar className="w-6 h-6" />}
          color="#3b82f6"
        />
        <StatCard
          title="获得徽章"
          value={badges.filter(b => b.earnedAt).length}
          suffix="个"
          icon={<Target className="w-6 h-6" />}
          color="#f59e0b"
        />
      </div>

      {userStats?.heatmapData && userStats.heatmapData.length > 0 && (
        <HeatmapCalendar data={userStats.heatmapData} />
      )}

      <div className="bg-white rounded-2xl p-1.5 shadow-sm">
        <div className="flex">
          <button
            onClick={() => setActiveTab('checkins')}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === 'checkins'
                ? "bg-emerald-500 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            打卡记录
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === 'badges'
                ? "bg-emerald-500 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            徽章墙
          </button>
        </div>
      </div>

      {activeTab === 'checkins' ? (
        <div className="space-y-4">
          {userCheckIns.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {isOwnProfile ? '还没有打卡记录' : 'TA 还没有打卡记录'}
              </h3>
              <p className="text-gray-500">
                {isOwnProfile ? '创建第一个习惯开始打卡吧' : '等待 TA 的第一次打卡'}
              </p>
            </div>
          ) : (
            userCheckIns.map(item => (
              <CheckInCard key={item.id} item={item} />
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">获得的徽章</h2>
          {badges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              还没有获得任何徽章
            </div>
          ) : (
            <BadgeWall badges={badges} />
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
