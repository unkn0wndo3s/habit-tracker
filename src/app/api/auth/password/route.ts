import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/middleware/auth';
import { comparePassword, hashPassword } from '@/lib/auth';
import { sendPasswordChangedEmail } from '@/lib/email';

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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Le mot de passe actuel et le nouveau mot de passe sont requis' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur avec le mot de passe
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { password: true, email: true }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Un problème est survenu lors de la modification du mot de passe' },
        { status: 404 }
      );
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await comparePassword(currentPassword, dbUser.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Le mot de passe actuel est incorrect' },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hashPassword(newPassword);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: user.userId },
      data: { password: hashedPassword }
    });

    // Envoyer un email de confirmation
    await sendPasswordChangedEmail(dbUser.email);

    return NextResponse.json({
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la modification du mot de passe:', error);
    return NextResponse.json(
      { error: 'Un problème est survenu lors de la modification du mot de passe' },
      { status: 500 }
    );
  }
}

