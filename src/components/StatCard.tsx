import React from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  suffix?: string;
  trend?: {
    value: number;
    label: string;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = '#10b981',
  suffix,
  trend
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span
              className="text-3xl font-bold"
              style={{ color }}
            >
              {value}
            </span>
            {suffix && (
              <span className="text-sm text-gray-400">{suffix}</span>
            )}
          </div>
          {trend && (
            <div className={cn(
              "mt-1 text-xs font-medium",
              trend.value >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
