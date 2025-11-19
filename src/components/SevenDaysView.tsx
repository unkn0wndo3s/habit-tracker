'use client';

'use client';

import { Habit } from '@/types/habit';
import { HabitStorage } from '@/services/habitStorage';
import { formatDateShort, isToday, getDateKey } from '@/utils/dateUtils';
import StreakBadge from './StreakBadge';
import { Button } from './ui/button';

interface SevenDaysViewProps {
  habits: Habit[];
  onClose: () => void;
}

export default function SevenDaysView({ habits, onClose }: SevenDaysViewProps) {
  const today = new Date();
  const last7DaysDates = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });

  const getIndicator = (isScheduled: boolean, isCompleted: boolean) => {
    if (!isScheduled) {
      return { label: 'Non programmé', className: 'border border-slate-200 text-slate-400', symbol: '–' };
    }
    if (isCompleted) {
      return { label: 'Complété', className: 'bg-emerald-100 text-emerald-700', symbol: '✓' };
    }
    return { label: 'Non complété', className: 'bg-rose-100 text-rose-700', symbol: '✗' };
  };

  const getHabitDayStatus = (habit: Habit, date: Date) => {
    const dayData = HabitStorage.getHabitLast7Days(habit.id).find((d) => d.dateKey === getDateKey(date));
    return dayData ?? { isScheduled: false, isCompleted: false };
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Vue hebdo</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Progression sur 7 jours</h2>
          <p className="text-sm text-slate-500">Comparez les habitudes planifiées et réalisées</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Fermer la vue 7 jours" onClick={onClose}>
          ✕
        </Button>
      </div>

      {habits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
          Aucune habitude enregistrée
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="min-w-[520px] divide-y divide-slate-100">
            <div className="grid grid-cols-[180px_repeat(7,minmax(56px,1fr))] gap-2 border-b border-slate-200 px-4 pb-2 pt-3 text-xs font-medium text-slate-500">
              <span>Habitude</span>
              {last7DaysDates.map((date) => (
                <div key={date.toISOString()} className="text-center">
                  <span className="block text-[11px] uppercase tracking-[0.2em]">{formatDateShort(date)}</span>
                  {isToday(date) && <span className="text-xs text-indigo-600">Aujourd&apos;hui</span>}
                </div>
              ))}
            </div>

            {habits.map((habit) => (
              <div
                key={habit.id}
                className="grid grid-cols-[180px_repeat(7,minmax(56px,1fr))] gap-2 px-4 py-3 text-sm"
              >
                <div className="pr-3">
                  <p className="font-medium text-slate-900">{habit.name}</p>
                  {habit.description && <p className="text-xs text-slate-500">{habit.description}</p>}
                  <div className="mt-1">
                    <StreakBadge streak={HabitStorage.getHabitStreak(habit.id)} size="sm" />
                  </div>
                </div>

                {last7DaysDates.map((date) => {
                  const status = getHabitDayStatus(habit, date);
                  const indicator = getIndicator(status.isScheduled, status.isCompleted);
                  return (
                    <div key={`${habit.id}-${date.toISOString()}`} className="text-center">
                      <div
                        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${indicator.className}`}
                      >
                        {indicator.symbol}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <div className="flex items-center gap-2 font-medium text-slate-900">
          <span>ℹ️</span>
          <p>Conseil</p>
        </div>
        <p className="mt-2">
          Utilisez cette vue pour repérer les jours manqués et ajuster les habitudes ou tags en conséquence.
        </p>
      </div>
    </div>
  );
}
