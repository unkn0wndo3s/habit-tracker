'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import SettingsView from '@/components/SettingsView';
import { NotificationService } from '@/services/notificationService';
import { useToast } from '@/hooks/useToast';
import { useUndo } from '@/hooks/useUndo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ViewMode = 'daily' | 'create' | 'manage' | 'edit' | 'sevenDays' | 'settings';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyHabits, setDailyHabits] = useState<DailyHabit[]>([]);
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [duplicatingHabit, setDuplicatingHabit] = useState<Habit | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importFileData, setImportFileData] = useState<any>(null);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [previousViewMode, setPreviousViewMode] = useState<ViewMode>('daily');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const { undoState, registerUndo, undo, clearUndo, canUndo } = useUndo<Habit>();
  const [undoRemainingTime, setUndoRemainingTime] = useState(0);
  const installPromptEvent = useRef<BeforeInstallPromptEvent | null>(null);

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

  // Filtrer les habitudes par tag sélectionné et recherche (exclure les archivées)
  const filteredHabits = useCallback(() => {
    let filtered = allHabits.filter(habit => !habit.archived);

    // Filtre par tag
    if (selectedTag) {
      filtered = filtered.filter(habit => (habit.tags || []).includes(selectedTag));
    }

    // Filtre par recherche (nom et description, insensible à la casse)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(habit => {
        const nameMatch = habit.name.toLowerCase().includes(query);
        const descriptionMatch = habit.description?.toLowerCase().includes(query) || false;
        return nameMatch || descriptionMatch;
      });
    }

    return filtered;
  }, [allHabits, selectedTag, searchQuery]);

  // Récupérer les habitudes archivées
  const archivedHabits = useCallback(() => {
    return allHabits.filter(habit => habit.archived === true);
  }, [allHabits]);

  const loadDailyHabits = useCallback(() => {
    const habits = HabitStorage.getHabitsForDate(currentDate);
    // Trier par ordre de création (plus ancien en premier)
    const sortedHabits = habits.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    setDailyHabits(sortedHabits);
  }, [currentDate]);

  useEffect(() => {
    loadHabits();
    // Planifier toutes les notifications au chargement
    NotificationService.scheduleAllNotifications();
  }, [loadHabits]);

  useEffect(() => {
    if (viewMode === 'daily') {
      loadDailyHabits();
    }
  }, [currentDate, allHabits, viewMode, loadDailyHabits]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      installPromptEvent.current = event as BeforeInstallPromptEvent;
      setCanInstallPWA(true);
    };

    const handleAppInstalled = () => {
      installPromptEvent.current = null;
      setCanInstallPWA(false);
      setIsAppInstalled(true);
      showSuccess("TrackIt est maintenant installée sur votre écran d'accueil !");
    };

    const standaloneMatcher = window.matchMedia('(display-mode: standalone)');
    const syncStandalone = () => {
      const installed =
        standaloneMatcher.matches || (window.navigator as any).standalone === true;
      setIsAppInstalled(installed);
      if (installed) {
        setCanInstallPWA(false);
      }
    };

    syncStandalone();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    standaloneMatcher.addEventListener('change', syncStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneMatcher.removeEventListener('change', syncStandalone);
    };
  }, [showSuccess]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let hasAcknowledgedFirstChange = false;

    const controllerChangeHandler = () => {
      if (!hasAcknowledgedFirstChange) {
        hasAcknowledgedFirstChange = true;
        return;
      }
      showSuccess('TrackIt a été mise à jour automatiquement.');
    };

    navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler);

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) {
            return;
          }
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showSuccess('Une nouvelle version est disponible, elle sera appliquée automatiquement.');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    registerServiceWorker();

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeHandler);
    };
  }, [showSuccess]);

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
    
    // Planifier les notifications si activées
    if (newHabit.notificationEnabled) {
      NotificationService.scheduleNotification(newHabit);
    }
    
    if (duplicatingHabit) {
      showSuccess('Habitude dupliquée avec succès !');
      setDuplicatingHabit(null);
    } else {
      showSuccess('Habitude créée avec succès !');
    }
    setViewMode('daily');
  };

  const handleHabitUpdated = (updatedHabit: Habit) => {
    // Sauvegarder l'ancienne version pour l'annulation
    const oldHabit = allHabits.find(h => h.id === updatedHabit.id);
    
    const updated = HabitStorage.updateHabit(updatedHabit.id, {
      name: updatedHabit.name,
      description: updatedHabit.description,
      targetDays: updatedHabit.targetDays,
      tags: updatedHabit.tags || [],
      notificationEnabled: updatedHabit.notificationEnabled,
      notificationTime: updatedHabit.notificationTime
    });
    
    if (updated) {
      // Utiliser l'habitude retournée par updateHabit qui contient les tags normalisés
      setAllHabits(prev => prev.map(habit => 
        habit.id === updatedHabit.id ? updated : habit
      ));
      
      // Mettre à jour les notifications
      if (updated.notificationEnabled) {
        NotificationService.scheduleNotification(updated);
      } else {
        NotificationService.cancelNotification(updated.id);
      }
      
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

  const handleArchiveHabit = (habit: Habit) => {
    const success = HabitStorage.archiveHabit(habit.id);
    if (success) {
      setAllHabits(prev => prev.map(h => 
        h.id === habit.id ? { ...h, archived: true } : h
      ));
      showSuccess('Habitude archivée avec succès !');
    } else {
      showError('Erreur lors de l\'archivage de l\'habitude');
    }
  };

  const handleUnarchiveHabit = (habit: Habit) => {
    const success = HabitStorage.unarchiveHabit(habit.id);
    if (success) {
      setAllHabits(prev => prev.map(h => 
        h.id === habit.id ? { ...h, archived: false } : h
      ));
      showSuccess('Habitude réactivée avec succès !');
    } else {
      showError('Erreur lors de la réactivation de l\'habitude');
    }
  };

  const generateDuplicateName = (originalName: string): string => {
    const allHabits = HabitStorage.loadHabits();
    const baseName = originalName.trim();
    
    // Vérifier si le nom commence déjà par "Copie de"
    if (baseName.startsWith('Copie de ')) {
      const nameWithoutPrefix = baseName.replace(/^Copie de /, '');
      // Chercher un numéro existant
      const match = nameWithoutPrefix.match(/^(.+?)\s*\((\d+)\)$/);
      if (match) {
        const base = match[1];
        const num = parseInt(match[2], 10);
        let newNum = num + 1;
        let newName = `Copie de ${base} (${newNum})`;
        while (allHabits.some(h => h.name === newName)) {
          newNum++;
          newName = `Copie de ${base} (${newNum})`;
        }
        return newName;
      }
      // Si pas de numéro, ajouter (2)
      let newName = `${baseName} (2)`;
      let num = 2;
      while (allHabits.some(h => h.name === newName)) {
        num++;
        newName = `${baseName} (${num})`;
      }
      return newName;
    }
    
    // Vérifier si le nom se termine déjà par un numéro entre parenthèses
    const match = baseName.match(/^(.+?)\s*\((\d+)\)$/);
    if (match) {
      const base = match[1];
      const num = parseInt(match[2], 10);
      let newNum = num + 1;
      let newName = `${base} (${newNum})`;
      while (allHabits.some(h => h.name === newName)) {
        newNum++;
        newName = `${base} (${newNum})`;
      }
      return newName;
    }
    
    // Sinon, préfixer par "Copie de"
    let newName = `Copie de ${baseName}`;
    let num = 2;
    while (allHabits.some(h => h.name === newName)) {
      newName = `Copie de ${baseName} (${num})`;
      num++;
    }
    return newName;
  };

  const handleDuplicateHabit = (habit: Habit) => {
    const duplicateName = generateDuplicateName(habit.name);
    setDuplicatingHabit({
      ...habit,
      name: duplicateName
    });
    setViewMode('create');
  };

  const handleExportData = () => {
    try {
      const data = HabitStorage.exportData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trackit-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess('Sauvegarde exportée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      showError('Erreur lors de l\'export de la sauvegarde');
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        setImportFileData(data);
        setShowImportConfirm(true);
      } catch (error) {
        console.error('Erreur lors de la lecture du fichier:', error);
        showError('Fichier invalide. Veuillez sélectionner un fichier de sauvegarde valide.');
      }
    };
    reader.onerror = () => {
      showError('Erreur lors de la lecture du fichier');
    };
    reader.readAsText(file);
    
    // Réinitialiser l'input pour permettre de sélectionner le même fichier à nouveau
    event.target.value = '';
  };

  const confirmImport = () => {
    if (!importFileData) return;

    const result = HabitStorage.importData(importFileData);
    if (result.success) {
      // Recharger toutes les données
      setAllHabits(HabitStorage.loadHabits());
      loadDailyHabits();
      
      // Afficher un message avec le nombre d'éléments ajoutés
      const messages = [];
      if (result.habitsAdded > 0) {
        messages.push(`${result.habitsAdded} habitude${result.habitsAdded > 1 ? 's' : ''} ajoutée${result.habitsAdded > 1 ? 's' : ''}`);
      }
      if (result.completionsAdded > 0) {
        messages.push(`${result.completionsAdded} complétion${result.completionsAdded > 1 ? 's' : ''} ajoutée${result.completionsAdded > 1 ? 's' : ''}`);
      }
      
      if (messages.length > 0) {
        showSuccess(`Sauvegarde importée avec succès ! ${messages.join(' et ')}.`);
      } else {
        showSuccess('Sauvegarde importée. Aucune nouvelle donnée à ajouter (toutes les habitudes existent déjà).');
      }
    } else {
      showError('Erreur lors de l\'import. Le fichier est peut-être corrompu ou invalide.');
    }
    
    setShowImportConfirm(false);
    setImportFileData(null);
  };

  const cancelImport = () => {
    setShowImportConfirm(false);
    setImportFileData(null);
  };

  const handleInstallApp = async () => {
    const promptEvent = installPromptEvent.current;
    if (!promptEvent) {
      return;
    }

    try {
      promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showSuccess("Installation en cours ! TrackIt sera disponible depuis votre écran d'accueil.");
      } else {
        showError("Installation annulée.");
      }
    } catch (error) {
      console.error('Erreur lors de la tentative d’installation:', error);
      showError("Impossible d'installer l'application pour le moment.");
    } finally {
      installPromptEvent.current = null;
      setCanInstallPWA(false);
    }
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
      key: 'settings',
      label: 'Paramètres',
      icon: '🔔',
      action: () => setViewMode('settings')
    },
    {
      key: 'stats',
      label: '7 jours',
      icon: '📊',
      action: handleViewSevenDays
    }
  ];

  const shouldDisplayInstallCTA = canInstallPWA && !isAppInstalled;

  return (
    <div className="min-h-screen pb-28 pt-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col gap-5 px-4 pb-10">
        <main className="flex-1 space-y-4 pt-2">
          {shouldDisplayInstallCTA && (
            <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
              <CardContent className="flex flex-col gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Installer l'app</p>
                  <p className="text-xs text-slate-600">
                    Ajoutez TrackIt sur votre écran d'accueil pour un accès hors ligne et en plein écran.
                  </p>
                </div>
                <Button
                  onClick={handleInstallApp}
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Installer l'app
                </Button>
              </CardContent>
            </Card>
          )}

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
                  <CardTitle>{duplicatingHabit ? 'Dupliquer l\'habitude' : 'Créer une habitude'}</CardTitle>
                  <CardDescription>
                    {duplicatingHabit ? 'Modifiez les données si nécessaire avant de sauvegarder' : 'Définissez un nom, des tags et un planning clair'}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setViewMode('daily');
                    setDuplicatingHabit(null);
                  }} 
                  aria-label="Fermer le formulaire"
                >
                  ✕
                </Button>
              </CardHeader>
              <CardContent>
                <CreateHabitForm 
                  onHabitCreated={handleHabitCreated} 
                  onError={showError}
                  initialValues={duplicatingHabit ? {
                    name: duplicatingHabit.name,
                    description: duplicatingHabit.description,
                    targetDays: duplicatingHabit.targetDays,
                    tags: duplicatingHabit.tags
                  } : undefined}
                />
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
                <SevenDaysView habits={allHabits.filter(h => !h.archived)} onClose={handleCloseSevenDays} />
              </CardContent>
            </Card>
          )}

          {viewMode === 'settings' && (
            <SettingsView
              onClose={() => setViewMode('daily')}
              onError={showError}
              onSuccess={showSuccess}
            />
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
                {/* Champ de recherche */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Rechercher une habitude..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                  {searchQuery && (
                <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label="Effacer la recherche"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                </button>
                  )}
              </div>

                {tagsWithCount().length > 0 && (
                  <TagsFilter selectedTag={selectedTag} onTagSelect={setSelectedTag} tags={tagsWithCount()} />
                )}

                {filteredHabits().length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl">📝</div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {searchQuery.trim() 
                        ? 'Aucune habitude trouvée' 
                        : selectedTag 
                        ? `Aucune habitude avec le tag "${selectedTag}"` 
                        : 'Aucune habitude créée'}
                  </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {searchQuery.trim() 
                        ? 'Essayez une autre recherche ou effacez le champ pour voir toutes les habitudes' 
                        : selectedTag 
                        ? 'Essayez un autre tag ou créez une nouvelle habitude' 
                        : 'Commencez par définir votre première habitude'}
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
                              onClick={() => handleDuplicateHabit(habit)}
                              className="text-slate-500 hover:text-blue-600"
                              aria-label="Dupliquer l'habitude"
                            >
                              📋
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleArchiveHabit(habit)}
                              className="text-slate-500 hover:text-amber-600"
                              aria-label="Archiver l'habitude"
                            >
                              📦
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

                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">Sauvegarde et transfert</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleExportData}
                    >
                      📥 Exporter
                    </Button>
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportFile}
                        className="hidden"
                        id="import-file-input"
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        type="button"
                        onClick={() => document.getElementById('import-file-input')?.click()}
                      >
                        📤 Importer
                      </Button>
                    </label>
                  </div>
                </div>

                {/* Section des habitudes archivées */}
                {archivedHabits().length > 0 && (
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-700">Archivées</h3>
                      <Badge variant="secondary" className="text-xs">
                        {archivedHabits().length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {archivedHabits().map((habit) => (
                        <div
                          key={habit.id}
                          className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-inner shadow-white/50 opacity-75"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-slate-700 line-through">{habit.name}</h3>
                                <Badge variant="outline" className="border-amber-300 bg-amber-100 text-xs text-amber-700">
                                  Archivée
                                </Badge>
                                <StreakBadge streak={HabitStorage.getHabitStreak(habit.id)} size="sm" />
                              </div>
                              {habit.description && (
                                <p className="mt-1 text-sm text-slate-500">{habit.description}</p>
                              )}
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {habit.targetDays.map((day) => (
                                  <Badge key={day} variant="outline" className="border-amber-200 bg-white text-xs text-amber-600">
                                    {day.charAt(0).toUpperCase() + day.slice(1)}
                                  </Badge>
                                ))}
                              </div>
                              {habit.tags && habit.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {habit.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs text-slate-500">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnarchiveHabit(habit)}
                                className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                                aria-label="Réactiver l'habitude"
                              >
                                Réactiver
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
            </div>
                )}
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

        <ConfirmationModal
          isOpen={showImportConfirm}
          onClose={cancelImport}
          onConfirm={confirmImport}
          title="Importer une sauvegarde"
          message="Les habitudes et complétions du fichier seront ajoutées à vos données existantes. Les habitudes avec le même ID seront ignorées pour éviter les doublons."
          confirmText="Importer"
          cancelText="Annuler"
          variant="info"
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
