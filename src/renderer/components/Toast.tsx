import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { IconAlert, IconCheck, IconClose } from './icons';

export type ToastVariant = 'info' | 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, variant = 'info') => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/**
 * Toast container. Mount once at the root. Subscribes to the toast store
 * via vanilla `useEffect`+`subscribe` to avoid re-rendering the whole tree.
 */
export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    // Seed initial state and subscribe to future changes.
    setToasts(useToastStore.getState().toasts);
    const unsubscribe = useToastStore.subscribe((s) => setToasts(s.toasts));
    return unsubscribe;
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 shadow-soft animate-fade-in"
        >
          <span
            className={
              t.variant === 'success'
                ? 'text-emerald-600'
                : t.variant === 'error'
                ? 'text-danger'
                : 'text-ink-500'
            }
          >
            {t.variant === 'success' ? <IconCheck /> : <IconAlert />}
          </span>
          <span className="text-[12.5px] text-ink-800 max-w-[300px] leading-snug">{t.message}</span>
          <button
            onClick={() => useToastStore.getState().dismiss(t.id)}
            className="text-ink-400 hover:text-ink-900"
            aria-label="Dismiss"
          >
            <IconClose />
          </button>
        </div>
      ))}
    </div>
  );
}
