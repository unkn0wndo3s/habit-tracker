'use client';

import { Button } from './ui/button';

interface UndoButtonProps {
  onUndo: () => void;
  action: string;
  remainingTime: number;
}

export default function UndoButton({ onUndo, action, remainingTime }: UndoButtonProps) {
  const secondsLeft = Math.ceil(remainingTime / 1000);

  return (
    <div className="animate-slide-up fixed bottom-5 left-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-3xl border border-white/40 bg-slate-900/80 px-5 py-4 text-white shadow-2xl shadow-slate-900/40 backdrop-blur">
        <div className="flex-1">
          <p className="text-sm font-semibold">{action}</p>
          <p className="mt-1 text-xs text-slate-200">Annulation possible dans {secondsLeft}s</p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={onUndo}
          className="bg-white/15 px-4 text-white hover:bg-white/30"
          aria-label="Annuler la dernière action"
        >
          ↶ Annuler
        </Button>
      </div>
    </div>
  );
}
