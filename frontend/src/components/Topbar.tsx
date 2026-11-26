import React from 'react';
import { MainView } from '../types';

interface TopbarProps {
  activeView: MainView;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSimulator: () => void;
  onToggleMobileMenu: () => void;
  onLogout: () => void;
}

export const Topbar: React.FC<TopbarProps> = React.memo(({
  activeView,
  searchQuery,
  onSearchChange,
  onOpenSimulator,
  onToggleMobileMenu,
  onLogout,
}) => {
  const viewLabels: Record<MainView, string> = {
    overview: 'Vista General',
    focus: 'En Foco (Máx. 2)',
    freezer: 'Congelador Técnico',
    content: 'Fábrica de Contenido',
    launched: 'Lanzados / Validados',
    discarded: 'Descartados (Anti-Humo)',
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 shrink-0 items-center justify-between gap-2 sm:gap-3 border-b border-borderHairline bg-white/95 backdrop-blur-md px-3 sm:px-8 xl:px-10 2xl:px-12">
      {/* Izquierda: Botón móvil + Breadcrumb dinámico */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Abrir menú lateral"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-borderHairline bg-searchBg text-inkPrimary lg:hidden"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 truncate text-[12.5px] sm:text-[13px]">
          <span className="hidden xs:inline font-medium text-inkMuted">CortexFiltro</span>
          <span className="hidden xs:inline text-inkFaint">&gt;</span>
          <span className="truncate font-semibold text-inkPrimary">
            {viewLabels[activeView] || 'Vista General'}
          </span>
        </nav>
      </div>

      {/* Derecha: Buscador redondeado #F5F6F8 + Botón Primario Charcoal */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="relative hidden md:block sm:w-56 md:w-64 lg:w-72">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkFaint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar idea, nicho o stack..."
            className="h-9 w-full rounded-xl border border-borderHairline bg-searchBg pl-9 pr-7 text-[13px] text-inkPrimary placeholder-inkFaint transition focus:border-inkPrimary focus:bg-white focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-inkFaint hover:text-inkPrimary"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenSimulator}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-inkCharcoal px-2.5 sm:px-3.5 text-[12px] sm:text-[12.5px] font-semibold text-white shadow-xs transition hover:bg-black active:scale-[0.99]"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">Simular Entrada Telegram / IA</span>
          <span className="inline sm:hidden">Capturar</span>
        </button>

        {/* Botón de Cerrar Sesión en Topbar */}
        <button
          type="button"
          onClick={onLogout}
          title="Cerrar sesión"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-borderHairline bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 px-2.5 sm:px-3 text-[12px] font-semibold text-neutral-600 transition-colors"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span className="hidden md:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
});
