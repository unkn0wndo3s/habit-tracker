'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Icon } from './Icon';

interface TagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  availableTags?: string[];
}

export default function TagsInput({ tags, onChange, availableTags = [] }: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedValue = inputValue.trim();
  const canAddTag = trimmedValue.length > 0;

  // Filtrer les suggestions pour ne montrer que celles qui ne sont pas déjà sélectionnées
  const filteredSuggestions = availableTags.filter(
    tag => !tags.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(value.length > 0 && filteredSuggestions.length > 0);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && trimmedValue) {
      e.preventDefault();
      addTag(trimmedValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Supprimer le dernier tag si on appuie sur Backspace dans un champ vide
      removeTag(tags[tags.length - 1]);
    }
  };

  const addTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      onChange([...tags, normalizedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={inputRef}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-100">Tags (optionnel)</label>
        {tags.length > 0 && (
          <Badge variant="secondary" className="text-[11px] border border-slate-700 bg-slate-900/40 text-slate-200">
            {tags.length}
          </Badge>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-indigo-500/40 bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-medium text-indigo-100 shadow-[0_0_20px_rgba(99,102,241,0.25)] sm:px-3 sm:py-1 sm:text-xs"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-indigo-200 transition hover:text-white focus:outline-none"
                aria-label={`Supprimer le tag ${tag}`}
              >
                <Icon name="close" className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Champ de saisie */}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setShowSuggestions(inputValue.length > 0 && filteredSuggestions.length > 0)}
          placeholder="Ajouter un tag (Entrée ou bouton)"
          className="flex-1"
        />
        <Button
          type="button"
          onClick={() => canAddTag && addTag(trimmedValue)}
          disabled={!canAddTag}
          variant="secondary"
          size="sm"
          className="w-full whitespace-nowrap border border-indigo-500/30 bg-indigo-500/20 px-4 text-slate-100 hover:bg-indigo-500/40 sm:w-auto sm:px-5"
        >
          Ajouter
        </Button>
      </div>

      {/* Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/90 shadow-2xl shadow-black/40 backdrop-blur">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left text-sm text-slate-200 transition hover:bg-indigo-950/30 focus:bg-indigo-950/30 focus:outline-none"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
