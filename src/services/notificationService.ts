import { Habit } from '@/types/habit';
import { HabitStorage } from './habitStorage';
import { getDayOfWeek } from '@/utils/dateUtils';
import { VAPID_PUBLIC_KEY } from '@/config/pushPublicKey';

const NOTIFICATIONS_ENABLED_KEY = 'trackit-notifications-enabled';
const SUBSCRIPTION_ID_KEY = 'trackit-subscription-id';

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
export class NotificationService {
  private static cachedApplicationServerKey: ArrayBuffer | null = null;

  static areNotificationsEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === 'true';
    } catch {
      return false;
    }
  }

  static async setNotificationsEnabled(enabled: boolean): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');

    if (enabled) {
      const granted = await this.requestPermission();
      if (!granted) {
        localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
        throw new Error('Notifications refusées par le navigateur');
      }

      await this.ensureSubscription();
      await this.scheduleAllNotifications();
    } else {
      const subscriptionId = this.getStoredSubscriptionId();
      if (subscriptionId) {
        await fetch('/api/notifications/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId, cancelAll: true })
        }).catch(() => {});

        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId })
        }).catch(() => {});
      }

      const registration = await navigator.serviceWorker.ready.catch(() => null);
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe().catch(() => {});
      }

      localStorage.removeItem(SUBSCRIPTION_ID_KEY);
    }
  }

  static async scheduleNotification(habit: Habit): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!this.areNotificationsEnabled()) return;
    if (!habit.notificationEnabled || habit.archived || !habit.notificationTime) {
      await this.cancelNotification(habit.id);
      return;
    }

    const nextOccurrence = this.getNextOccurrence(habit);
    if (!nextOccurrence) {
      await this.cancelNotification(habit.id);
      return;
    }

    const subscriptionId = await this.ensureSubscription();
    if (!subscriptionId) return;

    await fetch('/api/notifications/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId,
        habitId: habit.id,
        habitName: habit.name,
        scheduledAt: nextOccurrence.toISOString()
      })
    }).catch((error) => {
      console.error('Erreur lors de la programmation du rappel:', error);
    });
  }

  static async cancelNotification(habitId: string): Promise<void> {
    const subscriptionId = this.getStoredSubscriptionId();
    if (!subscriptionId) return;

    await fetch('/api/notifications/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, habitId })
    }).catch(() => {});
  }

  static async scheduleAllNotifications(): Promise<void> {
    if (!this.areNotificationsEnabled()) return;
    const habits = HabitStorage.loadHabits();

    await Promise.all(
      habits
        .filter((habit) => habit.notificationEnabled && !habit.archived)
        .map((habit) => this.scheduleNotification(habit))
    );
  }

  static async scheduleTestNotification(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const subscriptionId = await this.ensureSubscription();
    if (!subscriptionId) return false;

    const response = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId })
    });

    return response.ok;
  }

  static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  private static async ensureSubscription(): Promise<string | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const applicationServerKey = await this.getApplicationServerKey();
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // Convertir PushSubscription en objet sérialisable
    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');
    
    if (!p256dhKey || !authKey) {
      console.error('Clés de subscription manquantes');
      return null;
    }

    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(p256dhKey),
        auth: arrayBufferToBase64(authKey)
      }
    };

    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscriptionData })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erreur inconnue');
      console.error('Impossible de sauvegarder la subscription push:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const subscriptionId = data.subscriptionId as string;
    localStorage.setItem(SUBSCRIPTION_ID_KEY, subscriptionId);
    return subscriptionId;
  }

  private static getStoredSubscriptionId(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(SUBSCRIPTION_ID_KEY);
    } catch {
      return null;
    }
  }

  private static async getApplicationServerKey(): Promise<ArrayBuffer> {
    if (this.cachedApplicationServerKey) {
      return this.cachedApplicationServerKey;
    }

    const padding = '='.repeat((4 - (VAPID_PUBLIC_KEY.length % 4)) % 4);
    const base64 = (VAPID_PUBLIC_KEY + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    this.cachedApplicationServerKey = outputArray.buffer;
    return outputArray.buffer;
  }

  private static getNextOccurrence(habit: Habit): Date | null {
    if (!habit.notificationTime || !habit.targetDays.length) {
      return null;
    }

    const [hours, minutes] = habit.notificationTime.split(':').map(Number);
    const now = new Date();

    for (let offset = 0; offset < 14; offset += 1) {
      const candidate = new Date(now);
      candidate.setDate(now.getDate() + offset);
      candidate.setHours(hours, minutes, 0, 0);

      const day = getDayOfWeek(candidate);
      if (!habit.targetDays.includes(day)) {
        continue;
      }

      if (candidate <= now) {
        continue;
      }

      return candidate;
    }

    return null;
  }
}

