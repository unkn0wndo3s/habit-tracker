'use client';

import { useMemo } from 'react';
import { Habit } from '@/types/habit';
import { HabitStorage } from '@/services/habitStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

const BASE_TIMEFRAMES = [
  {
    key: '7d',
    label: '7 jours',
    days: 7,
    bucketSize: 1,
    description: 'Progression quotidienne sur la dernière semaine.'
  },
  {
    key: '30d',
    label: '30 jours',
    days: 30,
    bucketSize: 2,
    description: 'Vue détaillée du dernier mois.'
  },
  {
    key: '90d',
    label: '3 mois',
    days: 90,
    bucketSize: 5,
    description: 'Votre cadence sur le trimestre.'
  },
  {
    key: '180d',
    label: '6 mois',
    days: 180,
    bucketSize: 10,
    description: 'Vue intermédiaire sur un semestre.'
  },
  {
    key: '365d',
    label: '1 an',
    days: 365,
    bucketSize: 15,
    description: 'Vos habitudes sur les douze derniers mois.'
  }
];

type CompletionPoint = {
  date: Date;
  dateKey: string;
  scheduledCount: number;
  completedCount: number;
};

type TimeframeConfig = {
  key: string;
  label: string;
  days: number;
  bucketSize: number;
  description: string;
};

interface StatsViewProps {
  habits: Habit[];
}

