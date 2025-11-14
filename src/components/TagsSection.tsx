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
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span>🏷️</span>
        <span>Tous les tags utilisés</span>
      </h3>
      {tags.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun tag utilisé pour le moment</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => onTagClick?.(tag.name)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-colors shadow-sm"
            >
              <span>#{tag.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {tag.count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
