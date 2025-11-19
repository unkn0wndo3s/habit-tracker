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
      active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
    );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Filtrer par tag</h3>
        <Badge variant="secondary" className="text-[11px]">
          {tags.length} tags
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onTagSelect(null)} className={pillClasses(selectedTag === null)}>
          <span>Tout voir</span>
          <Badge variant={selectedTag === null ? 'default' : 'outline'} className="text-[11px]">
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
            <Badge variant={selectedTag === tag.name ? 'default' : 'outline'} className="text-[11px]">
              {tag.count}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
