'use client';

import { useState, useEffect } from 'react';
import { Habit, DayOfWeek, DAYS_OF_WEEK } from '@/types/habit';

interface EditHabitFormProps {
  habit: Habit;
  onHabitUpdated: (habit: Habit) => void;
  onCancel: () => void;
}

export default function EditHabitForm({ habit, onHabitUpdated, onCancel }: EditHabitFormProps) {
  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description || '');
  const [targetDays, setTargetDays] = useState<DayOfWeek[]>(habit.targetDays);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(habit.name);
    setDescription(habit.description || '');
    setTargetDays(habit.targetDays);
  }, [habit]);

  const handleDayToggle = (day: DayOfWeek) => {
    setTargetDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Le nom de l&apos;habitude est requis');
      return;
    }

    if (targetDays.length === 0) {
      alert('Veuillez sélectionner au moins un jour de la semaine');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedHabit = {
        ...habit,
        name: name.trim(),
        description: description.trim() || undefined,
        targetDays
      };

      onHabitUpdated(updatedHabit);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l&apos;habitude:', error);
      alert('Erreur lors de la mise à jour de l&apos;habitude');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nom de l'habitude */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Nom de l&apos;habitude *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Méditation, Sport, Lecture..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Description optionnelle */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description (optionnelle)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez votre habitude..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Jours de la semaine */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Jours ciblés *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <label
              key={day.value}
              className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                targetDays.includes(day.value)
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={targetDays.includes(day.value)}
                onChange={() => handleDayToggle(day.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{day.label}</span>
            </label>
          ))}
        </div>
        {targetDays.length === 0 && (
          <p className="text-sm text-red-600 mt-1">Sélectionnez au moins un jour</p>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || targetDays.length === 0}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
        </button>
      </div>
    </form>
  );
}
