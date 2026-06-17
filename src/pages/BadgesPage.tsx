import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Lock } from 'lucide-react';
import { badgesApi } from '../api';
import { Badge } from '../../shared/types';
import BadgeWall from '../components/BadgeWall';
import { Loader2 } from 'lucide-react';

const BadgesPage: React.FC = () => {
  const navigate = useNavigate();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const data = await badgesApi.getUserBadges();
      setBadges(data);
    } catch (err) {
      console.error('加载徽章失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const earnedBadges = badges.filter(b => b.earnedAt);
  const lockedBadges = badges.filter(b => !b.earnedAt);
  const progress = badges.length > 0 ? Math.round((earnedBadges.length / badges.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回
      </button>

      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8" />
            <h1 className="text-2xl font-bold">我的徽章</h1>
          </div>
          <p className="text-white/80 mb-6">
            每一份坚持都值得被记录，每一个里程碑都值得被庆祝
          </p>
          
          <div className="flex items-center gap-6">
            <div>
              <p className="text-white/70 text-sm">已获得</p>
              <p className="text-3xl font-bold">{earnedBadges.length}/{badges.length}</p>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-white/70 text-xs mt-1">{progress}% 收集进度</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p>加载中...</p>
        </div>
      ) : (
        <>
          {earnedBadges.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                已获得 ({earnedBadges.length})
              </h2>
              <BadgeWall badges={earnedBadges} />
            </div>
          )}

          {lockedBadges.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-400" />
                待解锁 ({lockedBadges.length})
              </h2>
              <BadgeWall badges={lockedBadges} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BadgesPage;
