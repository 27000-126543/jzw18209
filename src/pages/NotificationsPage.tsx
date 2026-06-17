import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Award, UserPlus, Bell, Check, Trash2 } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';
import { Notification } from '../../shared/types';
import { formatRelativeTime } from '../utils/date';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

type TabType = 'all' | 'like' | 'comment' | 'follow' | 'badge';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const [tab, setTab] = useState<TabType>('all');

  useEffect(() => {
    fetchNotifications();
  }, [tab, fetchNotifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-emerald-500" />;
      case 'badge': return <Award className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredNotifications = tab === 'all'
    ? notifications
    : notifications.filter(n => n.type === tab);

  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors text-sm font-medium"
          >
            <Check className="w-4 h-4" />
            全部已读
          </button>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">消息通知</h1>
        <p className="text-gray-500 text-sm mt-1">
          {unreadCount > 0 ? `还有 ${unreadCount} 条未读消息` : '暂无未读消息'}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-1.5 shadow-sm">
        <div className="flex overflow-x-auto">
          {[
            { key: 'all', label: '全部', icon: Bell },
            { key: 'like', label: '点赞', icon: Heart },
            { key: 'comment', label: '评论', icon: MessageCircle },
            { key: 'follow', label: '关注', icon: UserPlus },
            { key: 'badge', label: '徽章', icon: Award },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as TabType)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
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
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">暂无消息</h3>
          <p className="text-gray-500">
            {tab === 'all' ? '还没有任何消息通知' : `还没有${
              tab === 'like' ? '点赞' :
              tab === 'comment' ? '评论' :
              tab === 'follow' ? '关注' : '徽章'
            }相关的消息`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={cn(
                "flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm transition-all group",
                !notification.isRead && "bg-emerald-50/50"
              )}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                  {notification.relatedUserAvatar ? (
                    <img
                      src={notification.relatedUserAvatar}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    getIcon(notification.type)
                  )}
                </div>
                {!notification.isRead && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800">
                  <span className="font-medium">{notification.title}</span>
                  {' '}
                  <span className="text-gray-600">{notification.content}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatRelativeTime(notification.createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
