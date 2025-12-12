'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Modal from '@/components/Modal';
import LeaderboardView from './LeaderboardView';

type BasicUser = {
  id: string;
  email: string;
  pseudo?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

type FriendsResponse = {
  friends: Array<{ id: string; user: BasicUser }>;
  pending: { incoming: any[]; outgoing: any[] };
};

type Competition = {
  id: string;
  name: string;
  ownerId: string;
  startAt: string;
  endAt: string;
  status: 'ACTIVE' | 'ENDED';
  participants: Array<{ user: BasicUser; status: 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'LEFT' }>;
};

export default function CompetitionsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  // Create form state
  const [name, setName] = useState('');
  const [startAt, setStartAt] = useState<string>(defaultStart());
  const [endAt, setEndAt] = useState<string>(defaultEnd());
  const [friends, setFriends] = useState<BasicUser[]>([]);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const [openLeaderboardFor, setOpenLeaderboardFor] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const comps = await apiFetch<Competition[]>('/api/competitions');
      setCompetitions(comps);
      // Load friends for inviting
      const fr = await apiFetch<FriendsResponse>('/api/friends');
      setFriends(fr.friends.map((f) => f.user));
    } catch (e: any) {
      setError(e.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const canSubmit = useMemo(() => {
    return name.trim().length >= 3 && startAt !== '' && endAt !== '' && new Date(endAt) > new Date(startAt);
  }, [name, startAt, endAt]);

  async function createCompetition() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch<Competition>('/api/competitions', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          invitedUserIds: Array.from(invited),
        }),
      });
      // reset
      setName('');
      setStartAt(defaultStart());
      setEndAt(defaultEnd());
      setInvited(new Set());
      await load();
    } catch (e: any) {
      setError(e.message || 'Erreur création');
    } finally {
      setSubmitting(false);
    }
  }

  function toggleInvite(id: string) {
    setInvited((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <Card className="border border-slate-800/70 bg-slate-900/60">
        <CardHeader>
          <CardTitle>Compétitions</CardTitle>
          <CardDescription>Créez des compétitions et consultez vos classements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create form */}
          <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3 sm:p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-300">Nom</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Défi semaine" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-300">Début</label>
                  <Input type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-300">Fin</label>
                  <Input type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-300">Inviter des amis</label>
              {friends.length === 0 ? (
                <p className="text-sm text-slate-400">Aucun ami disponible. Ajoutez d'abord des amis.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {friends.map((u) => {
                    const checked = invited.has(u.id);
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => toggleInvite(u.id)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${checked ? 'border-indigo-500 bg-indigo-500/20 text-indigo-100' : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:bg-slate-800/60'}`}
                          title="Inviter / Retirer"
                        >
                          {displayName(u)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={createCompetition} disabled={!canSubmit || submitting}>Créer</Button>
            </div>
          </div>

          {/* List competitions */}
          {error && <div className="text-sm text-red-400">{error}</div>}
          {loading ? (
            <div className="text-sm text-slate-300">Chargement…</div>
          ) : competitions.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune compétition encore. Créez votre première !</p>
          ) : (
            <ul className="space-y-3">
              {competitions.map((c) => (
                <li key={c.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{c.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {formatDate(c.startAt)} → {formatDate(c.endAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                        {c.status}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => setOpenLeaderboardFor(c.id)}>
                        Voir le classement
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.participants.map((p, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px]">
                        {displayName(p.user)}{p.status !== 'ACCEPTED' ? ` (${p.status.toLowerCase()})` : ''}
                      </Badge>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={!!openLeaderboardFor}
        onClose={() => setOpenLeaderboardFor(null)}
        title="Classement"
        size="md"
      >
        {openLeaderboardFor && (
          <LeaderboardView competitionId={openLeaderboardFor} />
        )}
      </Modal>
    </div>
  );
}

function displayName(u: BasicUser) {
  if (u.pseudo) return u.pseudo;
  const fn = [u.firstName, u.lastName].filter(Boolean).join(' ');
  if (fn) return fn;
  return u.email;
}

function defaultStart() {
  const d = new Date();
  // format yyyy-mm-dd
  return d.toISOString().slice(0, 10);
}

function defaultEnd() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
