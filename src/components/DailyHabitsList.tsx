'use client';

import { DailyHabit } from '@/types/habit';
import { formatDate } from '@/utils/dateUtils';
import { HabitStorage } from '@/services/habitStorage';
import StreakBadge from './StreakBadge';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

interface DailyHabitsListProps {
  date: Date;
  habits: DailyHabit[];
  onHabitToggle: (habitId: string) => void;
}

export default function DailyHabitsList({ date, habits, onHabitToggle }: DailyHabitsListProps) {
  const completedCount = habits.filter((habit) => habit.isCompleted).length;

  if (habits.length === 0) {
    return (
      <Card className="border-dashed border-slate-800 bg-slate-900/60 p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/80 text-indigo-200">
          <Icon name="calendar" className="h-7 w-7" strokeWidth={1.4} />
        </div>
        <h3 className="text-lg font-semibold text-slate-50">Aucune habitude prévue</h3>
        <p className="mt-2 text-sm text-slate-400">
          Rien de programmé pour {formatDate(date)}. Profitez-en pour ajouter une nouvelle habitude !
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1 pt-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Habitudes du jour</p>
          <h2 className="text-lg font-semibold text-slate-50">{formatDate(date)}</h2>
        </div>
        <Badge variant="secondary" className="shrink-0 border border-slate-700 px-3 py-1 text-center text-slate-100">
          {completedCount}/{habits.length} réalisées
        </Badge>
      </div>

      <div className="space-y-3">
        {habits.map((habit) => {
          const streak = HabitStorage.getHabitStreak(habit.id);
          const isDue = !habit.isCompleted && !habit.isFuture;
          return (
            <Card
              key={habit.id}
              className={cn(
                'relative border px-4 py-4 transition-all duration-200 hover:-translate-y-0.5',
                (isDue || habit.isCompleted) && 'card-neon',
                isDue && 'card-neon-pending bg-slate-900/60',
                habit.isCompleted && 'card-neon-completed bg-emerald-500/10',
                habit.isFuture && 'border-dashed border-slate-700 bg-slate-900/40'
              )}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => onHabitToggle(habit.id)}
                  aria-label={habit.isCompleted ? 'Marquer comme non réalisée' : 'Marquer comme réalisée'}
                  disabled={habit.isFuture}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-2xl border-2 text-sm font-semibold transition-all',
                    habit.isFuture
                      ? 'cursor-not-allowed border-slate-700 bg-slate-900/20 text-slate-600'
                      : habit.isCompleted
                      ? 'border-emerald-400 bg-emerald-500 text-white shadow shadow-emerald-500/30'
                      : 'border-slate-700 bg-slate-900/40 text-slate-200 hover:border-indigo-400 hover:text-indigo-300'
                  )}
                >
                  {habit.isCompleted ? (
                    <Icon name="check" className="h-4 w-4" strokeWidth={2.2} />
                  ) : habit.isFuture ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                  ) : null}
                </button>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={cn(
                        'text-base font-semibold text-slate-50',
                        habit.isCompleted && 'text-emerald-200 line-through'
                      )}
                    >
                      {habit.name}
                    </h3>
                    <StreakBadge streak={streak} size="sm" />
                    {habit.isFuture && (
                      <Badge variant="outline" className="border-slate-700 text-[11px] text-slate-300">
                        À venir
                      </Badge>
                    )}
                  </div>
                  {habit.description && (
                    <p
                      className={cn(
                        'mt-1 text-sm text-slate-400',
                        habit.isCompleted && 'text-emerald-200'
                      )}
                    >
                      {habit.description}
                    </p>
                  )}
                  {habit.isCompleted && habit.completedAt && (
                    <Badge variant="success" className="mt-3">
                      Terminé à{' '}
                      {habit.completedAt.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
