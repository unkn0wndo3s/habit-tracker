import { Habit, DailyHabit } from '@/types/habit';
import { getDayOfWeek, getDateKey } from '@/utils/dateUtils';

const STORAGE_KEY = 'trackit-habits';
const COMPLETIONS_KEY = 'trackit-completions';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type HabitCompletionEntry = {
  habitId: string;
  completedAt: string;
};

type HabitCompletions = Record<string, HabitCompletionEntry[]>;

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
      // Convertir les dates string en objets Date et s'assurer que tags, archived et notifications existent
      return habits.map((habit: Habit) => ({
        ...habit,
        tags: habit.tags || [],
        archived: habit.archived || false,
        notificationEnabled: habit.notificationEnabled ?? false,
        notificationTime: habit.notificationTime,
        createdAt: new Date(habit.createdAt)
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des habitudes:', error);
      return [];
    }
  }

  static addHabit(habit: Omit<Habit, 'id' | 'createdAt'>): Habit {
    const habits = this.loadHabits();
    // Normaliser les tags (minuscules, sans doublons)
    const normalizedTags = (habit.tags || [])
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .filter((tag, index, array) => array.indexOf(tag) === index); // Supprimer les doublons
    
    const newHabit: Habit = {
      ...habit,
      tags: normalizedTags,
      archived: false,
      notificationEnabled: habit.notificationEnabled ?? false,
      notificationTime: habit.notificationTime,
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
  static saveHabitCompletions(habitId: string): Record<string, string> {
    const completions = this.loadCompletions();
    const habitCompletions: Record<string, string> = {};
    
    // Parcourir toutes les dates et sauvegarder celles où l'habitude est complétée
    Object.keys(completions).forEach(dateKey => {
      const entry = completions[dateKey].find(c => c.habitId === habitId);
      if (entry) {
        habitCompletions[dateKey] = entry.completedAt;
      }
    });
    
    return habitCompletions;
  }

  /**
   * Restaure les complétions d'une habitude spécifique
   */
  static restoreHabitCompletions(habitId: string, completions: Record<string, string>): void {
    const allCompletions = this.loadCompletions();
    
    // Restaurer chaque complétion
    Object.keys(completions).forEach(dateKey => {
      if (!allCompletions[dateKey]) {
        allCompletions[dateKey] = [];
      }
      
      const alreadyCompleted = allCompletions[dateKey].some(entry => entry.habitId === habitId);
      if (!alreadyCompleted) {
        allCompletions[dateKey].push({
          habitId,
          completedAt: completions[dateKey]
        });
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
    
    // Normaliser les tags si présents dans les updates
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.tags !== undefined) {
      normalizedUpdates.tags = (normalizedUpdates.tags || [])
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .filter((tag, index, array) => array.indexOf(tag) === index); // Supprimer les doublons
    }
    
    habits[index] = {
      ...habits[index],
      ...normalizedUpdates
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const habits = this.loadHabits();
    const dayOfWeek = getDayOfWeek(targetDate);
    const dateKey = getDateKey(targetDate);
    const completions = this.loadCompletions();

    const dayCompletions = completions[dateKey] || [];

    return habits
      .filter(habit => {
        if (habit.archived) return false;
        if (!habit.targetDays.includes(dayOfWeek)) return false;
        // Ne pas afficher l'habitude avant sa date de création
        const createdAt = new Date(habit.createdAt);
        createdAt.setHours(0, 0, 0, 0);
        if (createdAt > targetDate) return false;
        return true;
      })
      .map(habit => {
        const completionEntry = dayCompletions.find(entry => entry.habitId === habit.id);
        const isFutureDate = targetDate > today;
        return {
          ...habit,
          isCompleted: !isFutureDate && Boolean(completionEntry),
          completedAt: completionEntry ? new Date(completionEntry.completedAt) : undefined,
          isFuture: isFutureDate
        };
      });
  }

  static archiveHabit(id: string): boolean {
    const updated = this.updateHabit(id, { archived: true });
    return updated !== null;
  }

  static unarchiveHabit(id: string): boolean {
    const updated = this.updateHabit(id, { archived: false });
    return updated !== null;
  }

  static toggleHabitCompletion(habitId: string, date: Date): void {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate > today) {
      return;
    }

    const dateKey = getDateKey(targetDate);
    const completions = this.loadCompletions();
    
    if (!completions[dateKey]) {
      completions[dateKey] = [];
    }
    
    const dayCompletions = completions[dateKey];
    const index = dayCompletions.findIndex(entry => entry.habitId === habitId);
    
    if (index > -1) {
      dayCompletions.splice(index, 1);
    } else {
      dayCompletions.push({
        habitId,
        completedAt: new Date().toISOString()
      });
    }
    
    this.saveCompletions(completions);
  }

  private static loadCompletions(): HabitCompletions {
    try {
      const stored = localStorage.getItem(COMPLETIONS_KEY);
      if (!stored) {
        return {};
      }

      const parsed = JSON.parse(stored);
      const normalized: HabitCompletions = {};

      Object.keys(parsed).forEach(dateKey => {
        const value = parsed[dateKey];
        if (!Array.isArray(value)) {
          normalized[dateKey] = [];
          return;
        }

        if (value.length > 0 && typeof value[0] === 'string') {
          // Ancien format (array d'IDs) -> convertir avec timestamp par défaut
          normalized[dateKey] = value.map((habitId: string) => ({
            habitId,
            completedAt: new Date(`${dateKey}T00:00:00`).toISOString()
          }));
        } else {
          normalized[dateKey] = value
            .filter(entry => entry && typeof entry === 'object')
            .map((entry: HabitCompletionEntry) => ({
              habitId: entry.habitId,
              completedAt: entry.completedAt || new Date(`${dateKey}T00:00:00`).toISOString()
            }));
        }
      });

      return normalized;
    } catch (error) {
      console.error('Erreur lors du chargement des complétions:', error);
      return {};
    }
  }

  private static saveCompletions(completions: HabitCompletions): void {
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
    const updatedCompletions: HabitCompletions = {};
    
    // Parcourir toutes les dates et supprimer l'habitude des complétions
    Object.keys(completions).forEach(dateKey => {
      const dayCompletions = completions[dateKey].filter(entry => entry.habitId !== habitId);
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
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const dateKey = getDateKey(date);
      const dayOfWeek = getDayOfWeek(date);
      const createdAt = new Date(habit.createdAt);
      createdAt.setHours(0, 0, 0, 0);
      const isBeforeCreation = date < createdAt;
      const isScheduled = !isBeforeCreation && habit.targetDays.includes(dayOfWeek);
      const isCompleted = completions[dateKey]?.some(entry => entry.habitId === habitId) || false;

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
   * Retourne le nombre de jours suivis depuis la première habitude créée
   */
  static getTrackedDays(): number {
    const habits = this.loadHabits();
    if (habits.length === 0) {
      return 0;
    }

    const earliest = habits.reduce((min, habit) => {
      const createdAt = new Date(habit.createdAt);
      createdAt.setHours(0, 0, 0, 0);
      return Math.min(min, createdAt.getTime());
    }, Number.POSITIVE_INFINITY);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diff = today.getTime() - earliest;
    if (diff < 0) {
      return 0;
    }

    return Math.floor(diff / DAY_IN_MS) + 1;
  }

  /**
   * Retourne l'évolution des complétions sur une période donnée
   */
  static getCompletionTimeline(days: number): Array<{
    date: Date;
    dateKey: string;
    scheduledCount: number;
    completedCount: number;
  }> {
    if (!days || days <= 0) {
      return [];
    }

    const habits = this.loadHabits();
    const completions = this.loadCompletions();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timeline: Array<{
      date: Date;
      dateKey: string;
      scheduledCount: number;
      completedCount: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = getDateKey(date);
      const dayOfWeek = getDayOfWeek(date);

      const activeHabits = habits.filter((habit) => {
        if (habit.archived) {
          return false;
        }
        const createdAt = new Date(habit.createdAt);
        createdAt.setHours(0, 0, 0, 0);
        return createdAt <= date && habit.targetDays.includes(dayOfWeek);
      });

      const scheduledCount = activeHabits.length;
      const activeHabitIds = new Set(activeHabits.map((habit) => habit.id));
      const completedCount =
        completions[dateKey]?.filter((entry) => activeHabitIds.has(entry.habitId)).length || 0;

      timeline.push({
        date,
        dateKey,
        scheduledCount,
        completedCount
      });
    }

    return timeline;
  }

  /**
   * Taux de complétion du mois en cours
   */
  static getMonthlyCompletionRate(): {
    monthLabel: string;
    rate: number;
    scheduled: number;
    completed: number;
  } {
    const habits = this.loadHabits();
    const completions = this.loadCompletions();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    let scheduled = 0;
    let completed = 0;

    for (let date = new Date(start); date <= today; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = getDayOfWeek(date);
      const dateKey = getDateKey(date);

      habits.forEach((habit) => {
        if (habit.archived) {
          return;
        }
        const createdAt = new Date(habit.createdAt);
        createdAt.setHours(0, 0, 0, 0);
        if (createdAt > date) {
          return;
        }
        if (habit.targetDays.includes(dayOfWeek)) {
          scheduled += 1;
          const hasCompleted =
            completions[dateKey]?.some((entry) => entry.habitId === habit.id) || false;
          if (hasCompleted) {
            completed += 1;
          }
        }
      });
    }

    const rate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);
    const monthLabel = today.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });

    return { monthLabel, rate, scheduled, completed };
  }

  /**
   * Données pour la heatmap des X derniers jours
   */
  static getHeatmapData(days = 30): Array<{
    date: Date;
    dateKey: string;
    scheduledCount: number;
    completedCount: number;
  }> {
    return this.getCompletionTimeline(days);
  }

  /**
   * Statistiques par habitude sur une période donnée
   */
  static getHabitStats(days = 30): Array<{
    habit: Habit;
    scheduled: number;
    completed: number;
    rate: number;
  }> {
    if (days <= 0) {
      return [];
    }

    const habits = this.loadHabits();
    const completions = this.loadCompletions();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return habits
      .filter((habit) => !habit.archived)
      .map((habit) => {
        let scheduled = 0;
        let completed = 0;
        const createdAt = new Date(habit.createdAt);
        createdAt.setHours(0, 0, 0, 0);

        for (let i = 0; i < days; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          date.setHours(0, 0, 0, 0);
          if (date < createdAt) {
            continue;
          }
          const dayOfWeek = getDayOfWeek(date);
          if (!habit.targetDays.includes(dayOfWeek)) {
            continue;
          }
          scheduled += 1;
          const dateKey = getDateKey(date);
          const hasCompleted =
            completions[dateKey]?.some((entry) => entry.habitId === habit.id) || false;
          if (hasCompleted) {
            completed += 1;
          }
        }

        const rate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);

        return {
          habit,
          scheduled,
          completed,
          rate
        };
      })
      .sort((a, b) => b.rate - a.rate || b.completed - a.completed);
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
      const isCompleted = completions[dateKey]?.some(entry => entry.habitId === habitId) || false;
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

  /**
   * Exporte toutes les données (habitudes et complétions) dans un format JSON
   * @returns Un objet contenant les habitudes et les complétions
   */
  static exportData(): {
    habits: Habit[];
    completions: HabitCompletions;
    exportDate: string;
    version: string;
  } {
    const habits = this.loadHabits();
    const completions = this.loadCompletions();
    
    return {
      habits,
      completions,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Importe des données depuis un objet JSON
   * Fusionne les données avec les données existantes (ne remplace pas)
   * @param data Les données à importer
   * @returns Un objet avec le nombre d'habitudes et complétions ajoutées
   */
  static importData(data: {
    habits: Habit[];
    completions: HabitCompletions;
    exportDate?: string;
    version?: string;
  }): { success: boolean; habitsAdded: number; completionsAdded: number } {
    try {
      // Valider la structure des données
      if (!data || !Array.isArray(data.habits) || !data.completions || typeof data.completions !== 'object') {
        return { success: false, habitsAdded: 0, completionsAdded: 0 };
      }

      // Charger les habitudes existantes
      const existingHabits = this.loadHabits();
      const existingHabitIds = new Set(existingHabits.map(h => h.id));

      // Normaliser les habitudes à importer (s'assurer que tous les champs sont présents)
      const normalizedHabits = data.habits.map(habit => ({
        ...habit,
        tags: habit.tags || [],
        archived: habit.archived ?? false,
        createdAt: habit.createdAt || new Date().toISOString()
      }));

      const habitIdMap: Record<string, string> = {};
      const mergedHabits = [...existingHabits];
      let habitsAdded = 0;

      normalizedHabits.forEach(habit => {
        const originalId = habit.id || crypto.randomUUID();
        let finalId = originalId;

        while (!finalId || existingHabitIds.has(finalId)) {
          finalId = crypto.randomUUID();
        }

        habitIdMap[originalId] = finalId;

        const habitToAdd: Habit = {
          ...habit,
          id: finalId
        };

        mergedHabits.push(habitToAdd);
        existingHabitIds.add(finalId);
        habitsAdded++;
      });

      // Charger les complétions existantes
      const existingCompletions = this.loadCompletions();

      // Normaliser les complétions à importer (s'assurer que la structure est correcte)
      const normalizedCompletions: HabitCompletions = {};
      Object.keys(data.completions).forEach(dateKey => {
        const dayCompletions = data.completions[dateKey];
        if (Array.isArray(dayCompletions)) {
          const firstEntry = dayCompletions[0] as unknown;

          // Si c'est l'ancien format (tableau de strings), convertir
          if (
            dayCompletions.length > 0 &&
            typeof firstEntry === 'string'
          ) {
            const legacyCompletions = dayCompletions as unknown as string[];
            normalizedCompletions[dateKey] = legacyCompletions.map(habitId => ({
              habitId: habitIdMap[habitId] || habitId,
              completedAt: new Date().toISOString() // Date par défaut pour les anciennes données
            }));
          } else {
            // Nouveau format (tableau d'objets)
            const structuredCompletions = dayCompletions as unknown as HabitCompletionEntry[];
            normalizedCompletions[dateKey] = structuredCompletions.map(entry => ({
              ...entry,
              habitId: habitIdMap[entry.habitId] || entry.habitId
            }));
          }
        }
      });

      // Fusionner les complétions existantes avec les nouvelles
      const mergedCompletions: HabitCompletions = { ...existingCompletions };
      let completionsAdded = 0;

      Object.keys(normalizedCompletions).forEach(dateKey => {
        const existingDayCompletions = mergedCompletions[dateKey] || [];
        const newDayCompletions = normalizedCompletions[dateKey] || [];
        
        // Créer un Set pour éviter les doublons (même habitId et même completedAt)
        const completionSet = new Set<string>();
        existingDayCompletions.forEach(entry => {
          completionSet.add(`${entry.habitId}-${entry.completedAt}`);
        });

        // Ajouter les nouvelles complétions qui n'existent pas déjà
        const uniqueNewCompletions = newDayCompletions.filter(entry => {
          const key = `${entry.habitId}-${entry.completedAt}`;
          if (!completionSet.has(key)) {
            completionSet.add(key);
            completionsAdded++;
            return true;
          }
          return false;
        });

        if (uniqueNewCompletions.length > 0 || existingDayCompletions.length > 0) {
          mergedCompletions[dateKey] = [...existingDayCompletions, ...uniqueNewCompletions];
        }
      });

      // Sauvegarder les données fusionnées
      this.saveHabits(mergedHabits);
      this.saveCompletions(mergedCompletions);

      return {
        success: true,
        habitsAdded,
        completionsAdded
      };
    } catch (error) {
      console.error('Erreur lors de l\'import des données:', error);
      return { success: false, habitsAdded: 0, completionsAdded: 0 };
    }
  }
}
