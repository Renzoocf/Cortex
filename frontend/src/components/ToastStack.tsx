import React from 'react';
import { ToastMessage } from '../types';

interface ToastStackProps {
  toasts: ToastMessage[];
}

export const ToastStack: React.FC<ToastStackProps> = React.memo(({ toasts }) => {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const bgClass =
          toast.variant === 'emerald'
            ? 'border-emerald-200 bg-white text-emerald-800'
            : toast.variant === 'rose'
            ? 'border-rose-200 bg-white text-rose-800'
            : 'border-inkCharcoal bg-inkCharcoal text-white';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-lg animate-pop-in ${bgClass}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
});
