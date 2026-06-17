import { create } from 'zustand';
import { habitsApi, checkInsApi } from '../api';
import { Habit, HabitDetail, HabitListResponse, Badge } from '../../shared/types';

interface HabitState {
  habits: Habit[];
  todayProgress: { habitId: number; completed: boolean }[];
  currentHabit: HabitDetail | null;
  loading: boolean;
  fetchHabits: () => Promise<void>;
  fetchHabitDetail: (id: number) => Promise<void>;
  createHabit: (data: Parameters<typeof habitsApi.create>[0]) => Promise<number>;
  updateHabit: (id: number, data: Parameters<typeof habitsApi.update>[1]) => Promise<boolean>;
  deleteHabit: (id: number) => Promise<boolean>;
  checkIn: (habitId: number, data: Parameters<typeof checkInsApi.create>[0]) => Promise<{ success: boolean; newBadge: Badge | null }>;
  refreshProgress: () => Promise<void>;
}

export const useHabitStore = create<HabitState>((set) => ({
  habits: [],
  todayProgress: [],
  currentHabit: null,
  loading: false,

  fetchHabits: async () => {
    set({ loading: true });
    try {
      const response: HabitListResponse = await habitsApi.list();
      set({
        habits: response.habits,
        todayProgress: response.todayProgress,
        loading: false
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchHabitDetail: async (id: number) => {
    set({ loading: true });
    try {
      const habit = await habitsApi.detail(id);
      set({ currentHabit: habit, loading: false });
    } catch (error) {
      set({ loading: false, currentHabit: null });
      throw error;
    }
  },

  createHabit: async (data) => {
    const id = await habitsApi.create(data);
    set((state) => ({
      habits: [...state.habits, { ...data, id, userId: 0, createdAt: new Date().toISOString() }]
    }));
    return id;
  },

  updateHabit: async (id, data) => {
    const success = await habitsApi.update(id, data);
    if (success) {
      set((state) => ({
        habits: state.habits.map(h => h.id === id ? { ...h, ...data } : h)
      }));
    }
    return success;
  },

  deleteHabit: async (id) => {
    const success = await habitsApi.delete(id);
    if (success) {
      set((state) => ({
        habits: state.habits.filter(h => h.id !== id)
      }));
    }
    return success;
  },

  checkIn: async (habitId, data) => {
    const result = await checkInsApi.create(data);
    
    set((state) => ({
      todayProgress: state.todayProgress.map(p =>
        p.habitId === habitId ? { ...p, completed: true } : p
      )
    }));

    return {
      success: true,
      newBadge: result.newBadge as Badge | null
    };
  },

  refreshProgress: async () => {
    try {
      const progress = await habitsApi.progress();
      set({ todayProgress: progress });
    } catch (error) {
      console.error('Refresh progress failed:', error);
    }
  }
}));
