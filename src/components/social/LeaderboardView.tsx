'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type LeaderboardItem = {
  userId: string;
  points: number;
  user: {
    id: string;
    email: string;
    pseudo?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

type LeaderboardResponse = {
  competition: { id: string; name: string; startAt: string | Date; endAt: string | Date; status: string };
  leaderboard: LeaderboardItem[];
};

export default function LeaderboardView({ competitionId }: { competitionId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LeaderboardResponse | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<LeaderboardResponse>(`/api/competitions/${competitionId}/leaderboard`);
        setData(res);
      } catch (e: any) {
        setError(e.message || 'Erreur chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [competitionId]);

  return (
    <Card className="border border-slate-800/70 bg-slate-900/60">
      <CardHeader>
        <CardTitle>Classement</CardTitle>
        <CardDescription>Points cumulés durant la période</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-sm text-slate-300">Chargement…</div>}
        {error && <div className="text-sm text-red-400">{error}</div>}
        {!loading && !error && (
          <ul className="space-y-2">
            {data?.leaderboard.map((row, idx) => (
              <li key={row.userId} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Badge variant={idx === 0 ? 'success' : 'secondary'} className="text-[10px]">#{idx + 1}</Badge>
                  <span className="text-sm text-slate-200">{displayName(row.user)}</span>
                </div>
                <div className="text-sm font-semibold text-indigo-200">{row.points} pt{row.points > 1 ? 's' : ''}</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function displayName(u: LeaderboardItem['user']) {
  if (!u) return 'Utilisateur';
  if (u.pseudo) return u.pseudo;
  const fn = [u.firstName, u.lastName].filter(Boolean).join(' ');
  if (fn) return fn;
  return u.email;
}
