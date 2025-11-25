'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500 text-white shadow-[0_15px_35px_-20px_rgba(99,102,241,0.9)] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-indigo-300',
  secondary:
    'border border-white/10 bg-slate-900/60 text-slate-100 shadow-inner shadow-black/20 hover:bg-slate-900/40 focus-visible:ring-2 focus-visible:ring-indigo-400/40',
  outline:
    'border border-white/20 bg-transparent text-slate-100 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/50',
  ghost:
    'bg-transparent text-slate-300 hover:text-white hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-indigo-400/40',
  destructive:
    'bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-[0_15px_35px_-20px_rgba(239,68,68,0.8)] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-rose-300'
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-xs',
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  icon: 'h-10 w-10'
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading = false, children, disabled, ...props }, ref) => {
    const variantClass = variantClasses[variant] ?? variantClasses.default;
    const sizeClass = sizeClasses[size] ?? sizeClasses.md;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none',
          variantClass,
          sizeClass,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin text-white/80"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };

