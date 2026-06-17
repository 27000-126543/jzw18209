import { create } from 'zustand';
import { habitsApi, checkInsApi } from '../api';
import {
  Habit,
  HabitDetail,
  HabitListResponse,
  HabitStatistics,
  TodayProgress,
  CheckIn,
  Badge,
  CreateHabitRequest,
  CheckInRequest,
  HabitTrend,
} from '../../shared/types';

interface HabitState {
  habits: Habit[];
  todayProgress: TodayProgress[];
  statistics: HabitStatistics;
  recentCheckIns: CheckIn[];
  currentHabit: HabitDetail | null;
  trendData: HabitTrend | null;
  loading: boolean;
  fetchHabits: () => Promise<void>;
  fetchStatistics: () => Promise<void>;
  fetchHabitDetail: (id: number) => Promise<HabitDetail | null>;
  fetchCheckIns: (habitId: number) => Promise<void>;
  fetchTrend: (habitId: number) => Promise<HabitTrend | null>;
  fetchHeatmapData?: (habitId: number) => Promise<{ date: string; count: number }[]>;
  createHabit: (data: CreateHabitRequest) => Promise<number>;
  updateHabit: (id: number, data: Partial<CreateHabitRequest>) => Promise<boolean>;
  deleteHabit: (id: number) => Promise<boolean>;
  checkIn: (
    habitId: number,
    data: Omit<CheckInRequest, 'habitId'>
  ) => Promise<{
    success: boolean;
    newBadge: Badge | null;
    currentCount: number;
    targetCount: number;
    completed: boolean;
  }>;
  refreshProgress: () => Promise<void>;
}

const emptyStatistics: HabitStatistics = {
  currentStreak: 0,
  longestStreak: 0,
  monthlyRate: 0,
  totalCheckIns: 0,
  badgesCount: 0,
  heatmapData: [],
  streaks: {},
};

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  todayProgress: [],
  statistics: emptyStatistics,
  recentCheckIns: [],
  currentHabit: null,
  trendData: null,
  loading: false,

  fetchHabits: async () => {
    set({ loading: true });
    try {
      const response: HabitListResponse = await habitsApi.list();
      set({
        habits: response.habits,
        todayProgress: response.todayProgress,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchStatistics: async () => {
    set({ loading: true });
    try {
      const stats = await habitsApi.statistics();
      set({ statistics: stats, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Fetch statistics failed:', error);
    }
  },

  fetchHabitDetail: async (id: number) => {
    set({ loading: true });
    try {
      const habit = await habitsApi.detail(id);
      set({ currentHabit: habit, loading: false });
      return habit;
    } catch (error) {
      set({ loading: false, currentHabit: null });
      console.error('Fetch habit detail failed:', error);
      return null;
    }
  },

  fetchCheckIns: async (habitId: number) => {
    set({ loading: true });
    try {
      const checkIns = await habitsApi.getCheckIns(habitId);
      set({ recentCheckIns: checkIns, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Fetch check-ins failed:', error);
    }
  },

  fetchTrend: async (habitId: number) => {
    set({ loading: true });
    try {
      const trend = await habitsApi.getTrend(habitId);
      set({ trendData: trend, loading: false });
      return trend;
    } catch (error) {
      set({ loading: false, trendData: null });
      console.error('Fetch trend data failed:', error);
      return null;
    }
  },

  fetchHeatmapData: async (habitId: number) => {
    try {
      const habit = await habitsApi.detail(habitId);
      return habit.heatmapData || [];
    } catch (error) {
      console.error('Fetch heatmap data failed:', error);
      return [];
    }
  },

  createHabit: async (data) => {
    const result = await habitsApi.create(data);
    const id = result.id;
    set((state) => ({
      habits: [
        ...state.habits,
        {
          ...data,
          id,
          userId: 0,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    return id;
  },

  updateHabit: async (id, data) => {
    const result = await habitsApi.update(id, data);
    if (result.success) {
      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === id ? { ...h, ...data } : h
        ),
      }));
    }
    return result.success;
  },

  deleteHabit: async (id) => {
    const result = await habitsApi.delete(id);
    if (result.success) {
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
        todayProgress: state.todayProgress.filter((p) => p.habitId !== id),
      }));
    }
    return result.success;
  },

  checkIn: async (habitId, data) => {
    const checkInData: CheckInRequest = { habitId, ...data };
    try {
      const result = await checkInsApi.create(checkInData);

      const targetHabit = get().habits.find((h) => h.id === habitId);
      const targetCount = targetHabit?.targetCount ?? result.targetCount ?? 1;

      set((state) => ({
        todayProgress: state.todayProgress.map((p) =>
          p.habitId === habitId
            ? {
                ...p,
                currentCount: result.currentCount,
                targetCount,
                completed: result.completed,
                completionRate: Math.min(100, (result.currentCount / targetCount) * 100),
              }
            : p
        ),
      }));

      return {
        success: true,
        newBadge: result.newBadge as Badge | null,
        currentCount: result.currentCount,
        targetCount,
        completed: result.completed,
      };
    } catch (error) {
      throw error;
    }
  },

  refreshProgress: async () => {
    try {
      const progress = await habitsApi.progress();
      set({ todayProgress: progress });
    } catch (error) {
      console.error('Refresh progress failed:', error);
    }
  },
}));
