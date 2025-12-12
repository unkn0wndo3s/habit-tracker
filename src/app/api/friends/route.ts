import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [acceptedAsRequester, acceptedAsAddressee, incoming, outgoing] = await Promise.all([
    prisma.friendship.findMany({
      where: { requesterId: user.id, status: 'ACCEPTED' },
      include: { addressee: true },
    }),
    prisma.friendship.findMany({
      where: { addresseeId: user.id, status: 'ACCEPTED' },
      include: { requester: true },
    }),
    prisma.friendship.findMany({
      where: { addresseeId: user.id, status: 'PENDING' },
      include: { requester: true },
    }),
    prisma.friendship.findMany({
      where: { requesterId: user.id, status: 'PENDING' },
      include: { addressee: true },
    }),
  ]);

  const friends = [
    ...acceptedAsRequester.map((f) => ({ id: f.id, user: f.addressee })),
    ...acceptedAsAddressee.map((f) => ({ id: f.id, user: f.requester })),
  ];

  return NextResponse.json({
    friends,
    pending: {
      incoming: incoming.map((f) => ({ id: f.id, from: f.requester })),
      outgoing: outgoing.map((f) => ({ id: f.id, to: f.addressee })),
    },
  });
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { userId?: string; email?: string; pseudo?: string } | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  let target = null as null | { id: string };
  if (body.userId) {
    target = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true } });
  } else if (body.email) {
    target = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } });
  } else if (body.pseudo) {
    target = await prisma.user.findFirst({ where: { pseudo: body.pseudo }, select: { id: true } });
  }

  if (!target) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }
  if (target.id === user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas vous ajouter vous-même' }, { status: 400 });
  }

  // Prevent duplicate or reversed friendships
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, addresseeId: target.id },
        { requesterId: target.id, addresseeId: user.id },
      ],
    },
  });
  if (existing) {
    return NextResponse.json({ error: 'Relation déjà existante' }, { status: 409 });
  }

  const created = await prisma.friendship.create({
    data: { requesterId: user.id, addresseeId: target.id, status: 'PENDING' },
  });

  return NextResponse.json({ id: created.id, status: created.status }, { status: 201 });
}
