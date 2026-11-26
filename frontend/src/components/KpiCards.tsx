import React from 'react';

interface KpiCardsProps {
  focusCount: number;
  freezerCount: number;
  avgScore: number;
  recentCount?: number;
}

export const KpiCards: React.FC<KpiCardsProps> = React.memo(({
  focusCount,
  freezerCount,
  avgScore,
  recentCount = 0,
}) => {
  return (
    <section aria-label="Métricas clave" className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:gap-6">
      {/* KPI Card 1: EN FOCO ACTIVO */}
      <div className="flex flex-col justify-between rounded-2xl border border-borderHairline bg-white transition hover:border-gray-300">
        <div className="p-5 pb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-inkMuted">
            EN FOCO ACTIVO
          </div>
          <div className="mt-2.5 flex items-end justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[28px] font-bold leading-none tracking-tight tabular-nums text-inkPrimary">
                {focusCount} / 2
              </span>
              <span className="text-xs font-medium text-inkMuted">Slots</span>
            </div>
            {/* Mini vertical bar sparkline (estilo exacto de la referencia) */}
            <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
              <span className="w-[2.5px] h-3 rounded-full bg-gray-200"></span>
              <span className="w-[2.5px] h-5 rounded-full bg-gray-300"></span>
              <span className="w-[2.5px] h-8 rounded-full bg-inkPrimary"></span>
              <span className="w-[2.5px] h-6 rounded-full bg-gray-400"></span>
              <span className="w-[2.5px] h-9 rounded-full bg-inkPrimary"></span>
              <span className="w-[2.5px] h-4 rounded-full bg-gray-300"></span>
              <span className="w-[2.5px] h-2.5 rounded-full bg-gray-200"></span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 bg-cardSubtle/60 px-5 py-2.5 rounded-b-2xl">
          <span
            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200/80 font-mono text-[10px] font-bold text-inkMuted"
            title="Máximo 2 proyectos activos simultáneamente"
          >
            i
          </span>
          <span className="text-xs font-medium text-emerald-600">
            {focusCount === 2 ? 'Límite saludable activo' : `${2 - focusCount} slot disponible`}
          </span>
        </div>
      </div>

      {/* KPI Card 2: IDEAS EN CONGELADOR */}
      <div className="flex flex-col justify-between rounded-2xl border border-borderHairline bg-white transition hover:border-gray-300">
        <div className="p-5 pb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-inkMuted">
            IDEAS EN CONGELADOR
          </div>
          <div className="mt-2.5 flex items-end justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[28px] font-bold leading-none tracking-tight tabular-nums text-inkPrimary">
                {String(freezerCount).padStart(2, '0')}
              </span>
              <span className="text-xs font-medium text-inkMuted">Fichas</span>
            </div>
            {/* Mini vertical bar sparkline */}
            <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
              <span className="w-[2.5px] h-2.5 rounded-full bg-gray-200"></span>
              <span className="w-[2.5px] h-4 rounded-full bg-gray-300"></span>
              <span className="w-[2.5px] h-6 rounded-full bg-gray-400"></span>
              <span className="w-[2.5px] h-9 rounded-full bg-inkPrimary"></span>
              <span className="w-[2.5px] h-5 rounded-full bg-gray-300"></span>
              <span className="w-[2.5px] h-7 rounded-full bg-gray-400"></span>
              <span className="w-[2.5px] h-3 rounded-full bg-gray-200"></span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 bg-cardSubtle/60 px-5 py-2.5 rounded-b-2xl">
          <span
            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200/80 font-mono text-[10px] font-bold text-inkMuted"
            title="Ideas con arquitectura guardada esperando turno"
          >
            i
          </span>
          <span className="text-xs font-medium text-emerald-600">
            {recentCount > 0 ? `+${recentCount} filtradas esta semana` : 'Bóveda activa · 0 esta semana'}
          </span>
        </div>
      </div>

      {/* KPI Card 3: PUNTAJE IA PROMEDIO */}
      <div className="flex flex-col justify-between rounded-2xl border border-borderHairline bg-white transition hover:border-gray-300">
        <div className="p-5 pb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-inkMuted">
            PUNTAJE IA PROMEDIO
          </div>
          <div className="mt-2.5 flex items-end justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[28px] font-bold leading-none tracking-tight tabular-nums text-inkPrimary">
                {avgScore.toFixed(1)} / 10
              </span>
              <span className="text-xs font-medium text-inkMuted">Viabilidad</span>
            </div>
            {/* Mini vertical bar sparkline */}
            <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
              <span className="w-[2.5px] h-4 rounded-full bg-gray-200"></span>
              <span className="w-[2.5px] h-7 rounded-full bg-gray-400"></span>
              <span className="w-[2.5px] h-5 rounded-full bg-gray-300"></span>
              <span className="w-[2.5px] h-8 rounded-full bg-inkPrimary"></span>
              <span className="w-[2.5px] h-9 rounded-full bg-inkPrimary"></span>
              <span className="w-[2.5px] h-6 rounded-full bg-gray-400"></span>
              <span className="w-[2.5px] h-3 rounded-full bg-gray-200"></span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 bg-cardSubtle/60 px-5 py-2.5 rounded-b-2xl">
          <span
            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200/80 font-mono text-[10px] font-bold text-inkMuted"
            title="Promedio de viabilidad de ideas activas (excluyendo descartadas)"
          >
            i
          </span>
          <span className="text-xs font-medium text-emerald-600">
            Filtro anti-humo activo
          </span>
        </div>
      </div>
    </section>
  );
});
