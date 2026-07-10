'use client';

import { useState } from 'react';
import type { DeviceDto, TVCommand, TVState, TagDto } from '@casa/shared-types';
import { DeviceCard } from './DeviceCard';
import { DeviceTagSelector } from '../tags/DeviceTagSelector';

const APPS: { key: 'netflix' | 'youtube' | 'primevideo' | 'disneyplus' | 'globoplay'; label: string }[] = [
  { key: 'netflix', label: 'Netflix' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'primevideo', label: 'Prime Video' },
  { key: 'disneyplus', label: 'Disney+' },
  { key: 'globoplay', label: 'Globoplay' },
];

const INPUTS = ['HDMI1', 'HDMI2', 'HDMI3', 'digitalTv'];

interface TVCardProps {
  device: DeviceDto;
  onCommand: (command: TVCommand) => Promise<void>;
  onRename?: (newName: string) => void;
  onRemove?: () => void;
  onChangeIcon?: (icon: string) => void;
  allTags?: TagDto[];
  onChangeTags?: (tagIds: string[]) => Promise<void>;
}

export function TVCard({ device, onCommand, onRename, onRemove, onChangeIcon, allTags, onChangeTags }: TVCardProps) {
  const [busy, setBusy] = useState(false);
  const state = (device.state as TVState | null) ?? {
    power: 'off',
    volume: null,
    muted: null,
    input: null,
    app: null,
  };

  async function run(command: TVCommand) {
    setBusy(true);
    try {
      await onCommand(command);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DeviceCard
      icon={device.icon ?? '📺'}
      name={device.name}
      online={device.online}
      powerOn={state.power === 'on'}
      turnedOnBy={device.turnedOnBy}
      busy={busy}
      onTogglePower={() => run({ type: 'power', value: state.power === 'on' ? 'off' : 'on' })}
      nameHref={device.provider === 'SMARTTHINGS' ? `/remote/${device.id}` : undefined}
      onRename={onRename}
      onRemove={onRemove}
      onChangeIcon={onChangeIcon}
      adminExtra={
        onChangeTags && allTags ? <DeviceTagSelector device={device} allTags={allTags} onChange={onChangeTags} /> : undefined
      }
    >
      <div className="flex items-center gap-3">
        <span className="w-16 text-xs text-muted">Volume</span>
        <input
          type="range"
          min={0}
          max={100}
          value={state.volume ?? 20}
          disabled={busy}
          onChange={(e) => run({ type: 'volume', value: Number(e.target.value) })}
          className="flex-1 accent-accent"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => run({ type: 'mute', value: !state.muted })}
          className={`rounded-lg px-2 py-1 text-xs ${state.muted ? 'bg-accent-soft text-accent' : 'bg-black/[0.04] dark:bg-white/[0.06]'}`}
        >
          {state.muted ? 'Mudo' : 'Som'}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="w-16 text-xs text-muted">Entrada</span>
        <select
          value={state.input ?? ''}
          disabled={busy}
          onChange={(e) => run({ type: 'input', value: e.target.value })}
          className="flex-1 rounded-lg border border-surface-border bg-transparent px-2 py-1.5 text-sm"
        >
          <option value="" disabled>
            Selecionar
          </option>
          {INPUTS.map((input) => (
            <option key={input} value={input}>
              {input}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {APPS.map((app) => (
          <button
            key={app.key}
            type="button"
            disabled={busy}
            onClick={() => run({ type: 'launchApp', value: app.key })}
            className="rounded-xl bg-black/[0.04] px-2 py-2 text-xs font-medium transition hover:bg-accent-soft hover:text-accent dark:bg-white/[0.06]"
          >
            {app.label}
          </button>
        ))}
      </div>
    </DeviceCard>
  );
}
