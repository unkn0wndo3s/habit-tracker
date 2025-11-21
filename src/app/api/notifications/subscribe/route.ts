import { NextRequest, NextResponse } from 'next/server';
import { NotificationScheduler } from '@/server/notificationScheduler';

export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json();

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription manquante' }, { status: 400 });
    }

    const subscriptionId = NotificationScheduler.addSubscription(subscription);
    return NextResponse.json({ subscriptionId });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la subscription push:', error);
    return NextResponse.json({ error: 'Impossible de sauvegarder la subscription' }, { status: 500 });
  }
}


