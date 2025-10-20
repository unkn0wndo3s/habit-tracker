'use client';

import { useState, useEffect } from 'react';
import { Habit, DailyHabit } from '@/types/habit';
import { HabitStorage } from '@/services/habitStorage';
import CreateHabitForm from '@/components/CreateHabitForm';
import DailyHabitsList from '@/components/DailyHabitsList';
import DateNavigation from '@/components/DateNavigation';

type ViewMode = 'daily' | 'create' | 'manage';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyHabits, setDailyHabits] = useState<DailyHabit[]>([]);
  const [allHabits, setAllHabits] = useState<Habit[]>([]);

  useEffect(() => {
    loadHabits();
  }, []);

  useEffect(() => {
    if (viewMode === 'daily') {
      loadDailyHabits();
    }
  }, [currentDate, allHabits, viewMode]);

  const loadHabits = () => {
    setAllHabits(HabitStorage.loadHabits());
  };

  const loadDailyHabits = () => {
    const habits = HabitStorage.getHabitsForDate(currentDate);
    setDailyHabits(habits);
  };

  const handleHabitCreated = (newHabit: Habit) => {
    setAllHabits(prev => [...prev, newHabit]);
    setViewMode('daily');
  };

  const handleHabitToggle = (habitId: string) => {
    HabitStorage.toggleHabitCompletion(habitId, currentDate);
    loadDailyHabits();
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <header className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">TrackIt</h1>
              <p className="text-blue-100 text-sm">Suivez vos habitudes</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'daily' ? 'bg-blue-500' : 'bg-blue-700 hover:bg-blue-600'
                }`}
              >
                📅
              </button>
              <button
                onClick={() => setViewMode('manage')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'manage' ? 'bg-blue-500' : 'bg-blue-700 hover:bg-blue-600'
                }`}
              >
                ⚙️
              </button>
            </div>
          </div>
        </header>

        <main>
          {viewMode === 'daily' && (
            <>
              <DateNavigation currentDate={currentDate} onDateChange={handleDateChange} />
              <div className="p-4">
                <DailyHabitsList
                  date={currentDate}
                  habits={dailyHabits}
                  onHabitToggle={handleHabitToggle}
                />
              </div>
            </>
          )}

          {viewMode === 'create' && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Créer une habitude</h2>
                <button
                  onClick={() => setViewMode('daily')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <CreateHabitForm onHabitCreated={handleHabitCreated} />
            </div>
          )}

          {viewMode === 'manage' && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Gérer les habitudes</h2>
                <button
                  onClick={() => setViewMode('daily')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Liste des habitudes */}
              {allHabits.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune habitude créée
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Commencez par créer votre première habitude
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allHabits.map((habit) => (
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
                onClick={() => setViewMode('create')}
                className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                + Créer une habitude
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
