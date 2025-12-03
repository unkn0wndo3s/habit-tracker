import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/middleware/auth';
import { Habit } from '@/types/habit';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const habits = await prisma.habit.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'asc' },
      include: {
        completions: {
          select: {
            dateKey: true,
            completedAt: true
          }
        }
      }
    });

    // Convertir au format Habit
    const formattedHabits: Habit[] = habits.map(habit => ({
      id: habit.id,
      name: habit.name,
      description: habit.description || undefined,
      targetDays: habit.targetDays as Habit['targetDays'],
      tags: habit.tags,
      archived: habit.archived,
      notificationEnabled: habit.notificationEnabled,
      notificationTime: habit.notificationTime || undefined,
      createdAt: habit.createdAt
    }));

    return NextResponse.json({ habits: formattedHabits });
  } catch (error) {
    console.error('Erreur lors de la récupération des habitudes:', error);
    return NextResponse.json(
      { error: 'Un problème est survenu lors de la récupération des habitudes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, targetDays, tags, notificationEnabled, notificationTime } = body;

    if (!name || !targetDays || !Array.isArray(targetDays)) {
      return NextResponse.json(
        { error: 'Nom et jours cibles requis' },
        { status: 400 }
      );
    }

    // Normaliser les tags
    const normalizedTags = (tags || [])
      .map((tag: string) => tag.trim().toLowerCase())
      .filter((tag: string) => tag.length > 0)
      .filter((tag: string, index: number, array: string[]) => array.indexOf(tag) === index);

    const habit = await prisma.habit.create({
      data: {
        userId: user.userId,
        name,
        description: description || null,
        targetDays,
        tags: normalizedTags,
        notificationEnabled: notificationEnabled || false,
        notificationTime: notificationTime || null
      }
    });

    const formattedHabit: Habit = {
      id: habit.id,
      name: habit.name,
      description: habit.description || undefined,
      targetDays: habit.targetDays as Habit['targetDays'],
      tags: habit.tags,
      archived: habit.archived,
      notificationEnabled: habit.notificationEnabled,
      notificationTime: habit.notificationTime || undefined,
      createdAt: habit.createdAt
    };

    return NextResponse.json({ habit: formattedHabit }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'habitude:', error);
    return NextResponse.json(
      { error: 'Un problème est survenu lors de la création de l\'habitude' },
      { status: 500 }
    );
  }
}

