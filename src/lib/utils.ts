import type { TimeSlot } from '../types';

export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 60) {
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours.toString().padStart(2, '0')}:${remainMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getTimeDiff(endTime: number, startTime = Date.now()): number {
  return Math.max(0, Math.floor((endTime - startTime) / 1000));
}

export function isTimeOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && start2 < end1;
}

export function addMinutes(timestamp: number, minutes: number): number {
  return timestamp + minutes * 60 * 1000;
}

export function isToday(timestamp: number): boolean {
  const date = new Date(timestamp);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function getTodayStart(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

export function getTodayEnd(): number {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today.getTime();
}

export function getTimeSlotsForDay(
  startTime: string,
  endTime: string,
  intervalMinutes = 30,
  date?: Date
): { label: string; value: number }[] {
  const slots: { label: string; value: number }[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const baseDate = date || new Date();
  let current = new Date(baseDate);
  current.setHours(startHour, startMin, 0, 0);

  const end = new Date(baseDate);
  end.setHours(endHour, endMin, 0, 0);

  while (current.getTime() <= end.getTime()) {
    slots.push({
      label: current.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      value: current.getTime(),
    });
    current = new Date(current.getTime() + intervalMinutes * 60 * 1000);
  }

  return slots;
}

export function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(timestamp: number, days: number): number {
  return timestamp + days * 24 * 60 * 60 * 1000;
}

export function isSameDay(timestamp1: number, timestamp2: number): boolean {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getTimeSlotsForRoomAndDate(
  roomBookableSlots: TimeSlot[],
  date: Date,
  intervalMinutes = 30
): { label: string; value: number }[] {
  const weekday = date.getDay();
  const allSlots: { label: string; value: number }[] = [];

  for (const slot of roomBookableSlots) {
    if (!slot.weekday.includes(weekday)) continue;
    const slots = getTimeSlotsForDay(slot.startTime, slot.endTime, intervalMinutes, date);
    allSlots.push(...slots);
  }

  allSlots.sort((a, b) => a.value - b.value);

  const uniqueSlots: { label: string; value: number }[] = [];
  const seen = new Set<number>();
  for (const slot of allSlots) {
    if (!seen.has(slot.value)) {
      seen.add(slot.value);
      uniqueSlots.push(slot);
    }
  }

  return uniqueSlots;
}

export function isTimeInPast(timestamp: number): boolean {
  return timestamp < Date.now();
}

export function getDayLabel(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(date.getTime(), today.getTime())) {
    return '今天';
  } else if (isSameDay(date.getTime(), tomorrow.getTime())) {
    return '明天';
  } else {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getMonth() + 1}/${date.getDate()} ${weekdays[date.getDay()]}`;
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
