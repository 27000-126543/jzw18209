import { habitRepository } from '../repositories/habitRepository';
import { CreateHabitRequest, HabitListResponse, HabitDetail, HabitTrend } from '../../shared/types';

export const habitService = {
  async createHabit(userId: number, data: CreateHabitRequest): Promise<number> {
    return habitRepository.create(userId, data);
  },

  async getHabits(userId: number): Promise<HabitListResponse> {
    const habits = await habitRepository.findByUserId(userId);
    const todayProgress = await habitRepository.getTodayProgress(userId);
    return { habits, todayProgress };
  },

  async getHabitDetail(habitId: number, userId: number): Promise<HabitDetail | null> {
    return habitRepository.getHabitDetail(habitId, userId);
  },

  async updateHabit(habitId: number, userId: number, data: Partial<CreateHabitRequest>): Promise<boolean> {
    return habitRepository.update(habitId, userId, data);
  },

  async deleteHabit(habitId: number, userId: number): Promise<boolean> {
    return habitRepository.delete(habitId, userId);
  },

  async getTodayProgress(userId: number) {
    return habitRepository.getTodayProgress(userId);
  },

  async getHabitTrend(habitId: number, userId: number, days: number): Promise<HabitTrend | null> {
    return habitRepository.getHabitTrend(habitId, userId, days);
  },

  async getPublicHabitTypes() {
    return habitRepository.getPublicHabitTypes();
  }
};
