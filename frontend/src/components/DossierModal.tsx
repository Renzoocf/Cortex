import React from 'react';
import { EvidenceLevel, Idea, IdeaStatus } from '../types';
import { getFocusTimerState } from '../utils/focusTimer';
import { EVIDENCE_META } from '../utils/ideaFunnel';
import {
  generateAgentMasterPrompt,
  getChatProviderMeta,
  launchChatGPT,
  launchClaude,
  launchGemini,
} from '../utils/promptBuilder';

interface DossierModalProps {
  idea: Idea | null;
  onClose: () => void;
  onToggleStep: (stepIdx: number) => void;
  onStatusChange: (status: IdeaStatus) => void;
  onCopyMarkdown: () => void;
  onDownloadMarkdown: () => void;
  onUpdateLinks?: (
    id: string,
    repoUrl: string,
    liveUrl: string,
    localPath?: string,
    workspaceUrls?: string[],
    chatUrl?: string
  ) => void;
  onLaunchWorkspace?: (idea: Idea) => void;
  onCopyMasterPrompt?: () => void;
  onResetFocusTimer?: (id: string) => void;
  onUpdateEvidence?: (id: string, level: EvidenceLevel, note: string) => void;
  onUpdateClosingNote?: (id: string, closingNote: string) => void;
}

