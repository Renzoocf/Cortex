import React from 'react';
import { Idea, MainView } from '../types';
import {
  COLD_THRESHOLD_DAYS,
  EVIDENCE_META,
  getFreezerAgeDays,
  isColdFreezerIdea,
} from '../utils/ideaFunnel';
import { getChatProviderMeta } from '../utils/promptBuilder';

interface IdeasLibraryProps {
  ideas: Idea[];
  activeView: MainView;
  libraryPillFilter: string;
  onSelectPillFilter: (pill: string) => void;
  onOpenDossier: (id: string) => void;
  onPromoteFocus: (id: string) => void;
  onDiscardIdea: (id: string) => void;
  onRestoreFreezer: (id: string) => void;
  onClearAllFilters: () => void;
  onLaunchWorkspace?: (idea: Idea) => void;
  onPurgeColdIdeas?: () => void;
  onReviveIdea?: (id: string) => void;
}

export const IdeasLibrary: React.FC<IdeasLibraryProps> = React.memo(({
  ideas,
  activeView,
  libraryPillFilter,
  onSelectPillFilter,
  onOpenDossier,
  onPromoteFocus,
  onDiscardIdea,
  onRestoreFreezer,
  onClearAllFilters,
  onLaunchWorkspace,
  onPurgeColdIdeas,
  onReviveIdea,
}) => {
  if (activeView === 'focus') return null;

  const sectionTitles: Record<MainView, { title: string; subtitle: string }> = {
    overview: {
      title: 'CONGELADOR TÉCNICO & FÁBRICA DE CONTENIDO',
      subtitle: 'Fichas procesadas por la IA con arquitectura y viabilidad listas para ejecutar cuando liberes foco.',
    },
    focus: { title: '', subtitle: '' },
    freezer: {
      title: 'CONGELADOR TÉCNICO',
      subtitle: 'Proyectos buenos con arquitectura guardada esperando su turno sin hacerte ruido mental.',
    },
    content: {
      title: 'FÁBRICA DE CONTENIDO (TIKTOK / REELS / SHORTS)',
      subtitle: 'Ideas de videos, series cortas y formatos listos para grabar.',
    },
    launched: {
      title: 'LANZADOS / VALIDADOS (CIERRE DEL CICLO)',
      subtitle: 'Proyectos terminados o validados en la calle junto con su aprendizaje clave.',
    },
    discarded: {
      title: 'DESCARTADOS (FILTRO ANTI-HUMO)',
      subtitle: 'Ideas frenadas automáticamente por baja viabilidad o falta de modelo de ingresos.',
    },
  };

  const { title, subtitle } = sectionTitles[activeView] || sectionTitles.overview;

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
    <section aria-label="Biblioteca de Ideas">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-inkPrimary">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-inkMuted">{subtitle}</p>
        </div>

        {/* Filter Pills (solo visible en Vista General) */}
        {activeView === 'overview' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'Congelador', label: 'Congelador' },
              { id: 'Contenido', label: 'Contenido' },
              { id: 'EVIDENCE', label: '✅ Con evidencia' },
              { id: 'GEMS', label: 'Puntaje ≥ 8.5' },
            ].map((p) => {
              const isMatch = p.id === libraryPillFilter;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPillFilter(p.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs transition ${
                    isMatch
                      ? 'bg-inkCharcoal font-semibold text-white'
                      : 'border border-borderHairline bg-white font-medium text-inkMuted hover:border-inkPrimary hover:text-inkPrimary'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Alerta Anti-Cementerio: ideas frías (+30 días en Congelador) */}
      {(activeView === 'overview' || activeView === 'freezer') && (() => {
        const coldIdeas = ideas.filter((i) => isColdFreezerIdea(i));
        if (coldIdeas.length === 0) return null;
        return (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5">
            <span className="text-xs text-amber-950">
              🧊 <strong>Anti-cementerio:</strong> {coldIdeas.length} ficha(s) llevan más de {COLD_THRESHOLD_DAYS} días congeladas sin movimiento.
            </span>
            {onPurgeColdIdeas && (
              <button
                type="button"
                onClick={onPurgeColdIdeas}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Purgar frías ({coldIdeas.length})
              </button>
            )}
          </div>
        );
      })()}

      {ideas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borderHairline bg-cardSubtle px-6 py-14 text-center">
          <p className="text-sm font-semibold text-inkPrimary">No hay fichas que coincidan con este filtro</p>
          <p className="mt-1 text-xs text-inkMuted">
            Prueba limpiando la búsqueda, cambiando el nicho o simulando una nueva entrada desde Telegram.
          </p>
          <button
            type="button"
            onClick={onClearAllFilters}
            className="mt-4 rounded-xl border border-borderHairline bg-white px-4 py-2 text-xs font-semibold text-inkPrimary transition hover:border-inkPrimary"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 xl:gap-5">
          {ideas.map((idea) => {
            const isDiscarded = idea.status === 'Descartado';
            const isLaunched = idea.status === 'Lanzado';
            const isCold = isColdFreezerIdea(idea);
            const ageDays = getFreezerAgeDays(idea);
            const evidenceInfo = EVIDENCE_META[idea.evidence_level || 'intuicion'];
            const mentions = idea.mention_count || 1;

            return (
              <article
                key={idea.id}
                className={`idea-card-opt flex flex-col justify-between rounded-2xl border border-borderHairline bg-white p-5 transition-colors duration-150 hover:border-inkPrimary ${
                  isDiscarded ? 'bg-cardSubtle/70' : isLaunched ? 'border-l-[3px] border-l-emerald-500' : ''
                }`}
              >
                <div>
                  {/* Top row: Categoría pill + Fuente + Evidencia + Obsesión + Puntaje */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md border border-borderHairline bg-sidebarBg px-2 py-0.5 text-[11px] font-semibold text-inkPrimary">
                        {idea.niche}
                      </span>
                      {getSourceBadge(idea.source)}
                      <span
                        title={idea.evidence_note || 'Nivel de evidencia'}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-semibold ${evidenceInfo.badgeClass}`}
                      >
                        {evidenceInfo.icon} {evidenceInfo.label}
                      </span>
                      {mentions >= 2 && (
                        <span
                          title="Señal de Obsesión: idea mencionada varias veces"
                          className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-orange-700"
                        >
                          🔥 ×{mentions}
                        </span>
                      )}
                      {isCold && (
                        <span
                          title={`Sin tocar hace ${ageDays} días`}
                          className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-sky-800"
                        >
                          🧊 Fría (+{ageDays}d)
                        </span>
                      )}
                      {isLaunched && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-800">
                          🚀 Lanzado
                        </span>
                      )}
                    </div>
                    {getScoreBadge(idea.score)}
                  </div>

                  {/* Título & Resumen de 2 líneas */}
                  <h3
                    onClick={() => onOpenDossier(idea.id)}
                    className="mt-3.5 cursor-pointer text-[15px] font-bold leading-snug text-inkPrimary transition hover:underline"
                  >
                    {idea.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-inkBody">
                    {idea.summary}
                  </p>

                  {isLaunched && idea.closing_note && (
                    <div className="mt-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-[11.5px] text-emerald-950">
                      <span className="font-semibold">Aprendizaje:</span> {idea.closing_note}
                    </div>
                  )}

                  {/* Monospace tech stack / format pills */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {(idea.stack || []).map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-md border border-borderHairline bg-cardSubtle px-2 py-0.5 font-mono text-[11px] font-medium text-inkMuted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenDossier(idea.id)}
                      className="rounded-xl border border-borderHairline bg-cardSubtle px-3 py-1.5 text-xs font-semibold text-inkPrimary transition hover:border-inkPrimary hover:bg-white"
                    >
                      Ver Ficha
                    </button>

                    {/* Enlace directo a la conversación de IA */}
                    {idea.chat_url && (
                      <a
                        href={idea.chat_url}
                        target="_blank"
                        rel="noreferrer"
                        title={`Continuar en ${getChatProviderMeta(idea.chat_url).name}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex h-7 items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition ${getChatProviderMeta(idea.chat_url).buttonClass}`}
                      >
                        <span>{getChatProviderMeta(idea.chat_url).icon}</span>
                        <span>{getChatProviderMeta(idea.chat_url).shortName}</span>
                      </a>
                    )}

                    {/* Botón directo para abrir en Antigravity */}
                    {idea.local_path && onLaunchWorkspace && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLaunchWorkspace(idea);
                        }}
                        title="Abrir únicamente la carpeta del proyecto en Antigravity"
                        className="inline-flex h-7 items-center gap-1 rounded-lg bg-inkPrimary px-2 py-0.5 text-[11px] font-semibold text-white shadow-xs hover:bg-black transition"
                      >
                        <span>⚡ Abrir</span>
                      </button>
                    )}

                    {idea.repo_url && (
                      <a
                        href={idea.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Ver repositorio"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-borderHairline bg-white px-2 py-0.5 text-[11px] font-semibold text-inkMuted hover:border-inkPrimary hover:text-inkPrimary transition"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
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
                        title="Ver automatización"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-borderHairline bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:border-emerald-300 transition"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        <span>Flujo</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isDiscarded ? (
                      <button
                        type="button"
                        onClick={() => onRestoreFreezer(idea.id)}
                        className="rounded-xl border border-borderHairline bg-white px-3 py-1.5 text-xs font-semibold text-inkPrimary transition hover:border-inkPrimary"
                      >
                        ↩ Restaurar
                      </button>
                    ) : isLaunched ? (
                      <button
                        type="button"
                        onClick={() => onRestoreFreezer(idea.id)}
                        title="Reabrir en el Congelador Técnico"
                        className="rounded-xl border border-borderHairline bg-white px-3 py-1.5 text-xs font-semibold text-inkMuted transition hover:border-inkPrimary hover:text-inkPrimary"
                      >
                        ↩ Reabrir
                      </button>
                    ) : (
                      <>
                        {isCold && onReviveIdea && (
                          <button
                            type="button"
                            onClick={() => onReviveIdea(idea.id)}
                            title="Marcar actividad hoy y quitar estado frío"
                            className="rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-800 transition hover:border-sky-300"
                          >
                            ♻️ Avivar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onPromoteFocus(idea.id)}
                          className="rounded-xl border border-borderHairline bg-white px-2.5 py-1.5 text-xs font-semibold text-inkPrimary transition hover:bg-inkCharcoal hover:text-white"
                        >
                          Pasar a En Foco
                        </button>
                        <button
                          type="button"
                          onClick={() => onDiscardIdea(idea.id)}
                          title="Descartar idea"
                          aria-label="Descartar idea"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-borderHairline bg-white text-inkMuted transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      </>
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
