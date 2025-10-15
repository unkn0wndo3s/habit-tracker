'use client';

import { useEffect, useState } from 'react';
import { ActionHistoryItem } from '@/hooks/useActionHistory';

interface UndoToastProps {
  lastAction: ActionHistoryItem | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export default function UndoToast({ lastAction, onUndo, onDismiss }: UndoToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (lastAction) {
      setIsVisible(true);
      setTimeLeft(5);
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsVisible(false);
            onDismiss();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lastAction, onDismiss]);

  const handleUndo = () => {
    onUndo();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible || !lastAction) return null;

  const getActionText = (action: ActionHistoryItem) => {
    switch (action.type) {
      case 'create':
        return `"${action.habitName}" créée`;
      case 'update':
        return `"${action.habitName}" modifiée`;
      case 'delete':
        return `"${action.habitName}" supprimée`;
      case 'toggle':
        return `"${action.habitName}" marquée`;
      default:
        return 'Action effectuée';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-gray-900 text-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">
              {getActionText(lastAction)}
            </p>
            <div className="flex items-center mt-1">
              <div className="w-full bg-gray-700 rounded-full h-1 mr-2">
                <div 
                  className="bg-white h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${(timeLeft / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-300">{timeLeft}s</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleUndo}
              className="text-sm font-medium text-blue-400 hover:text-blue-300 focus:outline-none focus:underline"
            >
              Annuler
            </button>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-300 focus:outline-none"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
