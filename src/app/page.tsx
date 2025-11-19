'use client';

import { useState, useEffect, useCallback } from 'react';
import { Habit, DailyHabit } from '@/types/habit';
import { HabitStorage } from '@/services/habitStorage';
import CreateHabitForm from '@/components/CreateHabitForm';
import EditHabitForm from '@/components/EditHabitForm';
import DailyHabitsList from '@/components/DailyHabitsList';
import DateNavigation from '@/components/DateNavigation';
import SevenDaysView from '@/components/SevenDaysView';
import StreakBadge from '@/components/StreakBadge';
import TagsFilter from '@/components/TagsFilter';
import ConfirmationModal from '@/components/ConfirmationModal';
import UndoButton from '@/components/UndoButton';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { useUndo } from '@/hooks/useUndo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ViewMode = 'daily' | 'create' | 'manage' | 'edit' | 'sevenDays';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyHabits, setDailyHabits] = useState<DailyHabit[]>([]);
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [previousViewMode, setPreviousViewMode] = useState<ViewMode>('daily');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const { undoState, registerUndo, undo, clearUndo, canUndo } = useUndo<Habit>();
  const [undoRemainingTime, setUndoRemainingTime] = useState(0);

  const loadHabits = useCallback(() => {
    setAllHabits(HabitStorage.loadHabits());
  }, []);

  // Calculer les tags et leurs compteurs
  const tagsWithCount = useCallback(() => {
    const tagCounts: Record<string, number> = {};
    allHabits.forEach(habit => {
      (habit.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Trier par nombre décroissant
  }, [allHabits]);

  // Filtrer les habitudes par tag sélectionné
  const filteredHabits = useCallback(() => {
    if (!selectedTag) {
      return allHabits;
    }
    return allHabits.filter(habit => (habit.tags || []).includes(selectedTag));
  }, [allHabits, selectedTag]);

  const loadDailyHabits = useCallback(() => {
    const habits = HabitStorage.getHabitsForDate(currentDate);
    // Trier par ordre de création (plus ancien en premier)
    const sortedHabits = habits.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    setDailyHabits(sortedHabits);
  }, [currentDate]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  useEffect(() => {
    if (viewMode === 'daily') {
      loadDailyHabits();
    }
  }, [currentDate, allHabits, viewMode, loadDailyHabits]);

  // Gérer le timer pour le bouton d'annulation
  useEffect(() => {
    if (!undoState) {
      setUndoRemainingTime(0);
      return;
    }

    const startTime = undoState.timestamp;
    const duration = 5000; // 5 secondes
    
    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setUndoRemainingTime(remaining);
      
      if (remaining <= 0) {
        clearUndo();
      }
    };

    const interval = setInterval(updateTimer, 100);
    updateTimer(); // Appel initial

    return () => clearInterval(interval);
  }, [undoState, clearUndo]);

  const handleHabitCreated = (newHabit: Habit) => {
    setAllHabits(prev => [...prev, newHabit]);
    setViewMode('daily');
    showSuccess('Habitude créée avec succès !');
  };

  const handleHabitUpdated = (updatedHabit: Habit) => {
    // Sauvegarder l'ancienne version pour l'annulation
    const oldHabit = allHabits.find(h => h.id === updatedHabit.id);
    
    const updated = HabitStorage.updateHabit(updatedHabit.id, {
      name: updatedHabit.name,
      description: updatedHabit.description,
      targetDays: updatedHabit.targetDays,
      tags: updatedHabit.tags || []
    });
    
    if (updated) {
      // Utiliser l'habitude retournée par updateHabit qui contient les tags normalisés
      setAllHabits(prev => prev.map(habit => 
        habit.id === updatedHabit.id ? updated : habit
      ));
      setEditingHabit(null);
      setViewMode('manage');
      showSuccess('Habitude modifiée avec succès !');
      
      // Enregistrer pour annulation si on avait une ancienne version
      if (oldHabit) {
        registerUndo('modification', oldHabit);
      }
    } else {
      showError('Erreur lors de la modification de l\'habitude');
    }
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setViewMode('edit');
  };

  const handleViewSevenDays = () => {
    setPreviousViewMode(viewMode);
    setViewMode('sevenDays');
  };

  const handleCloseSevenDays = () => {
    // Retourner à la vue précédente (daily ou manage)
    setViewMode(previousViewMode);
  };

  const handleCancelEdit = () => {
    setEditingHabit(null);
    setViewMode('manage');
  };

  const handleDeleteHabit = (habit: Habit) => {
    setHabitToDelete(habit);
  };

  const confirmDeleteHabit = () => {
    if (!habitToDelete) return;
    
    // Sauvegarder l'habitude et ses complétions pour l'annulation
    const habitToRestore = { ...habitToDelete };
    const completions = HabitStorage.saveHabitCompletions(habitToDelete.id);
    
    const success = HabitStorage.deleteHabit(habitToDelete.id);
    if (success) {
      setAllHabits(prev => prev.filter(habit => habit.id !== habitToDelete.id));
      setHabitToDelete(null);
      showSuccess('Habitude supprimée avec succès !');
      
      // Enregistrer pour annulation avec les complétions
      registerUndo('suppression', habitToRestore, { completions });
    } else {
      showError('Erreur lors de la suppression de l\'habitude');
    }
  };

  const handleUndo = () => {
    const undoResult = undo();
    if (!undoResult) return;

    if (undoResult.action === 'suppression') {
      // Restaurer l'habitude supprimée avec son ID original
      const habit = undoResult.data as Habit;
      const restoredHabit = HabitStorage.restoreHabit(habit);
      
      // Restaurer les complétions si elles ont été sauvegardées
      if (undoResult.metadata?.completions) {
        HabitStorage.restoreHabitCompletions(habit.id, undoResult.metadata.completions);
      }
      
      setAllHabits(prev => [...prev, restoredHabit]);
      showSuccess('Habitude restaurée avec succès !');
    } else if (undoResult.action === 'modification') {
      // Restaurer l'ancienne version
      const oldHabit = undoResult.data as Habit;
      const success = HabitStorage.updateHabit(oldHabit.id, {
        name: oldHabit.name,
        description: oldHabit.description,
        targetDays: oldHabit.targetDays
      });
      
      if (success) {
        setAllHabits(prev => prev.map(habit => 
          habit.id === oldHabit.id ? oldHabit : habit
        ));
        showSuccess('Modification annulée avec succès !');
      }
    }
  };

  const handleHabitToggle = (habitId: string) => {
    HabitStorage.toggleHabitCompletion(habitId, currentDate);
    loadDailyHabits();
    // Pas de message de confirmation pour le toggle car c'est une action fréquente
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const completedToday = dailyHabits.filter((habit) => habit.isCompleted).length;
  const completionRate = dailyHabits.length
    ? Math.round((completedToday / dailyHabits.length) * 100)
    : 0;

  const navItems: Array<{
    key: ViewMode | 'stats';
    label: string;
    icon: string;
    action: () => void;
  }> = [
    {
      key: 'daily',
      label: 'Aujourd’hui',
      icon: '📅',
      action: () => setViewMode('daily')
    },
    {
      key: 'create',
      label: 'Créer',
      icon: '✨',
      action: () => setViewMode('create')
    },
    {
      key: 'manage',
      label: 'Gérer',
      icon: '⚙️',
      action: () => setViewMode('manage')
    },
    {
      key: 'stats',
      label: '7 jours',
      icon: '📊',
      action: handleViewSevenDays
    }
  ];

  return (
    <div className="min-h-screen pb-28 pt-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col gap-5 px-4 pb-10">
        <main className="flex-1 space-y-4 pt-2">
          {viewMode === 'daily' && (
            <>
              <DateNavigation currentDate={currentDate} onDateChange={handleDateChange} />
              <Card className="bg-white/95">
                <CardContent className="p-4">
                  <DailyHabitsList date={currentDate} habits={dailyHabits} onHabitToggle={handleHabitToggle} />
                </CardContent>
              </Card>
            </>
          )}

          {viewMode === 'create' && (
            <Card className="bg-white/95">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Créer une habitude</CardTitle>
                  <CardDescription>Définissez un nom, des tags et un planning clair</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setViewMode('daily')} aria-label="Fermer le formulaire">
                  ✕
                </Button>
              </CardHeader>
              <CardContent>
                <CreateHabitForm onHabitCreated={handleHabitCreated} onError={showError} />
              </CardContent>
            </Card>
          )}

          {viewMode === 'edit' && editingHabit && (
            <Card className="bg-white/95">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Modifier l&apos;habitude</CardTitle>
                  <CardDescription>Ajustez les détails pour rester aligné</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCancelEdit} aria-label="Fermer l'édition">
                  ✕
                </Button>
              </CardHeader>
              <CardContent>
                <EditHabitForm habit={editingHabit} onHabitUpdated={handleHabitUpdated} onCancel={handleCancelEdit} onError={showError} />
              </CardContent>
            </Card>
          )}

          {viewMode === 'sevenDays' && (
            <Card className="bg-white/95">
              <CardContent className="p-0">
                <SevenDaysView habits={allHabits} onClose={handleCloseSevenDays} />
              </CardContent>
            </Card>
          )}

          {viewMode === 'manage' && (
            <Card className="bg-white/95">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Gérer les habitudes</CardTitle>
                  <CardDescription>Filtrez, éditez et organisez vos rituels</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handleViewSevenDays} aria-label="Voir la vue 7 jours">
                    📊
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setViewMode('daily')} aria-label="Fermer la gestion">
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {tagsWithCount().length > 0 && (
                  <TagsFilter selectedTag={selectedTag} onTagSelect={setSelectedTag} tags={tagsWithCount()} />
                )}

                {filteredHabits().length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl">📝</div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {selectedTag ? `Aucune habitude avec le tag "${selectedTag}"` : 'Aucune habitude créée'}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {selectedTag ? 'Essayez un autre tag ou créez une nouvelle habitude' : 'Commencez par définir votre première habitude'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredHabits().map((habit) => (
                      <div
                        key={habit.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-inner shadow-white/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-slate-900">{habit.name}</h3>
                              <StreakBadge streak={HabitStorage.getHabitStreak(habit.id)} size="sm" />
                            </div>
                            {habit.description && (
                              <p className="mt-1 text-sm text-slate-600">{habit.description}</p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {habit.targetDays.map((day) => (
                                <Badge key={day} variant="outline" className="border-indigo-100 bg-white text-xs text-indigo-600">
                                  {day.charAt(0).toUpperCase() + day.slice(1)}
                                </Badge>
                              ))}
                            </div>
                            {habit.tags && habit.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {habit.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs text-slate-600">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditHabit(habit)}
                              className="text-slate-500 hover:text-indigo-600"
                              aria-label="Modifier l'habitude"
                            >
                              ✏️
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteHabit(habit)}
                              className="text-slate-400 hover:text-rose-600"
                              aria-label="Supprimer l'habitude"
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button className="w-full" onClick={() => setViewMode('create')}>
                  + Créer une habitude
                </Button>
              </CardContent>
            </Card>
          )}
        </main>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-4">
          <nav className="pointer-events-auto w-full max-w-3xl px-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg shadow-slate-200/60">
              {navItems.map((item) => {
                const isActive =
                  item.key === 'stats'
                    ? viewMode === 'sevenDays'
                    : viewMode === item.key;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition',
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        <ConfirmationModal
          isOpen={!!habitToDelete}
          onClose={() => setHabitToDelete(null)}
          onConfirm={confirmDeleteHabit}
          title="Supprimer l'habitude"
          message={`Êtes-vous sûr de vouloir supprimer l'habitude "${habitToDelete?.name}" ? Cette action supprimera également tout l'historique de progression.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          variant="danger"
        />

        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}

        {canUndo && undoState && (
          <UndoButton
            onUndo={handleUndo}
            action={
              undoState.action === 'suppression'
                ? 'Habitude supprimée'
                : undoState.action === 'modification'
                ? 'Habitude modifiée'
                : 'Action effectuée'
            }
            remainingTime={undoRemainingTime}
          />
        )}
      </div>
    </div>
  );
}
