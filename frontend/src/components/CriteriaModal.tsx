import React, { useState } from 'react';
import { DEFAULT_CRITERIA } from '../data/mockData';

interface CriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  criteriaText: string;
  onSaveCriteria: (val: string) => void;
}

export const CriteriaModal: React.FC<CriteriaModalProps> = ({
  isOpen,
  onClose,
  criteriaText,
  onSaveCriteria,
}) => {
  const [val, setVal] = useState(criteriaText);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveCriteria(val.trim() || DEFAULT_CRITERIA);
    onClose();
  };

  const handleReset = () => {
    setVal(DEFAULT_CRITERIA);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-borderHairline bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] animate-pop-in">
        <div className="flex shrink-0 items-center justify-between border-b border-borderHairline bg-cardSubtle px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-inkPrimary">Criterios del Filtro Crítico IA</h3>
            <p className="text-xs text-inkMuted">Reglas que aplica Gemini antes de aceptar una idea en tu bóveda.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-borderHairline bg-white p-2 text-inkMuted hover:text-inkPrimary"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-6">
          <div>
            <label htmlFor="criteriaTextarea" className="mb-1.5 block text-xs font-semibold text-inkPrimary">
              Prompt de Evaluación Estricta (Umbral Aprobación: ≥ 8.0 / 10)
            </label>
            <textarea
              id="criteriaTextarea"
              rows={6}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full rounded-xl border border-borderHairline bg-searchBg p-3 font-mono text-xs leading-relaxed text-inkBody focus:border-inkPrimary focus:bg-white focus:outline-none"
            ></textarea>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-inkMuted underline hover:text-inkPrimary"
            >
              Restaurar reglas por defecto
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-inkCharcoal px-4 py-2 text-xs font-semibold text-white hover:bg-black"
            >
              Guardar Criterios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
