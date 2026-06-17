import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Compass, Flame, Users, Sparkles, TrendingUp, Search, RotateCcw, Filter, PlusCircle, ChevronDown } from 'lucide-react';
import { useFeedStore } from '../store/useFeedStore';
import { habitsApi } from '../api';
import CheckInCard from '../components/CheckInCard';
import UserCard from '../components/UserCard';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { CheckInFeed } from '../../shared/types';
import { useNavigate } from 'react-router-dom';

type TabType = 'recommend' | 'hot' | 'users';

interface HabitType {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface CheckInCardWithTagProps {
  item: CheckInFeed;
  tag: '最新' | '热门';
}

const CheckInCardWithTag: React.FC<CheckInCardWithTagProps> = ({ item, tag }) => {
  return (
    <div className="relative">
      <div className={cn(
        "absolute -top-2 -right-2 z-10 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-md",
        tag === '最新' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-orange-500 to-red-500'
      )}>
        {tag}
      </div>
      <CheckInCard item={item} />
    </div>
  );
};

const ExplorePage: React.FC = () => {
  const { publicFeed, exploreUsers, loading, fetchPublicFeed, fetchExploreUsers } = useFeedStore();
  const [tab, setTab] = useState<TabType>('recommend');
  const [habitTypes, setHabitTypes] = useState<HabitType[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<number | undefined>();
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [showHabitDropdown, setShowHabitDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    habitsApi.getPublicTypes().then(setHabitTypes).catch(console.error);
  }, []);

  useEffect(() => {
    if (tab === 'users') {
      fetchExploreUsers();
    } else {
      fetchPublicFeed(tab === 'hot', selectedHabitId, debouncedKeyword);
    }
  }, [tab, selectedHabitId, debouncedKeyword, fetchPublicFeed, fetchExploreUsers]);

  const handleReset = useCallback(() => {
    setSelectedHabitId(undefined);
    setKeyword('');
    setDebouncedKeyword('');
  }, []);

  const selectedHabit = useMemo(() => {
    return habitTypes.find(h => h.id === selectedHabitId);
  }, [habitTypes, selectedHabitId]);

  const hasFilters = selectedHabitId !== undefined || debouncedKeyword !== '';

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

      {tab !== 'users' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium">筛选条件</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <button
                onClick={() => setShowHabitDropdown(!showHabitDropdown)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all",
                  selectedHabit
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                )}
              >
                <span className="flex items-center gap-2">
                  {selectedHabit && (
                    <span className="text-lg">{selectedHabit.icon}</span>
                  )}
                  <span>{selectedHabit ? selectedHabit.name : '选择习惯类型'}</span>
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", showHabitDropdown && "rotate-180")} />
              </button>
              {showHabitDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedHabitId(undefined);
                      setShowHabitDropdown(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2",
                      !selectedHabitId && "text-emerald-600 bg-emerald-50"
                    )}
                  >
                    <span className="text-lg">🎯</span>
                    <span>全部习惯</span>
                  </button>
                  {habitTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedHabitId(type.id);
                        setShowHabitDropdown(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2",
                        selectedHabitId === type.id && "text-emerald-600 bg-emerald-50"
                      )}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span>{type.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索打卡内容或习惯名称..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>

            <button
              onClick={handleReset}
              disabled={!hasFilters}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all",
                hasFilters
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
              )}
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          </div>
          {hasFilters && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">当前筛选：</span>
              {selectedHabit && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: selectedHabit.color }}
                >
                  {selectedHabit.icon} {selectedHabit.name}
                </span>
              )}
              {debouncedKeyword && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  关键词: {debouncedKeyword}
                </span>
              )}
            </div>
          )}
        </div>
      )}

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
                <UserCard key={user.id} user={user as any} />
              ))}
            </div>
          )}
        </div>
      ) : publicFeed.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Compass className="w-12 h-12 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {hasFilters ? '没有找到匹配的内容' : '暂无公开打卡内容'}
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {hasFilters
              ? '试试调整筛选条件，或者看看其他精彩内容'
              : '成为第一个分享打卡的人吧，让更多人看到你的坚持！'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {hasFilters && (
              <>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  查看全部
                </button>
                <button
                  onClick={() => setTab(tab === 'recommend' ? 'hot' : 'recommend')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  换个筛选条件试试
                </button>
              </>
            )}
            <button
              onClick={() => navigate('/habits')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              创建第一个打卡
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {publicFeed.map(item => (
            <CheckInCardWithTag
              key={item.id}
              item={item}
              tag={tab === 'hot' ? '热门' : '最新'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
