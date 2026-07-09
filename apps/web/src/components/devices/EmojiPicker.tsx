'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEVICE_ICON_OPTIONS } from '@casa/shared-types';

interface EmojiPickerProps {
  value: string | null;
  onChange: (emoji: string) => void;
  options?: readonly string[];
}

export function EmojiPicker({ value, onChange, options = DEVICE_ICON_OPTIONS }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Trocar ícone"
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-dashed border-surface-border text-xl transition hover:border-accent"
      >
        {value ?? '➕'}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="glass-card absolute left-0 top-full z-50 mt-2 grid w-52 grid-cols-4 gap-1 rounded-2xl p-3 shadow-2xl"
            >
              {options.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onChange(emoji);
                    setOpen(false);
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition hover:bg-accent-soft ${
                    value === emoji ? 'bg-accent-soft' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
