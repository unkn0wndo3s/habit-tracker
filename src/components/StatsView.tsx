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
    <div className="space-y-4 p-3 sm:space-y-5 sm:p-4 md:p-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 sm:text-xs">Statistiques</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-100 sm:text-2xl">Visualisez votre constance</h1>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
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
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-400 sm:text-sm">Taux de complétion</p>
            <p className="text-3xl font-semibold text-indigo-200 sm:text-4xl">{monthlyStats.rate}%</p>
          </div>
          <div className="flex gap-4 text-sm text-slate-300">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:text-xs">Planifiées</p>
              <p className="text-base font-semibold text-slate-100 sm:text-lg">{monthlyStats.scheduled}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:text-xs">Réalisées</p>
              <p className="text-base font-semibold text-slate-100 sm:text-lg">{monthlyStats.completed}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30 backdrop-blur">
        <CardHeader>
          <CardTitle>Heatmap des 30 derniers jours</CardTitle>
          <CardDescription>
            Chaque jour est coloré selon le nombre d'habitudes complétées.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {heatmapData.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune donnée disponible.</p>
          ) : (
            <>
              <div className="grid grid-cols-[repeat(10,minmax(16px,1fr))] gap-0.5 sm:grid-cols-[repeat(10,minmax(20px,1fr))] sm:gap-1">
                {heatmapData.map((point) => {
                  const completedCount = point.completedCount;
                  const intensity = getHeatmapIntensity(completedCount, heatmapData);
                  return (
                    <div
                      key={point.dateKey}
                      className={cn(
                        'h-6 rounded-sm transition-all hover:scale-110 hover:ring-2 hover:ring-indigo-400/50 sm:h-8',
                        getHeatmapColorClass(intensity)
                      )}
                      title={`${formatLongDate(point.date)}: ${completedCount} ${completedCount === 1 ? 'habitude' : 'habitudes'} complétée${completedCount > 1 ? 's' : ''}${point.scheduledCount > 0 ? ` sur ${point.scheduledCount}` : ''}`}
                    >
                      <span className="sr-only">
                        {completedCount} {completedCount === 1 ? 'habitude' : 'habitudes'} complétée{completedCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* Légende style GitHub */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="hidden sm:inline">Moins</span>
                  <div className="flex items-center gap-0.5">
                    <div className={cn('h-3 w-3 rounded-sm border', getHeatmapColorClass(0))} title="Aucune habitude complétée" />
                    <div className={cn('h-3 w-3 rounded-sm border', getHeatmapColorClass(1))} title="Peu d'habitudes complétées" />
                    <div className={cn('h-3 w-3 rounded-sm border', getHeatmapColorClass(2))} title="Quelques habitudes complétées" />
                    <div className={cn('h-3 w-3 rounded-sm border', getHeatmapColorClass(3))} title="Beaucoup d'habitudes complétées" />
                    <div className={cn('h-3 w-3 rounded-sm border', getHeatmapColorClass(4))} title="Maximum d'habitudes complétées" />
                  </div>
                  <span className="hidden sm:inline">Plus</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 sm:text-xs">
                  <span className="flex items-center gap-1">
                    <div className={cn('h-2.5 w-2.5 rounded-sm border', getHeatmapColorClass(0))} />
                    <span>Aucune</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <div className={cn('h-2.5 w-2.5 rounded-sm border', getHeatmapColorClass(1))} />
                    <span>Faible</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <div className={cn('h-2.5 w-2.5 rounded-sm border', getHeatmapColorClass(2))} />
                    <span>Moyen-faible</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <div className={cn('h-2.5 w-2.5 rounded-sm border', getHeatmapColorClass(3))} />
                    <span>Moyen-élevé</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <div className={cn('h-2.5 w-2.5 rounded-sm border', getHeatmapColorClass(4))} />
                    <span>Élevé</span>
                  </span>
                </div>
              </div>
            </>
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
                className="flex flex-col gap-2 rounded-2xl border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:p-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100 break-words sm:text-base">{habit.name}</p>
                  {habit.description && (
                    <p className="mt-1 text-xs text-slate-400">{habit.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 sm:gap-4 sm:shrink-0">
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
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe.key}
                type="button"
                onClick={() => setSelectedTimeframe(timeframe.key)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm',
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
                  <div className="flex items-end gap-1 overflow-x-auto pb-2 sm:gap-2 sm:pb-0">
                    {chartData.map((bucket) => (
                      <div key={bucket.label} className="flex min-w-[24px] flex-1 flex-col gap-1.5 sm:min-w-[28px] sm:gap-2">
                        <div className="flex h-24 items-end rounded-full bg-slate-800/50 p-0.5 sm:h-32 sm:p-1">
                          <div
                            className="w-full rounded-full bg-gradient-to-t from-indigo-900 via-indigo-500 to-indigo-400 transition-all"
                            style={{ height: `${bucket.rate}%` }}
                            aria-label={`Taux de ${bucket.rate}%`}
                          />
                        </div>
                        <p className="text-center text-[10px] font-medium text-slate-400 sm:text-[11px]">
                          {bucket.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-300 sm:gap-4 sm:p-4 md:grid-cols-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
                        Habitudes réalisées
                      </p>
                      <p className="mt-1 text-xl font-semibold text-slate-100 sm:text-2xl">
                        {summary.totalCompleted}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
                        {timeframe.groupByMonth ? 'Mois suivis' : 'Jours suivis'}
                      </p>
                      <p className="mt-1 text-xl font-semibold text-slate-100 sm:text-2xl">
                        {summary.daysWithSchedule}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
                        {timeframe.groupByMonth ? 'Meilleur mois' : 'Top jour'}
                      </p>
                      {summary.bestDay ? (
                        <p className="mt-1 text-sm font-semibold text-slate-100 sm:text-base">
                          {summary.bestDay.label}{' '}
                          <span className="text-xs font-normal text-slate-400 sm:text-sm">
                            ({summary.bestDay.rate}%)
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1 text-sm font-semibold text-slate-100 sm:text-base">
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

/**
 * Calcule l'intensité (0-4) basée sur le nombre de complétions
 * Utilise les percentiles pour une distribution équilibrée comme GitHub
 */
function getHeatmapIntensity(completedCount: number, allData: CompletionPoint[]): number {
  if (completedCount === 0) return 0;
  
  // Calculer les valeurs de complétion pour tous les jours
  const allCounts = allData.map(p => p.completedCount).filter(c => c > 0);
  if (allCounts.length === 0) return 0;
  
  // Trier pour calculer les percentiles
  const sorted = [...allCounts].sort((a, b) => a - b);
  const max = sorted[sorted.length - 1];
  
  if (max === 0) return 0;
  
  // Calculer les seuils basés sur les percentiles (style GitHub)
  const p20 = sorted[Math.floor(sorted.length * 0.2)] || 0;
  const p40 = sorted[Math.floor(sorted.length * 0.4)] || 0;
  const p60 = sorted[Math.floor(sorted.length * 0.6)] || 0;
  const p80 = sorted[Math.floor(sorted.length * 0.8)] || 0;
  
  // Déterminer l'intensité basée sur les seuils
  if (completedCount <= p20) return 1; // Low
  if (completedCount <= p40) return 2; // Medium-low
  if (completedCount <= p60) return 3; // Medium-high
  if (completedCount <= p80) return 4; // High
  return 4; // More (maximum)
}

/**
 * Retourne les classes CSS pour chaque niveau d'intensité (style GitHub)
 */
function getHeatmapColorClass(intensity: number): string {
  switch (intensity) {
    case 0:
      // No activity - gris très clair
      return 'bg-slate-800/30 border border-slate-700/30';
    case 1:
      // Low - vert très clair
      return 'bg-emerald-500/20 border border-emerald-500/30';
    case 2:
      // Medium-low - vert clair
      return 'bg-emerald-500/40 border border-emerald-500/50';
    case 3:
      // Medium-high - vert moyen
      return 'bg-emerald-500/60 border border-emerald-500/70';
    case 4:
      // High/More - vert foncé
      return 'bg-emerald-500/80 border border-emerald-500/90';
    default:
      return 'bg-slate-800/30 border border-slate-700/30';
  }
}


