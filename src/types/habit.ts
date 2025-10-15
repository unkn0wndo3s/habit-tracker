export interface Habit {
  id: string;
  name: string;
  description?: string;
  daysOfWeek: boolean[]; // [lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche]
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitCompletion {
  habitId: string;
  date: string; // Format YYYY-MM-DD
  completed: boolean;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = dimanche, 1 = lundi, etc.
