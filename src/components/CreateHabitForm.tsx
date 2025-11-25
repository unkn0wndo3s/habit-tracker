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
import { Icon } from './Icon';

interface CreateHabitFormProps {
  onHabitCreated: (habit: Habit) => void;
  onError?: (message: string) => void;
  initialValues?: {
    name?: string;
    description?: string;
    targetDays?: DayOfWeek[];
    tags?: string[];
    notificationEnabled?: boolean;
    notificationTime?: string;
  };
}

export default function CreateHabitForm({ onHabitCreated, onError, initialValues }: CreateHabitFormProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [targetDays, setTargetDays] = useState<DayOfWeek[]>(initialValues?.targetDays || []);
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  const [notificationEnabled, setNotificationEnabled] = useState(initialValues?.notificationEnabled || false);
  const [notificationTime, setNotificationTime] = useState(initialValues?.notificationTime || '09:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string; targetDays?: string }>({});

  // Mettre à jour les valeurs si initialValues change
  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || '');
      setDescription(initialValues.description || '');
      setTargetDays(initialValues.targetDays || []);
      setTags(initialValues.tags || []);
      setNotificationEnabled(initialValues.notificationEnabled || false);
      setNotificationTime(initialValues.notificationTime || '09:00');
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
        tags,
        notificationEnabled: notificationEnabled,
        notificationTime: notificationEnabled ? notificationTime : undefined
      });

      onHabitCreated(newHabit);
      
      // Reset form seulement si ce n'est pas une duplication
      if (!initialValues) {
        setName('');
        setDescription('');
        setTargetDays([]);
        setTags([]);
        setNotificationEnabled(false);
        setNotificationTime('09:00');
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
        <div className="flex items-center justify-between text-sm font-medium text-slate-200">
          <label htmlFor="name" className="text-sm font-medium text-slate-200">
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
        <div className="flex items-center justify-between text-sm font-medium text-slate-200">
          <label htmlFor="description" className="text-sm font-medium text-slate-200">
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
        <p className="mb-3 text-sm font-medium text-slate-200">Jours ciblés *</p>
        <div className="grid grid-cols-2 gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = targetDays.includes(day.value);
            return (
              <button
                type="button"
                key={day.value}
                onClick={() => handleDayToggle(day.value)}
                className={cn(
                  'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                  isSelected
                    ? 'border-indigo-500/60 bg-gradient-to-br from-indigo-900/60 to-indigo-900/30 text-indigo-100 shadow-sm shadow-indigo-900/30'
                    : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-indigo-500 hover:text-slate-50'
                )}
              >
                <span>{day.label}</span>
                {isSelected && (
                  <Badge variant="outline" className="border-indigo-500/70 text-indigo-100 text-[11px]">
                    <Icon name="check" className="h-3 w-3" strokeWidth={2.2} />
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

      {/* Notifications */}
      <div className="space-y-4 border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label htmlFor="notificationEnabled" className="text-sm font-medium text-slate-200">
              Activer les notifications
            </label>
            <p className="mt-1 text-xs text-slate-400">
              Recevez un rappel pour cette habitude
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNotificationEnabled(!notificationEnabled)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950',
              notificationEnabled ? 'bg-indigo-500' : 'bg-slate-700'
            )}
            role="switch"
            aria-checked={notificationEnabled}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                notificationEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {notificationEnabled && (
          <div className="space-y-2">
            <label htmlFor="notificationTime" className="text-sm font-medium text-slate-200">
              Heure du rappel
            </label>
            <Input
              id="notificationTime"
              type="time"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
              className="w-full"
            />
          </div>
        )}
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
