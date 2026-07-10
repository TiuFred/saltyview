'use client';

import { useState } from 'react';
import type { DeviceDto, TVCommand, TVState } from '@casa/shared-types';

const APPS: { key: 'netflix' | 'youtube' | 'primevideo' | 'disneyplus'; label: string; emoji: string }[] = [
  { key: 'netflix', label: 'Netflix', emoji: '🎬' },
  { key: 'youtube', label: 'YouTube', emoji: '▶️' },
  { key: 'primevideo', label: 'Prime Video', emoji: '📺' },
  { key: 'disneyplus', label: 'Disney+', emoji: '✨' },
];

const INPUTS = ['HDMI1', 'HDMI2', 'HDMI3', 'digitalTv'];

interface SamsungTvRemoteControlProps {
  device: DeviceDto;
  onCommand: (command: TVCommand) => Promise<void>;
}

// Apps abrem imediatamente ao clicar — um único comando launchApp por toque, sem confirmação.
export function SamsungTvRemoteControl({ device, onCommand }: SamsungTvRemoteControlProps) {
  const [busy, setBusy] = useState(false);
  const state = (device.state as TVState | null) ?? {
    power: 'off',
    volume: 20,
    muted: false,
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

  const isOn = state.power === 'on';
  const volume = state.volume ?? 20;

  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[2.5rem] bg-gradient-to-b from-gray-100 to-gray-300 p-6 shadow-2xl">
      {/* Display */}
      <div className="mb-6 rounded-2xl bg-gray-800 px-6 py-6 text-white shadow-inner">
        <div className="text-center">
          <div className="text-2xl font-bold">{isOn ? 'Ligada' : 'Desligada'}</div>
          {isOn && (
            <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm">
              <span>Vol {volume}{state.muted ? ' · Mudo' : ''}</span>
              {state.input && <span>{state.input}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Power */}
      <div className="mb-6 flex justify-center">
        <button
          type="button"
          onClick={() => run({ type: 'power', value: isOn ? 'off' : 'on' })}
          disabled={busy}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-red-400 to-red-600 text-white shadow-lg transition active:scale-95 disabled:opacity-50"
        >
          <span className="text-2xl">⏻</span>
        </button>
      </div>

      {/* Apps — abertura imediata, um toque */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {APPS.map((app) => (
          <button
            key={app.key}
            type="button"
            disabled={busy || !isOn}
            onClick={() => run({ type: 'launchApp', value: app.key })}
            className="flex flex-col items-center gap-1 rounded-2xl border-2 border-gray-300 bg-white px-3 py-3 text-xs font-semibold text-gray-700 shadow transition active:scale-95 disabled:opacity-50"
          >
            <span className="text-2xl">{app.emoji}</span>
            {app.label}
          </button>
        ))}
      </div>

      {/* Volume */}
      <div className="mb-6 flex items-center justify-center gap-8">
        <button
          type="button"
          onClick={() => run({ type: 'volume', value: Math.min(100, volume + 5) })}
          disabled={busy || !isOn}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-white to-gray-200 text-2xl font-bold shadow transition active:scale-95 disabled:opacity-50"
        >
          +
        </button>
        <div className="text-center">
          <span className="text-xs text-gray-600">Volume</span>
        </div>
        <button
          type="button"
          onClick={() => run({ type: 'volume', value: Math.max(0, volume - 5) })}
          disabled={busy || !isOn}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-white to-gray-200 text-2xl font-bold shadow transition active:scale-95 disabled:opacity-50"
        >
          −
        </button>
      </div>

      {/* Mute + Input */}
      <div className="mb-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => run({ type: 'mute', value: !state.muted })}
          disabled={busy || !isOn}
          className={`rounded-2xl px-4 py-2 text-sm font-semibold shadow transition active:scale-95 disabled:opacity-50 ${
            state.muted
              ? 'bg-gradient-to-b from-blue-400 to-blue-600 text-white'
              : 'bg-gradient-to-b from-white to-gray-200 text-gray-700'
          }`}
        >
          {state.muted ? 'Mudo' : 'Som'}
        </button>
        <select
          value={state.input ?? ''}
          disabled={busy || !isOn}
          onChange={(e) => run({ type: 'input', value: e.target.value })}
          className="rounded-2xl border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow disabled:opacity-50"
        >
          <option value="" disabled>
            Entrada
          </option>
          {INPUTS.map((input) => (
            <option key={input} value={input}>
              {input}
            </option>
          ))}
        </select>
      </div>

      {/* Device Info */}
      <p className="mt-4 text-center text-xs text-gray-600">
        {device.name} · {device.online ? '🟢 Online' : '🔴 Offline'}
      </p>
    </div>
  );
}
