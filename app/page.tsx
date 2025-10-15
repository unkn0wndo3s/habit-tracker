'use client';

import { useState, useEffect } from 'react';
import { Habit } from '@/types/habit';
import { HabitService } from '@/lib/habitService';
import CreateHabitForm from '@/components/CreateHabitForm';
import EditHabitForm from '@/components/EditHabitForm';
import DateNavigation from '@/components/DateNavigation';
import HabitsList from '@/components/HabitsList';
import WeekView from '@/components/WeekView';
import HabitDetailView from '@/components/HabitDetailView';

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showHabitDetail, setShowHabitDetail] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  useEffect(() => {
    const loadedHabits = HabitService.getHabits();
    setHabits(loadedHabits);
  }, []);

  const handleHabitCreated = (habit: Habit) => {
    setHabits(prev => [...prev, habit]);
    setShowCreateForm(false);
  };

  const handleHabitEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowEditForm(true);
  };

  const handleHabitDetail = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowHabitDetail(true);
  };

  const handleHabitUpdated = (updatedHabit: Habit) => {
    setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
    setShowEditForm(false);
    setEditingHabit(null);
  };

  const handleHabitDelete = (habitId: string) => {
    const success = HabitService.deleteHabit(habitId);
    if (success) {
      setHabits(prev => prev.filter(h => h.id !== habitId));
    }
  };

  const handleHabitToggle = (habitId: string, completed: boolean) => {
    // Force re-render by updating state
    setHabits(prev => [...prev]);
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
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'day' ? 'week' : 'day')}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {viewMode === 'day' ? 'Vue 7 jours' : 'Vue jour'}
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              + Nouvelle habitude
            </button>
          </div>
        </div>
      </header>

      {/* Date Navigation - seulement en vue jour */}
      {viewMode === 'day' && (
        <DateNavigation 
          currentDate={currentDate} 
          onDateChange={setCurrentDate} 
        />
      )}

      {/* Main Content */}
      <main className="p-4">
        {viewMode === 'day' ? (
          // Vue jour
          getHabitsForToday().length === 0 ? (
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
            <HabitsList 
              habits={getHabitsForToday()} 
              currentDate={currentDate}
              onHabitToggle={handleHabitToggle}
              onHabitEdit={handleHabitEdit}
              onHabitDelete={handleHabitDelete}
              onHabitDetail={handleHabitDetail}
            />
          )
        ) : (
          // Vue 7 jours
          habits.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune habitude</h3>
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
            <WeekView 
              habits={habits} 
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />
          )
        )}
      </main>

      {/* Create Habit Form Modal */}
      {showCreateForm && (
        <CreateHabitForm
          onHabitCreated={handleHabitCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Habit Form Modal */}
      {showEditForm && editingHabit && (
        <EditHabitForm
          habit={editingHabit}
          onHabitUpdated={handleHabitUpdated}
          onCancel={() => {
            setShowEditForm(false);
            setEditingHabit(null);
          }}
        />
      )}

      {/* Habit Detail Modal */}
      {showHabitDetail && selectedHabit && (
        <HabitDetailView
          habit={selectedHabit}
          onClose={() => {
            setShowHabitDetail(false);
            setSelectedHabit(null);
          }}
        />
      )}
    </div>
  );
}
