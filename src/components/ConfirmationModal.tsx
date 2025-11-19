'use client';

import Modal from './Modal';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'info'
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const iconClasses = cn(
    'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2',
    variant === 'danger' && 'border-rose-200 bg-rose-50 text-rose-600',
    variant === 'warning' && 'border-amber-200 bg-amber-50 text-amber-600',
    variant === 'info' && 'border-indigo-200 bg-indigo-50 text-indigo-600'
  );

  const confirmVariant =
    variant === 'danger' ? 'destructive' : variant === 'warning' ? 'secondary' : 'default';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className={iconClasses}>
          {variant === 'danger' && (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )}
          {variant === 'warning' && (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.667 1.73-2.5L13.73 4c-.77-.833-1.96-.833-2.73 0L3.2 16.5C2.43 17.333 3.39 19 4.93 19z" />
            </svg>
          )}
          {variant === 'info' && (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        
        <p className="mb-6 text-sm text-slate-600">{message}</p>
        
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            className={cn('flex-1', variant === 'warning' && 'bg-amber-500 text-white hover:bg-amber-400')}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
