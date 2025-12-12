'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/Icon';

type BasicUser = {
  id: string;
  email: string;
  pseudo?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

type FriendsResponse = {
  friends: Array<{ id: string; user: BasicUser }>;
  pending: {
    incoming: Array<{ id: string; from: BasicUser }>;
    outgoing: Array<{ id: string; to: BasicUser }>;
  };
};

export default function FriendsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FriendsResponse | null>(null);
  const [invite, setInvite] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<FriendsResponse>('/api/friends');
      setData(res);
    } catch (e: any) {
      setError(e.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const allFriends = data?.friends ?? [];
  const incoming = data?.pending.incoming ?? [];
  const outgoing = data?.pending.outgoing ?? [];

  const friendIds = useMemo(() => new Set(allFriends.map((f) => f.user.id)), [allFriends]);

  async function sendRequest() {
    if (!invite.trim()) return;
    setSending(true);
    setError(null);
    try {
      const body = invite.includes('@')
        ? { email: invite.trim() }
        : { pseudo: invite.trim() };
      await apiFetch('/api/friends', { method: 'POST', body: JSON.stringify(body) });
      setInvite('');
      await load();
    } catch (e: any) {
      setError(e.message || 'Erreur envoi requête');
    } finally {
      setSending(false);
    }
  }

  async function act(requestId: string, action: 'accept' | 'decline' | 'cancel') {
    setError(null);
    try {
      await apiFetch(`/api/friends/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      await load();
    } catch (e: any) {
      setError(e.message || 'Erreur action');
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border border-slate-800/70 bg-slate-900/60">
        <CardHeader>
          <CardTitle>Amis</CardTitle>
          <CardDescription>Ajoutez des amis, gérez les demandes et voyez vos connexions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Email ou pseudo..."
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
            />
            <Button onClick={sendRequest} disabled={sending || !invite.trim()}>
              <Icon name="users" className="mr-2 h-4 w-4" />
              Inviter
            </Button>
          </div>

          {error && (
            <div className="text-sm text-red-400">{error}</div>
          )}

          {loading ? (
            <div className="text-sm text-slate-300">Chargement…</div>
          ) : (
            <div className="grid gap-4">
              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-200">Mes amis</h3>
                {allFriends.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucun ami pour le moment.</p>
                ) : (
                  <ul className="space-y-2">
                    {allFriends.map(({ id, user }) => (
                      <li key={id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">Ami</Badge>
                          <span className="text-sm text-slate-200">{userDisplayName(user)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-200">Demandes reçues</h3>
                {incoming.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune demande reçue.</p>
                ) : (
                  <ul className="space-y-2">
                    {incoming.map(({ id, from }) => (
                      <li key={id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                        <div className="text-sm text-slate-200">{userDisplayName(from)}</div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => act(id, 'accept')}>Accepter</Button>
                          <Button size="sm" variant="ghost" onClick={() => act(id, 'decline')}>Refuser</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-200">Demandes envoyées</h3>
                {outgoing.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune demande envoyée.</p>
                ) : (
                  <ul className="space-y-2">
                    {outgoing.map(({ id, to }) => (
                      <li key={id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                        <div className="text-sm text-slate-200">{userDisplayName(to)}</div>
                        <div>
                          <Button size="sm" variant="ghost" onClick={() => act(id, 'cancel')}>Annuler</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function userDisplayName(u: BasicUser) {
  if (u.pseudo) return u.pseudo;
  const fn = [u.firstName, u.lastName].filter(Boolean).join(' ');
  if (fn) return fn;
  return u.email;
}
