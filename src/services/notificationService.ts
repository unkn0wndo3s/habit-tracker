import { Habit } from '@/types/habit';
import { HabitStorage } from './habitStorage';
import { getDayOfWeek, getDateKey } from '@/utils/dateUtils';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const NOTIFICATIONS_ENABLED_KEY = 'trackit-notifications-enabled';

// Stockage en mémoire des timers (ne peut pas être sérialisé)
const notificationTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export class NotificationService {
  /**
   * Vérifie si les notifications sont activées globalement
   */
  static areNotificationsEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Active ou désactive les notifications globalement
   */
  static setNotificationsEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
      if (enabled) {
        this.requestPermission().then(() => {
          this.scheduleAllNotifications();
        });
      } else {
        this.cancelAllNotifications();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres de notifications:', error);
    }
  }

  /**
   * Demande la permission pour les notifications
   */
  static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Planifie une notification pour une habitude spécifique
   */
  static scheduleNotification(habit: Habit): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (!this.areNotificationsEnabled()) {
      return;
    }

    if (!habit.notificationEnabled || !habit.notificationTime) {
      return;
    }

    if (habit.archived) {
      return;
    }

    // Annuler les notifications existantes pour cette habitude
    this.cancelNotification(habit.id);

    // Planifier les notifications pour chaque jour ciblé
    habit.targetDays.forEach((day) => {
      this.scheduleNotificationForDay(habit, day);
    });
  }

  /**
   * Planifie une notification pour un jour spécifique
   */
  private static scheduleNotificationForDay(habit: Habit, day: DayOfWeek): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    const [hours, minutes] = habit.notificationTime!.split(':').map(Number);
    const today = new Date();
    const currentDay = getDayOfWeek(today);
    
    // Trouver le prochain jour correspondant
    const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(day);
    const currentDayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(currentDay);
    
    let daysUntilTarget = dayIndex - currentDayIndex;
    if (daysUntilTarget < 0) {
      daysUntilTarget += 7;
    }
    
    // Si c'est aujourd'hui et que l'heure est passée, programmer pour la semaine prochaine
    if (daysUntilTarget === 0) {
      const now = new Date();
      const notificationTime = new Date();
      notificationTime.setHours(hours, minutes, 0, 0);
      if (notificationTime <= now) {
        daysUntilTarget = 7;
      }
    }

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    targetDate.setHours(hours, minutes, 0, 0);

    // Utiliser l'API Notification pour créer une notification programmée
    // Note: Les notifications programmées nécessitent un Service Worker
    // Pour l'instant, on utilise une approche simplifiée avec setInterval
    // Dans un environnement de production, on utiliserait l'API Service Worker Notification
    
    // Stocker l'ID de la notification pour pouvoir l'annuler
    const notificationId = `habit-${habit.id}-${day}`;
    
    // Pour une vraie implémentation, on utiliserait l'API Service Worker
    // Ici, on simule avec setTimeout (limitation: ne fonctionne que si l'app est ouverte)
    const timeout = targetDate.getTime() - Date.now();
    
    if (timeout > 0 && timeout < 7 * 24 * 60 * 60 * 1000) { // Max 7 jours
      const timerId = setTimeout(() => {
        this.showNotification(habit);
      }, timeout);
      
      // Stocker le timer ID pour pouvoir l'annuler
      notificationTimers[notificationId] = timerId;
    }
  }

  /**
   * Affiche une notification pour une habitude
   */
  private static async showNotification(habit: Habit): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    // Vérifier si l'habitude est déjà complétée aujourd'hui
    const today = new Date();
    const habitsForToday = HabitStorage.getHabitsForDate(today);
    const habitForToday = habitsForToday.find(h => h.id === habit.id);
    const isCompleted = habitForToday?.isCompleted || false;

    if (isCompleted) {
      return; // Ne pas envoyer de notification si déjà complétée
    }

    const notification = new Notification('TrackIt - Rappel d\'habitude', {
      body: `N'oubliez pas : ${habit.name}`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `habit-${habit.id}`,
      requireInteraction: false,
      data: {
        habitId: habit.id,
        url: window.location.origin
      }
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Planifier la prochaine notification pour la semaine suivante
    setTimeout(() => {
      this.scheduleNotification(habit);
    }, 1000);
  }

  /**
   * Annule toutes les notifications pour une habitude
   */
  static cancelNotification(habitId: string): void {
    Object.keys(notificationTimers).forEach(key => {
      if (key.startsWith(`habit-${habitId}-`)) {
        clearTimeout(notificationTimers[key]);
        delete notificationTimers[key];
      }
    });
  }

  /**
   * Annule toutes les notifications
   */
  static cancelAllNotifications(): void {
    Object.values(notificationTimers).forEach(timerId => {
      clearTimeout(timerId);
    });
    Object.keys(notificationTimers).forEach(key => {
      delete notificationTimers[key];
    });
  }

  /**
   * Planifie les notifications pour toutes les habitudes
   */
  static scheduleAllNotifications(): void {
    if (!this.areNotificationsEnabled()) {
      return;
    }

    const habits = HabitStorage.loadHabits();
    habits.forEach(habit => {
      if (habit.notificationEnabled && !habit.archived) {
        this.scheduleNotification(habit);
      }
    });
  }

}

