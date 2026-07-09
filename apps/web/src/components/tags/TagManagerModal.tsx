'use client';

import { useState } from 'react';
import type { TagDto } from '@casa/shared-types';
import { Modal } from '../ui/Modal';

interface TagManagerModalProps {
  open: boolean;
  onClose: () => void;
  tags: TagDto[];
  onCreate: (name: string) => Promise<void>;
  onRename: (tagId: string, name: string) => Promise<void>;
  onDelete: (tagId: string) => Promise<void>;
  getUsage: (tagId: string) => Promise<{ deviceCount: number }>;
}

export function TagManagerModal({ open, onClose, tags, onCreate, onRename, onDelete, getUsage }: TagManagerModalProps) {
  const [newTagName, setNewTagName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!newTagName.trim()) return;
    try {
      await onCreate(newTagName.trim());
      setNewTagName('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a tag.');
    }
  }

  async function handleRename(tagId: string) {
    if (!draftName.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await onRename(tagId, draftName.trim());
      setEditingId(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível renomear a tag.');
    }
  }

  async function handleDelete(tag: TagDto) {
    const { deviceCount } = await getUsage(tag.id);
    const message =
      deviceCount > 0
        ? `A tag "${tag.name}" está atribuída a ${deviceCount} aparelho(s). Excluir vai remover essa associação. Continuar?`
        : `Excluir a tag "${tag.name}"?`;

    if (!window.confirm(message)) return;

    try {
      await onDelete(tag.id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir a tag.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Gerenciar tags">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <input
            value={newTagName}
            onChange={(event) => setNewTagName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleCreate();
              }
            }}
            placeholder="Nova tag"
            className="flex-1 rounded-xl border border-surface-border bg-transparent px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Adicionar
          </button>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <ul className="flex flex-col gap-2">
          {tags.map((tag) => (
            <li key={tag.id} className="flex items-center justify-between gap-2 rounded-xl border border-surface-border px-3 py-2">
              {editingId === tag.id ? (
                <input
                  autoFocus
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  onBlur={() => handleRename(tag.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleRename(tag.id);
                    }
                    if (event.key === 'Escape') {
                      setEditingId(null);
                    }
                  }}
                  className="flex-1 rounded-lg border border-surface-border bg-transparent px-2 py-1 text-sm"
                />
              ) : (
                <span className="text-sm">{tag.name}</span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(tag.id);
                    setDraftName(tag.name);
                  }}
                  className="rounded-lg border border-surface-border px-2 py-1 text-xs text-muted transition hover:text-foreground"
                >
                  Renomear
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(tag)}
                  className="rounded-lg border border-danger/30 px-2 py-1 text-xs text-danger transition hover:bg-danger/10"
                >
                  Apagar
                </button>
              </div>
            </li>
          ))}
          {tags.length === 0 && <p className="text-sm text-muted">Nenhuma tag criada ainda.</p>}
        </ul>
      </div>
    </Modal>
  );
}
