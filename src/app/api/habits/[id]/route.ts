import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/middleware/auth';
import { Habit } from '@/types/habit';

export async function PUT(
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
    const { name, description, targetDays, tags, archived, notificationEnabled, notificationTime } = body;

    // Vérifier que l'habitude appartient à l'utilisateur
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id,
        userId: user.userId
      }
    });

    if (!existingHabit) {
      return NextResponse.json(
        { error: 'Un problème est survenu lors de la mise à jour de l\'habitude' },
        { status: 404 }
      );
    }

    // Normaliser les tags si présents
    let normalizedTags = existingHabit.tags;
    if (tags !== undefined) {
      normalizedTags = (tags || [])
        .map((tag: string) => tag.trim().toLowerCase())
        .filter((tag: string) => tag.length > 0)
        .filter((tag: string, index: number, array: string[]) => array.indexOf(tag) === index);
    }

    const habit = await prisma.habit.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingHabit.name,
        description: description !== undefined ? (description || null) : existingHabit.description,
        targetDays: targetDays !== undefined ? targetDays : existingHabit.targetDays,
        tags: normalizedTags,
        archived: archived !== undefined ? archived : existingHabit.archived,
        notificationEnabled: notificationEnabled !== undefined ? notificationEnabled : existingHabit.notificationEnabled,
        notificationTime: notificationTime !== undefined ? (notificationTime || null) : existingHabit.notificationTime
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

    return NextResponse.json({ habit: formattedHabit });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'habitude:', error);
    return NextResponse.json(
      { error: 'Un problème est survenu lors de la mise à jour de l\'habitude' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Vérifier que l'habitude appartient à l'utilisateur
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id,
        userId: user.userId
      }
    });

    if (!existingHabit) {
      return NextResponse.json(
        { error: 'Un problème est survenu lors de la suppression de l\'habitude' },
        { status: 404 }
      );
    }

    // Supprimer l'habitude (les complétions seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.habit.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'habitude:', error);
    return NextResponse.json(
      { error: 'Un problème est survenu lors de la suppression de l\'habitude' },
      { status: 500 }
    );
  }
}

