import React from 'react';
import { MainView } from '../types';

interface MobileBottomNavProps {
  activeView: MainView;
  onSelectView: (view: MainView) => void;
  onOpenSimulator: () => void;
  onToggleMobileMenu: () => void;
  focusCount: number;
  freezerCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = React.memo(({
  activeView,
  onSelectView,
  onOpenSimulator,
  onToggleMobileMenu,
  focusCount,
  freezerCount,
}) => {
  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-borderHairline bg-white/95 px-2 pb-safe backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden"
    >
      {/* 1. Vista General */}
      <button
        type="button"
        onClick={() => onSelectView('overview')}
        className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
          activeView === 'overview' ? 'text-neutral-900 font-semibold' : 'text-neutral-400 hover:text-neutral-700'
        }`}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill={activeView === 'overview' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
        <span className="mt-1 text-[10.5px] tracking-tight">Inicio</span>
      </button>

      {/* 2. En Foco */}
      <button
        type="button"
        onClick={() => onSelectView('focus')}
        className={`relative flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
          activeView === 'focus' ? 'text-neutral-900 font-semibold' : 'text-neutral-400 hover:text-neutral-700'
        }`}
      >
        <div className="relative">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {focusCount > 0 && (
            <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-neutral-900 px-1 font-mono text-[9px] font-bold text-white">
              {focusCount}
            </span>
          )}
        </div>
        <span className="mt-1 text-[10.5px] tracking-tight">En Foco</span>
      </button>

      {/* 3. Botón Central: + CAPTURAR */}
      <div className="flex flex-1 justify-center">
        <button
          type="button"
          onClick={onOpenSimulator}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md transition active:scale-95"
          title="Capturar o evaluar nueva idea con IA"
          aria-label="Capturar idea con IA"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* 4. Congelador / Bóveda */}
      <button
        type="button"
        onClick={() => onSelectView('freezer')}
        className={`relative flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
          activeView === 'freezer' ? 'text-neutral-900 font-semibold' : 'text-neutral-400 hover:text-neutral-700'
        }`}
      >
        <div className="relative">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          {freezerCount > 0 && (
            <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-neutral-200 px-1 font-mono text-[9px] font-semibold text-neutral-800">
              {freezerCount}
            </span>
          )}
        </div>
        <span className="mt-1 text-[10.5px] tracking-tight">Bóveda</span>
      </button>

      {/* 5. Menú / Opciones */}
      <button
        type="button"
        onClick={onToggleMobileMenu}
        className="flex flex-1 flex-col items-center justify-center py-1 text-neutral-400 hover:text-neutral-700 transition-colors"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
        <span className="mt-1 text-[10.5px] tracking-tight">Menú</span>
      </button>
    </nav>
  );
});
