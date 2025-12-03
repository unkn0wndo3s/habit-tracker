import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      // Message générique pour éviter l'énumération d'emails
      return NextResponse.json({
        message: 'Si cet email existe, un lien de réinitialisation vous a été envoyé.'
      });
    }

    // Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Toujours retourner le même message pour éviter l'énumération
    if (!user) {
      return NextResponse.json({
        message: 'Si cet email existe, un lien de réinitialisation vous a été envoyé.'
      });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date();
    resetTokenExpiresAt.setHours(resetTokenExpiresAt.getHours() + 1); // Expire dans 1 heure

    // Sauvegarder le token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiresAt
      }
    });

    // Envoyer l'email
    await sendPasswordResetEmail(user.email, resetToken);

    return NextResponse.json({
      message: 'Si cet email existe, un lien de réinitialisation vous a été envoyé.'
    });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    // Toujours retourner le même message
    return NextResponse.json({
      message: 'Si cet email existe, un lien de réinitialisation vous a été envoyé.'
    });
  }
}

