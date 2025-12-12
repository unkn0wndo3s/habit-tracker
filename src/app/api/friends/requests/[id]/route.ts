import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

// PATCH /api/friends/requests/:id
// body: { action: 'accept' | 'decline' | 'cancel' }
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  const body = await request.json().catch(() => null) as { action?: 'accept' | 'decline' | 'cancel' } | null;
  if (!body?.action) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Accept / decline allowed to addressee; cancel allowed to requester (while pending)
  if (body.action === 'accept' || body.action === 'decline') {
    if (friendship.addresseeId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (friendship.status !== 'PENDING') {
      return NextResponse.json({ error: 'Déjà traité' }, { status: 409 });
    }
    const updated = await prisma.friendship.update({
      where: { id },
      data: {
        status: body.action === 'accept' ? 'ACCEPTED' : 'DECLINED',
        respondedAt: new Date(),
      },
    });
    return NextResponse.json({ id: updated.id, status: updated.status });
  }

  if (body.action === 'cancel') {
    if (friendship.requesterId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (friendship.status !== 'PENDING') {
      return NextResponse.json({ error: 'Impossible d’annuler' }, { status: 409 });
    }
    await prisma.friendship.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
