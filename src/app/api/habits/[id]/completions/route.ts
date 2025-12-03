import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/middleware/auth';
import { getDateKey } from '@/utils/dateUtils';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { date } = body;

    // Vérifier que l'habitude appartient à l'utilisateur
    const habit = await prisma.habit.findFirst({
      where: {
        id,
        userId: user.userId
      }
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Un problème est survenu lors de la modification de la complétion' },
        { status: 404 }
      );
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate > today) {
      return NextResponse.json(
        { error: 'Impossible de compléter une habitude dans le futur' },
        { status: 400 }
      );
    }

    const dateKey = getDateKey(targetDate);

    // Vérifier si la complétion existe déjà
    const existingCompletion = await prisma.habitCompletion.findUnique({
      where: {
        habitId_dateKey: {
          habitId: id,
          dateKey
        }
      }
    });

    if (existingCompletion) {
      // Supprimer la complétion (toggle off)
      await prisma.habitCompletion.delete({
        where: {
          habitId_dateKey: {
            habitId: id,
            dateKey
          }
        }
      });

      return NextResponse.json({ completed: false });
    } else {
      // Créer la complétion (toggle on)
      await prisma.habitCompletion.create({
        data: {
          habitId: id,
          dateKey,
          completedAt: new Date()
        }
      });

      return NextResponse.json({ completed: true });
    }
  } catch (error) {
    console.error('Erreur lors du toggle de la complétion:', error);
    return NextResponse.json(
      { error: 'Un problème est survenu lors de la modification de la complétion' },
      { status: 500 }
    );
  }
}

