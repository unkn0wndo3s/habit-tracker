import { randomUUID } from 'crypto';
import webPush from 'web-push';
import { VAPID_KEYS, VAPID_SUBJECT } from '@/config/pushServerKeys';

type PushSubscription = webPush.PushSubscription;

webPush.setVapidDetails(VAPID_SUBJECT, VAPID_KEYS.publicKey, VAPID_KEYS.privateKey);

type ScheduledKey = string;

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ScheduleOptions extends NotificationPayload {
  subscriptionId: string;
  habitId: string;
  scheduledAt: string; // ISO string
}

const subscriptions = new Map<string, PushSubscription>();
const scheduledNotifications = new Map<ScheduledKey, NodeJS.Timeout>();

export class NotificationScheduler {
  static getPublicKey(): string {
    return VAPID_KEYS.publicKey;
  }

  static addSubscription(subscription: PushSubscription): string {
    // Réutiliser l'ID si l'endpoint existe déjà
    for (const [id, existing] of subscriptions.entries()) {
      if (existing.endpoint === subscription.endpoint) {
        subscriptions.set(id, subscription);
        return id;
      }
    }

    const id = randomUUID();
    subscriptions.set(id, subscription);
    return id;
  }

  static removeSubscription(subscriptionId: string): void {
    subscriptions.delete(subscriptionId);
    this.cancelAllForSubscription(subscriptionId);
  }

  static async scheduleNotification(options: ScheduleOptions): Promise<void> {
    const subscription = subscriptions.get(options.subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const scheduledTime = new Date(options.scheduledAt).getTime();
    if (Number.isNaN(scheduledTime)) {
      throw new Error('Invalid scheduledAt date');
    }

    const delay = scheduledTime - Date.now();
    const key = this.getTimerKey(options.subscriptionId, options.habitId);

    this.cancelScheduledTimer(key);

    const triggerNotification = async () => {
      await this.sendNotification(subscription, options);
      scheduledNotifications.delete(key);
    };

    if (delay <= 0) {
      await triggerNotification();
      return;
    }

    const timer = setTimeout(() => {
      triggerNotification().catch((error) => {
        console.error('Erreur lors de l’envoi de la notification programmée:', error);
      });
    }, delay);

    scheduledNotifications.set(key, timer);
  }

  static async scheduleTestNotification(subscriptionId: string): Promise<void> {
    const subscription = subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const payload: NotificationPayload = {
      title: "TrackIt — Notification de test",
      body: "Ceci est un rappel de test, programmé 10 secondes plus tôt.",
      data: {
        url: '/',
        type: 'test'
      }
    };

    const key = this.getTimerKey(subscriptionId, 'test');
    this.cancelScheduledTimer(key);

    const timer = setTimeout(() => {
      this.sendNotification(subscription, payload).catch((error) => {
        console.error('Erreur lors de l’envoi de la notification de test:', error);
      });
      scheduledNotifications.delete(key);
    }, 10_000);

    scheduledNotifications.set(key, timer);
  }

  static cancelNotification(subscriptionId: string, habitId: string): void {
    const key = this.getTimerKey(subscriptionId, habitId);
    this.cancelScheduledTimer(key);
  }

  static cancelAllForSubscription(subscriptionId: string): void {
    for (const key of scheduledNotifications.keys()) {
      if (key.startsWith(`${subscriptionId}::`)) {
        this.cancelScheduledTimer(key);
      }
    }
  }

  private static getTimerKey(subscriptionId: string, habitId: string): ScheduledKey {
    return `${subscriptionId}::${habitId}`;
  }

  private static cancelScheduledTimer(key: ScheduledKey): void {
    const timer = scheduledNotifications.get(key);
    if (timer) {
      clearTimeout(timer);
      scheduledNotifications.delete(key);
    }
  }

  private static async sendNotification(
    subscription: PushSubscription,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      await webPush.sendNotification(
        subscription,
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          data: payload.data ?? {}
        })
      );
    } catch (error: any) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        // Subscription invalid
        for (const [id, existing] of subscriptions.entries()) {
          if (existing.endpoint === subscription.endpoint) {
            this.removeSubscription(id);
            break;
          }
        }
      }
      throw error;
    }
  }
}


