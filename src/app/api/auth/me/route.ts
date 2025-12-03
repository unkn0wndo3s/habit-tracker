import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/middleware/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        pseudo: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Un problème est survenu lors de la récupération du profil' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: dbUser
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return NextResponse.json(
      { error: 'Un problème est survenu lors de la récupération du profil' },
      { status: 500 }
    );
  }
}

