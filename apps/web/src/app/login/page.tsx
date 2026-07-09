'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { ApiError, apiClient } from '@/lib/api-client';
import type { UserSummaryDto } from '@casa/shared-types';

const GUEST_NAME = 'Visitante';

export default function LoginPage() {
  const { user, loading, login, loginWithPassword } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserSummaryDto[]>([]);
  const [name, setName] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pinInputs = useRef<Array<HTMLInputElement | null>>([]);

  const [ownerMode, setOwnerMode] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

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

  async function handleOwnerSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginWithPassword(ownerEmail, ownerPassword);
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

  function selectGuest() {
    setName(GUEST_NAME);
    pinInputs.current[0]?.focus();
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onSubmit={ownerMode ? handleOwnerSubmit : handleSubmit}
        className="glass-card w-full max-w-sm rounded-3xl p-8 shadow-2xl shadow-black/5"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Casa</h1>
        <p className="mt-1 text-sm text-muted">
          {ownerMode ? 'Entre com e-mail e senha.' : 'Entre com seu nome e um PIN de 4 dígitos.'}
        </p>

        {ownerMode ? (
          <div className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted">E-mail</span>
              <input
                type="email"
                required
                autoFocus
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="rounded-xl border border-surface-border bg-black/[0.02] px-4 py-2.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-soft dark:bg-white/[0.03]"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted">Senha</span>
              <input
                type="password"
                required
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                className="rounded-xl border border-surface-border bg-black/[0.02] px-4 py-2.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-soft dark:bg-white/[0.03]"
              />
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
        ) : (
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
                  {users.map((user) => (
                    <option key={user.id} value={user.name}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={selectGuest}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                    name === GUEST_NAME
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-surface-border text-muted hover:text-foreground'
                  }`}
                >
                  Visitante
                </button>
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
        )}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            aria-label="."
            onClick={() => {
              setError(null);
              setOwnerMode((prev) => !prev);
            }}
            className="h-2 w-2 rounded-full bg-black/10 transition hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20"
          />
        </div>
      </motion.form>
    </div>
  );
}
