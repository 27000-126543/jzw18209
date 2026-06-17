import { create } from 'zustand';
import { notificationsApi } from '../api';
import { Notification } from '../../shared/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const notifications = await notificationsApi.list();
      set({ notifications, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await notificationsApi.unreadCount();
      set({ unreadCount: response.count });
    } catch (error) {
      console.error('Fetch unread count failed:', error);
    }
  },

  markAsRead: async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Mark as read failed:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const count = await notificationsApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: Math.max(0, state.unreadCount - count)
      }));
    } catch (error) {
      console.error('Mark all as read failed:', error);
    }
  },

  deleteNotification: async (id: number) => {
    try {
      await notificationsApi.delete(id);
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    } catch (error) {
      console.error('Delete notification failed:', error);
    }
  }
}));
