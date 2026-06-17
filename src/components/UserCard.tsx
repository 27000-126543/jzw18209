import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, UserCheck } from 'lucide-react';
import { User } from '../../shared/types';
import { cn } from '../lib/utils';

interface UserCardProps {
  user: User & {
    isFollowing?: boolean;
    currentStreak?: number;
    totalCheckIns?: number;
  };
  onFollow?: () => void;
  onUnfollow?: () => void;
  showFollowButton?: boolean;
  size?: 'sm' | 'md';
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onFollow,
  onUnfollow,
  showFollowButton = true,
  size = 'md'
}) => {
  const handleClick = () => {
    if (user.isFollowing) {
      onUnfollow?.();
    } else {
      onFollow?.();
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-xl hover:bg-gray-50 transition-colors">
      <Link to={`/users/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <img
          src={user.avatar}
          alt={user.username}
          className={cn(
            "rounded-full object-cover ring-2 ring-transparent hover:ring-emerald-200 transition-all",
            size === 'sm' ? 'w-10 h-10' : 'w-12 h-12'
          )}
        />
        <div className="min-w-0 flex-1">
          <p className={cn(
            "font-medium text-gray-800 truncate",
            size === 'sm' ? 'text-sm' : 'text-base'
          )}>
            {user.username}
          </p>
          {(user.currentStreak !== undefined || user.totalCheckIns !== undefined) && (
            <p className="text-xs text-gray-500">
              {user.currentStreak && <span>🔥 {user.currentStreak}天</span>}
              {user.currentStreak && user.totalCheckIns && <span className="mx-1">·</span>}
              {user.totalCheckIns !== undefined && <span>📝 {user.totalCheckIns}次打卡</span>}
            </p>
          )}
          {size === 'md' && user.bio && (
            <p className="text-xs text-gray-400 truncate">{user.bio}</p>
          )}
        </div>
      </Link>

      {showFollowButton && (
        <button
          onClick={handleClick}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            user.isFollowing
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : "bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-md hover:shadow-emerald-500/30"
          )}
        >
          {user.isFollowing ? (
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
  );
};

export default UserCard;
