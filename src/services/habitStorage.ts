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
      return habits.map((habit: Habit) => ({
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

  /**
   * Restaure une habitude avec son ID et sa date de création originaux
   * Utile pour l'annulation de suppression
   */
  static restoreHabit(habit: Habit): Habit {
    const habits = this.loadHabits();
    
    // Vérifier si l'habitude existe déjà
    if (habits.find(h => h.id === habit.id)) {
      return habit; // Déjà présente
    }
    
    // Restaurer l'habitude avec son ID original
    habits.push(habit);
    this.saveHabits(habits);
    return habit;
  }

  /**
   * Sauvegarde les complétions d'une habitude spécifique
   * Retourne un objet avec les dateKeys et les complétions
   */
  static saveHabitCompletions(habitId: string): Record<string, boolean> {
    const completions = this.loadCompletions();
    const habitCompletions: Record<string, boolean> = {};
    
    // Parcourir toutes les dates et sauvegarder celles où l'habitude est complétée
    Object.keys(completions).forEach(dateKey => {
      if (completions[dateKey].includes(habitId)) {
        habitCompletions[dateKey] = true;
      }
    });
    
    return habitCompletions;
  }

  /**
   * Restaure les complétions d'une habitude spécifique
   */
  static restoreHabitCompletions(habitId: string, completions: Record<string, boolean>): void {
    const allCompletions = this.loadCompletions();
    
    // Restaurer chaque complétion
    Object.keys(completions).forEach(dateKey => {
      if (completions[dateKey]) {
        if (!allCompletions[dateKey]) {
          allCompletions[dateKey] = [];
        }
        // Ajouter l'habitude si elle n'est pas déjà présente
        if (!allCompletions[dateKey].includes(habitId)) {
          allCompletions[dateKey].push(habitId);
        }
      }
    });
    
    this.saveCompletions(allCompletions);
  }

  static updateHabit(id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>): Habit | null {
    const habits = this.loadHabits();
    const index = habits.findIndex(habit => habit.id === id);
    
    if (index === -1) {
      return null;
    }
    
    habits[index] = {
      ...habits[index],
      ...updates
    };
    
    this.saveHabits(habits);
    return habits[index];
  }

  static deleteHabit(id: string): boolean {
    const habits = this.loadHabits();
    const filteredHabits = habits.filter(habit => habit.id !== id);
    
    if (filteredHabits.length === habits.length) {
      return false; // Habit not found
    }
    
    this.saveHabits(filteredHabits);
    
    // Supprimer aussi l'historique de progression de cette habitude
    this.removeHabitFromCompletions(id);
    
    return true;
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

  private static removeHabitFromCompletions(habitId: string): void {
    const completions = this.loadCompletions();
    const updatedCompletions: Record<string, string[]> = {};
    
    // Parcourir toutes les dates et supprimer l'habitude des complétions
    Object.keys(completions).forEach(dateKey => {
      const dayCompletions = completions[dateKey].filter(id => id !== habitId);
      if (dayCompletions.length > 0) {
        updatedCompletions[dateKey] = dayCompletions;
      }
    });
    
    this.saveCompletions(updatedCompletions);
  }

  /**
   * Récupère l'état des 7 derniers jours pour une habitude donnée
   * Retourne un tableau de 7 éléments représentant les 7 derniers jours (du plus ancien au plus récent)
   */
  static getHabitLast7Days(habitId: string): Array<{
    date: Date;
    dateKey: string;
    isScheduled: boolean; // L'habitude était-elle programmée ce jour-là ?
    isCompleted: boolean; // L'habitude a-t-elle été complétée ce jour-là ?
  }> {
    const habit = this.loadHabits().find(h => h.id === habitId);
    if (!habit) {
      return [];
    }

    const completions = this.loadCompletions();
    const today = new Date();
    const result: Array<{
      date: Date;
      dateKey: string;
      isScheduled: boolean;
      isCompleted: boolean;
    }> = [];

    // Générer les 7 derniers jours (du plus ancien au plus récent)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = getDateKey(date);
      const dayOfWeek = getDayOfWeek(date);
      const isScheduled = habit.targetDays.includes(dayOfWeek);
      const isCompleted = completions[dateKey]?.includes(habitId) || false;

      result.push({
        date,
        dateKey,
        isScheduled,
        isCompleted
      });
    }

    return result;
  }

  /**
   * Calcule la série actuelle (streak) d'une habitude
   * La série compte les jours consécutifs où l'habitude a été complétée
   * La série se remet à zéro si un jour programmé n'a pas été complété
   * @param habitId L'ID de l'habitude
   * @returns Le nombre de jours consécutifs (streak)
   */
  static getHabitStreak(habitId: string): number {
    const habit = this.loadHabits().find(h => h.id === habitId);
    if (!habit) {
      return 0;
    }

    const completions = this.loadCompletions();
    const today = new Date();
    let streak = 0;
    const currentDate = new Date(today);
    const todayKey = getDateKey(today);
    
    // Parcourir les jours en remontant depuis aujourd'hui
    // On compte les jours programmés complétés consécutivement
    // On s'arrête dès qu'on trouve un jour programmé non complété dans le passé
    for (let i = 0; i < 365; i++) {
      const dateKey = getDateKey(currentDate);
      const dayOfWeek = getDayOfWeek(currentDate);
      const isScheduled = habit.targetDays.includes(dayOfWeek);
      const isCompleted = completions[dateKey]?.includes(habitId) || false;
      const isToday = dateKey === todayKey;

      if (isScheduled) {
        if (isCompleted) {
          // Jour programmé et complété : on incrémente le streak
          streak++;
        } else {
          // Jour programmé mais non complété
          if (!isToday) {
            // Si c'est un jour passé non complété, on arrête le comptage
            // Le streak actuel est la série jusqu'à présent
            break;
          }
          // Si c'est aujourd'hui et non complété, on ne compte pas aujourd'hui
          // mais on continue à vérifier les jours précédents
        }
      }

      // Passer au jour précédent
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }
}
