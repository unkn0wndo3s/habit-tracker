'use client';

import { DailyHabit } from '@/types/habit';
import { formatDate } from '@/utils/dateUtils';

interface DailyHabitsListProps {
  date: Date;
  habits: DailyHabit[];
  onHabitToggle: (habitId: string) => void;
}

export default function DailyHabitsList({ date, habits, onHabitToggle }: DailyHabitsListProps) {
  if (habits.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📅</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucune habitude prévue
        </h3>
        <p className="text-gray-500 text-sm">
          Aucune habitude n'est planifiée pour {formatDate(date)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium text-gray-900">
        Habitudes du {formatDate(date)}
      </h2>
      <div className="space-y-2">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className={`p-4 rounded-lg border-2 transition-colors ${
              habit.isCompleted
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start space-x-3">
              <button
                onClick={() => onHabitToggle(habit.id)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  habit.isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {habit.isCompleted && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium ${
                  habit.isCompleted ? 'text-green-800 line-through' : 'text-gray-900'
                }`}>
                  {habit.name}
                </h3>
                {habit.description && (
                  <p className={`text-sm mt-1 ${
                    habit.isCompleted ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {habit.description}
                  </p>
                )}
                {habit.isCompleted && habit.completedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    Complétée à {habit.completedAt.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
