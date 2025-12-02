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
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-3 shadow-inner shadow-black/30 backdrop-blur sm:p-4">
      <h3 className="mb-3 text-xs font-semibold text-slate-100 sm:text-sm">Tous les tags</h3>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {tags.map((tag) => (
          <button
            key={tag.name}
            onClick={() => onTagClick?.(tag.name)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-100"
          >
            <span>#{tag.name}</span>
            <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-400">{tag.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
