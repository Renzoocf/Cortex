import React from 'react';
import { MainView, UserProfile } from '../types';

interface SidebarProps {
  activeView: MainView;
  onSelectView: (view: MainView) => void;
  activeNiche: string;
  onSelectNiche: (niche: string) => void;
  onOpenCriteria: () => void;
  onExportVault: () => void;
  onOpenDigest: () => void;
  onClearMockData?: () => void;
  currentUser?: UserProfile;
  counts: {
    focus: number;
    freezer: number;
    content: number;
    launched: number;
    discarded: number;
  };
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  activeView,
  onSelectView,
  activeNiche,
  onSelectNiche,
  onOpenCriteria,
  onExportVault,
  onOpenDigest,
  onClearMockData,
  currentUser,
  counts,
  isOpenMobile,
  onCloseMobile,
  onLogout,
}) => {
  return (
    <>
      {/* Scrim móvil */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
        />
      )}

      <aside
        id="leftSidebar"
        aria-label="Navegación principal"
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] shrink-0 flex-col justify-between border-r border-borderHairline bg-sidebarBg px-3.5 py-4 transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6 overflow-y-auto pr-0.5">
          {/* Workspace Header Card */}
          <div className="flex items-center justify-between rounded-xl border border-borderHairline bg-[#EAEBEB]/75 px-3 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-inkCharcoal text-white shadow-xs">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 6.5H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H7" />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-medium leading-tight text-inkMuted">Segundo Cerebro</span>
                <span className="block truncate text-[13px] font-bold leading-tight text-inkPrimary">CortexFiltro</span>
              </div>
            </div>
            <svg className="h-3.5 w-3.5 shrink-0 text-inkFaint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>
            </svg>
          </div>

          {/* Grupo 1: MENÚ PRINCIPAL */}
          <div>
            <div className="mb-2 px-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-inkMuted">
              Menú Principal
            </div>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => { onSelectView('overview'); onCloseMobile(); }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[13px] transition ${
                  activeView === 'overview' ? 'nav-item-active' : 'nav-item-idle'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-9.5Z"/>
                  </svg>
                  <span>Vista General</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => { onSelectView('focus'); onCloseMobile(); }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[13px] transition ${
                  activeView === 'focus' ? 'nav-item-active' : 'nav-item-idle'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  <span className="truncate">En Foco (Máx. 2)</span>
                </span>
                <span className="rounded-md border border-borderHairline bg-white px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tabular-nums text-inkPrimary">
                  {counts.focus}/2
                </span>
              </button>

              <button
                type="button"
                onClick={() => { onSelectView('freezer'); onCloseMobile(); }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[13px] transition ${
                  activeView === 'freezer' ? 'nav-item-active' : 'nav-item-idle'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
                  </svg>
                  <span className="truncate">Congelador Técnico</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums text-inkFaint">{counts.freezer}</span>
              </button>

              <button
                type="button"
                onClick={() => { onSelectView('content'); onCloseMobile(); }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[13px] transition ${
                  activeView === 'content' ? 'nav-item-active' : 'nav-item-idle'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="18" x="3" y="3" rx="2"/><path d="m10 8 6 4-6 4Z"/>
                  </svg>
                  <span className="truncate">Fábrica de Contenido</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums text-inkFaint">{counts.content}</span>
              </button>

              <button
                type="button"
                onClick={() => { onSelectView('launched'); onCloseMobile(); }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[13px] transition ${
                  activeView === 'launched' ? 'nav-item-active' : 'nav-item-idle'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span className="truncate">Lanzados / Validados</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums text-emerald-600 font-semibold">{counts.launched}</span>
              </button>

              <button
                type="button"
                onClick={() => { onSelectView('discarded'); onCloseMobile(); }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[13px] transition ${
                  activeView === 'discarded' ? 'nav-item-active' : 'nav-item-idle'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                  <span className="truncate">Descartados (Anti-Humo)</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums text-inkFaint">{counts.discarded}</span>
              </button>
            </nav>
          </div>

          {/* Grupo 2: NICHOS & FILTROS */}
          <div>
            <div className="mb-2 px-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-inkMuted">
              Nichos &amp; Filtros
            </div>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => { onSelectNiche('ALL'); onCloseMobile(); }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[13px] transition ${
                  activeNiche === 'ALL' ? 'nav-item-active' : 'nav-item-idle'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  <span>Todos los Nichos</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => { onSelectNiche('SaaS & Micro-Apps'); onCloseMobile(); }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[13px] transition ${
                  activeNiche === 'SaaS & Micro-Apps' ? 'nav-item-active' : 'nav-item-idle'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                  </svg>
                  <span className="truncate">SaaS &amp; Micro-Apps</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => { onSelectNiche('Contenido & TikTok'); onCloseMobile(); }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[13px] transition ${
                  activeNiche === 'Contenido & TikTok' ? 'nav-item-active' : 'nav-item-idle'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
                  </svg>
                  <span className="truncate">Contenido &amp; TikTok</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => { onSelectNiche('Automatización & IA'); onCloseMobile(); }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-[13px] transition ${
                  activeNiche === 'Automatización & IA' ? 'nav-item-active' : 'nav-item-idle'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  <span className="truncate">Automatización &amp; IA</span>
                </span>
              </button>
            </nav>
          </div>

          {/* Grupo 3: SISTEMA */}
          <div>
            <div className="mb-2 px-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-inkMuted">
              Sistema
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => { onOpenDigest(); onCloseMobile(); }}
                className="nav-item-idle flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Resumen de Domingo</span>
              </button>

              <button
                type="button"
                onClick={() => { onOpenCriteria(); onCloseMobile(); }}
                className="nav-item-idle flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
                </svg>
                <span>Criterios Filtro IA</span>
              </button>

              <button
                type="button"
                onClick={() => { onExportVault(); onCloseMobile(); }}
                className="nav-item-idle flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Exportar Bóveda (.md)</span>
              </button>

              {onClearMockData && (
                <button
                  type="button"
                  onClick={() => { onClearMockData(); onCloseMobile(); }}
                  title="Vaciar las fichas de prueba y empezar con tablero 100% en limpio"
                  className="nav-item-idle flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition text-neutral-400 hover:text-amber-600"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  <span>Vaciar Fichas de Prueba</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Estado Bot Telegram en el pie del sidebar */}
        <div className="space-y-2 mt-4">
          <div className="rounded-xl border border-borderHairline bg-white px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
              <span className="text-[11.5px] font-semibold text-inkPrimary">Telegram: @RCortex_bot</span>
            </div>
            <p className="mt-0.5 font-mono text-[10.5px] text-inkMuted">Gemini Flash · Supabase Listo</p>
          </div>

          {/* Tarjeta de Usuario con Botón de Cerrar Sesión Destacado */}
          <div className="flex items-center justify-between rounded-xl border border-borderHairline bg-white px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white font-mono text-[11px] font-bold">
                {(currentUser?.full_name || 'R').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="block truncate text-[12px] font-bold leading-tight text-inkPrimary">
                  {currentUser?.full_name || 'Renzo'}
                </span>
                <span className="block truncate font-mono text-[10px] text-inkMuted">
                  {currentUser?.role || 'Creador'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { onLogout(); onCloseMobile(); }}
              title="Cerrar sesión"
              className="flex items-center gap-1 rounded-lg border border-borderHairline bg-[#F5F6F8] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 px-2 py-1 text-[11px] font-semibold text-neutral-600 transition-colors"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Salir</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
});
