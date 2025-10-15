'use client';

import { useState } from 'react';
import { Habit } from '@/types/habit';
import { HabitService } from '@/lib/habitService';

interface WeekViewProps {
  habits: Habit[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function WeekView({ habits, currentDate, onDateChange }: WeekViewProps) {
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  // Générer les 7 derniers jours à partir de la date actuelle
  const getWeekDays = () => {
    const days = [];
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - 6); // 7 jours incluant aujourd'hui
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const isCompleted = (habitId: string, date: Date) => {
    return HabitService.isCompleted(habitId, HabitService.formatDate(date));
  };

  const getCompletionRate = (habit: Habit) => {
    const completedDays = weekDays.filter(day => 
      isCompleted(habit.id, day)
    ).length;
    return Math.round((completedDays / 7) * 100);
  };

  const formatDay = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    return {
      dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      dayNumber: date.getDate(),
      isToday
    };
  };

  const handleDayClick = (date: Date) => {
    onDateChange(date);
  };

  const handleHabitClick = (habit: Habit) => {
    setSelectedHabit(selectedHabit?.id === habit.id ? null : habit);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Vue 7 jours</h3>
      
      {/* Header avec les jours */}
      <div className="grid grid-cols-8 gap-2 mb-4">
        <div className="text-sm font-medium text-gray-500">Habitude</div>
        {weekDays.map((day, index) => {
          const dayInfo = formatDay(day);
          return (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              className={`text-center p-2 rounded-lg text-xs font-medium transition-colors ${
                dayInfo.isToday
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="font-medium">{dayInfo.dayName}</div>
              <div className="text-lg">{dayInfo.dayNumber}</div>
            </button>
          );
        })}
      </div>

      {/* Liste des habitudes avec leur statut */}
      <div className="space-y-2">
        {habits.map((habit) => {
          const completionRate = getCompletionRate(habit);
          const isSelected = selectedHabit?.id === habit.id;
          
          return (
            <div key={habit.id} className="space-y-2">
              <button
                onClick={() => handleHabitClick(habit)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{habit.name}</h4>
                    <p className="text-sm text-gray-500">
                      {completionRate}% cette semaine
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {weekDays.map((day, index) => {
                      const completed = isCompleted(habit.id, day);
                      return (
                        <div
                          key={index}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {completed && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {habits.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Aucune habitude à afficher</p>
        </div>
      )}
    </div>
  );
}
