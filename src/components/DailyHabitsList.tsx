'use client';

import { DailyHabit } from '@/types/habit';
import { formatDate } from '@/utils/dateUtils';
import { HabitStorage } from '@/services/habitStorage';
import StreakBadge from './StreakBadge';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface DailyHabitsListProps {
  date: Date;
  habits: DailyHabit[];
  onHabitToggle: (habitId: string) => void;
}

export default function DailyHabitsList({ date, habits, onHabitToggle }: DailyHabitsListProps) {
  const completedCount = habits.filter((habit) => habit.isCompleted).length;

  if (habits.length === 0) {
    return (
      <Card className="border-dashed border-slate-200 bg-white/80 p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-2xl">
          📅
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Aucune habitude prévue</h3>
        <p className="mt-2 text-sm text-slate-500">
          Rien de programmé pour {formatDate(date)}. Profitez-en pour ajouter une nouvelle habitude !
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1 pt-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Habitudes du jour</p>
          <h2 className="text-lg font-semibold text-slate-900">{formatDate(date)}</h2>
        </div>
        <Badge variant="secondary" className="shrink-0 text-center py-1 px-3">
          {completedCount}/{habits.length} réalisées
        </Badge>
      </div>

      <div className="space-y-3">
        {habits.map((habit) => {
          const streak = HabitStorage.getHabitStreak(habit.id);
          return (
            <Card
              key={habit.id}
              className={cn(
                'border border-transparent px-4 py-4 transition-all duration-200 hover:-translate-y-0.5',
                habit.isCompleted
                  ? 'border-emerald-200 bg-emerald-50/70 shadow-inner shadow-emerald-100'
                  : 'bg-white/90'
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
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300'
                      : habit.isCompleted
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow shadow-emerald-500/30'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-500'
                  )}
                >
                  {habit.isCompleted ? '✓' : habit.isFuture ? '•' : ''}
                </button>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={cn(
                        'text-base font-semibold text-slate-900',
                        habit.isCompleted && 'text-emerald-700 line-through'
                      )}
                    >
                      {habit.name}
                    </h3>
                    <StreakBadge streak={streak} size="sm" />
                    {habit.isFuture && (
                      <Badge variant="outline" className="border-slate-200 text-[11px] text-slate-500">
                        À venir
                      </Badge>
                    )}
                  </div>
                  {habit.description && (
                    <p
                      className={cn(
                        'mt-1 text-sm text-slate-600',
                        habit.isCompleted && 'text-emerald-700'
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
