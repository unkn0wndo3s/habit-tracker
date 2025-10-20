import { Habit, DailyHabit } from '@/types/habit';
import { getDayOfWeek, getDateKey } from '@/utils/dateUtils';

const STORAGE_KEY = 'trackit-habits';
const COMPLETIONS_KEY = 'trackit-completions';

export class HabitStorage {
  static saveHabits(habits: Habit[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des habitudes:', error);
    }
  }

  static loadHabits(): Habit[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const habits = JSON.parse(stored);
      // Convertir les dates string en objets Date
      return habits.map((habit: any) => ({
        ...habit,
        createdAt: new Date(habit.createdAt)
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des habitudes:', error);
      return [];
    }
  }

  static addHabit(habit: Omit<Habit, 'id' | 'createdAt'>): Habit {
    const habits = this.loadHabits();
    const newHabit: Habit = {
      ...habit,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    
    habits.push(newHabit);
    this.saveHabits(habits);
    return newHabit;
  }

  static getHabitsForDate(date: Date): DailyHabit[] {
    const habits = this.loadHabits();
    const dayOfWeek = getDayOfWeek(date);
    const dateKey = getDateKey(date);
    const completions = this.loadCompletions();

    return habits
      .filter(habit => habit.targetDays.includes(dayOfWeek))
      .map(habit => ({
        ...habit,
        isCompleted: completions[dateKey]?.includes(habit.id) || false,
        completedAt: completions[dateKey]?.includes(habit.id) ? date : undefined
      }));
  }

  static toggleHabitCompletion(habitId: string, date: Date): void {
    const dateKey = getDateKey(date);
    const completions = this.loadCompletions();
    
    if (!completions[dateKey]) {
      completions[dateKey] = [];
    }
    
    const dayCompletions = completions[dateKey];
    const index = dayCompletions.indexOf(habitId);
    
    if (index > -1) {
      dayCompletions.splice(index, 1);
    } else {
      dayCompletions.push(habitId);
    }
    
    this.saveCompletions(completions);
  }

  private static loadCompletions(): Record<string, string[]> {
    try {
      const stored = localStorage.getItem(COMPLETIONS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Erreur lors du chargement des complétions:', error);
      return {};
    }
  }

  private static saveCompletions(completions: Record<string, string[]>): void {
    try {
      localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des complétions:', error);
    }
  }

  static clearHabits(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COMPLETIONS_KEY);
  }
}
