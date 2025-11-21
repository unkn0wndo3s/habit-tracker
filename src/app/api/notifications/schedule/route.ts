import { NextRequest, NextResponse } from 'next/server';
import { NotificationScheduler } from '@/server/notificationScheduler';

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, habitId, habitName, scheduledAt } = await request.json();

    if (!subscriptionId || !habitId || !habitName || !scheduledAt) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    await NotificationScheduler.scheduleNotification({
      subscriptionId,
      habitId,
      scheduledAt,
      title: 'TrackIt — Rappel',
      body: `N'oubliez pas : ${habitName}`,
      data: {
        url: '/',
        habitId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la programmation d’une notification:', error);
    return NextResponse.json({ error: 'Impossible de programmer la notification' }, { status: 500 });
  }
}


