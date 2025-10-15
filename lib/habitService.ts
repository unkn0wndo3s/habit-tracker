import { Habit, HabitCompletion } from '@/types/habit';

const STORAGE_KEYS = {
  HABITS: 'habits',
  COMPLETIONS: 'habit_completions'
};

export class HabitService {
  // Gestion des habitudes
  static getHabits(): Habit[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!stored) return [];
    
    try {
      const habits = JSON.parse(stored);
      return habits.map((habit: any) => ({
        ...habit,
        createdAt: new Date(habit.createdAt),
        updatedAt: new Date(habit.updatedAt)
      }));
    } catch {
      return [];
    }
  }

  static saveHabits(habits: Habit[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  }

  static addHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Habit {
    const habits = this.getHabits();
    const newHabit: Habit = {
      ...habit,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    habits.push(newHabit);
    this.saveHabits(habits);
    return newHabit;
  }

  static updateHabit(id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>): Habit | null {
    const habits = this.getHabits();
    const index = habits.findIndex(h => h.id === id);
    
    if (index === -1) return null;
    
    habits[index] = {
      ...habits[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.saveHabits(habits);
    return habits[index];
  }

  static deleteHabit(id: string): boolean {
    const habits = this.getHabits();
    const filtered = habits.filter(h => h.id !== id);
    
    if (filtered.length === habits.length) return false;
    
    this.saveHabits(filtered);
    return true;
  }

  // Gestion des complétions
  static getCompletions(): HabitCompletion[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static saveCompletions(completions: HabitCompletion[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
  }

  static toggleCompletion(habitId: string, date: string): boolean {
    const completions = this.getCompletions();
    const existing = completions.find(c => c.habitId === habitId && c.date === date);
    
    if (existing) {
      existing.completed = !existing.completed;
    } else {
      completions.push({ habitId, date, completed: true });
    }
    
    this.saveCompletions(completions);
    return existing ? existing.completed : true;
  }

  static isCompleted(habitId: string, date: string): boolean {
    const completions = this.getCompletions();
    const completion = completions.find(c => c.habitId === habitId && c.date === date);
    return completion?.completed || false;
  }

  // Utilitaires
  static getHabitsForDate(date: Date): Habit[] {
    const habits = this.getHabits();
    const dayOfWeek = date.getDay(); // 0 = dimanche, 1 = lundi, etc.
    
    return habits.filter(habit => {
      // Convertir l'index du jour (0=dimanche) vers notre format (0=lundi)
      const habitDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      return habit.daysOfWeek[habitDayIndex];
    });
  }

  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static parseDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
  }
}
