'use client';

import { useState } from 'react';
import type { DeviceDto, TagDto } from '@casa/shared-types';

interface DeviceTagSelectorProps {
  device: DeviceDto;
  allTags: TagDto[];
  onChange: (tagIds: string[]) => Promise<void>;
}

export function DeviceTagSelector({ device, allTags, onChange }: DeviceTagSelectorProps) {
  const [busy, setBusy] = useState(false);
  const selectedIds = new Set(device.tags.map((tag) => tag.id));

  async function toggle(tagId: string) {
    const next = selectedIds.has(tagId)
      ? [...selectedIds].filter((id) => id !== tagId)
      : [...selectedIds, tagId];

    setBusy(true);
    try {
      await onChange(next);
    } finally {
      setBusy(false);
    }
  }

  if (allTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {allTags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          disabled={busy}
          onClick={() => toggle(tag.id)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
            selectedIds.has(tag.id)
              ? 'bg-accent-soft text-accent'
              : 'bg-black/[0.04] text-muted dark:bg-white/[0.06]'
          }`}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
