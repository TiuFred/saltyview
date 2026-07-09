'use client';

import type { TagDto } from '@casa/shared-types';

interface TagFilterBarProps {
  tags: TagDto[];
  selectedTagId: string | null;
  onToggle: (tagId: string) => void;
  onClear: () => void;
}

export function TagFilterBar({ tags, selectedTagId, onToggle, onClear }: TagFilterBarProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => {
        const active = selectedTagId === tag.id;
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggle(tag.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active ? 'bg-accent text-white' : 'bg-black/[0.04] text-muted dark:bg-white/[0.06]'
            }`}
          >
            {tag.name}
          </button>
        );
      })}
      {selectedTagId && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full px-3 py-1.5 text-xs text-muted underline underline-offset-2 hover:text-foreground"
        >
          Limpar filtro
        </button>
      )}
    </div>
  );
}
