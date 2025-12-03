import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/middleware/auth';

export async function PUT(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pseudo, firstName, lastName } = body;

    // Validation
    if (pseudo !== undefined && (typeof pseudo !== 'string' || pseudo.length > 50)) {
      return NextResponse.json(
        { error: 'Un problème est survenu lors de la mise à jour du profil' },
        { status: 400 }
      );
    }

    if (firstName !== undefined && (typeof firstName !== 'string' || firstName.length > 100)) {
      return NextResponse.json(
        { error: 'Un problème est survenu lors de la mise à jour du profil' },
        { status: 400 }
      );
    }

    if (lastName !== undefined && (typeof lastName !== 'string' || lastName.length > 100)) {
      return NextResponse.json(
        { error: 'Un problème est survenu lors de la mise à jour du profil' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: {
        ...(pseudo !== undefined && { pseudo: pseudo.trim() || null }),
        ...(firstName !== undefined && { firstName: firstName.trim() || null }),
        ...(lastName !== undefined && { lastName: lastName.trim() || null }),
      },
      select: {
        id: true,
        email: true,
        pseudo: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      user: updatedUser
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json(
      { error: 'Un problème est survenu lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}

