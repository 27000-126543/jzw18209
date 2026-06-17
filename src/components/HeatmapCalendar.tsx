import React from 'react';
import dayjs from 'dayjs';

interface HeatmapCalendarProps {
  data: { date: string; count: number }[];
  color?: string;
}

const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ data, color = '#10b981' }) => {
  const today = dayjs();
  const startDate = today.subtract(371, 'day');
  const weeks: Array<Array<{ date: string; count: number } | null>> = [];
  
  let currentWeek: Array<{ date: string; count: number } | null> = [];
  const startDay = startDate.day();
  
  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null);
  }

  const dataMap = new Map(data.map(d => [d.date, d.count]));
  
  for (let i = 0; i < 371; i++) {
    const currentDate = startDate.add(i, 'day');
    const dateStr = currentDate.format('YYYY-MM-DD');
    const count = dataMap.get(dateStr) || 0;
    
    currentWeek.push({ date: dateStr, count });
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const getColor = (count: number): string => {
    if (count === 0) return '#ebedf0';
    if (count === 1) return '#9be9a8';
    if (count === 2) return '#40c463';
    if (count >= 3) return color;
    return '#ebedf0';
  };

  const monthLabels = [];
  const firstDayOfMonth = new Map();
  
  weeks.forEach((week, weekIndex) => {
    week.forEach((day, dayIndex) => {
      if (day && dayjs(day.date).date() === 1) {
        firstDayOfMonth.set(dayjs(day.date).format('YYYY-MM'), { weekIndex, dayIndex });
        monthLabels.push({ 
          month: dayjs(day.date).format('M月'),
          weekIndex 
        });
      }
    });
  });

  const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  const activeDays = data.filter(d => d.count > 0).length;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">打卡热力图</h3>
        <div className="text-sm text-gray-500">
          {activeDays} 天活跃 / {totalCount} 次打卡
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[750px]">
          <div className="flex text-xs text-gray-400 mb-2 ml-8">
            {monthLabels.map((label, idx) => (
              <div
                key={idx}
                className="relative"
                style={{
                  marginLeft: idx === 0 ? `${label.weekIndex * 14}px` : '0',
                  width: '70px'
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            <div className="flex flex-col gap-1 mr-2 text-xs text-gray-400">
              {dayLabels.map((day, idx) => (
                <div key={idx} className="h-3 flex items-center justify-end pr-1">
                  {idx % 2 === 1 ? day : ''}
                </div>
              ))}
            </div>

            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="w-3 h-3 rounded-sm transition-transform hover:scale-150 cursor-pointer"
                      style={{
                        backgroundColor: day ? getColor(day.count) : 'transparent'
                      }}
                      title={day ? `${day.date}: ${day.count}次打卡` : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
            <span>少</span>
            <div className="w-3 h-3 rounded-sm bg-[#ebedf0]" />
            <div className="w-3 h-3 rounded-sm bg-[#9be9a8]" />
            <div className="w-3 h-3 rounded-sm bg-[#40c463]" />
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span>多</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapCalendar;
