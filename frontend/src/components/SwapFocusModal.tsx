import React from 'react';
import { Idea } from '../types';

interface SwapFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFocus: Idea[];
  onSwapOut: (outId: string) => void;
}

export const SwapFocusModal: React.FC<SwapFocusModalProps> = ({
  isOpen,
  onClose,
  currentFocus,
  onSwapOut,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-borderHairline bg-white p-6 shadow-[0_12px_32px_rgba(0,0,0,0.14)] animate-pop-in">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-inkCharcoal text-white font-mono text-xs font-bold">
            2/2
          </div>
          <div>
            <h3 className="text-base font-bold text-inkPrimary">Límite de Enfoque Activo Alcanzado</h3>
            <p className="mt-1 text-xs leading-relaxed text-inkMuted">
              Para evitar abrir múltiples frentes sin terminar ninguno, tu regla es mantener máximo <strong className="text-inkPrimary">2 proyectos en foco</strong>. Elige cuál deseas devolver al <strong className="text-inkPrimary">Congelador Técnico</strong> para liberar espacio:
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {currentFocus.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSwapOut(f.id)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-borderHairline bg-cardSubtle p-3 text-left transition hover:border-inkPrimary hover:bg-white"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-inkPrimary">{f.title}</p>
                <p className="mt-0.5 font-mono text-[11px] text-inkMuted">
                  {f.niche} · {f.score.toFixed(1)}/10
                </p>
              </div>
              <span className="shrink-0 rounded-lg border border-borderHairline bg-white px-2.5 py-1 text-[11px] font-semibold text-inkPrimary">
                Enviar a Congelador
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-end border-t border-borderHairline pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-borderHairline bg-white px-4 py-2 text-xs font-semibold text-inkMuted hover:border-inkPrimary hover:text-inkPrimary"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
