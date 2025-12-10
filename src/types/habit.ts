export interface Habit {
  id: string;
  name: string;
  description?: string;
  targetDays: DayOfWeek[];
  tags: string[];
  archived?: boolean;
  createdAt: Date;
  updatedAt: Date;
  notificationEnabled?: boolean;
  notificationTime?: string; // Format HH:mm (ex: "09:00")
}

export interface DailyHabit extends Habit {
  isCompleted: boolean;
  completedAt?: Date;
  isFuture?: boolean;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Lundi' },
  { value: 'tuesday', label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday', label: 'Jeudi' },
  { value: 'friday', label: 'Vendredi' },
  { value: 'saturday', label: 'Samedi' },
  { value: 'sunday', label: 'Dimanche' }
];