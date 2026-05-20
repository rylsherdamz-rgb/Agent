import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  differenceInDays,
  differenceInMinutes,
  getHours,
  getMinutes,
  parseISO,
  isSameDay,
  isSameMonth,
  isSameYear,
  getDaysInMonth,
  getDay,
  setDate,
  setHours,
  setMinutes,
} from 'date-fns';

export {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  differenceInDays,
  differenceInMinutes,
  getHours,
  getMinutes,
  parseISO,
  isSameDay,
  isSameMonth,
  isSameYear,
  getDaysInMonth,
  getDay,
  setDate,
  setHours,
  setMinutes,
};

export function formatDate(date: number | Date, formatStr: string): string {
  return format(date, formatStr);
}

export function formatRelativeDate(date: number | Date): string {
  const d = typeof date === 'number' ? new Date(date) : date;

  if (isToday(d)) {
    return `Today ${format(d, 'h:mm a')}`;
  }
  if (isTomorrow(d)) {
    return `Tomorrow ${format(d, 'h:mm a')}`;
  }
  if (isYesterday(d)) {
    return `Yesterday ${format(d, 'h:mm a')}`;
  }

  const diffDays = differenceInDays(d, new Date());
  if (diffDays < 7) {
    return format(d, 'EEEE h:mm a');
  }

  return format(d, 'MMM d, yyyy h:mm a');
}

export function formatTimeRange(start: number, end: number): string {
  return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
}

export function formatCalendarDate(date: number | Date): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMMM d');
}

export function getWeekDays(
  date: Date,
  firstDayOfWeek: 0 | 1 = 0
): Date[] {
  const start = startOfWeek(date, { weekStartsOn: firstDayOfWeek });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function getMonthGrid(
  date: Date,
  firstDayOfWeek: 0 | 1 = 0
): (Date | null)[][] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const startDay = getDay(start);
  const daysInMonth = getDaysInMonth(date);

  const days: (Date | null)[] = [];

  const offset = startDay < firstDayOfWeek
    ? 7 - (firstDayOfWeek - startDay)
    : startDay - firstDayOfWeek;

  for (let i = 0; i < offset; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(setDate(start, i));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return weeks;
}

export function timeToMinutes(date: Date): number {
  return getHours(date) * 60 + getMinutes(date);
}

export function minutesToTime(minutes: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60,
  };
}