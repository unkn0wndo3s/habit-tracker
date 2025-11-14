'use client';

import { useState, useEffect } from 'react';
import { Habit, DayOfWeek, DAYS_OF_WEEK } from '@/types/habit';
import { HabitStorage } from '@/services/habitStorage';
import TagsInput from './TagsInput';

interface EditHabitFormProps {
  habit: Habit;
  onHabitUpdated: (habit: Habit) => void;
  onCancel: () => void;
  onError?: (message: string) => void;
}

export default function EditHabitForm({ habit, onHabitUpdated, onCancel, onError }: EditHabitFormProps) {
  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description || '');
  const [targetDays, setTargetDays] = useState<DayOfWeek[]>(habit.targetDays);
  const [tags, setTags] = useState<string[]>(habit.tags || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string; targetDays?: string }>({});
  
  // Récupérer tous les tags existants pour les suggestions
  const allHabits = HabitStorage.loadHabits();
  const allTags = Array.from(new Set(allHabits.flatMap(h => h.tags || [])));

  useEffect(() => {
    setName(habit.name);
    setDescription(habit.description || '');
    setTargetDays(habit.targetDays);
    setTags(habit.tags || []);
  }, [habit]);

  const handleDayToggle = (day: DayOfWeek) => {
    setTargetDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const validateForm = () => {
    const newErrors: { name?: string; description?: string; targetDays?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Le nom de l\'habitude est requis';
    } else if (name.trim().length > 50) {
      newErrors.name = 'Le nom ne peut pas dépasser 50 caractères';
    }

    if (description.trim().length > 200) {
      newErrors.description = 'La description ne peut pas dépasser 200 caractères';
    }

    if (targetDays.length === 0) {
      newErrors.targetDays = 'Veuillez sélectionner au moins un jour de la semaine';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedHabit = {
        ...habit,
        name: name.trim(),
        description: description.trim() || undefined,
        targetDays,
        tags
      };

      onHabitUpdated(updatedHabit);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'habitude:', error);
      onError?.('Erreur lors de la mise à jour de l\'habitude');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nom de l'habitude */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Nom de l&apos;habitude * ({name.length}/50)
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Méditation, Sport, Lecture..."
          maxLength={50}
          className={`text-black w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          required
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
        )}
      </div>

      {/* Description optionnelle */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description (optionnelle) ({description.length}/200)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez votre habitude..."
          rows={3}
          maxLength={200}
          className={`text-black w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description}</p>
        )}
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
        {errors.targetDays && (
          <p className="text-sm text-red-600 mt-1">{errors.targetDays}</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <TagsInput
          tags={tags}
          onChange={setTags}
          availableTags={allTags}
        />
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
