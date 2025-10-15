'use client';

import { Habit } from '@/types/habit';
import StreakDisplay from './StreakDisplay';

interface HabitDetailViewProps {
  habit: Habit;
  onClose: () => void;
}

export default function HabitDetailView({ habit, onClose }: HabitDetailViewProps) {
  const currentDate = new Date();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{habit.name}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {habit.description && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600">{habit.description}</p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Jours planifiés</h3>
          <div className="flex flex-wrap gap-2">
            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-sm ${
                  habit.daysOfWeek[index]
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {day}
              </span>
            ))}
          </div>
        </div>

        <StreakDisplay habit={habit} currentDate={currentDate} />

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>Créée le {habit.createdAt.toLocaleDateString('fr-FR')}</p>
            <p>Dernière modification le {habit.updatedAt.toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
