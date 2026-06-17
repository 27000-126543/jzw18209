import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, MoreHorizontal, Trash2, Smile } from 'lucide-react';
import { CheckInFeed } from '../../shared/types';
import { formatRelativeTime } from '../utils/date';
import { useFeedStore } from '../store/useFeedStore';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';

interface CheckInCardProps {
  item: CheckInFeed;
}

const CheckInCard: React.FC<CheckInCardProps> = ({ item }) => {
  const { user } = useAuthStore();
  const { toggleLike, addComment, deleteCheckIn } = useFeedStore();
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(item.id);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment(item.id, commentText);
    setCommentText('');
    setShowCommentInput(false);
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这条打卡记录吗？')) {
      deleteCheckIn(item.id);
    }
    setShowMenu(false);
  };

  const moodEmojis = ['😢', '😕', '😐', '😊', '🤩'];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link to={`/users/${item.userId}`}>
            <img
              src={item.avatar}
              alt={item.username}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent hover:ring-emerald-200 transition-all"
            />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                to={`/users/${item.userId}`}
                className="font-semibold text-gray-800 hover:text-emerald-600 transition-colors"
              >
                {item.username}
              </Link>
              <span className="text-gray-300">·</span>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: item.habitName.includes('读书') ? '#8b5cf6' : item.habitName.includes('跑步') ? '#f59e0b' : item.habitName.includes('早起') ? '#f97316' : '#10b981' }}
              >
                <span>{item.habitIcon}</span>
                {item.habitName}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatRelativeTime(item.createdAt)}
            </p>
          </div>
        </div>

        {user?.id === item.userId && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {item.content && (
        <p className="mt-3 text-gray-700 leading-relaxed whitespace-pre-wrap">
          {item.content}
        </p>
      )}

      {item.photos && item.photos.length > 0 && (
        <div className={cn(
          "mt-3 grid gap-2",
          item.photos.length === 1 ? "grid-cols-1" : item.photos.length === 2 ? "grid-cols-2" : "grid-cols-3"
        )}>
          {item.photos.map((photo, idx) => (
            <img
              key={idx}
              src={photo}
              alt=""
              className="w-full aspect-square object-cover rounded-xl"
            />
          ))}
        </div>
      )}

      {item.mood && (
        <div className="mt-3 flex items-center gap-2">
          <Smile className="w-4 h-4 text-amber-500" />
          <span className="text-2xl">{moodEmojis[item.mood - 1]}</span>
        </div>
      )}

      <div className="mt-4 flex items-center gap-6 pt-3 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium transition-all",
            item.isLiked
              ? "text-red-500"
              : "text-gray-500 hover:text-red-500"
          )}
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-all",
              item.isLiked && "fill-current"
            )}
          />
          <span>{item.likesCount}</span>
        </button>
        <button
          onClick={() => setShowCommentInput(!showCommentInput)}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-500 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{item.commentsCount}</span>
        </button>
      </div>

      {showCommentInput && (
        <form onSubmit={handleComment} className="mt-3 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="写下你的评论..."
            className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white transition-all"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors"
          >
            发送
          </button>
        </form>
      )}
    </div>
  );
};

export default CheckInCard;
