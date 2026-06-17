import React from 'react';
import { Badge } from '../../shared/types';
import { Flame, Trophy, Crown, Sunrise, Dumbbell, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

interface BadgeWallProps {
  badges: Badge[];
  size?: 'sm' | 'md' | 'lg';
}

const iconMap: Record<string, React.ElementType> = {
  flame: Flame,
  trophy: Trophy,
  crown: Crown,
  sunrise: Sunrise,
  dumbbell: Dumbbell,
  'book-open': BookOpen,
};

const BadgeWall: React.FC<BadgeWallProps> = ({ badges, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
      {badges.map(badge => {
        const Icon = iconMap[badge.icon] || Trophy;
        const earned = !!badge.earnedAt;
        
        return (
          <div
            key={badge.id}
            className={cn(
              "relative flex flex-col items-center group",
              !earned && "opacity-40 grayscale"
            )}
          >
            <div
              className={cn(
                sizeClasses[size],
                "rounded-2xl flex items-center justify-center relative overflow-hidden",
                earned
                  ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30"
                  : "bg-gray-200"
              )}
            >
              {earned && (
                <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent" />
              )}
              <Icon
                className={cn(
                  iconSizes[size],
                  "relative z-10",
                  earned ? "text-white" : "text-gray-400"
                )}
              />
            </div>
            <div className="mt-2 text-center">
              <p className={cn(
                "text-sm font-medium",
                earned ? "text-gray-800" : "text-gray-400"
              )}>
                {badge.name}
              </p>
              <p className="text-xs text-gray-400">
                {badge.requirement}天
              </p>
            </div>
            {earned && badge.earnedAt && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg">
                ✓
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BadgeWall;
