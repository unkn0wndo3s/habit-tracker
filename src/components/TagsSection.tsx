'use client';

interface TagsSectionProps {
  tags: Array<{ name: string; count: number }>;
  onTagClick?: (tag: string) => void;
}

export default function TagsSection({ tags, onTagClick }: TagsSectionProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Tous les tags</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.name}
            onClick={() => onTagClick?.(tag.name)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
          >
            <span>#{tag.name}</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">{tag.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
