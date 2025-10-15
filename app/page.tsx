'use client';

import { useState, useEffect } from 'react';
import { Habit } from '@/types/habit';
import { HabitService } from '@/lib/habitService';
import CreateHabitForm from '@/components/CreateHabitForm';

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const loadedHabits = HabitService.getHabits();
    setHabits(loadedHabits);
  }, []);

  const handleHabitCreated = (habit: Habit) => {
    setHabits(prev => [...prev, habit]);
    setShowCreateForm(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getHabitsForToday = () => {
    return HabitService.getHabitsForDate(currentDate);
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Habit Tracker</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Nouvelle habitude
          </button>
        </div>
      </header>

      {/* Date Display */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {formatDate(currentDate)}
        </h2>
      </div>

      {/* Habits List */}
      <main className="p-4">
        {getHabitsForToday().length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune habitude aujourd'hui</h3>
            <p className="text-gray-500 mb-4">
              Créez votre première habitude pour commencer votre suivi quotidien.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Créer une habitude
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {getHabitsForToday().map((habit) => (
              <div key={habit.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{habit.name}</h3>
                    {habit.description && (
                      <p className="text-sm text-gray-500 mt-1">{habit.description}</p>
                    )}
                  </div>
                  <div className="ml-4">
                    <button className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {/* Checkbox sera implémenté dans US3 */}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Habit Form Modal */}
      {showCreateForm && (
        <CreateHabitForm
          onHabitCreated={handleHabitCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}
