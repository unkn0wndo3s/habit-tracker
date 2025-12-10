'use client';

import type { CSSProperties } from 'react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Habit, DailyHabit } from '@/types/habit';
import { HabitStorage } from '@/services/habitStorage';
import CreateHabitForm from '@/components/CreateHabitForm';
import EditHabitForm from '@/components/EditHabitForm';
import DailyHabitsList from '@/components/DailyHabitsList';
import DateNavigation from '@/components/DateNavigation';
import StatsView from '@/components/StatsView';
import StreakBadge from '@/components/StreakBadge';
import TagsFilter from '@/components/TagsFilter';
import ConfirmationModal from '@/components/ConfirmationModal';
import Modal from '@/components/Modal';
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
import { Icon, IconName } from '@/components/Icon';

type ViewMode = 'daily' | 'manage' | 'edit' | 'stats' | 'settings';

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importFileData, setImportFileData] = useState<any>(null);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyDue, setShowOnlyDue] = useState(false);
  const [sortMode, setSortMode] = useState<'created' | 'alphabetical' | 'recentlyCompleted'>('created');
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const { undoState, registerUndo, undo, clearUndo, canUndo } = useUndo<Habit>();
  const [undoRemainingTime, setUndoRemainingTime] = useState(0);
  const installPromptEvent = useRef<BeforeInstallPromptEvent | null>(null);
  const pointerFrame = useRef<number | null>(null);

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
  // On utilise dailyHabits au lieu de allHabits pour avoir les données à jour avec les complétions
  const dueHabitIds = useMemo(() => {
    return new Set(
      dailyHabits
        .filter(habit => !habit.isCompleted && !habit.isFuture)
        .map(habit => habit.id)
    );
  }, [dailyHabits]);

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

    // Ne garder que celles dues aujourd'hui si demandé
    if (showOnlyDue) {
      filtered = filtered.filter(habit => dueHabitIds.has(habit.id));
    }

    filtered = filtered.sort((a, b) => {
      if (sortMode === 'alphabetical') {
        return a.name.localeCompare(b.name, 'fr-FR');
      }
      if (sortMode === 'recentlyCompleted') {
        const lastCompletedA = HabitStorage.getHabitStreak(a.id);
        const lastCompletedB = HabitStorage.getHabitStreak(b.id);
        return lastCompletedB - lastCompletedA;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return filtered;
  }, [allHabits, selectedTag, searchQuery, showOnlyDue, sortMode, dueHabitIds]);

  // Récupérer les habitudes archivées
  const archivedHabits = useCallback(() => {
    return allHabits.filter(habit => habit.archived === true);
  }, [allHabits]);

  const availableTags = tagsWithCount();

  const activeHabitsCount = useMemo(() => allHabits.filter(habit => !habit.archived).length, [allHabits]);
  const archivedCount = allHabits.length - activeHabitsCount;

  const dueTodayCount = useMemo(() => dueHabitIds.size, [dueHabitIds]);

  const loadDailyHabits = useCallback(() => {
    const habits = HabitStorage.getHabitsForDate(currentDate);
    // Trier par ordre de création (plus ancien en premier)
    const sortedHabits = habits.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    setDailyHabits(sortedHabits);
  }, [currentDate]);

  useEffect(() => {
    loadHabits();
    // Planifier toutes les notifications au chargement
    NotificationService.scheduleAllNotifications().catch(() => {});
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
    // Désactiver le service worker en mode développement
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
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

    if (newHabit.notificationEnabled) {
      NotificationService.scheduleNotification(newHabit).catch((error) => {
        console.error('Erreur lors de la planification du rappel:', error);
      });
    }

    if (duplicatingHabit) {
      showSuccess('Habitude dupliquée avec succès !');
    } else {
      showSuccess('Habitude créée avec succès !');
    }

    setDuplicatingHabit(null);
    setIsCreateModalOpen(false);
    setViewMode('manage');
  };

  const handleHabitUpdated = async (updatedHabit: Habit) => {
    // Sauvegarder l'ancienne version pour l'annulation
    const oldHabit = allHabits.find(h => h.id === updatedHabit.id);
    
    const updated = await HabitStorage.updateHabit(updatedHabit.id, {
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
      
      if (updated.notificationEnabled) {
        NotificationService.scheduleNotification(updated).catch((error) => {
          console.error('Erreur lors de la reprogrammation du rappel:', error);
        });
      } else {
        NotificationService.cancelNotification(updated.id).catch(() => {});
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

  const handleViewStats = () => {
    setViewMode('stats');
  };

  const handleCancelEdit = () => {
    setEditingHabit(null);
    setViewMode('manage');
  };

  const handleDeleteHabit = (habit: Habit) => {
    setHabitToDelete(habit);
  };

  const handleArchiveHabit = async (habit: Habit) => {
    const success = await HabitStorage.archiveHabit(habit.id);
    if (success) {
      setAllHabits(prev => prev.map(h => 
        h.id === habit.id ? { ...h, archived: true } : h
      ));
      showSuccess('Habitude archivée avec succès !');
      NotificationService.cancelNotification(habit.id).catch(() => {});
    } else {
      showError('Erreur lors de l\'archivage de l\'habitude');
    }
  };

  const handleUnarchiveHabit = async (habit: Habit) => {
    const success = await HabitStorage.unarchiveHabit(habit.id);
    if (success) {
      setAllHabits(prev => prev.map(h => 
        h.id === habit.id ? { ...h, archived: false } : h
      ));
      const storedHabit = HabitStorage.loadHabits().find(h => h.id === habit.id);
      if (storedHabit?.notificationEnabled) {
        NotificationService.scheduleNotification(storedHabit).catch((error) => {
          console.error('Erreur lors de la reprogrammation du rappel:', error);
        });
      }
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
    setIsCreateModalOpen(true);
    setViewMode('manage');
  };

  const handleStartCreateHabit = () => {
    setDuplicatingHabit(null);
    setIsCreateModalOpen(true);
    setViewMode('manage');
  };

  const handleCancelCreateHabit = () => {
    setIsCreateModalOpen(false);
    setDuplicatingHabit(null);
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
      NotificationService.scheduleAllNotifications().catch(() => {});
      
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

  const schedulePointerUpdate = useCallback((x: number, y: number) => {
    if (pointerFrame.current) {
      cancelAnimationFrame(pointerFrame.current);
    }
    pointerFrame.current = requestAnimationFrame(() => {
      const percentX = Math.min(Math.max((x / window.innerWidth) * 100, 0), 100);
      const percentY = Math.min(Math.max((y / window.innerHeight) * 100, 0), 100);
      document.documentElement.style.setProperty('--pointer-x', `${percentX}%`);
      document.documentElement.style.setProperty('--pointer-y', `${percentY}%`);
    });
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    schedulePointerUpdate(event.clientX, event.clientY);
  }, [schedulePointerUpdate]);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    schedulePointerUpdate(touch.clientX, touch.clientY);
  }, [schedulePointerUpdate]);

  useEffect(() => {
    return () => {
      if (pointerFrame.current) {
        cancelAnimationFrame(pointerFrame.current);
      }
    };
  }, []);

  const confirmDeleteHabit = async () => {
    if (!habitToDelete) return;
    
    // Sauvegarder l'habitude et ses complétions pour l'annulation
    const habitToRestore = { ...habitToDelete };
    const completions = HabitStorage.saveHabitCompletions(habitToDelete.id);
    
    const success = await HabitStorage.deleteHabit(habitToDelete.id);
    if (success) {
      setAllHabits(prev => prev.filter(habit => habit.id !== habitToDelete.id));
      setHabitToDelete(null);
      showSuccess('Habitude supprimée avec succès !');
      NotificationService.cancelNotification(habitToDelete.id).catch(() => {});
      
      // Enregistrer pour annulation avec les complétions
      registerUndo('suppression', habitToRestore, { completions });
    } else {
      showError('Erreur lors de la suppression de l\'habitude');
    }
  };

  const handleUndo = async () => {
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
      if (restoredHabit.notificationEnabled) {
        NotificationService.scheduleNotification(restoredHabit).catch((error) => {
          console.error('Erreur lors de la reprogrammation du rappel après restauration:', error);
        });
      }
    } else if (undoResult.action === 'modification') {
      // Restaurer l'ancienne version
      const oldHabit = undoResult.data as Habit;
      const success = await HabitStorage.updateHabit(oldHabit.id, {
        name: oldHabit.name,
        description: oldHabit.description,
        targetDays: oldHabit.targetDays,
        tags: oldHabit.tags,
        notificationEnabled: oldHabit.notificationEnabled,
        notificationTime: oldHabit.notificationTime
      });
      
      if (success) {
        setAllHabits(prev => prev.map(habit => 
          habit.id === oldHabit.id ? oldHabit : habit
        ));
        showSuccess('Modification annulée avec succès !');
        if (oldHabit.notificationEnabled) {
          NotificationService.scheduleNotification(oldHabit).catch((error) => {
            console.error('Erreur lors de la reprogrammation du rappel après annulation:', error);
          });
        } else {
          NotificationService.cancelNotification(oldHabit.id).catch(() => {});
        }
      }
    }
  };

  const handleHabitToggle = async (habitId: string) => {
    await HabitStorage.toggleHabitCompletion(habitId, currentDate);
    // Recharger les habitudes pour mettre à jour le compteur "Encore à cocher"
    loadHabits();
    loadDailyHabits();
    const updatedHabit = HabitStorage.loadHabits().find(habit => habit.id === habitId);
    if (updatedHabit?.notificationEnabled) {
      NotificationService.scheduleNotification(updatedHabit).catch((error) => {
        console.error('Erreur lors de la mise à jour du rappel:', error);
      });
    } else {
      NotificationService.cancelNotification(habitId).catch(() => {});
    }
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const completedToday = dailyHabits.filter((habit) => habit.isCompleted).length;
  const completionRate = dailyHabits.length
    ? Math.round((completedToday / dailyHabits.length) * 100)
    : 0;

  const navItems: Array<{
    key: ViewMode;
    label: string;
    icon: IconName;
    action: () => void;
  }> = [
    {
      key: 'daily',
      label: 'Aujourd’hui',
      icon: 'calendar',
      action: () => setViewMode('daily')
    },
    {
      key: 'manage',
      label: 'Gérer',
      icon: 'settings',
      action: () => setViewMode('manage')
    },
    {
      key: 'settings',
      label: 'Paramètres',
      icon: 'bell',
      action: () => setViewMode('settings')
    },
    {
      key: 'stats',
      label: 'Statistiques',
      icon: 'chart',
      action: handleViewStats
    }
  ];

  const orbitalLayers = [
    { size: 520, duration: '40s', color: 'rgba(129, 140, 248, 0.5)' },
    { size: 940, duration: '58s', color: 'rgba(56, 189, 248, 0.4)' },
    { size: 1380, duration: '78s', color: 'rgba(16, 185, 129, 0.3)' }
  ];

  const shouldDisplayInstallCTA = canInstallPWA && !isAppInstalled;

  return (
    <div
      className="relative min-h-screen overflow-hidden pb-28 pt-6"
      onPointerMove={handlePointerMove}
      onTouchMove={handleTouchMove}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet-500/25 blur-[160px]" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-sky-500/20 blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-[150px]" />
        <div className="orbital-background">
          <div className="orbital-background__scene">
            {orbitalLayers.map((layer, index) => (
              <div
                key={`orbit-${index}`}
                className="orbital-background__orbit"
                style={
                  {
                    '--orbit-size': `${layer.size}px`,
                    '--orbit-duration': layer.duration,
                    '--orbit-color': layer.color
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col gap-4 px-3 pb-10 md:gap-5 md:px-4">
        <main className="flex-1 space-y-3 pt-2 md:space-y-4">
          {shouldDisplayInstallCTA && (
            <Card className="md:hidden border border-indigo-500/40 bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-900 shadow-xl shadow-indigo-900/40">
              <CardContent className="flex flex-col gap-3 p-5">
                <div>
                  <p className="text-sm font-semibold text-indigo-100" title="Installer l'app">Installer l'app</p>
                  <p className="text-xs text-slate-300" title="Ajoutez TrackIt sur votre écran d'accueil pour un accès hors ligne et en plein écran.">
                    Ajoutez TrackIt sur votre écran d'accueil pour un accès hors ligne et en plein écran.
                  </p>
                </div>
                <Button
                  onClick={handleInstallApp}
                  className="w-full border border-indigo-500/50 bg-indigo-500/30 text-slate-50 shadow-[0_15px_40px_rgba(99,102,241,0.35)] hover:bg-indigo-500/50"
                  title="Installer l'app"
                >
                  Installer l'app
                </Button>
              </CardContent>
            </Card>
          )}

          {viewMode === 'daily' && (
            <>
              <DateNavigation currentDate={currentDate} onDateChange={handleDateChange} />
              <Card className="border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30 backdrop-blur">
                <CardContent className="p-4">
                  <DailyHabitsList date={currentDate} habits={dailyHabits} onHabitToggle={handleHabitToggle} />
                </CardContent>
              </Card>
            </>
          )}

          {viewMode === 'edit' && editingHabit && (
            <Card className="border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle title="Modifier l'habitude">Modifier l&apos;habitude</CardTitle>
                  <CardDescription title="Ajustez les détails pour rester aligné">Ajustez les détails pour rester aligné</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCancelEdit} aria-label="Fermer l'édition" title="Fermer l'édition">
                  <Icon name="close" className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <EditHabitForm habit={editingHabit} onHabitUpdated={handleHabitUpdated} onCancel={handleCancelEdit} onError={showError} />
              </CardContent>
            </Card>
          )}

          {viewMode === 'stats' && (
            <Card className="border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30">
              <CardContent className="p-0">
                <StatsView habits={allHabits.filter(h => !h.archived)} />
              </CardContent>
            </Card>
          )}

          {viewMode === 'settings' && (
            <SettingsView
              onError={showError}
              onSuccess={showSuccess}
            />
          )}

          {viewMode === 'manage' &&
            (() => {
              const visibleHabits = filteredHabits();
              const archivedList = archivedHabits();
              const formatStatValue = (value: number) => (value > 99 ? '99+' : value);
              const manageHighlights: Array<{ key: string; label: string; value: number; caption: string; icon: IconName }> =
                [
                  {
                    key: 'active',
                    label: 'Habitudes actives',
                    value: activeHabitsCount,
                    caption: 'Actuellement suivies',
                    icon: 'sparkles'
                  },
                  {
                    key: 'due',
                    label: 'À faire aujourd’hui',
                    value: dueTodayCount,
                    caption: 'Encore à cocher',
                    icon: 'bell'
                  },
                  {
                    key: 'tags',
                    label: 'Tags actifs',
                    value: availableTags.length,
                    caption: 'Catégories disponibles',
                    icon: 'note'
                  }
                ];

              return (
                <Card className="w-full border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30">
                  <CardHeader>
                    <CardTitle title="Gérer les habitudes">Gérer les habitudes</CardTitle>
                    <CardDescription title="Filtrez, éditez et organisez vos rituels">Filtrez, éditez et organisez vos rituels</CardDescription>
                  </CardHeader>
                  <CardContent className="w-full space-y-6">
                    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                      {manageHighlights.map((stat) => (
                        <div
                          key={stat.key}
                          className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 via-transparent to-transparent px-3 py-3 shadow-inner shadow-black/30 backdrop-blur sm:px-4 sm:py-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="p-1.5 text-white" title={stat.label}>
                              <Icon name={stat.icon} className="h-3 w-3" />
                            </div>
                             <span className="text-[10px] uppercase tracking-[0.35em] text-slate-500 text-right flex-1 sm:w-32" title={stat.label}>
                              {stat.label}
                            </span>
                          </div>
                          <p className="mt-3 text-2xl font-semibold text-slate-50 sm:mt-4 sm:text-3xl" title={`${formatStatValue(stat.value)} ${stat.caption}`}>{formatStatValue(stat.value)}</p>
                          <p className="text-xs text-slate-400" title={stat.caption}>{stat.caption}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/50 to-slate-900/60 p-4 shadow-[0_25px_60px_-45px_rgba(99,102,241,0.8)] sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-100" title="Créer une habitude">Créer une habitude</p>
                          <p className="mt-1 text-xs text-slate-300" title="Définissez un nom, des tags et un planning clair ou dupliquez une habitude existante.">
                            Définissez un nom, des tags et un planning clair ou dupliquez une habitude existante.
                          </p>
                        </div>
                        <Button
                          className="w-full border border-white/10 bg-white/10 text-slate-100 sm:w-auto sm:shrink-0"
                          onClick={handleStartCreateHabit}
                          title="+ Nouvelle habitude"
                        >
                          + Nouvelle habitude
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-200 sm:mt-4">
                        <Badge variant="outline" className="border-white/20 text-slate-100" title={`${activeHabitsCount} actives`}>
                          {activeHabitsCount} actives
                        </Badge>
                        <Badge variant="outline" className="border-white/20 text-slate-100" title={`${archivedCount} archivées`}>
                          {archivedCount} archivées
                        </Badge>
                        <Badge variant="outline" className="border-white/20 text-slate-100" title={`${availableTags.length} tags`}>
                          {availableTags.length} tags
                        </Badge>
                      </div>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[2fr,1fr] lg:grid-cols-[1.7fr,1fr]">
                      <div className="w-full min-w-0 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-3 shadow-inner shadow-black/30 sm:p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <p className="text-sm font-semibold text-slate-200 sm:flex-1 sm:text-right" title="Recherche & filtre rapide">Recherche & filtre rapide</p>
                          {selectedTag && (
                            <button
                              type="button"
                              onClick={() => setSelectedTag(null)}
                              className="self-start text-xs text-slate-400 underline-offset-4 hover:text-slate-200 sm:self-auto"
                              title="Effacer le tag"
                            >
                              Effacer le tag
                            </button>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-900/30 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
                          <div title="Rechercher une habitude">
                            <Icon name="search" className="h-4 w-4 shrink-0 text-slate-500" />
                          </div>
                          <Input
                            type="text"
                            placeholder="Rechercher une habitude..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 border-none bg-transparent px-0 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-base"
                            title="Rechercher une habitude"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="shrink-0 text-slate-500 transition-colors hover:text-slate-100"
                              aria-label="Effacer la recherche"
                              title="Effacer la recherche"
                            >
                              <Icon name="close" className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 md:flex-nowrap">
                          <button
                            type="button"
                            onClick={() => setShowOnlyDue((prev) => !prev)}
                            className={cn(
                              'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition sm:px-3 sm:text-xs',
                              showOnlyDue
                                ? 'border-rose-400/70 bg-rose-500/20 text-rose-100'
                                : 'border-slate-600 text-slate-300 hover:text-slate-100'
                            )}
                            title={showOnlyDue ? 'Voir toutes les tâches' : "Voir les tâches à faire aujourd'hui"}
                          >
                            {showOnlyDue ? 'Voir toutes les tâches' : "Voir les tâches à faire aujourd'hui"}
                          </button>
                          {selectedTag && (
                            <span className="rounded-full border border-slate-600 px-2.5 py-1 text-[11px] text-slate-300 sm:px-3 sm:text-xs" title={`Tag #${selectedTag}`}>
                              Tag #{selectedTag}
                            </span>
                          )}
                          {(['created', 'alphabetical', 'recentlyCompleted'] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setSortMode(mode)}
                              className={cn(
                                'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition sm:px-3 sm:text-xs',
                                sortMode === mode
                                  ? 'border-indigo-400/70 bg-indigo-500/20 text-indigo-100'
                                  : 'border-slate-600 text-slate-300 hover:text-slate-100'
                              )}
                              title={mode === 'created'
                                ? 'Création'
                                : mode === 'alphabetical'
                                ? 'A → Z'
                                : 'Progression'}
                            >
                              {mode === 'created'
                                ? 'Création'
                                : mode === 'alphabetical'
                                ? 'A → Z'
                                : 'Progression'}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-slate-500 sm:text-right" title={selectedTag ? `Tag filtré : #${selectedTag}` : 'Combinez recherche, filtres et tri pour affiner la liste.'}>
                          {selectedTag ? `Tag filtré : #${selectedTag}` : 'Combinez recherche, filtres et tri pour affiner la liste.'}
                        </p>
                      </div>

                      {availableTags.length > 0 && (
                        <TagsFilter selectedTag={selectedTag} onTagSelect={setSelectedTag} tags={availableTags} />
                      )}
                    </div>

                    {visibleHabits.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center shadow-inner shadow-black/30">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900/70" title="Note">
                          <Icon name="note" className="h-8 w-8 text-indigo-200" strokeWidth={1.4} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-100" title={searchQuery.trim()
                            ? 'Aucune habitude trouvée'
                            : selectedTag
                            ? `Aucune habitude avec le tag "${selectedTag}"`
                            : 'Aucune habitude créée'}>
                          {searchQuery.trim()
                            ? 'Aucune habitude trouvée'
                            : selectedTag
                            ? `Aucune habitude avec le tag "${selectedTag}"`
                            : 'Aucune habitude créée'}
                        </h3>
                        <p className="mt-2 text-sm text-slate-400" title={searchQuery.trim()
                            ? 'Essayez une autre recherche ou effacez le champ pour voir toutes les habitudes'
                            : selectedTag
                            ? 'Essayez un autre tag ou créez une nouvelle habitude'
                            : 'Commencez par définir votre première habitude'}>
                          {searchQuery.trim()
                            ? 'Essayez une autre recherche ou effacez le champ pour voir toutes les habitudes'
                            : selectedTag
                            ? 'Essayez un autre tag ou créez une nouvelle habitude'
                            : 'Commencez par définir votre première habitude'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {visibleHabits.map((habit) => (
                          <div
                            key={habit.id}
                            className="rounded-2xl border border-slate-700 bg-slate-900/50 p-3 shadow-[0_25px_50px_-45px_rgba(0,0,0,0.9)] transition hover:border-slate-500/60 sm:p-4"
                          >
                            <div className="flex items-start justify-between gap-2 sm:gap-3">
                                <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <h3
                                    className="text-sm font-semibold text-slate-100 break-words line-clamp-2 sm:line-clamp-1 sm:text-base"
                                    title={habit.name}
                                  >
                                    {habit.name}
                                  </h3>
                                  <StreakBadge streak={HabitStorage.getHabitStreak(habit.id)} size="sm" />
                                </div>
                                {habit.description && (
                                  <p
                                    className="mt-1 text-sm text-slate-400 line-clamp-2 whitespace-pre-line"
                                    title={habit.description}
                                  >
                                    {habit.description}
                                  </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {habit.targetDays.map((day) => (
                                    <Badge
                                      key={day}
                                      variant="outline"
                                      className="border-indigo-500/40 bg-indigo-500/10 text-xs text-indigo-100"
                                      title={day.charAt(0).toUpperCase() + day.slice(1)}
                                    >
                                      {day.charAt(0).toUpperCase() + day.slice(1)}
                                    </Badge>
                                  ))}
                                </div>
                                {habit.tags && habit.tags.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {habit.tags.map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="text-xs border border-slate-700 bg-slate-900/20 text-slate-200"
                                        title={`Tag #${tag}`}
                                      >
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0 sm:gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditHabit(habit)}
                                  className="h-8 w-8 text-slate-400 hover:text-indigo-300 sm:h-10 sm:w-10"
                                  aria-label="Modifier l'habitude"
                                  title="Modifier l'habitude"
                                >
                                  <Icon name="pencil" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDuplicateHabit(habit)}
                                  className="h-8 w-8 text-slate-400 hover:text-blue-300 sm:h-10 sm:w-10"
                                  aria-label="Dupliquer l'habitude"
                                  title="Dupliquer l'habitude"
                                >
                                  <Icon name="copy" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleArchiveHabit(habit)}
                                  className="h-8 w-8 text-slate-400 hover:text-amber-300 sm:h-10 sm:w-10"
                                  aria-label="Archiver l'habitude"
                                  title="Archiver l'habitude"
                                >
                                  <Icon name="archive" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteHabit(habit)}
                                  className="h-8 w-8 text-slate-500 hover:text-rose-300 sm:h-10 sm:w-10"
                                  aria-label="Supprimer l'habitude"
                                  title="Supprimer l'habitude"
                                >
                                  <Icon name="trash" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-slate-800/70 pt-4">
                      <p className="mb-3 text-sm font-medium text-slate-100" title="Sauvegarde et transfert">Sauvegarde et transfert</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 border border-slate-700 bg-slate-900/40 text-slate-100"
                          onClick={handleExportData}
                          title="Exporter"
                        >
                          <Icon name="export" className="mr-2 h-4 w-4" />
                          Exporter
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
                            className="w-full border border-slate-700 bg-slate-900/40 text-slate-100"
                            type="button"
                            onClick={() => document.getElementById('import-file-input')?.click()}
                            title="Importer"
                          >
                            <Icon name="import" className="mr-2 h-4 w-4" />
                            Importer
                          </Button>
                        </label>
                      </div>
                    </div>

                    {archivedList.length > 0 && (
                      <div className="space-y-4 border-t border-slate-800/70 pt-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-200" title="Archivées">Archivées</h3>
                          <Badge
                            variant="secondary"
                            className="text-xs border border-slate-700 bg-slate-900/40 text-slate-100"
                            title={`${archivedList.length} archivées`}
                          >
                            {archivedList.length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {archivedList.map((habit) => (
                            <div
                              key={habit.id}
                              className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-100 shadow-inner shadow-black/30"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-base font-semibold text-amber-100 line-through" title={habit.name}>{habit.name}</h3>
                                    <Badge
                                      variant="outline"
                                      className="border-amber-400/70 bg-amber-500/15 text-xs text-amber-100"
                                      title="Archivée"
                                    >
                                      Archivée
                                    </Badge>
                                    <StreakBadge streak={HabitStorage.getHabitStreak(habit.id)} size="sm" />
                                  </div>
                                  {habit.description && (
                                    <p className="mt-1 text-sm text-amber-50/80" title={habit.description}>{habit.description}</p>
                                  )}
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    {habit.targetDays.map((day) => (
                                      <Badge
                                        key={day}
                                        variant="outline"
                                        className="border-amber-400/60 bg-amber-500/10 text-xs text-amber-100"
                                        title={day.charAt(0).toUpperCase() + day.slice(1)}
                                      >
                                        {day.charAt(0).toUpperCase() + day.slice(1)}
                                      </Badge>
                                    ))}
                                  </div>
                                  {habit.tags && habit.tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {habit.tags.map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="secondary"
                                          className="text-xs border border-amber-400/40 bg-amber-500/10 text-amber-50"
                                          title={`Tag #${tag}`}
                                        >
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
                                    className="text-amber-100 hover:bg-amber-400/20"
                                    aria-label="Réactiver l'habitude"
                                    title="Réactiver l'habitude"
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
              );
            })()}
        </main>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-2 sm:pb-4">
          <nav className="pointer-events-auto w-full max-w-3xl px-2 sm:px-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-2 py-1.5 shadow-2xl shadow-black/40 backdrop-blur sm:px-3 sm:py-2">
              {navItems.map((item) => {
                const isActive =
                  item.key === 'stats'
                    ? viewMode === 'stats'
                    : viewMode === item.key;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className={cn(
                      'flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-medium transition sm:gap-1 sm:px-3 sm:py-1.5 sm:text-xs',
                      isActive
                        ? 'bg-indigo-500/15 text-indigo-100'
                        : 'text-slate-400 hover:text-slate-100'
                    )}
                    title={item.label}
                  >
                    <Icon name={item.icon} className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline" title={item.label}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        <Modal
          isOpen={isCreateModalOpen}
          onClose={handleCancelCreateHabit}
          title={duplicatingHabit ? "Dupliquer une habitude" : "Créer une habitude"}
          size="lg"
          hideCloseButton
          headerContent={
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-100" title={duplicatingHabit ? "Dupliquer l'habitude" : 'Créer une habitude'}>
                    {duplicatingHabit ? "Dupliquer l'habitude" : 'Créer une habitude'}
                  </p>
                  <p className="text-xs text-slate-400" title={duplicatingHabit ? "Adaptez les paramètres avant d'enregistrer la copie." : "Définissez un nom, des tags et un planning clair."}>
                    {duplicatingHabit
                      ? "Adaptez les paramètres avant d'enregistrer la copie."
                      : "Définissez un nom, des tags et un planning clair."}
                  </p>
                </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancelCreateHabit} title="Annuler">
                  Annuler
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelCreateHabit} title="Terminer">
                  Terminer
                </Button>
              </div>
            </div>
          }
        >
          <CreateHabitForm
            onHabitCreated={handleHabitCreated}
            onError={showError}
            initialValues={
              duplicatingHabit
                ? {
                    name: duplicatingHabit.name,
                    description: duplicatingHabit.description,
                    targetDays: duplicatingHabit.targetDays,
                    tags: duplicatingHabit.tags,
                    notificationEnabled: duplicatingHabit.notificationEnabled,
                    notificationTime: duplicatingHabit.notificationTime
                  }
                : undefined
            }
          />
        </Modal>

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
