'use client';

import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface TagsFilterProps {
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  tags: Array<{ name: string; count: number }>;
}

export default function TagsFilter({ selectedTag, onTagSelect, tags }: TagsFilterProps) {
  const total = tags.reduce((sum, tag) => sum + tag.count, 0);

  const pillClasses = (active: boolean) =>
    cn(
      'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
      active
        ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-100 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
        : 'border-slate-700 bg-slate-900/40 text-slate-200 hover:border-indigo-500/40 hover:text-slate-50'
    );

  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 shadow-lg shadow-black/20 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Filtrer par tag</h3>
        <Badge variant="secondary" className="text-[11px] border border-slate-700 bg-slate-800/60 text-slate-200">
          {tags.length} tags
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onTagSelect(null)} className={pillClasses(selectedTag === null)}>
          <span>Tout voir</span>
          <Badge
            variant={selectedTag === null ? 'default' : 'outline'}
            className={cn(
              'text-[11px]',
              selectedTag === null ? 'border-transparent bg-white/10 text-white' : 'border-slate-700 text-slate-200'
            )}
          >
            {total}
          </Badge>
        </button>

        {tags.map((tag) => (
          <button
            type="button"
            key={tag.name}
            onClick={() => onTagSelect(tag.name)}
            className={pillClasses(selectedTag === tag.name)}
          >
            <span>#{tag.name}</span>
            <Badge
              variant={selectedTag === tag.name ? 'default' : 'outline'}
              className={cn(
                'text-[11px]',
                selectedTag === tag.name ? 'border-transparent bg-white/10 text-white' : 'border-slate-700 text-slate-200'
              )}
            >
              {tag.count}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
