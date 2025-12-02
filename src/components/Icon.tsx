import type { ComponentType, SVGProps } from 'react';
import {
  Archive,
  BarChart3,
  Bell,
  Calendar,
  Check,
  Copy,
  Download,
  Flame,
  NotebookPen,
  Pencil,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  Undo2,
  Upload,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

type IconName =
  | 'calendar'
  | 'settings'
  | 'bell'
  | 'chart'
  | 'note'
  | 'pencil'
  | 'copy'
  | 'archive'
  | 'trash'
  | 'export'
  | 'import'
  | 'undo'
  | 'check'
  | 'flame'
  | 'star'
  | 'sparkles'
  | 'close'
  | 'search';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  name: IconName;
}

const iconComponents: Record<IconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  calendar: Calendar,
  settings: Settings,
  bell: Bell,
  chart: BarChart3,
  note: NotebookPen,
  pencil: Pencil,
  copy: Copy,
  archive: Archive,
  trash: Trash2,
  export: Upload,
  import: Download,
  undo: Undo2,
  check: Check,
  flame: Flame,
  star: Star,
  sparkles: Sparkles,
  close: X,
  search: Search
};

export function Icon({ name, className, strokeWidth = 1.8, ...props }: IconProps) {
  const LucideIcon = iconComponents[name];
  if (!LucideIcon) {
    return null;
  }
  return <LucideIcon className={cn('h-5 w-5', className)} strokeWidth={strokeWidth} {...props} />;
}

export type { IconName };

