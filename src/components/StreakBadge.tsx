'use client';

import { Icon } from './Icon';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  if (streak === 0) {
    return null;
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-base px-4 py-2';
      default:
        return 'text-sm px-2.5 py-1';
    }
  };

  const getColorClasses = () => {
    if (streak >= 30) {
      return 'border-purple-500/40 bg-purple-500/20 text-purple-100';
    } else if (streak >= 14) {
      return 'border-blue-500/40 bg-blue-500/20 text-blue-100';
    } else if (streak >= 7) {
      return 'border-emerald-500/40 bg-emerald-500/20 text-emerald-100';
    } else {
      return 'border-amber-400/40 bg-amber-400/20 text-amber-100';
    }
  };

  const getIconName = () => {
    if (streak >= 30) {
      return 'flame';
    } else if (streak >= 14) {
      return 'star';
    } else {
      return 'sparkles';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${getSizeClasses()} ${getColorClasses()}`}
      title={`Série de ${streak} jour${streak > 1 ? 's' : ''}`}
    >
      <Icon name={getIconName()} className="h-3.5 w-3.5" strokeWidth={2} />
      <span>{streak} jour{streak > 1 ? 's' : ''}</span>
    </span>
  );
}
