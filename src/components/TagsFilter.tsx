'use client';

interface TagsFilterProps {
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  tags: Array<{ name: string; count: number }>;
}

export default function TagsFilter({ selectedTag, onTagSelect, tags }: TagsFilterProps) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Filtrer par tag</h3>
      <div className="flex flex-wrap gap-2">
        {/* Bouton "Tous" */}
        <button
          onClick={() => onTagSelect(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedTag === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous ({tags.reduce((sum, tag) => sum + tag.count, 0)})
        </button>
        
        {/* Tags avec compteur */}
        {tags.map((tag) => (
          <button
            key={tag.name}
            onClick={() => onTagSelect(tag.name)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedTag === tag.name
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tag.name} ({tag.count})
          </button>
        ))}
      </div>
    </div>
  );
}
