'use client';

import { Habit } from '@/types/habit';
import { HabitStorage } from '@/services/habitStorage';
import { formatDateShort, isToday, getDateKey } from '@/utils/dateUtils';
import StreakBadge from './StreakBadge';

interface SevenDaysViewProps {
  habits: Habit[];
  onClose: () => void;
}

export default function SevenDaysView({ habits, onClose }: SevenDaysViewProps) {
  // Générer les 7 derniers jours (du plus ancien au plus récent)
  const today = new Date();
  const last7DaysDates: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    last7DaysDates.push(date);
  }

  const getIndicator = (isScheduled: boolean, isCompleted: boolean) => {
    if (!isScheduled) {
      return { symbol: '-', label: 'Non programmé', className: 'text-gray-400 bg-gray-50' };
    }
    if (isCompleted) {
      return { symbol: '✓', label: 'Complété', className: 'text-green-600 bg-green-50' };
    }
    return { symbol: '✗', label: 'Non complété', className: 'text-red-600 bg-red-50' };
  };

  const getHabitDayStatus = (habit: Habit, date: Date) => {
    const dayData = HabitStorage.getHabitLast7Days(habit.id).find(
      d => d.dateKey === getDateKey(date)
    );
    return dayData ? { isScheduled: dayData.isScheduled, isCompleted: dayData.isCompleted } : { isScheduled: false, isCompleted: false };
  };

  if (habits.length === 0) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Vue 7 jours</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune habitude à afficher</p>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Vue 7 jours</h2>
          <p className="text-sm text-gray-600 mt-1">Aperçu de toutes les habitudes</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fermer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tableau des habitudes */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* En-tête avec les dates */}
          <div className="flex border-b-2 border-gray-200 pb-2 mb-2">
            <div className="flex-shrink-0 w-32 pr-2">
              <div className="text-xs font-medium text-gray-500">Habitude</div>
            </div>
            {last7DaysDates.map((date) => {
              const isTodayDate = isToday(date);
              return (
                <div
                  key={date.toISOString()}
                  className={`flex-1 text-center min-w-[50px] ${isTodayDate ? 'bg-blue-50 rounded' : ''}`}
                >
                  <div className="text-xs font-medium text-gray-700">
                    {formatDateShort(date)}
                  </div>
                  {isTodayDate && (
                    <div className="text-xs text-blue-600 mt-1">Aujourd'hui</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Lignes des habitudes */}
          <div className="space-y-2">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center border-b border-gray-100 pb-2"
              >
                {/* Nom de l'habitude avec streak */}
                <div className="flex-shrink-0 w-32 pr-2">
                  <div className="text-sm font-medium text-gray-900 truncate" title={habit.name}>
                    {habit.name}
                  </div>
                  {habit.description && (
                    <div className="text-xs text-gray-500 truncate" title={habit.description}>
                      {habit.description}
                    </div>
                  )}
                  <div className="mt-1">
                    <StreakBadge streak={HabitStorage.getHabitStreak(habit.id)} size="sm" />
                  </div>
                </div>

                {/* Indicateurs pour chaque jour */}
                {last7DaysDates.map((date) => {
                  const status = getHabitDayStatus(habit, date);
                  const indicator = getIndicator(status.isScheduled, status.isCompleted);
                  const isTodayDate = isToday(date);
                  
                  return (
                    <div
                      key={`${habit.id}-${date.toISOString()}`}
                      className={`flex-1 text-center min-w-[50px] ${isTodayDate ? 'bg-blue-50 rounded' : ''}`}
                    >
                      <div
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${indicator.className}`}
                        title={`${formatDateShort(date)}: ${indicator.label}`}
                      >
                        <span className="text-lg font-bold">
                          {indicator.symbol}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Légende</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-green-600 text-xl font-bold">✓</span>
            <span className="text-sm text-gray-700">Complété</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-red-600 text-xl font-bold">✗</span>
            <span className="text-sm text-gray-700">Non complété (programmé)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-xl font-bold">-</span>
            <span className="text-sm text-gray-700">Non programmé</span>
          </div>
        </div>
      </div>

      {/* Bouton de fermeture */}
      <button
        onClick={onClose}
        className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Fermer
      </button>
    </div>
  );
}
