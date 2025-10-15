'use client';

import { Habit } from '@/types/habit';
import { HabitService } from '@/lib/habitService';
import HabitActions from './HabitActions';

interface HabitsListProps {
  habits: Habit[];
  currentDate: Date;
  onHabitToggle?: (habitId: string, completed: boolean) => void;
  onHabitEdit?: (habit: Habit) => void;
  onHabitDelete?: (habitId: string) => void;
}

export default function HabitsList({ habits, currentDate, onHabitToggle, onHabitEdit, onHabitDelete }: HabitsListProps) {
  const dateString = HabitService.formatDate(currentDate);

  const handleHabitToggle = (habitId: string) => {
    const completed = HabitService.toggleCompletion(habitId, dateString);
    onHabitToggle?.(habitId, completed);
  };

  const isCompleted = (habitId: string) => {
    return HabitService.isCompleted(habitId, dateString);
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune habitude aujourd'hui</h3>
        <p className="text-gray-500 mb-4">
          Aucune habitude n'est planifiée pour cette date.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {habits.map((habit) => {
        const completed = isCompleted(habit.id);
        
        return (
          <div 
            key={habit.id} 
            className={`bg-white rounded-lg p-4 shadow-sm border transition-colors ${
              completed 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className={`font-medium transition-colors ${
                  completed ? 'text-green-800 line-through' : 'text-gray-900'
                }`}>
                  {habit.name}
                </h3>
                {habit.description && (
                  <p className={`text-sm mt-1 transition-colors ${
                    completed ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {habit.description}
                  </p>
                )}
              </div>
              <div className="ml-4 flex items-center space-x-2">
                <button 
                  onClick={() => handleHabitToggle(habit.id)}
                  className={`w-6 h-6 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-blue-500'
                  }`}
                  aria-label={completed ? 'Marquer comme non terminé' : 'Marquer comme terminé'}
                >
                  {completed && (
                    <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <HabitActions
                  habit={habit}
                  onEdit={onHabitEdit || (() => {})}
                  onDelete={onHabitDelete || (() => {})}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
