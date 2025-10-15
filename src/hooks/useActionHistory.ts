'use client';

import { useState, useCallback } from 'react';

export interface ActionHistoryItem {
  id: string;
  type: 'create' | 'update' | 'delete' | 'toggle';
  habitId: string;
  habitName: string;
  timestamp: Date;
  data?: any; // Données pour annuler l'action
}

export function useActionHistory() {
  const [history, setHistory] = useState<ActionHistoryItem[]>([]);
  const [lastAction, setLastAction] = useState<ActionHistoryItem | null>(null);

  const addAction = useCallback((action: Omit<ActionHistoryItem, 'id' | 'timestamp'>) => {
    const newAction: ActionHistoryItem = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
    
    setHistory(prev => [newAction, ...prev].slice(0, 10)); // Garder seulement les 10 dernières actions
    setLastAction(newAction);
  }, []);

  const undoLastAction = useCallback(() => {
    if (!lastAction) return null;
    
    // Retirer l'action de l'historique
    setHistory(prev => prev.filter(action => action.id !== lastAction.id));
    setLastAction(history[1] || null); // Prendre la suivante ou null
    
    return lastAction;
  }, [lastAction, history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setLastAction(null);
  }, []);

  return {
    history,
    lastAction,
    addAction,
    undoLastAction,
    clearHistory
  };
}
