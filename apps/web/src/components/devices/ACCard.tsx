'use client';

import { useState } from 'react';
import type { ACCommand, ACFanSpeed, ACMode, ACState, DeviceDto, TagDto } from '@casa/shared-types';
import { DeviceCard } from './DeviceCard';
import { DeviceTagSelector } from '../tags/DeviceTagSelector';

const MODES: { key: ACMode; label: string }[] = [
  { key: 'cool', label: 'Frio' },
  { key: 'heat', label: 'Quente' },
  { key: 'fan', label: 'Ventilar' },
  { key: 'dry', label: 'Desumidificar' },
  { key: 'auto', label: 'Auto' },
];

const FAN_SPEEDS: { key: ACFanSpeed; label: string }[] = [
  { key: 'low', label: 'Baixa' },
  { key: 'medium', label: 'Média' },
  { key: 'high', label: 'Alta' },
  { key: 'auto', label: 'Auto' },
];

interface ACCardProps {
  device: DeviceDto;
  onCommand: (command: ACCommand) => Promise<void>;
  onRename?: (newName: string) => void;
  onRemove?: () => void;
  onChangeIcon?: (icon: string) => void;
  allTags?: TagDto[];
  onChangeTags?: (tagIds: string[]) => Promise<void>;
}

export function ACCard({ device, onCommand, onRename, onRemove, onChangeIcon, allTags, onChangeTags }: ACCardProps) {
  const [busy, setBusy] = useState(false);
  const state = (device.state as ACState | null) ?? {
    power: 'off',
    targetTemperature: 23,
    currentTemperature: null,
    mode: null,
    fanSpeed: null,
    swing: null,
  };

  async function run(command: ACCommand) {
    setBusy(true);
    try {
      await onCommand(command);
    } finally {
      setBusy(false);
    }
  }

  const target = state.targetTemperature ?? 23;

  return (
    <DeviceCard
      icon={device.icon ?? '❄️'}
      name={device.name}
      online={device.online}
      powerOn={state.power === 'on'}
      busy={busy}
      onTogglePower={() => run({ type: 'power', value: state.power === 'on' ? 'off' : 'on' })}
      nameHref={`/remote/${device.id}`}
      onRename={onRename}
      onRemove={onRemove}
      onChangeIcon={onChangeIcon}
      adminExtra={
        onChangeTags && allTags ? <DeviceTagSelector device={device} allTags={allTags} onChange={onChangeTags} /> : undefined
      }
    >
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => run({ type: 'temperature', value: target - 1 })}
          className="h-10 w-10 rounded-full bg-black/[0.04] text-lg font-medium dark:bg-white/[0.06]"
        >
          −
        </button>
        <div className="text-center">
          <div className="text-3xl font-semibold tabular-nums">{target}°C</div>
          {state.currentTemperature != null && <div className="text-xs text-muted">Ambiente: {state.currentTemperature}°C</div>}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => run({ type: 'temperature', value: target + 1 })}
          className="h-10 w-10 rounded-full bg-black/[0.04] text-lg font-medium dark:bg-white/[0.06]"
        >
          +
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            disabled={busy}
            onClick={() => run({ type: 'mode', value: mode.key })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              state.mode === mode.key ? 'bg-accent text-white' : 'bg-black/[0.04] dark:bg-white/[0.06]'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="w-20 text-xs text-muted">Ventilação</span>
        <select
          value={state.fanSpeed ?? ''}
          disabled={busy}
          onChange={(e) => run({ type: 'fanSpeed', value: e.target.value as ACFanSpeed })}
          className="flex-1 rounded-lg border border-surface-border bg-transparent px-2 py-1.5 text-sm"
        >
          <option value="" disabled>
            Selecionar
          </option>
          {FAN_SPEEDS.map((speed) => (
            <option key={speed.key} value={speed.key}>
              {speed.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={busy}
          onClick={() => run({ type: 'swing', value: !state.swing })}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${state.swing ? 'bg-accent-soft text-accent' : 'bg-black/[0.04] dark:bg-white/[0.06]'}`}
        >
          Swing
        </button>
      </div>
    </DeviceCard>
  );
}
