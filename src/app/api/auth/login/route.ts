import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Toujours vérifier le mot de passe même si l'utilisateur n'existe pas
    // pour éviter l'énumération d'emails (timing attack)
    let isValidPassword = false;
    let foundUser = null;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (user) {
      foundUser = user;
      isValidPassword = await comparePassword(password, user.password);
    } else {
      // Simuler le temps de vérification du mot de passe pour éviter les timing attacks
      await comparePassword('dummy', '$2a$10$dummyhashfordummycomparison');
    }

    if (!foundUser || !isValidPassword) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Générer le token
    const token = generateToken({
      userId: foundUser.id,
      email: foundUser.email
    });

    return NextResponse.json({
      token,
      user: {
        id: foundUser.id,
        email: foundUser.email
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { error: 'Un problème est survenu lors de la connexion' },
      { status: 500 }
    );
  }
}

