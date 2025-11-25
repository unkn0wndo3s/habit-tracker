'use client';

import { formatDate, isToday, addDays } from '@/utils/dateUtils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateNavigation({ currentDate, onDateChange }: DateNavigationProps) {
  const goToPreviousDay = () => onDateChange(addDays(currentDate, -1));
  const goToNextDay = () => onDateChange(addDays(currentDate, 1));
  const goToToday = () => onDateChange(new Date());
  const today = isToday(currentDate);

  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 shadow-lg shadow-black/30 backdrop-blur">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Jour précédent" onClick={goToPreviousDay}>
          <svg className="h-5 w-5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>

        <div className="flex-1 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Date sélectionnée</p>
          <button onClick={goToToday} className="mt-1 text-base font-semibold text-slate-100 transition hover:text-white">
            {formatDate(currentDate)}
          </button>
          {today && (
            <Badge variant="success" className="mt-2 inline-flex border border-emerald-500/40 bg-emerald-500/15 text-emerald-100">
              Aujourd&apos;hui
            </Badge>
          )}
        </div>

        <Button variant="ghost" size="icon" aria-label="Jour suivant" onClick={goToNextDay}>
          <svg className="h-5 w-5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {!today && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4 w-full border border-slate-700/80 bg-slate-900/60 text-slate-100 hover:bg-slate-800"
          onClick={goToToday}
        >
          Revenir à aujourd&apos;hui
        </Button>
      )}
    </div>
  );
}

