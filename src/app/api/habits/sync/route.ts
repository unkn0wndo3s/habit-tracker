import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/middleware/auth';
import { Habit } from '@/types/habit';
import { getDateKey } from '@/utils/dateUtils';

interface SyncRequest {
  habits: Habit[];
  completions: Record<string, Array<{ habitId: string; completedAt: string }>>;
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

    const body: SyncRequest = await request.json();
    const { habits, completions } = body;

    if (!habits || !Array.isArray(habits) || !completions || typeof completions !== 'object') {
      return NextResponse.json(
        { error: 'Format de données invalide' },
        { status: 400 }
      );
    }

    // Récupérer les habitudes existantes de l'utilisateur
    const existingHabits = await prisma.habit.findMany({
      where: { userId: user.userId }
    });

    const existingHabitIds = new Set(existingHabits.map(h => h.id));
    const localHabitIds = new Set(habits.map(h => h.id));

    // Fusionner les habitudes : créer celles qui n'existent pas, mettre à jour celles qui existent
  const habitsToCreate: typeof habits = [];
  const habitsToMaybeUpdate: typeof habits = [];

    for (const habit of habits) {
      if (existingHabitIds.has(habit.id)) {
        habitsToMaybeUpdate.push(habit);
      } else {
        habitsToCreate.push(habit);
      }
    }

    // Créer les nouvelles habitudes
    for (const habit of habitsToCreate) {
      const normalizedTags = (habit.tags || [])
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .filter((tag, index, array) => array.indexOf(tag) === index);

      await prisma.habit.create({
        data: {
          id: habit.id, // Utiliser l'ID du localStorage pour garder la cohérence
          userId: user.userId,
          name: habit.name,
          description: habit.description || null,
          targetDays: habit.targetDays,
          tags: normalizedTags,
          archived: habit.archived || false,
          notificationEnabled: habit.notificationEnabled || false,
          notificationTime: habit.notificationTime || null,
          createdAt: habit.createdAt
        }
      });
    }

    // Mettre à jour les habitudes existantes
    for (const habit of habitsToMaybeUpdate) {
      const existingHabit = existingHabits.find(h => h.id === habit.id);
      if (!existingHabit) continue;

      const localUpdatedAt = habit.updatedAt ? new Date(habit.updatedAt) : null;
      const dbUpdatedAt = existingHabit.updatedAt;

      // Mettre à jour en BDD uniquement si la version locale est plus récente
      if (localUpdatedAt && localUpdatedAt > dbUpdatedAt) {
      const normalizedTags = (habit.tags || [])
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .filter((tag, index, array) => array.indexOf(tag) === index);

      await prisma.habit.update({
        where: { id: habit.id },
        data: {
          name: habit.name,
          description: habit.description || null,
          targetDays: habit.targetDays,
          tags: normalizedTags,
          archived: habit.archived || false,
          notificationEnabled: habit.notificationEnabled || false,
            notificationTime: habit.notificationTime || null,
            updatedAt: localUpdatedAt
        }
      });
    }
    }

    // Synchroniser les complétions
    for (const [dateKey, dayCompletions] of Object.entries(completions)) {
      for (const completion of dayCompletions) {
        // Vérifier que l'habitude appartient à l'utilisateur
        if (!localHabitIds.has(completion.habitId)) {
          continue;
        }

        // Vérifier si la complétion existe déjà
        const existing = await prisma.habitCompletion.findUnique({
          where: {
            habitId_dateKey: {
              habitId: completion.habitId,
              dateKey
            }
          }
        });

        if (!existing) {
          await prisma.habitCompletion.create({
            data: {
              habitId: completion.habitId,
              dateKey,
              completedAt: new Date(completion.completedAt)
            }
          });
        }
      }
    }

    // Récupérer toutes les habitudes de la BDD pour les renvoyer
    const allHabits = await prisma.habit.findMany({
      where: { userId: user.userId },
      include: {
        completions: {
          select: {
            dateKey: true,
            completedAt: true
          }
        }
      }
    });

    // Récupérer toutes les complétions
    const allCompletions: Record<string, Array<{ habitId: string; completedAt: string }>> = {};
    for (const habit of allHabits) {
      for (const completion of habit.completions) {
        if (!allCompletions[completion.dateKey]) {
          allCompletions[completion.dateKey] = [];
        }
        allCompletions[completion.dateKey].push({
          habitId: habit.id,
          completedAt: completion.completedAt.toISOString()
        });
      }
    }

    const formattedHabits: Habit[] = allHabits.map(habit => ({
      id: habit.id,
      name: habit.name,
      description: habit.description || undefined,
      targetDays: habit.targetDays as Habit['targetDays'],
      tags: habit.tags,
      archived: habit.archived,
      notificationEnabled: habit.notificationEnabled,
      notificationTime: habit.notificationTime || undefined,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt
    }));

    return NextResponse.json({
      habits: formattedHabits,
      completions: allCompletions
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
    return NextResponse.json(
      { error: 'Un problème est survenu lors de la synchronisation' },
      { status: 500 }
    );
  }
}

