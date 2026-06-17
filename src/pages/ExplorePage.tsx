import React, { useEffect, useState } from 'react';
import { Compass, Flame, Users, Sparkles, TrendingUp } from 'lucide-react';
import { useFeedStore } from '../store/useFeedStore';
import CheckInCard from '../components/CheckInCard';
import UserCard from '../components/UserCard';
import { Loader2 } from 'lucide-react';

type TabType = 'recommend' | 'hot' | 'users';

const ExplorePage: React.FC = () => {
  const { publicFeed, exploreUsers, loading, fetchPublicFeed, fetchExploreUsers } = useFeedStore();
  const [tab, setTab] = useState<TabType>('recommend');

  useEffect(() => {
    if (tab === 'users') {
      fetchExploreUsers();
    } else {
      fetchPublicFeed(tab === 'hot');
    }
  }, [tab, fetchPublicFeed, fetchExploreUsers]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Compass className="w-6 h-6" />
            <h1 className="text-2xl font-bold">发现广场</h1>
          </div>
          <p className="text-white/80">
            发现更多优质打卡内容，找到志同道合的伙伴
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-1.5 shadow-sm">
        <div className="flex">
          {[
            { key: 'recommend', label: '推荐', icon: Sparkles },
            { key: 'hot', label: '热门', icon: TrendingUp },
            { key: 'users', label: '活跃用户', icon: Users }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as TabType)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all",
                tab === item.key
                  ? "bg-emerald-500 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p>加载中...</p>
        </div>
      ) : tab === 'users' ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            活跃用户
          </h2>
          {exploreUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无活跃用户
            </div>
          ) : (
            <div className="space-y-3">
              {exploreUsers.map(user => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {publicFeed.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Compass className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                暂无公开打卡内容
              </h3>
              <p className="text-gray-500">
                成为第一个分享打卡的人吧！
              </p>
            </div>
          ) : (
            publicFeed.map(item => (
              <CheckInCard key={item.id} item={item} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