export const DossierModal: React.FC<DossierModalProps> = ({
  idea,
  onClose,
  onToggleStep,
  onStatusChange,
  onCopyMarkdown,
  onDownloadMarkdown,
  onUpdateLinks,
  onLaunchWorkspace,
  onCopyMasterPrompt,
  onResetFocusTimer,
  onUpdateEvidence,
  onUpdateClosingNote,
}) => {
  const [isEditingLinks, setIsEditingLinks] = React.useState(false);
  const [repoInput, setRepoInput] = React.useState('');
  const [liveInput, setLiveInput] = React.useState('');
  const [localPathInput, setLocalPathInput] = React.useState('');
  const [workspaceUrlsInput, setWorkspaceUrlsInput] = React.useState('');
  const [chatUrlInput, setChatUrlInput] = React.useState('');
  const [evidenceNoteInput, setEvidenceNoteInput] = React.useState('');
  const [closingNoteInput, setClosingNoteInput] = React.useState('');

  React.useEffect(() => {
    if (idea) {
      setRepoInput(idea.repo_url || '');
      setLiveInput(idea.live_url || '');
      setLocalPathInput(idea.local_path || '');
      setWorkspaceUrlsInput((idea.workspace_urls || []).join(', '));
      setChatUrlInput(idea.chat_url || '');
      setEvidenceNoteInput(idea.evidence_note || '');
      setClosingNoteInput(idea.closing_note || '');
      setIsEditingLinks(false);
    }
  }, [idea]);

  if (!idea) return null;

  const handleSaveLinks = () => {
    if (onUpdateLinks && idea) {
      const urlsArray = workspaceUrlsInput
        .split(',')
        .map(u => u.trim())
        .filter(Boolean);
      onUpdateLinks(
        idea.id,
        repoInput.trim(),
        liveInput.trim(),
        localPathInput.trim(),
        urlsArray,
        chatUrlInput.trim()
      );
      setIsEditingLinks(false);
    }
  };

  const steps = idea.steps || [];
  const done = steps.filter((s) => s.done).length;
  const pct = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;

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

  const getVerdictBoxClass = (score: number) => {
    if (score >= 8.5) {
      return 'mt-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-[13px] leading-relaxed text-emerald-950';
    }
    if (score >= 7.0) {
      return 'mt-2 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-[13px] leading-relaxed text-amber-950';
    }
    return 'mt-2 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-[13px] leading-relaxed text-rose-950';
  };

  const statuses: IdeaStatus[] = ['En Foco', 'Congelador', 'Contenido', 'Descartado', 'Lanzado'];
  const currentEvidence = idea.evidence_level || 'intuicion';
  const evidenceLevels: EvidenceLevel[] = ['intuicion', 'conversado', 'con_demanda'];
  const mentions = idea.mention_count || 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-5"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-borderHairline bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] animate-pop-in">
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-4 border-b border-borderHairline bg-cardSubtle px-6 py-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-inkCharcoal px-2 py-0.5 text-[11px] font-semibold text-white">
                {idea.status}
              </span>
              <span className="rounded-md border border-borderHairline bg-white px-2 py-0.5 text-[11px] font-semibold text-inkPrimary">
                {idea.niche}
              </span>
              {getSourceBadge(idea.source)}
              {getScoreBadge(idea.score)}
              {mentions >= 2 && (
                <span className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 font-mono text-[11px] font-bold text-orange-700">
                  🔥 Señal de Obsesión (×{mentions})
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold tracking-tight text-inkPrimary sm:text-xl">
              {idea.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha técnica"
            className="rounded-xl border border-borderHairline bg-white p-2 text-inkMuted transition hover:border-inkPrimary hover:text-inkPrimary"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Cuerpo Dos Columnas */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Columna Izquierda (7 cols): Problema, Arquitectura y Veredicto IA */}
            <div className="space-y-5 lg:col-span-7">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-inkMuted">
                  Problema &amp; Validación de Mercado
                </h3>
                <div className="mt-2 rounded-xl border border-borderHairline bg-cardSubtle p-4 text-[13px] leading-relaxed text-inkBody">
                  {idea.problem}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-inkMuted">
                  Arquitectura Técnica &amp; Stack Sugerido
                </h3>
                <div className="mt-2 rounded-xl border border-borderHairline bg-cardSubtle p-4 text-[13px] leading-relaxed text-inkBody">
                  {idea.architecture}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {(idea.stack || []).map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-borderHairline bg-sidebarBg px-2.5 py-1 font-mono text-xs font-medium text-inkPrimary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-inkMuted">
                  Veredicto Crítico de Gemini IA
                </h3>
                <div className={getVerdictBoxClass(idea.score)}>
                  {idea.verdict}
                </div>
              </div>

              {/* Sección de Enlaces y Recursos (GitHub / n8n / Live URL) */}
              <div className="rounded-xl border border-borderHairline bg-cardSubtle p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-inkMuted">
                    Enlaces Directos &amp; Repositorio
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingLinks(!isEditingLinks)}
                    className="text-xs font-semibold text-inkPrimary hover:underline"
                  >
                    {isEditingLinks ? 'Cancelar' : '⚙️ Editar enlaces'}
                  </button>
                </div>

                {isEditingLinks ? (
                  <div className="space-y-2 mt-2">
                    <div>
                      <label className="text-[11px] font-medium text-inkMuted block mb-1">
                        Repositorio (GitHub / GitLab):
                      </label>
                      <input
                        type="url"
                        value={repoInput}
                        onChange={(e) => setRepoInput(e.target.value)}
                        placeholder="https://github.com/tu-usuario/tu-repo"
                        className="w-full h-8 px-2.5 text-xs bg-white rounded-lg border border-borderHairline text-inkPrimary focus:outline-none focus:border-inkPrimary"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-inkMuted block mb-1">
                        Enlace de Automatización / Demo / n8n:
                      </label>
                      <input
                        type="url"
                        value={liveInput}
                        onChange={(e) => setLiveInput(e.target.value)}
                        placeholder="https://n8n.cloud/workflow/... o https://tu-demo.com"
                        className="w-full h-8 px-2.5 text-xs bg-white rounded-lg border border-borderHairline text-inkPrimary focus:outline-none focus:border-inkPrimary"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-inkMuted block mb-1">
                        Carpeta Local del Proyecto (Espacio de Trabajo Antigravity):
                      </label>
                      <input
                        type="text"
                        value={localPathInput}
                        onChange={(e) => setLocalPathInput(e.target.value)}
                        placeholder="C:\Users\ASUS\Desktop\Agente"
                        className="w-full h-8 px-2.5 text-xs bg-white rounded-lg border border-borderHairline text-inkPrimary focus:outline-none focus:border-inkPrimary font-mono"
                      />
                      <p className="mt-1 text-[10.5px] text-inkMuted">
                        Ingresa la ruta exacta del proyecto. Antigravity se abrirá enfocado únicamente en esta carpeta como espacio de trabajo independiente.
                      </p>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-inkMuted block mb-1">
                        Hilo de Conversación IA (ChatGPT / Claude / Gemini / Perplexity):
                      </label>
                      <input
                        type="url"
                        value={chatUrlInput}
                        onChange={(e) => setChatUrlInput(e.target.value)}
                        placeholder="https://chatgpt.com/c/... o https://claude.ai/chat/... o link de Gemini"
                        className="w-full h-8 px-2.5 text-xs bg-white rounded-lg border border-borderHairline text-inkPrimary focus:outline-none focus:border-inkPrimary font-mono"
                      />
                      <p className="mt-1 text-[10.5px] text-inkMuted">
                        Pega aquí el enlace de tu chat para regresar a la conversación exacta donde diseñaste el código o la arquitectura.
                      </p>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-inkMuted block mb-1">
                        URLs de Trabajo (separadas por coma):
                      </label>
                      <input
                        type="text"
                        value={workspaceUrlsInput}
                        onChange={(e) => setWorkspaceUrlsInput(e.target.value)}
                        placeholder="https://www.tiktok.com/creator-center, https://studio.youtube.com"
                        className="w-full h-8 px-2.5 text-xs bg-white rounded-lg border border-borderHairline text-inkPrimary focus:outline-none focus:border-inkPrimary"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleSaveLinks}
                        className="rounded-lg bg-inkCharcoal px-3 py-1.5 text-xs font-semibold text-white hover:bg-black"
                      >
                        Guardar Enlaces
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {/* Botón directo al Hilo de Conversación IA */}
                    {idea.chat_url && (
                      <a
                        href={idea.chat_url}
                        target="_blank"
                        rel="noreferrer"
                        title={`Continuar conversación en ${getChatProviderMeta(idea.chat_url).name}`}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${getChatProviderMeta(idea.chat_url).buttonClass}`}
                      >
                        <span>{getChatProviderMeta(idea.chat_url).icon}</span>
                        <span>Abrir en {getChatProviderMeta(idea.chat_url).name}</span>
                        <svg className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    )}

                    {/* Botón para abrir exclusivamente en Antigravity */}
                    {idea.local_path && onLaunchWorkspace && (
                      <button
                        type="button"
                        onClick={() => onLaunchWorkspace(idea)}
                        title="Abrir únicamente la carpeta del proyecto en Antigravity"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-inkPrimary px-3 py-1.5 text-xs font-semibold text-white hover:bg-black transition shadow-xs"
                      >
                        <span>⚡ Abrir en Antigravity</span>
                      </button>
                    )}

                    {idea.repo_url ? (
                      <a
                        href={idea.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-borderHairline bg-white px-3 py-1.5 text-xs font-semibold text-inkPrimary hover:border-inkPrimary transition"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                        </svg>
                        <span>Abrir Repositorio</span>
                        <svg className="h-3 w-3 text-inkMuted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    ) : null}

                    {idea.live_url ? (
                      <a
                        href={idea.live_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:border-emerald-400 transition"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                        </svg>
                        <span>Ir al Flujo / Automatización</span>
                        <svg className="h-3 w-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    ) : null}

                    {/* Enlaces individuales de redes/flujos (para abrirlos uno a uno por elección) */}
                    {idea.workspace_urls && idea.workspace_urls.map((url, i) => {
                      const cleanUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
                      let label = url.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0];
                      if (/tiktok/i.test(url)) label = 'TikTok';
                      else if (/youtube/i.test(url)) label = 'YouTube Studio';
                      else if (/instagram/i.test(url)) label = 'Instagram';
                      else if (/n8n/i.test(url)) label = 'n8n';

                      return (
                        <a
                          key={i}
                          href={cleanUrl}
                          target="_blank"
                          rel="noreferrer"
                          title={`Abrir ${label}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-borderHairline bg-cardSubtle px-2.5 py-1.5 text-xs font-medium text-inkPrimary hover:border-inkPrimary hover:bg-white transition"
                        >
                          <span>🔗 {label}</span>
                          <svg className="h-3 w-3 text-inkMuted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      );
                    })}

                    {!idea.repo_url && !idea.live_url && (!idea.workspace_urls || idea.workspace_urls.length === 0) && (
                      <p className="text-xs text-inkMuted italic">
                        No hay enlaces agregados aún. Haz clic en "Editar enlaces" para agregar tus redes o repositorio.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha (5 cols): Checklist Interactivo & Estado */}
            <div className="space-y-5 lg:col-span-5">
              <div className="rounded-xl border border-borderHairline bg-cardSubtle p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-inkPrimary">
                    Plan de Acción (Primeros Pasos)
                  </h3>
                  <span className="font-mono text-xs font-bold tabular-nums text-emerald-600">
                    {pct}% ({done}/{steps.length})
                  </span>
                </div>
                {idea.status === 'En Foco' && (() => {
                  const timer = getFocusTimerState(idea);
                  return (
                    <div
                      className={`mt-2.5 flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] ${
                        timer.isCompleted
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : timer.isExpired
                          ? 'border-rose-200 bg-rose-50 text-rose-800'
                          : timer.isWarning
                          ? 'border-amber-200 bg-amber-50 text-amber-800'
                          : 'border-borderHairline bg-white text-inkBody'
                      }`}
                    >
                      <span className="font-mono font-semibold tabular-nums">
                        {timer.isCompleted ? '✅' : timer.isExpired ? '⏰' : '⏳'} Ventana 48h: {timer.remainingLabel}
                      </span>
                      {timer.isExpired && onResetFocusTimer && (
                        <button
                          type="button"
                          onClick={() => onResetFocusTimer(idea.id)}
                          className="rounded-md bg-rose-700 px-2 py-0.5 text-[10.5px] font-semibold text-white transition hover:bg-rose-800"
                        >
                          Reiniciar +48h
                        </button>
                      )}
                    </div>
                  );
                })()}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-inkPrimary transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>

                <div className="mt-3.5 space-y-2">
                  {steps.map((step, idx) => (
                    <label
                      key={idx}
                      className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-borderHairline bg-white p-3 transition hover:border-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={step.done}
                        onChange={() => onToggleStep(idx)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-inkPrimary"
                      />
                      <span className={`text-xs leading-relaxed ${step.done ? 'text-inkFaint line-through' : 'text-inkPrimary'}`}>
                        {step.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-borderHairline bg-white p-4">
                <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-inkMuted">
                  Mover Estado en el Embudo
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {statuses.map((st) => {
                    const isCurrent = idea.status === st;
                    const activeClass =
                      st === 'Lanzado'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-inkPrimary bg-inkCharcoal text-white';
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => onStatusChange(st)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                          isCurrent
                            ? activeClass
                            : 'border-borderHairline bg-cardSubtle text-inkBody hover:border-inkPrimary hover:bg-white'
                        } ${st === 'Lanzado' ? 'col-span-2' : ''}`}
                      >
                        {st === 'Lanzado' ? '🚀 Lanzado / Validado' : st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cierre de ciclo (Nota de aprendizaje de 1 línea) */}
              {idea.status === 'Lanzado' && onUpdateClosingNote && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                      Cierre del Ciclo — Aprendizaje
                    </h3>
                    {idea.launched_at && (
                      <span className="font-mono text-[10.5px] text-emerald-700">
                        {idea.launched_at.slice(0, 10)}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={closingNoteInput}
                    onChange={(e) => setClosingNoteInput(e.target.value)}
                    placeholder="Ej: Los bodegueros sí lo usan, pero piden impresión térmica."
                    className="w-full h-8 px-2.5 text-xs bg-white rounded-lg border border-emerald-200 text-inkPrimary focus:outline-none focus:border-emerald-500"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onUpdateClosingNote(idea.id, closingNoteInput.trim())}
                      className="rounded-lg bg-emerald-700 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800 transition"
                    >
                      Guardar aprendizaje
                    </button>
                  </div>
                </div>
              )}

              {/* Nivel de Evidencia en la calle */}
              {onUpdateEvidence && (
                <div className="rounded-xl border border-borderHairline bg-white p-4">
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-inkMuted">
                    Nivel de Evidencia
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {evidenceLevels.map((lvl) => {
                      const meta = EVIDENCE_META[lvl];
                      const active = currentEvidence === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => onUpdateEvidence(idea.id, lvl, evidenceNoteInput.trim())}
                          className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border px-1.5 py-1.5 text-[10.5px] font-semibold leading-tight transition ${
                            active
                              ? 'border-inkPrimary bg-inkCharcoal text-white'
                              : 'border-borderHairline bg-cardSubtle text-inkBody hover:border-inkPrimary'
                          }`}
                        >
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <input
                      type="text"
                      value={evidenceNoteInput}
                      onChange={(e) => setEvidenceNoteInput(e.target.value)}
                      placeholder="Nota breve (ej: 2 bodegueros pidieron probarlo)"
                      className="h-8 min-w-0 flex-1 rounded-lg border border-borderHairline bg-searchBg px-2.5 text-xs text-inkPrimary focus:border-inkPrimary focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateEvidence(idea.id, currentEvidence, evidenceNoteInput.trim())}
                      className="rounded-lg border border-borderHairline bg-cardSubtle px-2.5 text-[11px] font-semibold text-inkPrimary hover:border-inkPrimary"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {/* Historial de menciones si hay Señal de Obsesión */}
              {idea.mention_notes && idea.mention_notes.length > 0 && (
                <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
                  <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-orange-800">
                    🔥 Historial de Obsesión ({mentions} menciones)
                  </h3>
                  <ul className="space-y-1 text-[11.5px] text-orange-950">
                    {idea.mention_notes.map((n, idx) => (
                      <li key={idx} className="truncate">
                        • {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Modal con Exportación Obsidian */}
        <div className="flex flex-col gap-2.5 border-t border-borderHairline bg-cardSubtle px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[11px] text-inkMuted">
            Formato compatible con Obsidian / Logseq (YAML Frontmatter)
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {/* Lanzadores Rápidos a IA con Prompt Copiado/Precargado */}
            <div className="flex items-center gap-1 rounded-xl border border-borderHairline bg-white px-2 py-1 shadow-2xs">
              <span className="font-mono text-[10.5px] font-bold text-inkMuted pr-1">Lanzar IA:</span>
              <button
                type="button"
                onClick={() => launchChatGPT(generateAgentMasterPrompt(idea))}
                title="Abrir en ChatGPT con el Prompt Maestro pre-cargado"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 transition"
              >
                <span>🟢</span>
                <span>ChatGPT</span>
              </button>
              <button
                type="button"
                onClick={() => launchClaude(generateAgentMasterPrompt(idea))}
                title="Copiar Prompt Maestro y abrir Claude"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-purple-900 hover:bg-purple-50 transition"
              >
                <span>🟣</span>
                <span>Claude</span>
              </button>
              <button
                type="button"
                onClick={() => launchGemini(generateAgentMasterPrompt(idea))}
                title="Copiar Prompt Maestro y abrir Gemini Web"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-blue-900 hover:bg-blue-50 transition"
              >
                <span>🔵</span>
                <span>Gemini</span>
              </button>
            </div>

            {onCopyMasterPrompt && (
              <button
                type="button"
                onClick={onCopyMasterPrompt}
                title="Copia un System Prompt listo para Antigravity, Cursor o Claude"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-borderHairline bg-white px-3 py-2 text-xs font-semibold text-inkPrimary transition hover:border-inkPrimary"
              >
                <span>🤖 Prompt IA</span>
              </button>
            )}
            <button
              type="button"
              onClick={onCopyMarkdown}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-borderHairline bg-white px-3 py-2 text-xs font-semibold text-inkPrimary transition hover:border-inkPrimary"
            >
              <span>📋 Copiar .md</span>
            </button>
            <button
              type="button"
              onClick={onDownloadMarkdown}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-inkCharcoal px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-black"
            >
              <span>⬇ Descargar .md</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
