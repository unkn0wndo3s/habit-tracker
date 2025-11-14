'use client';

interface UndoButtonProps {
  onUndo: () => void;
  action: string;
  remainingTime: number;
}

export default function UndoButton({ onUndo, action, remainingTime }: UndoButtonProps) {
  const secondsLeft = Math.ceil(remainingTime / 1000);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
        <div className="flex-1">
          <p className="text-sm font-medium">
            {action}
          </p>
          <p className="text-xs text-gray-300 mt-0.5">
            Annulation possible dans {secondsLeft}s
          </p>
        </div>
        <button
          onClick={onUndo}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          aria-label="Annuler"
        >
          <span>↶</span>
          <span>Annuler</span>
        </button>
      </div>
    </div>
  );
}
