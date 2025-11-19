'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-indigo-600 text-white shadow shadow-indigo-500/40 hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500',
  secondary:
    'bg-slate-100 text-slate-900 shadow-sm hover:bg-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-300',
  outline:
    'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500/60',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500/40',
  destructive:
    'bg-rose-600 text-white shadow-sm shadow-rose-500/30 hover:bg-rose-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-500'
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
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none',
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