export default function StatsView({ habits }: StatsViewProps) {
  const habitsFingerprint = useMemo(
    () => habits.map((habit) => habit.id).join('|'),
    [habits]
  );

  const trackedDays = useMemo(() => {
    void habitsFingerprint;
    return HabitStorage.getTrackedDays();
  }, [habitsFingerprint]);

  const timeframes: TimeframeConfig[] = useMemo(() => {
    const allDays = Math.max(trackedDays, 30);
    return [
      ...BASE_TIMEFRAMES,
      {
        key: 'all',
        label: 'Toujours',
        days: allDays,
        bucketSize: Math.max(1, Math.ceil(allDays / 24)),
        description: 'Panorama global depuis vos débuts.'
      }
    ];
  }, [trackedDays]);

  const timelinePerTimeframe = useMemo(() => {
    void habitsFingerprint;
    const map = new Map<string, CompletionPoint[]>();
    timeframes.forEach((tf) => {
      map.set(tf.key, HabitStorage.getCompletionTimeline(tf.days));
    });
    return map;
  }, [timeframes, habitsFingerprint]);

  const monthlyStats = useMemo(() => {
    void habitsFingerprint;
    return HabitStorage.getMonthlyCompletionRate();
  }, [habitsFingerprint]);

  const heatmapData = useMemo(() => {
    void habitsFingerprint;
    return HabitStorage.getHeatmapData(30);
  }, [habitsFingerprint]);

  const habitStats = useMemo(() => {
    void habitsFingerprint;
    return HabitStorage.getHabitStats(30);
  }, [habitsFingerprint]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Statistiques</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Visualisez votre constance</h1>
        <p className="text-sm text-slate-500">
          Comparez vos habitudes sur différentes périodes pour repérer vos temps forts et les axes
          de progression.
        </p>
      </div>

      <Card className="border border-slate-200 bg-gradient-to-br from-indigo-50 to-white shadow-sm shadow-indigo-100">
        <CardHeader className="flex flex-col gap-1">
          <CardTitle>Taux de complétion mensuel</CardTitle>
          <CardDescription>
            {monthlyStats.monthLabel.charAt(0).toUpperCase() + monthlyStats.monthLabel.slice(1)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Taux de complétion</p>
            <p className="text-4xl font-semibold text-indigo-700">{monthlyStats.rate}%</p>
          </div>
          <div className="flex gap-4 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Planifiées</p>
              <p className="text-lg font-semibold text-slate-900">{monthlyStats.scheduled}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Réalisées</p>
              <p className="text-lg font-semibold text-slate-900">{monthlyStats.completed}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white/95 shadow-sm shadow-slate-100">
        <CardHeader>
          <CardTitle>Heatmap des 30 derniers jours</CardTitle>
          <CardDescription>
            Chaque jour est coloré selon le nombre d’habitudes complétées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {heatmapData.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune donnée disponible.</p>
          ) : (
            <div className="grid grid-cols-[repeat(10,minmax(20px,1fr))] gap-1">
              {heatmapData.map((point) => {
                const rate =
                  point.scheduledCount === 0
                    ? 0
                    : Math.round((point.completedCount / point.scheduledCount) * 100);
                return (
                  <div
                    key={point.dateKey}
                    className={cn(
                      'h-8 rounded-md border text-[10px] font-semibold text-white transition',
                      getHeatmapColor(rate)
                    )}
                    title={`${formatLongDate(point.date)} · ${point.completedCount}/${
                      point.scheduledCount
                    } habitudes`}
                  >
                    <span className="sr-only">{rate}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white/95 shadow-sm shadow-slate-100">
        <CardHeader>
          <CardTitle>Statistiques par habitude (30 jours)</CardTitle>
          <CardDescription>
            Analysez le taux de réussite individuel pour chaque habitude active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {habitStats.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune habitude active pour le moment.</p>
          ) : (
            habitStats.map(({ habit, rate, completed, scheduled }) => (
              <div
                key={habit.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-base font-semibold text-slate-900">{habit.name}</p>
                  {habit.description && (
                    <p className="text-xs text-slate-500">{habit.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="text-xs font-semibold text-slate-700">
                    {completed}/{scheduled} réalisées
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-semibold',
                      rate >= 80
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : rate >= 50
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-rose-200 bg-rose-50 text-rose-700'
                    )}
                  >
                    {rate}%
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {timeframes.map((timeframe) => {
        const points = timelinePerTimeframe.get(timeframe.key) ?? [];
        const hasData = points.some((point) => point.scheduledCount > 0);
        const summary = computeSummary(points);
        const chartData = buildChart(points, timeframe.bucketSize);

        return (
          <Card
            key={timeframe.key}
            className="border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-100"
          >
            <CardHeader className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{timeframe.label}</CardTitle>
                  <CardDescription>{timeframe.description}</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs font-semibold text-slate-700">
                  {summary.avgRate}% de réussite
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasData ? (
                <>
                  <div className="flex items-end gap-2 overflow-x-auto">
                    {chartData.map((bucket) => (
                      <div key={bucket.label} className="flex min-w-[28px] flex-1 flex-col gap-2">
                        <div className="flex h-32 items-end rounded-full bg-slate-100 p-1">
                          <div
                            className="w-full rounded-full bg-gradient-to-t from-indigo-400 to-indigo-600 transition-all"
                            style={{ height: `${bucket.rate}%` }}
                            aria-label={`Taux de ${bucket.rate}%`}
                          />
                        </div>
                        <p className="text-center text-[11px] font-medium text-slate-500">
                          {bucket.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-600 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Habitudes réalisées
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">
                        {summary.totalCompleted}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Jours suivis
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">
                        {summary.daysWithSchedule}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Top jour</p>
                      {summary.bestDay ? (
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {summary.bestDay.label}{' '}
                          <span className="text-sm font-normal text-slate-600">
                            ({summary.bestDay.rate}%)
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          Pas encore de données
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Aucune habitude planifiée sur cette période pour le moment.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function computeSummary(points: CompletionPoint[]) {
  const totals = points.reduce(
    (acc, point) => {
      acc.scheduled += point.scheduledCount;
      acc.completed += point.completedCount;
      if (point.scheduledCount > 0) {
        acc.daysWithSchedule += 1;
      }
      return acc;
    },
    { scheduled: 0, completed: 0, daysWithSchedule: 0 }
  );

  const avgRate =
    totals.scheduled === 0 ? 0 : Math.round((totals.completed / totals.scheduled) * 100);

  const best = points.reduce<{
    label: string;
    rate: number;
  } | null>((bestPoint, point) => {
    if (point.scheduledCount === 0) return bestPoint;
    const rate = point.completedCount / point.scheduledCount;
    if (!bestPoint || rate > bestPoint.rate) {
      return {
        label: formatDate(point.date),
        rate: Math.round(rate * 100)
      };
    }
    return bestPoint;
  }, null);

  return {
    totalCompleted: totals.completed,
    daysWithSchedule: totals.daysWithSchedule,
    avgRate,
    bestDay: best ?? null
  };
}

function buildChart(points: CompletionPoint[], bucketSize: number) {
  if (bucketSize <= 0) {
    bucketSize = 1;
  }

  const buckets: Array<{ label: string; rate: number }> = [];

  for (let i = 0; i < points.length; i += bucketSize) {
    const slice = points.slice(i, i + bucketSize);
    const scheduled = slice.reduce((acc, point) => acc + point.scheduledCount, 0);
    const completed = slice.reduce((acc, point) => acc + point.completedCount, 0);
    const rate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);
    const label = slice[slice.length - 1]?.date
      ? formatShortLabel(slice[slice.length - 1].date)
      : '';

    buckets.push({
      label,
      rate
    });
  }

  return buckets;
}

function formatShortLabel(date: Date) {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit'
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
}

function getHeatmapColor(rate: number) {
  if (rate === 0) {
    return 'border-slate-200 bg-slate-100';
  }
  if (rate < 30) {
    return 'border-rose-200 bg-rose-200 text-rose-900';
  }
  if (rate < 60) {
    return 'border-amber-200 bg-amber-300 text-amber-900';
  }
  if (rate < 90) {
    return 'border-lime-200 bg-lime-300 text-lime-900';
  }
  return 'border-emerald-300 bg-emerald-400 text-emerald-900';
}


