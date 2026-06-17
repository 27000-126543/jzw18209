import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Flame } from 'lucide-react';
import { Habit } from '../../shared/types';
import { cn } from '../lib/utils';

interface HabitCardProps {
  habit: Habit;
  completed?: boolean;
  streak?: number;
  onCheckIn?: () => void;
}

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  completed = false,
  streak = 0,
  onCheckIn
}) => {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300",
        completed && "ring-2 ring-emerald-500/50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg relative"
            style={{ backgroundColor: habit.color }}
          >
            {habit.icon || '🎯'}
            {streak > 0 && (
              <div className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500 rounded-full text-white text-xs font-bold">
                <Flame className="w-3 h-3" />
                {streak}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{habit.name}</h3>
            {habit.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                {habit.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>{habit.frequency === 'daily' ? '每日' : '每周'} {habit.targetCount}次</span>
              <span>·</span>
              <span>截止 {habit.deadlineTime}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {completed ? (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium">
              <Check className="w-4 h-4" />
              已完成
            </div>
          ) : (
            onCheckIn ? (
              <button
                onClick={onCheckIn}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
              >
                立即打卡
              </button>
            ) : (
              <Link
                to={`/habits/${habit.id}/checkin`}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
              >
                立即打卡
              </Link>
            )
          )}
          <Link
            to={`/habits/${habit.id}`}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HabitCard;
