'use client';

import { useState } from 'react';
import type { ACCommand, ACFanSpeed, ACMode, ACState, DeviceDto } from '@casa/shared-types';

const MODE_LABELS: Record<ACMode, string> = {
  cool: 'Cool',
  heat: 'Heat',
  fan: 'Fan',
  dry: 'Dry',
  auto: 'Auto',
};

const FAN_LABELS: Record<ACFanSpeed, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  auto: 'Auto',
};

const FAN_SPEEDS: ACFanSpeed[] = ['low', 'medium', 'high', 'auto'];

interface LgAcRemoteControlProps {
  device: DeviceDto;
  onCommand: (command: ACCommand) => Promise<void>;
}

export function LgAcRemoteControl({ device, onCommand }: LgAcRemoteControlProps) {
  const [busy, setBusy] = useState(false);
  const state = (device.state as ACState | null) ?? {
    power: 'off',
    targetTemperature: 23,
    currentTemperature: null,
    mode: 'auto',
    fanSpeed: 'auto',
    swing: false,
    specialMode: null,
    energyCtrl: null,
    lightOff: null,
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
  const isOn = state.power === 'on';
  const mode = state.mode ?? 'auto';
  const fanSpeed = state.fanSpeed ?? 'auto';

  function shiftFanSpeed(step: 1 | -1) {
    const currentIndex = FAN_SPEEDS.indexOf(fanSpeed);
    const nextIndex = (currentIndex + step + FAN_SPEEDS.length) % FAN_SPEEDS.length;
    run({ type: 'fanSpeed', value: FAN_SPEEDS[nextIndex] });
  }

  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[3rem] bg-gradient-to-b from-gray-100 to-gray-300 p-6 shadow-2xl">
      {/* Display */}
      <div className="mb-6 rounded-2xl bg-gray-600 px-6 py-8 text-white shadow-inner">
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-6xl font-bold tabular-nums">{isOn ? target : '--'}</span>
            <span className="text-2xl">°C</span>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
            {isOn && (
              <>
                <span>{MODE_LABELS[mode]}</span>
                <span>{FAN_LABELS[fanSpeed]}</span>
                {state.swing && <span>Swing</span>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Power Button (Top) */}
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

      {/* Mode Button (Top Right) */}
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => {
            const modes: ACMode[] = ['cool', 'dry', 'fan', 'auto', 'heat'];
            const currentIndex = modes.indexOf(mode);
            const next = modes[(currentIndex + 1) % modes.length];
            run({ type: 'mode', value: next });
          }}
          disabled={busy || !isOn}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-gray-400 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow transition active:scale-95 disabled:opacity-50"
        >
          Mode<br />
          <span className="text-sm">{MODE_LABELS[mode]}</span>
        </button>
      </div>

      {/* Temperature Controls */}
      <div className="mb-6 flex items-center justify-center gap-8">
        <button
          type="button"
          onClick={() => run({ type: 'temperature', value: target + 1 })}
          disabled={busy || !isOn}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-white to-gray-200 text-2xl font-bold shadow transition active:scale-95 disabled:opacity-50"
        >
          +
        </button>
        <div className="text-center">
          <span className="text-xs text-gray-600">Temp</span>
        </div>
        <button
          type="button"
          onClick={() => run({ type: 'temperature', value: target - 1 })}
          disabled={busy || !isOn}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-white to-gray-200 text-2xl font-bold shadow transition active:scale-95 disabled:opacity-50"
        >
          −
        </button>
      </div>

      {/* Fan Speed Controls */}
      <div className="mb-6 flex items-center justify-center gap-8">
        <button
          type="button"
          onClick={() => shiftFanSpeed(1)}
          disabled={busy || !isOn}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-white to-gray-200 text-lg shadow transition active:scale-95 disabled:opacity-50"
        >
          ▲
        </button>
        <div className="text-center">
          <span className="text-xs text-gray-600">Fan</span>
        </div>
        <button
          type="button"
          onClick={() => shiftFanSpeed(-1)}
          disabled={busy || !isOn}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-white to-gray-200 text-lg shadow transition active:scale-95 disabled:opacity-50"
        >
          ▼
        </button>
      </div>

      {/* Swing Toggle */}
      <div className="mb-6 flex justify-center">
        <button
          type="button"
          onClick={() => run({ type: 'swing', value: !state.swing })}
          disabled={busy || !isOn}
          className={`rounded-2xl px-6 py-2 text-sm font-semibold shadow transition active:scale-95 disabled:opacity-50 ${
            state.swing
              ? 'bg-gradient-to-b from-blue-400 to-blue-600 text-white'
              : 'bg-gradient-to-b from-white to-gray-200 text-gray-700'
          }`}
        >
          Swing {state.swing ? 'On' : 'Off'}
        </button>
      </div>

      {/* Device Info */}
      <p className="text-center text-xs text-gray-600">
        {device.name} · {device.online ? '🟢 Online' : '🔴 Offline'}
      </p>
    </div>
  );
}
