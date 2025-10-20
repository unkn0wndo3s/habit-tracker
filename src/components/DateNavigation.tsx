'use client';

import { formatDate, isToday, addDays } from '@/utils/dateUtils';

interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateNavigation({ currentDate, onDateChange }: DateNavigationProps) {
  const goToPreviousDay = () => {
    onDateChange(addDays(currentDate, -1));
  };

  const goToNextDay = () => {
    onDateChange(addDays(currentDate, 1));
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousDay}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Jour précédent"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 text-center">
          <button
            onClick={goToToday}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              isToday(currentDate)
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {formatDate(currentDate)}
          </button>
          {isToday(currentDate) && (
            <p className="text-xs text-blue-600 mt-1">Aujourd&apos;hui</p>
          )}
        </div>

        <button
          onClick={goToNextDay}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Jour suivant"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
