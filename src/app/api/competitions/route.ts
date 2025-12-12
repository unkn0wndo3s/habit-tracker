import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const comps = await prisma.competition.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { participants: { some: { userId: user.id } } },
      ],
    },
    include: {
      participants: { include: { user: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(comps);
}

type CreateCompetitionBody = {
  name: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  invitedUserIds?: string[];
};

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null) as CreateCompetitionBody | null;
  if (!body?.name || !body?.startAt || !body?.endAt) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  const start = new Date(body.startAt);
  const end = new Date(body.endAt);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: 'Fenêtre temporelle invalide' }, { status: 400 });
  }

  const invited = Array.from(new Set(body.invitedUserIds ?? [])).filter((id) => id !== user.id);

  // Validate that invited users are friends (accepted) with the owner
  let validInvites: string[] = [];
  if (invited.length) {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: user.id, addresseeId: { in: invited } },
          { addresseeId: user.id, requesterId: { in: invited } },
        ],
      },
      select: { requesterId: true, addresseeId: true },
    });
    const friendIds = new Set<string>();
    friendships.forEach((f) => {
      friendIds.add(f.requesterId === user.id ? f.addresseeId : f.requesterId);
    });
    validInvites = invited.filter((id) => friendIds.has(id));
  }

  const comp = await prisma.competition.create({
    data: {
      name: body.name.trim(),
      ownerId: user.id,
      startAt: start,
      endAt: end,
      participants: {
        create: [
          // owner joins automatically
          { userId: user.id, status: 'ACCEPTED' },
          // invited friends
          ...validInvites.map((uid) => ({ userId: uid, invitedBy: user.id, status: 'INVITED' as const })),
        ],
      },
    },
    include: { participants: { include: { user: true } } },
  });

  return NextResponse.json(comp, { status: 201 });
}
