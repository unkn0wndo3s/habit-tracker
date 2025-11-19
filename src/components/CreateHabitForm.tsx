'use client';

import { useMemo, useState, useEffect } from 'react';
import { Habit, DayOfWeek, DAYS_OF_WEEK } from '@/types/habit';
import { HabitStorage } from '@/services/habitStorage';
import TagsInput from './TagsInput';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface CreateHabitFormProps {
  onHabitCreated: (habit: Habit) => void;
  onError?: (message: string) => void;
  initialValues?: {
    name?: string;
    description?: string;
    targetDays?: DayOfWeek[];
    tags?: string[];
  };
}

export default function CreateHabitForm({ onHabitCreated, onError, initialValues }: CreateHabitFormProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [targetDays, setTargetDays] = useState<DayOfWeek[]>(initialValues?.targetDays || []);
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string; targetDays?: string }>({});

  // Mettre à jour les valeurs si initialValues change
  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || '');
      setDescription(initialValues.description || '');
      setTargetDays(initialValues.targetDays || []);
      setTags(initialValues.tags || []);
    }
  }, [initialValues]);
  
  // Récupérer tous les tags existants pour les suggestions
  const allTags = useMemo(() => {
    const habits = HabitStorage.loadHabits();
    return Array.from(new Set(habits.flatMap(habit => habit.tags || [])));
  }, []);

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
      const newHabit = HabitStorage.addHabit({
        name: name.trim(),
        description: description.trim() || undefined,
        targetDays,
        tags
      });

      onHabitCreated(newHabit);
      
      // Reset form seulement si ce n'est pas une duplication
      if (!initialValues) {
        setName('');
        setDescription('');
        setTargetDays([]);
        setTags([]);
      }
      setErrors({});
    } catch (error) {
      console.error('Erreur lors de la création de l\'habitude:', error);
      onError?.('Erreur lors de la création de l\'habitude');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nom de l'habitude */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-slate-700">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Nom de l&apos;habitude *
          </label>
          <Badge variant="secondary">{name.length}/50</Badge>
        </div>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Méditation, Sport, Lecture..."
          maxLength={50}
          className={cn(errors.name && 'border-rose-300 focus-visible:ring-rose-400')}
          required
        />
        {errors.name && <p className="text-sm text-rose-500">{errors.name}</p>}
      </div>

      {/* Description optionnelle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-slate-700">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">
            Description (optionnelle)
          </label>
          <Badge variant="secondary">{description.length}/200</Badge>
        </div>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez votre habitude..."
          rows={4}
          maxLength={200}
          className={cn(errors.description && 'border-rose-300 focus-visible:ring-rose-400')}
        />
        {errors.description && <p className="text-sm text-rose-500">{errors.description}</p>}
      </div>

      {/* Jours de la semaine */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">Jours ciblés *</p>
        <div className="grid grid-cols-2 gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = targetDays.includes(day.value);
            return (
              <button
                type="button"
                key={day.value}
                onClick={() => handleDayToggle(day.value)}
                className={cn(
                  'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60',
                  isSelected
                    ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-700 shadow-sm shadow-indigo-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-slate-900'
                )}
              >
                <span>{day.label}</span>
                {isSelected && (
                  <Badge variant="outline" className="border-indigo-200 bg-white/60 text-indigo-600 text-[11px]">
                    ✔
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
        {errors.targetDays && <p className="text-sm text-rose-500 mt-2">{errors.targetDays}</p>}
      </div>

      {/* Tags */}
      <div>
        <TagsInput
          tags={tags}
          onChange={setTags}
          availableTags={allTags}
        />
      </div>

      {/* Bouton de soumission */}
      <Button
        type="submit"
        loading={isSubmitting}
        disabled={!name.trim() || targetDays.length === 0}
        className="w-full"
      >
        {isSubmitting ? 'Création...' : "Créer l'habitude"}
      </Button>
    </form>
  );
}
