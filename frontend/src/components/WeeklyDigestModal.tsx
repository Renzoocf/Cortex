import React, { useState, useEffect } from 'react';
import { Idea } from '../types';
import { buildWeeklyDigest } from '../utils/ideaFunnel';
import { API_BASE_URL } from '../config/api';

interface WeeklyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideas: Idea[];
  onCopyDigest: (text: string) => void;
  onToast: (message: string, variant?: 'dark' | 'emerald' | 'rose') => void;
}

export const WeeklyDigestModal: React.FC<WeeklyDigestModalProps> = ({
  isOpen,
  onClose,
  ideas,
  onCopyDigest,
  onToast,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setStatusNote(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const { markdown, stats } = buildWeeklyDigest(ideas);

  const handleSendTelegram = async () => {
    setIsSending(true);
    setStatusNote(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/digest/weekly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideas,
          send_to_telegram: true,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.sent) {
        setStatusNote('Enviado correctamente a tu chat privado de Telegram.');
        onToast('Resumen de Domingo enviado a Telegram', 'emerald');
      } else {
        const reason =
          data?.reason || 'Telegram no configurado en .env; usa "Copiar Resumen" para pegarlo manualmente.';
        setStatusNote(reason);
        onToast(reason, 'dark');
      }
    } catch {
      const msg = 'Backend local (puerto 8000) apagado. Usa "Copiar Resumen" o enciende uvicorn.';
      setStatusNote(msg);
      onToast(msg, 'rose');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="digestModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-borderHairline bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] animate-pop-in">
        <div className="flex shrink-0 items-center justify-between border-b border-borderHairline bg-cardSubtle px-6 py-4">
          <div>
            <h3 id="digestModalTitle" className="text-base font-bold text-inkPrimary">
              Resumen de Domingo (Telegram &amp; Cierre Semanal)
            </h3>
            <p className="text-xs text-inkMuted">
              Fotografía rápida de tu embudo para decidir qué entra a foco y qué se limpia esta semana.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar resumen semanal"
            className="rounded-xl border border-borderHairline bg-white p-2 text-inkMuted hover:border-inkPrimary hover:text-inkPrimary"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-6">
          {/* 4 Mini KPIs semanales */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-xl border border-borderHairline bg-cardSubtle p-3">
              <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-inkMuted">
                En Foco
              </span>
              <span className="mt-1 block font-mono text-lg font-bold tabular-nums text-inkPrimary">
                {stats.focus}/2
              </span>
              {stats.expiredFocus > 0 && (
                <span className="text-[10.5px] font-semibold text-rose-600">
                  {stats.expiredFocus} vencido(s)
                </span>
              )}
            </div>

            <div className="rounded-xl border border-borderHairline bg-cardSubtle p-3">
              <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-inkMuted">
                Congelador
              </span>
              <span className="mt-1 block font-mono text-lg font-bold tabular-nums text-inkPrimary">
                {stats.freezer}
              </span>
              {stats.coldFreezer > 0 && (
                <span className="text-[10.5px] font-semibold text-amber-700">
                  {stats.coldFreezer} fría(s) +30d
                </span>
              )}
            </div>

            <div className="rounded-xl border border-borderHairline bg-cardSubtle p-3">
              <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-inkMuted">
                Lanzados
              </span>
              <span className="mt-1 block font-mono text-lg font-bold tabular-nums text-emerald-700">
                {stats.launched}
              </span>
              <span className="text-[10.5px] text-inkMuted">ciclos cerrados</span>
            </div>

            <div className="rounded-xl border border-borderHairline bg-cardSubtle p-3">
              <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-inkMuted">
                Obsesiones
              </span>
              <span className="mt-1 block font-mono text-lg font-bold tabular-nums text-inkPrimary">
                🔥 {stats.obsessionCount}
              </span>
              <span className="text-[10.5px] text-inkMuted">ideas repetidas</span>
            </div>
          </div>

          {/* Vista previa exacta del mensaje Telegram */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-inkPrimary">
                Vista previa del mensaje en Telegram
              </span>
              <span className="font-mono text-[10.5px] text-inkMuted">
                Comando en bot: /resumen
              </span>
            </div>
            <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-xl border border-borderHairline bg-searchBg p-4 font-mono text-xs leading-relaxed text-inkPrimary">
              {markdown}
            </pre>
          </div>

          {statusNote && (
            <div className="rounded-xl border border-borderHairline bg-cardSubtle px-3.5 py-2.5 text-xs font-medium text-inkBody">
              {statusNote}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-mono text-[10.5px] text-inkMuted">
              Cron domingo 20:00 → GET /api/digest/weekly?send=true
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onCopyDigest(markdown)}
                className="rounded-xl border border-borderHairline bg-white px-3.5 py-2 text-xs font-semibold text-inkPrimary transition hover:border-inkPrimary"
              >
                📋 Copiar Resumen
              </button>
              <button
                type="button"
                onClick={handleSendTelegram}
                disabled={isSending}
                className="rounded-xl bg-inkCharcoal px-4 py-2 text-xs font-semibold text-white transition hover:bg-black disabled:opacity-50"
              >
                {isSending ? 'Enviando...' : '✈️ Enviar a Telegram ahora'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
