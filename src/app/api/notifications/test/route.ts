import { NextRequest, NextResponse } from 'next/server';
import { NotificationScheduler } from '@/server/notificationScheduler';

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId } = await request.json();
    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId manquant' }, { status: 400 });
    }

    await NotificationScheduler.scheduleTestNotification(subscriptionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la notification de test:', error);
    return NextResponse.json({ error: 'Impossible de programmer la notification de test' }, { status: 500 });
  }
}


