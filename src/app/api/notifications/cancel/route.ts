import { NextRequest, NextResponse } from 'next/server';
import { NotificationScheduler } from '@/server/notificationScheduler';

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, habitId, cancelAll } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId manquant' }, { status: 400 });
    }

    if (cancelAll) {
      NotificationScheduler.cancelAllForSubscription(subscriptionId);
      return NextResponse.json({ success: true });
    }

    if (!habitId) {
      return NextResponse.json({ error: 'habitId manquant' }, { status: 400 });
    }

    NotificationScheduler.cancelNotification(subscriptionId, habitId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de l’annulation des notifications:', error);
    return NextResponse.json({ error: 'Impossible d’annuler' }, { status: 500 });
  }
}


