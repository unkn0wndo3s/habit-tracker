export type HabitId = string;

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface Habit {
  id: HabitId;
  name: string;
  description?: string;
  // Which weekdays this habit is intended to be done on
  schedule: Weekday[];
  createdAt: string; // ISO string
  archivedAt?: string; // ISO string
}

export interface HabitCheck {
  habitId: HabitId;
  date: string; // YYYY-MM-DD
}

export interface HabitState {
  habits: Habit[];
  checksByDate: Record<string, HabitId[]>; // key: YYYY-MM-DD -> array of habit ids checked that day
}

export const todayKey = (d = new Date()): string => d.toISOString().slice(0, 10);

export const toDayKey = (d: Date): string => d.toISOString().slice(0, 10);

export const getWeekday = (d = new Date()): Weekday => d.getDay() as Weekday;


