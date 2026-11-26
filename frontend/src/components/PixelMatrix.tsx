import React, { useMemo, useState } from 'react';
import { ChartColumnItem, Idea } from '../types';

interface PixelMatrixProps {
  ideas: Idea[];
}

const TOTAL_ROWS = 16;

interface PixelColumnBarsProps {
  cols: [number, number][];
}

// Memoizado para que al mover el mouse entre columnas NO se reconstruyan las celdas DOM
const PixelColumnBars: React.FC<PixelColumnBarsProps> = React.memo(({ cols }) => {
  return (
    <div className="relative z-[1] flex gap-[2px]">
      {cols.map((subCol, sIdx) => {
        const [appCount, discCount] = subCol;
        const cells = [];
        for (let row = TOTAL_ROWS - 1; row >= 0; row--) {
          let cellClass = 'pixel-empty';
          if (row < appCount) cellClass = 'pixel-approved';
          else if (row < appCount + discCount) cellClass = 'pixel-discarded';
          cells.push(<span key={row} className={`pixel-cell ${cellClass}`}></span>);
        }
        return (
          <div key={sIdx} className="flex flex-col gap-[2px]">
            {cells}
          </div>
        );
      })}
    </div>
  );
});

export const PixelMatrix: React.FC<PixelMatrixProps> = React.memo(({ ideas }) => {
  const [chartRange, setChartRange] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  // Cálculo 100% en vivo a partir de las ideas reales almacenadas en Supabase
  const dynamicDataset = useMemo(() => {
    const totalCount = ideas.length;

    if (chartRange === 'monthly') {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthFull = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];

      const items: ChartColumnItem[] = monthNames.map((shortName, mIdx) => {
        const matching = ideas.filter((idea) => {
          if (!idea.created) return false;
          const d = new Date(idea.created);
          return d.getFullYear() === currentYear && d.getMonth() === mIdx;
        });

        const approved = matching.filter((i) => i.score >= 8.0 && i.status !== 'Descartado').length;
        const discarded = matching.filter((i) => i.score < 8.0 || i.status === 'Descartado').length;

        // Repartir en 3 subcolumnas de píxeles
        const sub1App = Math.min(TOTAL_ROWS, Math.ceil(approved / 2));
        const sub2App = Math.min(TOTAL_ROWS, approved - sub1App);
        const sub1Disc = Math.min(TOTAL_ROWS - sub1App, Math.ceil(discarded / 2));
        const sub2Disc = Math.min(TOTAL_ROWS - sub2App, discarded - sub1Disc);

        return {
          label: shortName,
          fullLabel: `${monthFull[mIdx]} ${currentYear}`,
          approved,
          discarded,
          cols: [
            [sub1App, sub1Disc],
            [sub2App, sub2Disc],
            [0, 0],
          ],
        };
      });

      return {
        totalLabel: `${totalCount}`,
        periodSuffix: `en ${currentYear}`,
        defaultIndex: currentMonthIdx,
        items,
      };
    }

    if (chartRange === 'weekly') {
      const items: ChartColumnItem[] = [];
      const now = new Date();

      for (let w = 11; w >= 0; w--) {
        const weekStart = new Date(now.getTime() - (w * 7 + 6) * 24 * 3600 * 1000);
        const weekEnd = new Date(now.getTime() - w * 7 * 24 * 3600 * 1000);

        const matching = ideas.filter((idea) => {
          if (!idea.created) return false;
          const d = new Date(idea.created);
          return d >= weekStart && d <= weekEnd;
        });

        const approved = matching.filter((i) => i.score >= 8.0 && i.status !== 'Descartado').length;
        const discarded = matching.filter((i) => i.score < 8.0 || i.status === 'Descartado').length;

        items.push({
          label: `S-${12 - w}`,
          fullLabel: `Semana ${12 - w}`,
          approved,
          discarded,
          cols: [
            [Math.min(TOTAL_ROWS, approved), Math.min(TOTAL_ROWS, discarded)],
            [0, 0],
            [0, 0],
          ],
        });
      }

      return {
        totalLabel: `${totalCount}`,
        periodSuffix: 'últimas 12 semanas',
        defaultIndex: 11,
        items,
      };
    }

    // Yearly
    const years = [currentYear - 2, currentYear - 1, currentYear];
    const items: ChartColumnItem[] = years.map((yr) => {
      const matching = ideas.filter((idea) => {
        if (!idea.created) return false;
        return new Date(idea.created).getFullYear() === yr;
      });

      const approved = matching.filter((i) => i.score >= 8.0 && i.status !== 'Descartado').length;
      const discarded = matching.filter((i) => i.score < 8.0 || i.status === 'Descartado').length;

      return {
        label: `${yr}`,
        fullLabel: `Año ${yr}`,
        approved,
        discarded,
        cols: [
          [Math.min(TOTAL_ROWS, approved), Math.min(TOTAL_ROWS, discarded)],
          [0, 0],
          [0, 0],
        ],
      };
    });

    return {
      totalLabel: `${totalCount}`,
      periodSuffix: 'histórico anual',
      defaultIndex: items.length - 1,
      items,
    };
  }, [ideas, chartRange, currentYear, currentMonthIdx]);

  const [activeColIndex, setActiveColIndex] = useState<number>(dynamicDataset.defaultIndex);

  const items = dynamicDataset.items;
  const activeItem = items[activeColIndex] || items[0] || {
    label: '',
    fullLabel: 'Sin datos',
    approved: 0,
    discarded: 0,
    cols: [[0, 0], [0, 0], [0, 0]],
  };

  const totalColumns = items.length || 1;
  const pct = ((activeColIndex + 0.5) / totalColumns) * 100;
  const tooltipStyle: React.CSSProperties =
    pct < 20
      ? { left: '8px', transform: 'none' }
      : pct > 80
      ? { right: '8px', left: 'auto', transform: 'none' }
      : { left: `${pct}%`, transform: 'translateX(-50%)' };
    activeColIndex >= 8
      ? { top: '24px', left: 'auto', right: `${Math.max(2, 100 - pct + 2)}%` }
      : { top: '24px', right: 'auto', left: `${Math.min(72, pct + 2)}%` };

  return (
    <section aria-label="Flujo de capturas y filtro IA" className="pixel-matrix-shell mb-7 rounded-2xl border border-borderHairline bg-white">
      {/* Franja superior del Chart Card */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-cardSubtle/60 px-5 py-3 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-inkMuted">
            FLUJO DE CAPTURAS &amp; FILTRO IA
          </span>
          <span
            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200/80 font-mono text-[10px] font-bold text-inkMuted"
            title="Comparativa histórica entre ideas aprobadas (≥8.0) y ruido filtrado"
          >
            i
          </span>
        </div>
        <span className="font-mono text-[11px] text-inkFaint">•••</span>
      </div>

      {/* Controles de Leyenda + Selector Semanal | Mensual | Anual */}
      <div className="flex flex-col gap-3 px-5 pt-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="text-xs font-medium text-inkMuted">Total Procesadas :</span>
          <span className="font-mono text-2xl font-bold tracking-tight tabular-nums text-inkPrimary">
            {dynamicDataset.totalLabel} Ideas Procesadas
          </span>
          <span className="text-xs text-inkMuted">({dynamicDataset.periodSuffix})</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Leyenda */}
          <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-wide">
            <span className="inline-flex items-center gap-1.5 text-inkPrimary">
              <span className="h-2 w-2 rounded-full bg-inkPrimary"></span>
              <span>APROBADAS (≥ 8.0)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-inkMuted">
              <span className="h-2 w-2 rounded-full bg-gray-300"></span>
              <span>DESCARTADAS / HUMO</span>
            </span>
          </div>

          {/* Segmented Pill Switcher (Semanal | Mensual | Anual) */}
          <div className="inline-flex rounded-xl border border-borderHairline bg-sidebarBg p-0.5">
            <button
              type="button"
              onClick={() => {
                setChartRange('weekly');
                setActiveColIndex(11);
              }}
              className={`rounded-lg px-3 py-1 text-xs transition ${
                chartRange === 'weekly'
                  ? 'bg-white font-semibold text-inkPrimary shadow-xs'
                  : 'font-medium text-inkMuted hover:text-inkPrimary'
              }`}
            >
              Semanal
            </button>
            <button
              type="button"
              onClick={() => {
                setChartRange('monthly');
                setActiveColIndex(currentMonthIdx);
              }}
              className={`rounded-lg px-3 py-1 text-xs transition ${
                chartRange === 'monthly'
                  ? 'bg-white font-semibold text-inkPrimary shadow-xs'
                  : 'font-medium text-inkMuted hover:text-inkPrimary'
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => {
                setChartRange('yearly');
                setActiveColIndex(2);
              }}
              className={`rounded-lg px-3 py-1 text-xs transition ${
                chartRange === 'yearly'
                  ? 'bg-white font-semibold text-inkPrimary shadow-xs'
                  : 'font-medium text-inkMuted hover:text-inkPrimary'
              }`}
            >
              Anual
            </button>
          </div>
        </div>
      </div>

      {/* Lienzo Interactivo de Matriz de Píxeles Apilados */}
      <div className="px-3 sm:px-5 pb-5 pt-2">
        <div className="flex sm:hidden justify-end mb-1">
          <span className="text-[10.5px] font-medium text-inkFaint flex items-center gap-1">
            <span>← Desliza para explorar meses →</span>
          </span>
        </div>
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="min-w-[640px]">
            <div className="relative flex items-stretch gap-3">
            {/* Eje Y izquierdo */}
            <div className="flex flex-col justify-between py-1 font-mono text-[10.5px] tabular-nums text-inkFaint select-none">
              <span className="flex items-center gap-1.5">18 <span className="h-1 w-1 rounded-full bg-gray-300"></span></span>
              <span className="flex items-center gap-1.5">15 <span className="h-1 w-1 rounded-full bg-gray-300"></span></span>
              <span className="flex items-center gap-1.5">12 <span className="h-1 w-1 rounded-full bg-gray-300"></span></span>
              <span className="flex items-center gap-1.5">09 <span className="h-1 w-1 rounded-full bg-gray-300"></span></span>
              <span className="flex items-center gap-1.5">06 <span className="h-1 w-1 rounded-full bg-gray-300"></span></span>
              <span className="flex items-center gap-1.5">03 <span className="h-1 w-1 rounded-full bg-gray-300"></span></span>
              <span className="flex items-center gap-1.5">00 <span className="h-1 w-1 rounded-full bg-gray-300"></span></span>
            </div>

            {/* Grid de 12 columnas */}
            <div className="relative flex-1">
              <div className="grid grid-cols-12 gap-2 sm:gap-3 xl:gap-4">
                {items.map((item, colIdx) => {
                  const isSelected = colIdx === activeColIndex;
                  const centerApproved = item.cols[1][0];
                  const markerBottomPx = Math.min(TOTAL_ROWS * 8 - 8, Math.max(8, centerApproved * 8));

                  return (
                    <div
                      key={colIdx}
                      onMouseEnter={() => setActiveColIndex(colIdx)}
                      className="matrix-month-col relative flex cursor-pointer justify-center py-1 select-none"
                    >
                      {/* Línea vertical punteada y marcador circular */}
                      {isSelected && (
                        <>
                          <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-dashed border-gray-400"></div>
                          <div
                            className="pointer-events-none absolute left-1/2 z-10 h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white bg-inkPrimary shadow-sm"
                            style={{ bottom: `${markerBottomPx}px` }}
                          ></div>
                        </>
                      )}

                      <PixelColumnBars cols={item.cols} />
                    </div>
                  );
                })}
              </div>

              {/* Tooltip Flotante */}
              {activeItem && (
                <div
                  className="pointer-events-none absolute z-20 w-44 rounded-xl border border-borderHairline bg-white shadow-lg transition-all duration-150 animate-pop-in"
                  style={tooltipStyle}
                >
                  <div className="border-b border-gray-100 bg-sidebarBg/80 px-3 py-1.5 text-xs font-medium text-inkMuted rounded-t-xl">
                    {activeItem.fullLabel}
                  </div>
                  <div className="space-y-1.5 px-3 py-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-inkMuted">
                        <span className="h-1.5 w-1.5 rounded-full bg-inkPrimary"></span>
                        <span>Aprobadas</span>
                      </span>
                      <span className="font-mono font-bold tabular-nums text-inkPrimary">{activeItem.approved}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-inkMuted">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
                        <span>Descartadas</span>
                      </span>
                      <span className="font-mono font-bold tabular-nums text-inkPrimary">{activeItem.discarded}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Etiquetas Eje X */}
          <div className="mt-3 ml-9 grid grid-cols-12 gap-2 text-center font-mono text-[10.5px] font-medium uppercase tracking-wider text-inkFaint">
            {items.map((item, idx) => (
              <span
                key={idx}
                className={idx === activeColIndex ? 'font-bold text-inkPrimary' : 'text-inkFaint'}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
  );
});
