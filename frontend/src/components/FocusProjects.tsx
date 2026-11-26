import React, { useState, useEffect } from 'react';
import { Idea } from '../types';
import { getFocusTimerState } from '../utils/focusTimer';
import { EVIDENCE_META } from '../utils/ideaFunnel';
import { getChatProviderMeta } from '../utils/promptBuilder';

interface FocusProjectsProps {
  ideas: Idea[];
  onOpenDossier: (id: string) => void;
  onMoveToFreezer: (id: string) => void;
  onLaunchWorkspace?: (idea: Idea) => void;
  onResetFocusTimer?: (id: string) => void;
  onCopyMasterPrompt?: (idea: Idea) => void;
  onMarkLaunched?: (id: string) => void;
}

export const FocusProjects: React.FC<FocusProjectsProps> = React.memo(({
  ideas,
  onOpenDossier,
  onMoveToFreezer,
  onLaunchWorkspace,
  onResetFocusTimer,
  onCopyMasterPrompt,
  onMarkLaunched,
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  const getScoreBadge = (score: number) => {
    if (score >= 8.5) {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-emerald-700">
          {score.toFixed(1)}/10
        </span>
      );
    }
    if (score >= 7.0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-amber-700">
          {score.toFixed(1)}/10
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-rose-700">
        {score.toFixed(1)}/10
      </span>
    );
  };

  const getSourceBadge = (source: string) => {
    let icon = '💬';
    if (source.includes('Link')) icon = '🔗';
    else if (source.includes('OCR') || source.includes('Queja')) icon = '📸';
    else if (source.includes('TikTok')) icon = '📱';
    else if (source.includes('Voz')) icon = '🎙️';
    else if (source.includes('Telegram')) icon = '✈️';
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-borderHairline bg-cardSubtle px-2 py-0.5 text-[11px] font-medium text-inkMuted">
        {icon} {source}
      </span>
    );
  };

  return (
    <section aria-label="En Foco Activo" className="mb-8">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-inkPrimary"></span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-inkPrimary">
            EN FOCO ACTIVO — MÁXIMO 2 PROYECTOS
          </h2>
        </div>
        <span className="text-xs text-inkMuted">
          Regla anti-dispersión: mantén máximo 2 frentes activos simultáneamente.
        </span>
      </div>

      {ideas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borderHairline bg-cardSubtle p-6 text-center">
          <p className="text-sm font-semibold text-inkPrimary">No hay proyectos en foco activo con este filtro</p>
          <p className="mt-1 text-xs text-inkMuted">Promueve una ficha desde el Congelador Técnico cuando estés listo para ejecutar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-6">
          {ideas.map((idea, index) => {
            const steps = idea.steps || [];
            const doneCount = steps.filter((s) => s.done).length;
            const pct = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;
            const nextStep = steps.find((s) => !s.done)?.text || 'Todos los primeros pasos completados';
            const timer = getFocusTimerState(idea, nowMs);

            const timerBadgeClass = timer.isCompleted
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : timer.isExpired
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : timer.isWarning
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : 'border-borderHairline bg-cardSubtle text-inkBody';
            const evidenceInfo = EVIDENCE_META[idea.evidence_level || 'intuicion'];
            const mentions = idea.mention_count || 1;

            return (
              <article
                key={idea.id}
                className="flex flex-col justify-between rounded-2xl border border-borderHairline border-l-[3px] border-l-inkPrimary bg-white p-5 transition hover:border-gray-300"
              >
                <div>
                  {/* Fila superior: Slot + Fuente + Reloj 48h + Evidencia + Obsesión + Puntaje */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-inkCharcoal px-2 py-0.5 font-mono text-[10.5px] font-bold text-white">
                        SLOT 0{index + 1}
                      </span>
                      {getSourceBadge(idea.source)}
                      <span className="rounded-md border border-borderHairline bg-white px-2 py-0.5 text-[11px] font-medium text-inkMuted">
                        {idea.niche}
                      </span>
                      <span
                        title={idea.evidence_note || 'Nivel de evidencia en calle'}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-semibold ${evidenceInfo.badgeClass}`}
                      >
                        <span>{evidenceInfo.icon}</span>
                        <span>{evidenceInfo.label}</span>
                      </span>
                      {mentions >= 2 && (
                        <span
                          title="Señal de Obsesión: esta idea se repitió varias veces"
                          className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 font-mono text-[10.5px] font-bold text-orange-700"
                        >
                          🔥 ×{mentions}
                        </span>
                      )}
                      <span
                        title="Regla Anti-Procrastinación: ventana de validación de 48 horas"
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10.5px] font-semibold tabular-nums ${timerBadgeClass}`}
                      >
                        <span>{timer.isCompleted ? '✅' : timer.isExpired ? '⏰' : '⏳'}</span>
                        <span>{timer.remainingLabel}</span>
                      </span>
                    </div>
                    {getScoreBadge(idea.score)}
                  </div>

                  {/* Título y Resumen */}
                  <h3
                    onClick={() => onOpenDossier(idea.id)}
                    className="mt-3 cursor-pointer text-base font-bold leading-snug text-inkPrimary transition hover:underline"
                  >
                    {idea.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-inkBody">
                    {idea.summary}
                  </p>

                  {/* Barra de progreso y siguiente paso */}
                  <div className="mt-4 rounded-xl border border-gray-100 bg-cardSubtle p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-inkMuted">Siguiente paso:</span>
                      <span className="font-mono font-bold tabular-nums text-inkPrimary">
                        {pct}% ({doneCount}/{steps.length})
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-medium text-inkPrimary">
                      → {nextStep}
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-inkPrimary transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Alerta Anti-Procrastinación si superó las 48 horas sin completar */}
                  {timer.isExpired && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2.5">
                      <div className="text-[11.5px] leading-snug text-rose-900">
                        <span className="font-semibold">Llevas {timer.elapsedHours}h en este foco.</span>{' '}
                        ¿Mueves al Congelador para liberar el slot?
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onMoveToFreezer(idea.id)}
                          className="rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-800 transition hover:bg-rose-100"
                        >
                          Liberar slot
                        </button>
                        {onResetFocusTimer && (
                          <button
                            type="button"
                            onClick={() => onResetFocusTimer(idea.id)}
                            className="rounded-lg bg-rose-700 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-rose-800"
                          >
                            Reiniciar +48h
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones inferiores */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenDossier(idea.id)}
                      className="rounded-xl bg-inkCharcoal px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-black"
                    >
                      Ver Ficha Técnica
                    </button>

                    <button
                      type="button"
                      onClick={() => onMoveToFreezer(idea.id)}
                      className="rounded-xl border border-borderHairline bg-white px-3.5 py-2 text-xs font-semibold text-inkBody transition hover:border-inkPrimary hover:text-inkPrimary"
                    >
                      Mover a Congelador
                    </button>

                    {onMarkLaunched && (
                      <button
                        type="button"
                        onClick={() => onMarkLaunched(idea.id)}
                        title="Cerrar ciclo como proyecto Lanzado / Validado"
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                          pct === 100
                            ? 'border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400'
                        }`}
                      >
                        🚀 Lanzado
                      </button>
                    )}
                  </div>

                  {/* Enlaces directos a Antigravity, Prompt IA, Repositorio o Automatización */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {onCopyMasterPrompt && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyMasterPrompt(idea);
                        }}
                        title="Copiar System Prompt maestro para Antigravity, Cursor o Claude"
                        className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-borderHairline bg-cardSubtle px-2.5 py-1 text-[11px] font-semibold text-inkPrimary transition hover:border-inkPrimary hover:bg-white"
                      >
                        <span>🤖 Prompt IA</span>
                      </button>
                    )}

                    {/* Enlace directo a la conversación de IA (ChatGPT, Claude, Gemini) */}
                    {idea.chat_url && (
                      <a
                        href={idea.chat_url}
                        target="_blank"
                        rel="noreferrer"
                        title={`Continuar conversación en ${getChatProviderMeta(idea.chat_url).name}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-semibold transition ${getChatProviderMeta(idea.chat_url).buttonClass}`}
                      >
                        <span>{getChatProviderMeta(idea.chat_url).icon}</span>
                        <span>{getChatProviderMeta(idea.chat_url).shortName}</span>
                        <svg className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    )}

                    {/* Botón directo para abrir exclusivamente en Antigravity */}
                    {idea.local_path && onLaunchWorkspace && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLaunchWorkspace(idea);
                        }}
                        title="Abrir únicamente la carpeta del proyecto en Antigravity"
                        className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-inkPrimary px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-black transition active:scale-[0.98]"
                      >
                        <span>⚡ Abrir en Antigravity</span>
                      </button>
                    )}

                    {idea.repo_url && (
                      <a
                        href={idea.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir Repositorio GitHub"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-borderHairline bg-cardSubtle px-2.5 py-1 text-[11px] font-semibold text-inkPrimary transition hover:border-inkPrimary hover:bg-white"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                        </svg>
                        <span>Repo</span>
                      </a>
                    )}

                    {idea.live_url && (
                      <a
                        href={idea.live_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Ir a Automatización / Flujo"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-borderHairline bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 transition hover:border-emerald-300"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        <span>Flujo</span>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
});
