'use client';

import { Habit } from '@/types/habit';
import { HabitService } from '@/lib/habitService';

interface StreakDisplayProps {
  habit: Habit;
  currentDate: Date;
}

export default function StreakDisplay({ habit, currentDate }: StreakDisplayProps) {
  const getCurrentStreak = () => {
    let streak = 0;
    const today = new Date(currentDate);
    
    // Vérifier les jours en arrière depuis aujourd'hui
    for (let i = 0; i < 365; i++) { // Limite à 1 an
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      // Vérifier si l'habitude est planifiée pour ce jour
      const dayOfWeek = checkDate.getDay();
      const habitDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convertir 0=dimanche vers 0=lundi
      
      if (!habit.daysOfWeek[habitDayIndex]) {
        // L'habitude n'est pas planifiée ce jour, continuer
        continue;
      }
      
      // Vérifier si l'habitude est complétée ce jour
      const isCompleted = HabitService.isCompleted(habit.id, HabitService.formatDate(checkDate));
      
      if (isCompleted) {
        streak++;
      } else {
        // Si c'est aujourd'hui et pas complété, ne pas casser la série
        if (i === 0) {
          continue;
        }
        // Sinon, casser la série
        break;
      }
    }
    
    return streak;
  };

  const getLongestStreak = () => {
    let maxStreak = 0;
    let currentStreak = 0;
    const today = new Date(currentDate);
    
    // Vérifier les 365 derniers jours
    for (let i = 365; i >= 0; i--) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      // Vérifier si l'habitude est planifiée pour ce jour
      const dayOfWeek = checkDate.getDay();
      const habitDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      if (!habit.daysOfWeek[habitDayIndex]) {
        // L'habitude n'est pas planifiée ce jour, continuer
        continue;
      }
      
      // Vérifier si l'habitude est complétée ce jour
      const isCompleted = HabitService.isCompleted(habit.id, HabitService.formatDate(checkDate));
      
      if (isCompleted) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return maxStreak;
  };

  const currentStreak = getCurrentStreak();
  const longestStreak = getLongestStreak();

  const getStreakEmoji = (streak: number) => {
    if (streak === 0) return '💤';
    if (streak < 7) return '🔥';
    if (streak < 30) return '🔥🔥';
    if (streak < 100) return '🔥🔥🔥';
    return '🔥🔥🔥🔥';
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Commencez votre série !';
    if (streak === 1) return '1 jour de suite !';
    if (streak < 7) return `${streak} jours de suite !`;
    if (streak < 30) return `${streak} jours d'affilée !`;
    if (streak < 100) return `${streak} jours consécutifs !`;
    return `${streak} jours incroyables !`;
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">Série actuelle</h4>
        <span className="text-2xl">{getStreakEmoji(currentStreak)}</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Actuelle</span>
          <span className="font-bold text-lg text-orange-600">
            {currentStreak} jour{currentStreak > 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Record</span>
          <span className="font-medium text-gray-700">
            {longestStreak} jour{longestStreak > 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="text-center pt-2">
          <p className="text-sm text-orange-700 font-medium">
            {getStreakMessage(currentStreak)}
          </p>
        </div>
      </div>
    </div>
  );
}
