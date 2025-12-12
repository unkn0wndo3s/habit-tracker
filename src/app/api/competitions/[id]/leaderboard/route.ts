import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

function toDateKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const comp = await prisma.competition.findUnique({
    where: { id },
    include: { participants: true },
  });
  if (!comp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Ensure user is part of the competition (owner or participant)
  const isMember = comp.ownerId === user.id || comp.participants.some((p) => p.userId === user.id);
  if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const startKey = toDateKey(new Date(comp.startAt));
  const endKey = toDateKey(new Date(comp.endAt));

  // Only accepted participants are scored; owner is included if present
  const participantUserIds = Array.from(new Set([
    comp.ownerId,
    ...comp.participants.filter((p) => p.status === 'ACCEPTED').map((p) => p.userId),
  ]));

  // Compute points: number of HabitCompletion for habits belonging to user within window
  const scores = await Promise.all(
    participantUserIds.map(async (uid) => {
      const count = await prisma.habitCompletion.count({
        where: {
          dateKey: { gte: startKey, lte: endKey },
          habit: { userId: uid },
        },
      });
      return { userId: uid, points: count };
    })
  );

  // Enrich with basic user info
  const users = await prisma.user.findMany({
    where: { id: { in: participantUserIds } },
    select: { id: true, email: true, pseudo: true, firstName: true, lastName: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u] as const));

  const leaderboard = scores
    .map((s) => ({ ...s, user: userMap.get(s.userId) }))
    .sort((a, b) => b.points - a.points);

  return NextResponse.json({
    competition: { id: comp.id, name: comp.name, startAt: comp.startAt, endAt: comp.endAt, status: comp.status },
    leaderboard,
  });
}
