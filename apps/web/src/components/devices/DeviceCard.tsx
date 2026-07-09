'use client';

import { motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';

interface DeviceCardProps {
  icon: ReactNode;
  name: string;
  online: boolean;
  powerOn: boolean;
  busy?: boolean;
  onTogglePower: () => void;
  nameHref?: string;
  onRename?: (newName: string) => void;
  onRemove?: () => void;
  children?: ReactNode;
}

export function DeviceCard({ icon, name, online, powerOn, busy, onTogglePower, nameHref, onRename, onRemove, children }: DeviceCardProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass-card flex flex-col gap-5 rounded-3xl p-6 shadow-xl shadow-black/5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl transition-colors ${
              powerOn ? 'bg-accent-soft text-accent' : 'bg-black/[0.04] text-muted dark:bg-white/[0.06]'
            }`}
          >
            {icon}
          </div>
          <div>
            {editing ? (
              <input
                autoFocus
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={() => {
                  if (draftName.trim()) {
                    onRename?.(draftName.trim());
                  }
                  setEditing(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    if (draftName.trim()) {
                      onRename?.(draftName.trim());
                    }
                    setEditing(false);
                  }
                  if (event.key === 'Escape') {
                    setDraftName(name);
                    setEditing(false);
                  }
                }}
                className="w-full rounded-lg border border-surface-border bg-transparent px-2 py-1 text-sm"
              />
            ) : nameHref ? (
              <a
                href={nameHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium leading-tight underline decoration-transparent underline-offset-2 transition hover:decoration-current"
              >
                {name}
              </a>
            ) : (
              <h3 className="font-medium leading-tight">{name}</h3>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-online' : 'bg-muted'}`} />
              {online ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRename && !editing && (
            <button
              type="button"
              onClick={() => {
                setDraftName(name);
                setEditing(true);
              }}
              className="rounded-lg border border-surface-border px-2 py-1 text-xs text-muted transition hover:text-foreground"
            >
              Renomear
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-lg border border-danger/30 px-2 py-1 text-xs text-danger transition hover:bg-danger/10"
            >
              Apagar
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onTogglePower}
            aria-pressed={powerOn}
            aria-label={powerOn ? `Desligar ${name}` : `Ligar ${name}`}
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              powerOn ? 'bg-accent' : 'bg-black/10 dark:bg-white/10'
            }`}
          >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 h-6 w-6 rounded-full bg-white shadow"
            style={{ left: powerOn ? 'calc(100% - 1.75rem)' : '0.25rem' }}
          />
          </button>
        </div>
      </div>

      {powerOn && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-4">
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}
