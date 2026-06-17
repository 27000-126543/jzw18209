import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export const formatRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm');
};

export const getDateString = (date: Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const getWeekStart = (date: Date): Date => {
  return dayjs(date).startOf('week').toDate();
};

export const getMonthDays = (year: number, month: number): number => {
  return dayjs(`${year}-${month + 1}`).daysInMonth();
};

export const isToday = (date: string | Date): boolean => {
  const d = dayjs(date);
  const t = dayjs();
  return d.format('YYYY-MM-DD') === t.format('YYYY-MM-DD');
};

export const generateHeatmapDates = (months: number = 12): { date: string; count: number }[] => {
  const data: { date: string; count: number }[] = [];
  const today = dayjs();
  
  for (let i = months * 30; i >= 0; i--) {
    const date = today.subtract(i, 'day');
    data.push({
      date: date.format('YYYY-MM-DD'),
      count: 0
    });
  }
  
  return data;
};

export default dayjs;
