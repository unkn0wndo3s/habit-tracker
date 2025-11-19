'use client';

import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning';
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-indigo-600 text-white',
  secondary: 'bg-slate-100 text-slate-700',
  outline: 'border border-slate-200 bg-white text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-800'
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

