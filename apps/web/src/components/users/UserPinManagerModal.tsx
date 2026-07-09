'use client';

import { useState } from 'react';
import type { UserSummaryDto } from '@casa/shared-types';
import { Modal } from '../ui/Modal';

interface UserPinManagerModalProps {
  open: boolean;
  onClose: () => void;
  users: UserSummaryDto[];
  onUpdatePin: (userId: string, pin: string) => Promise<void>;
}

export function UserPinManagerModal({ open, onClose, users, onUpdatePin }: UserPinManagerModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPin, setDraftPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSave(userId: string) {
    if (!/^\d{4}$/.test(draftPin)) {
      setError('O PIN precisa ter exatamente 4 dígitos.');
      return;
    }

    try {
      await onUpdatePin(userId, draftPin);
      setEditingId(null);
      setDraftPin('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível trocar o PIN.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Gerenciar PINs">
      <div className="flex flex-col gap-4">
        {error && <p className="text-sm text-danger">{error}</p>}

        <ul className="flex flex-col gap-2">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between gap-2 rounded-xl border border-surface-border px-3 py-2">
              <span className="text-sm">{user.name}</span>

              {editingId === user.id ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="0000"
                    value={draftPin}
                    onChange={(event) => setDraftPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleSave(user.id);
                      }
                      if (event.key === 'Escape') {
                        setEditingId(null);
                        setDraftPin('');
                      }
                    }}
                    className="w-20 rounded-lg border border-surface-border bg-transparent px-2 py-1 text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleSave(user.id)}
                    className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setDraftPin('');
                      setError(null);
                    }}
                    className="text-xs text-muted hover:text-foreground"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(user.id);
                    setDraftPin('');
                    setError(null);
                  }}
                  className="rounded-lg border border-surface-border px-2 py-1 text-xs text-muted transition hover:text-foreground"
                >
                  Trocar PIN
                </button>
              )}
            </li>
          ))}
          {users.length === 0 && <p className="text-sm text-muted">Nenhuma pessoa cadastrada ainda.</p>}
        </ul>
      </div>
    </Modal>
  );
}
