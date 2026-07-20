'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { ApiError, apiClient } from '@/lib/api-client';
import type { UserSummaryDto } from '@casa/shared-types';

const GUEST_NAME = 'Visitante';
const ADMIN_NAME = 'Administrador';
const ADMIN_LABEL = 'ADM';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserSummaryDto[]>([]);
  const [name, setName] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pinInputs = useRef<Array<HTMLInputElement | null>>([]);
  const profileOptions = [
    { id: 'quick-guest', name: GUEST_NAME, label: GUEST_NAME },
    { id: 'quick-admin', name: ADMIN_NAME, label: ADMIN_LABEL },
    ...users
      .filter((userOption) => userOption.name !== GUEST_NAME && userOption.name !== ADMIN_NAME)
      .map((userOption) => ({ id: userOption.id, name: userOption.name, label: userOption.name })),
  ];

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  useEffect(() => {
    apiClient.listUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const pinValue = pin.join('');
    if (pinValue.length !== 4) {
      setError('Informe os 4 dígitos do PIN.');
      return;
    }

    setSubmitting(true);
    try {
      await login(name, pinValue);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  function handlePinChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const nextPin = [...pin];
    nextPin[index] = digit;
    setPin(nextPin);

    if (digit && index < 3) {
      pinInputs.current[index + 1]?.focus();
    }
  }

  function handlePinKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !pin[index] && index > 0) {
      const previousPin = [...pin];
      previousPin[index - 1] = '';
      setPin(previousPin);
      pinInputs.current[index - 1]?.focus();
    }
  }

  function selectQuick(quickName: string) {
    setError(null);
    setName(quickName);
    pinInputs.current[0]?.focus();
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onSubmit={handleSubmit}
        className="glass-card w-full max-w-sm rounded-3xl p-8 shadow-2xl shadow-black/5"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Casa</h1>
        <p className="mt-1 text-sm text-muted">Entre com seu nome e um PIN de 4 dígitos.</p>

        <div className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">Seu nome</span>
            <div className="flex gap-2">
              <select
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-xl border border-surface-border bg-black/[0.02] px-4 py-2.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-soft dark:bg-white/[0.03]"
              >
                <option value="">Selecione alguém</option>
                {profileOptions.map((profileOption) => (
                  <option key={profileOption.id} value={profileOption.name}>
                    {profileOption.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => selectQuick(GUEST_NAME)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                    name === GUEST_NAME
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-surface-border text-muted hover:text-foreground'
                  }`}
                >
                  Visitante
                </button>
                <button
                  type="button"
                  onClick={() => selectQuick(ADMIN_NAME)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                    name === ADMIN_NAME
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-surface-border text-muted hover:text-foreground'
                  }`}
                >
                  {ADMIN_LABEL}
                </button>
              </div>
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">PIN</span>
            <div className="flex gap-2">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    pinInputs.current[index] = element;
                  }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  autoComplete="one-time-code"
                  value={digit}
                  onChange={(event) => handlePinChange(index, event.target.value)}
                  onKeyDown={(event) => handlePinKeyDown(index, event)}
                  className="h-12 w-12 rounded-xl border border-surface-border bg-black/[0.02] text-center text-lg outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-soft dark:bg-white/[0.03]"
                />
              ))}
            </div>
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-xl bg-accent px-4 py-2.5 font-medium text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
