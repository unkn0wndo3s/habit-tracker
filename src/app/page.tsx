'use client';

import { useState, useEffect } from 'react';
import { Habit } from '@/types/habit';
import { HabitStorage } from '@/services/habitStorage';
import CreateHabitForm from '@/components/CreateHabitForm';

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setHabits(HabitStorage.loadHabits());
  }, []);

  const handleHabitCreated = (newHabit: Habit) => {
    setHabits(prev => [...prev, newHabit]);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-xl font-bold">TrackIt</h1>
          <p className="text-blue-100 text-sm">Suivez vos habitudes</p>
        </header>

        <main className="p-4">
          {!showForm ? (
            <div className="space-y-4">
              {/* Liste des habitudes */}
              {habits.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h2 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune habitude créée
                  </h2>
                  <p className="text-gray-500 text-sm mb-4">
                    Commencez par créer votre première habitude
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h2 className="text-lg font-medium text-gray-900">Mes habitudes</h2>
                  {habits.map((habit) => (
                    <div key={habit.id} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{habit.name}</h3>
                      {habit.description && (
                        <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {habit.targetDays.map((day) => (
                          <span
                            key={day}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bouton pour créer une habitude */}
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                + Créer une habitude
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Créer une habitude</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <CreateHabitForm onHabitCreated={handleHabitCreated} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
