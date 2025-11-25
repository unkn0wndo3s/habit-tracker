'use client';

import { useState, useMemo } from 'react';
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
    groupByMonth: false,
    description: 'Progression quotidienne sur la dernière semaine.'
  },
  {
    key: '30d',
    label: '30 jours',
    days: 30,
    bucketSize: 2,
    groupByMonth: false,
    description: 'Vue détaillée du dernier mois.'
  },
  {
    key: '90d',
    label: '3 mois',
    months: 3,
    groupByMonth: true,
    description: 'Votre cadence sur le trimestre.'
  },
  {
    key: '180d',
    label: '6 mois',
    months: 6,
    groupByMonth: true,
    description: 'Vue intermédiaire sur un semestre.'
  },
  {
    key: '365d',
    label: '1 an',
    months: 12,
    groupByMonth: true,
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
  days?: number;
  months?: number;
  bucketSize?: number;
  groupByMonth: boolean;
  description: string;
};

interface StatsViewProps {
  habits: Habit[];
}

export default function StatsView({ habits }: StatsViewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30d');
  
  const habitsFingerprint = useMemo(
    () => habits.map((habit) => habit.id).join('|'),
    [habits]
  );

  const trackedDays = useMemo(() => {
    void habitsFingerprint;
    return HabitStorage.getTrackedDays();
  }, [habitsFingerprint]);

  const timeframes: TimeframeConfig[] = useMemo(() => {
    return [
      ...BASE_TIMEFRAMES,
      {
        key: 'all',
        label: 'Toujours',
        groupByMonth: true,
        description: 'Panorama global depuis vos débuts.'
      }
    ];
  }, []);

  const timelinePerTimeframe = useMemo(() => {
    void habitsFingerprint;
    const map = new Map<string, CompletionPoint[]>();
    timeframes.forEach((tf) => {
      if (tf.groupByMonth) {
        const months = tf.months || undefined; // undefined = tous les mois
        map.set(tf.key, HabitStorage.getCompletionTimelineByMonth(months));
      } else if (tf.days) {
        map.set(tf.key, HabitStorage.getCompletionTimeline(tf.days));
      }
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
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Statistiques</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-100">Visualisez votre constance</h1>
        <p className="text-sm text-slate-400">
          Comparez vos habitudes sur différentes périodes pour repérer vos temps forts et les axes
          de progression.
        </p>
      </div>

      <Card className="border border-slate-800/70 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 shadow-2xl shadow-black/40">
        <CardHeader className="flex flex-col gap-1">
          <CardTitle>Taux de complétion mensuel</CardTitle>
          <CardDescription>
            {monthlyStats.monthLabel.charAt(0).toUpperCase() + monthlyStats.monthLabel.slice(1)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-400">Taux de complétion</p>
            <p className="text-4xl font-semibold text-indigo-200">{monthlyStats.rate}%</p>
          </div>
          <div className="flex gap-4 text-sm text-slate-300">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Planifiées</p>
              <p className="text-lg font-semibold text-slate-100">{monthlyStats.scheduled}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Réalisées</p>
              <p className="text-lg font-semibold text-slate-100">{monthlyStats.completed}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30 backdrop-blur">
        <CardHeader>
          <CardTitle>Heatmap des 30 derniers jours</CardTitle>
          <CardDescription>
            Chaque jour est coloré selon le nombre d’habitudes complétées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {heatmapData.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune donnée disponible.</p>
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
                      'h-8 rounded-md border text-[10px] font-semibold transition',
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

      <Card className="border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30 backdrop-blur">
        <CardHeader>
          <CardTitle>Statistiques par habitude (30 jours)</CardTitle>
          <CardDescription>
            Analysez le taux de réussite individuel pour chaque habitude active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {habitStats.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune habitude active pour le moment.</p>
          ) : (
            habitStats.map(({ habit, rate, completed, scheduled }) => (
              <div
                key={habit.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-base font-semibold text-slate-100">{habit.name}</p>
                  {habit.description && (
                    <p className="text-xs text-slate-400">{habit.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="text-xs font-semibold text-slate-200">
                    {completed}/{scheduled} réalisées
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-semibold',
                      rate >= 80
                        ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
                        : rate >= 50
                        ? 'border-amber-400/60 bg-amber-400/15 text-amber-100'
                        : 'border-rose-400/60 bg-rose-500/20 text-rose-100'
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

      {/* Segmented control pour sélectionner la période */}
      <Card className="border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30 backdrop-blur">
        <CardHeader>
          <CardTitle>Progression dans le temps</CardTitle>
          <CardDescription>Sélectionnez une période pour voir l'évolution de vos habitudes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe.key}
                type="button"
                onClick={() => setSelectedTimeframe(timeframe.key)}
                className={cn(
                  'rounded-xl border px-4 py-2 text-sm font-medium transition-all',
                  selectedTimeframe === timeframe.key
                    ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-100 shadow-[0_10px_30px_rgba(99,102,241,0.2)]'
                    : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-indigo-500/40 hover:text-slate-100'
                )}
              >
                {timeframe.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {(() => {
        const timeframe = timeframes.find(tf => tf.key === selectedTimeframe);
        if (!timeframe) return null;
        
        const points = timelinePerTimeframe.get(timeframe.key) ?? [];
        const hasData = points.some((point) => point.scheduledCount > 0);
        const summary = computeSummary(points);
        const chartData = timeframe.groupByMonth 
          ? buildChartByMonth(points)
          : buildChart(points, timeframe.bucketSize || 1);

        return (
          <Card
            key={timeframe.key}
            className="border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30"
          >
            <CardHeader className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{timeframe.label}</CardTitle>
                  <CardDescription>{timeframe.description}</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs font-semibold text-slate-200">
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
                        <div className="flex h-32 items-end rounded-full bg-slate-800/50 p-1">
                          <div
                            className="w-full rounded-full bg-gradient-to-t from-indigo-900 via-indigo-500 to-indigo-400 transition-all"
                            style={{ height: `${bucket.rate}%` }}
                            aria-label={`Taux de ${bucket.rate}%`}
                          />
                        </div>
                        <p className="text-center text-[11px] font-medium text-slate-400">
                          {bucket.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 rounded-2xl border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Habitudes réalisées
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-slate-100">
                        {summary.totalCompleted}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {timeframe.groupByMonth ? 'Mois suivis' : 'Jours suivis'}
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-slate-100">
                        {summary.daysWithSchedule}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {timeframe.groupByMonth ? 'Meilleur mois' : 'Top jour'}
                      </p>
                      {summary.bestDay ? (
                        <p className="mt-1 text-base font-semibold text-slate-100">
                          {summary.bestDay.label}{' '}
                          <span className="text-sm font-normal text-slate-400">
                            ({summary.bestDay.rate}%)
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1 text-base font-semibold text-slate-100">
                          Pas encore de données
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">
                  Aucune habitude planifiée sur cette période pour le moment.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })()}
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
      // Vérifier si c'est un mois (dateKey contient seulement année-mois)
      const isMonth = /^\d{4}-\d{2}$/.test(point.dateKey);
      return {
        label: isMonth ? formatMonthLabel(point.date) : formatDate(point.date),
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

function formatDate(date: Date) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
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

function buildChartByMonth(points: CompletionPoint[]) {
  return points.map((point) => {
    const rate =
      point.scheduledCount === 0
        ? 0
        : Math.round((point.completedCount / point.scheduledCount) * 100);
    const label = formatMonthLabel(point.date);
    return { label, rate };
  });
}

function formatShortLabel(date: Date) {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit'
  });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString('fr-FR', {
    month: 'short',
    year: '2-digit'
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
    return 'border-slate-800/70 bg-slate-900/40 text-slate-500';
  }
  if (rate < 30) {
    return 'border-rose-500/40 bg-rose-500/20 text-rose-100';
  }
  if (rate < 60) {
    return 'border-amber-400/40 bg-amber-400/20 text-amber-100';
  }
  if (rate < 90) {
    return 'border-emerald-400/40 bg-emerald-400/20 text-emerald-100';
  }
  return 'border-emerald-300/60 bg-emerald-300/25 text-emerald-50';
}


