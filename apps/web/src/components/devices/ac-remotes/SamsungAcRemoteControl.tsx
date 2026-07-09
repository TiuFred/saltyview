'use client';

import { useState } from 'react';
import type { ACCommand, ACFanSpeed, ACMode, ACState, DeviceDto } from '@casa/shared-types';

const MODE_LABELS: Record<ACMode, string> = {
  cool: 'Cool',
  heat: 'Heat',
  fan: 'Wind',
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
const MODES: ACMode[] = ['cool', 'dry', 'fan', 'auto', 'heat'];

interface SamsungAcRemoteControlProps {
  device: DeviceDto;
  onCommand: (command: ACCommand) => Promise<void>;
}

// Comfort Air (windFree) e Jet Mode (turbo) derivam exclusivamente de state.specialMode vindo do
// servidor — nunca de estado local — porque no hardware Samsung são o mesmo atributo físico,
// mutuamente exclusivo. Energy Ctrl e Light Off são best-effort (ver samsung-ac-capabilities.ts).
export function SamsungAcRemoteControl({ device, onCommand }: SamsungAcRemoteControlProps) {
  const [busy, setBusy] = useState(false);
  const state = (device.state as ACState | null) ?? {
    power: 'off',
    targetTemperature: 23,
    currentTemperature: null,
    mode: 'auto',
    fanSpeed: 'auto',
    swing: false,
    specialMode: 'none',
    energyCtrl: false,
    lightOff: false,
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
  const specialMode = state.specialMode ?? 'none';
  const comfortAirOn = specialMode === 'windFree';
  const jetModeOn = specialMode === 'turbo';

  function toggleSpecialMode(target: 'windFree' | 'turbo') {
    run({ type: 'specialMode', value: specialMode === target ? 'none' : target });
  }

  function shiftFanSpeed() {
    const currentIndex = FAN_SPEEDS.indexOf(fanSpeed);
    const next = FAN_SPEEDS[(currentIndex + 1) % FAN_SPEEDS.length];
    run({ type: 'fanSpeed', value: next });
  }

  function shiftMode() {
    const currentIndex = MODES.indexOf(mode);
    const next = MODES[(currentIndex + 1) % MODES.length];
    run({ type: 'mode', value: next });
  }

  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[2.5rem] bg-gradient-to-b from-white to-gray-200 p-6 shadow-2xl">
      {/* Comfort Air */}
      <div className="mb-4 flex justify-center">
        <button
          type="button"
          onClick={() => toggleSpecialMode('windFree')}
          disabled={busy || !isOn}
          className={`rounded-2xl border-2 px-4 py-1.5 text-xs font-semibold shadow transition active:scale-95 disabled:opacity-50 ${
            comfortAirOn ? 'border-sky-500 bg-sky-500 text-white' : 'border-gray-300 bg-white text-gray-700'
          }`}
        >
          Comfort Air
        </button>
      </div>

      {/* Display */}
      <div className="mb-6 rounded-2xl bg-gray-800 px-6 py-8 text-white shadow-inner">
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
                {comfortAirOn && <span>Comfort Air</span>}
                {jetModeOn && <span>Jet Mode</span>}
                {state.energyCtrl && <span>Energy Ctrl</span>}
                {state.lightOff && <span>Light Off</span>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Power (center, laranja) + Light Off */}
      <div className="mb-6 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => run({ type: 'lightOff', value: !state.lightOff })}
          disabled={busy || !isOn}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-lg shadow transition active:scale-95 disabled:opacity-50 ${
            state.lightOff ? 'bg-gray-700 text-white' : 'bg-gradient-to-b from-white to-gray-200'
          }`}
          aria-label="Light Off"
        >
          💡
        </button>
        <button
          type="button"
          onClick={() => run({ type: 'power', value: isOn ? 'off' : 'on' })}
          disabled={busy}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-orange-600 text-white shadow-lg transition active:scale-95 disabled:opacity-50"
        >
          <span className="text-2xl">⏻</span>
        </button>
        <button
          type="button"
          onClick={() => run({ type: 'energyCtrl', value: !state.energyCtrl })}
          disabled={busy || !isOn}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold shadow transition active:scale-95 disabled:opacity-50 ${
            state.energyCtrl ? 'bg-emerald-500 text-white' : 'bg-gradient-to-b from-white to-gray-200'
          }`}
          aria-label="Energy Ctrl"
        >
          kW
        </button>
      </div>

      {/* Mode */}
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={shiftMode}
          disabled={busy || !isOn}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow transition active:scale-95 disabled:opacity-50"
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

      {/* Fan Speed */}
      <div className="mb-6 flex justify-center">
        <button
          type="button"
          onClick={shiftFanSpeed}
          disabled={busy || !isOn}
          className="rounded-2xl border-2 border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 shadow transition active:scale-95 disabled:opacity-50"
        >
          Fan Speed: {FAN_LABELS[fanSpeed]}
        </button>
      </div>

      {/* Swing + Jet Mode */}
      <div className="mb-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => run({ type: 'swing', value: !state.swing })}
          disabled={busy || !isOn}
          className={`rounded-2xl px-4 py-2 text-sm font-semibold shadow transition active:scale-95 disabled:opacity-50 ${
            state.swing
              ? 'bg-gradient-to-b from-blue-400 to-blue-600 text-white'
              : 'bg-gradient-to-b from-white to-gray-200 text-gray-700'
          }`}
        >
          Swing
        </button>
        <button
          type="button"
          onClick={() => toggleSpecialMode('turbo')}
          disabled={busy || !isOn}
          className={`rounded-2xl px-4 py-2 text-sm font-semibold shadow transition active:scale-95 disabled:opacity-50 ${
            jetModeOn
              ? 'bg-gradient-to-b from-purple-400 to-purple-600 text-white'
              : 'bg-gradient-to-b from-white to-gray-200 text-gray-700'
          }`}
        >
          Jet Mode
        </button>
      </div>

      {/* Device Info */}
      <p className="text-center text-xs text-gray-600">
        {device.name} · {device.online ? '🟢 Online' : '🔴 Offline'}
      </p>
    </div>
  );
}
