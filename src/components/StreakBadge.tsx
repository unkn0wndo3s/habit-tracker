'use client';

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
      return 'bg-purple-100 text-purple-800 border-purple-300';
    } else if (streak >= 14) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (streak >= 7) {
      return 'bg-green-100 text-green-800 border-green-300';
    } else {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getIcon = () => {
    if (streak >= 30) {
      return '🔥';
    } else if (streak >= 14) {
      return '⭐';
    } else if (streak >= 7) {
      return '✨';
    } else {
      return '🔥';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${getSizeClasses()} ${getColorClasses()}`}
      title={`Série de ${streak} jour${streak > 1 ? 's' : ''}`}
    >
      <span>{getIcon()}</span>
      <span>{streak} jour{streak > 1 ? 's' : ''}</span>
    </span>
  );
}
