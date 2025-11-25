'use client';

import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning';
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white shadow-inner shadow-indigo-900/30',
  secondary: 'bg-white/10 text-slate-100 border border-white/10',
  outline: 'border border-white/20 text-slate-100',
  success: 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
  warning: 'border border-amber-400/50 bg-amber-400/10 text-amber-200'
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

