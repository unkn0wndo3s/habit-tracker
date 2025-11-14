'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UndoState<T> {
  action: string;
  data: T;
  metadata?: Record<string, any>;
  timestamp: number;
}

export function useUndo<T>() {
  const [undoState, setUndoState] = useState<UndoState<T> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const registerUndo = useCallback((action: string, data: T, metadata?: Record<string, any>, duration = 5000) => {
    // Annuler le timeout précédent s'il existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Enregistrer l'état pour annulation
    setUndoState({
      action,
      data,
      metadata,
      timestamp: Date.now()
    });

    // Supprimer automatiquement après la durée spécifiée
    timeoutRef.current = setTimeout(() => {
      setUndoState(null);
      timeoutRef.current = null;
    }, duration);
  }, []);

  const undo = useCallback((): { action: string; data: T; metadata?: Record<string, any> } | null => {
    if (!undoState) {
      return null;
    }

    // Annuler le timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const result = {
      action: undoState.action,
      data: undoState.data,
      metadata: undoState.metadata
    };

    // Réinitialiser l'état
    setUndoState(null);

    return result;
  }, [undoState]);

  const clearUndo = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setUndoState(null);
  }, []);

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    undoState,
    registerUndo,
    undo,
    clearUndo,
    canUndo: undoState !== null
  };
}
