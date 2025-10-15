'use client';

import { useState, useEffect } from 'react';
import { Habit } from '@/types/habit';
import { HabitService } from '@/lib/habitService';

interface EditHabitFormProps {
  habit: Habit;
  onHabitUpdated: (habit: Habit) => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'
];

export default function EditHabitForm({ habit, onHabitUpdated, onCancel }: EditHabitFormProps) {
  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description || '');
  const [daysOfWeek, setDaysOfWeek] = useState<boolean[]>([...habit.daysOfWeek]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(habit.name);
    setDescription(habit.description || '');
    setDaysOfWeek([...habit.daysOfWeek]);
  }, [habit]);

  const handleDayToggle = (index: number) => {
    const newDays = [...daysOfWeek];
    newDays[index] = !newDays[index];
    setDaysOfWeek(newDays);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    if (!daysOfWeek.some(day => day)) return; // Au moins un jour sélectionné
    
    setIsSubmitting(true);
    
    try {
      const updatedHabit = HabitService.updateHabit(habit.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        daysOfWeek
      });
      
      if (updatedHabit) {
        onHabitUpdated(updatedHabit);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'habitude:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = name.trim() && daysOfWeek.some(day => day);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Modifier l'habitude</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'habitude *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Boire 2L d'eau"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnelle)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Description de votre habitude..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jours de la semaine *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map((day, index) => (
                <label key={index} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={daysOfWeek[index]}
                    onChange={() => handleDayToggle(index)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{day}</span>
                </label>
              ))}
            </div>
            {!daysOfWeek.some(day => day) && (
              <p className="text-red-500 text-xs mt-1">Sélectionnez au moins un jour</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
