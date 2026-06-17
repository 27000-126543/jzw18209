import { checkInRepository } from '../repositories/checkInRepository';
import { habitRepository } from '../repositories/habitRepository';
import { badgeRepository } from '../repositories/badgeRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { CheckInRequest, Badge } from '../../shared/types';
import dayjs from 'dayjs';

export const checkInService = {
  async createCheckIn(userId: number, data: CheckInRequest): Promise<{ checkInId: number; newBadge: Badge | null; currentCount: number; targetCount: number; completed: boolean }> {
    const habit = await habitRepository.findById(data.habitId);
    if (!habit || habit.userId !== userId) {
      throw new Error('习惯不存在或无权限');
    }

    const now = dayjs();
    const currentTime = now.format('HH:mm');
    const deadlineTime = habit.deadlineTime || '23:59';
    
    if (currentTime > deadlineTime) {
      const habitName = habit.name;
      throw new Error(`已超过"${habitName}"的截止时间 ${deadlineTime}，请明天继续加油！`);
    }

    const progress = await habitRepository.getTodayProgress(userId);
    const habitProgress = progress.find(p => p.habitId === habit.id);
    const currentCount = habitProgress?.currentCount || 0;
    const targetCount = habit.targetCount;
    const wasCompleted = habitProgress?.completed || false;

    if (wasCompleted) {
      return {
        checkInId: 0,
        newBadge: null,
        currentCount,
        targetCount,
        completed: true
      };
    }

    const checkInId = await checkInRepository.create(userId, data);

    const newCount = currentCount + 1;
    const completed = newCount >= targetCount;

    const habitDetail = await habitRepository.getHabitDetail(data.habitId, userId);
    let newBadge: Badge | null = null;

    if (habitDetail) {
      newBadge = await badgeRepository.checkAndAwardStreakBadge(userId, habitDetail.currentStreak);
      
      if (!newBadge) {
        newBadge = await badgeRepository.checkAndAwardTotalBadge(userId, habit.name, habitDetail.totalCheckIns);
      }

      if (newBadge) {
        await notificationRepository.create(
          userId,
          'badge',
          `恭喜你获得"${newBadge.name}"徽章！${newBadge.description}`,
          newBadge.id
        );
      }
    }

    return { 
      checkInId, 
      newBadge, 
      currentCount: newCount,
      targetCount,
      completed
    };
  },

  async getFeed(userId: number, cursor: number = 0, limit: number = 20) {
    return checkInRepository.getFeed(userId, cursor, limit);
  },

  async getExploreFeed(
    userId: number | null,
    options: {
      habitId?: number;
      keyword?: string;
      sortBy: 'latest' | 'popular';
    }
  ) {
    const feed = await checkInRepository.getExploreFeed(userId, options);
    return feed;
  },

  async toggleLike(checkInId: number, userId: number) {
    const result = await checkInRepository.toggleLike(checkInId, userId);
    
    if (result.liked) {
      const checkIn = await checkInRepository.findById(checkInId);
      if (checkIn && checkIn.userId !== userId) {
        await notificationRepository.create(
          checkIn.userId,
          'like',
          `有人赞了你的打卡记录`,
          checkInId
        );
      }
    }
    
    return result;
  },

  async addComment(checkInId: number, userId: number, content: string) {
    const commentId = await checkInRepository.addComment(checkInId, userId, content);
    
    const checkIn = await checkInRepository.findById(checkInId);
    if (checkIn && checkIn.userId !== userId) {
      await notificationRepository.create(
        checkIn.userId,
        'comment',
        `有人评论了你的打卡记录`,
        checkInId
      );
    }
    
    return commentId;
  },

  async getComments(checkInId: number) {
    return checkInRepository.getComments(checkInId);
  },

  async deleteCheckIn(checkInId: number, userId: number) {
    return checkInRepository.delete(checkInId, userId);
  }
};
