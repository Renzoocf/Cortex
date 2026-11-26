import { Idea } from '../types';

export const VALIDATION_WINDOW_HOURS = 48;
const VALIDATION_WINDOW_MS = VALIDATION_WINDOW_HOURS * 3600 * 1000;
const WARNING_THRESHOLD_MS = 36 * 3600 * 1000;

export interface FocusTimerState {
  elapsedHours: number;
  remainingMs: number;
  remainingLabel: string;
  isExpired: boolean;
  isWarning: boolean;
  isCompleted: boolean;
  progressPct: number;
}

/**
 * Calcula el estado del reloj de validación de 48 horas para proyectos en "En Foco".
 */
export function getFocusTimerState(idea: Idea, nowMs: number = Date.now()): FocusTimerState {
  const steps = idea.steps || [];
  const isCompleted = steps.length > 0 && steps.every((s) => s.done);

  const parsedStart = idea.focus_started_at ? Date.parse(idea.focus_started_at) : NaN;
  const startMs = Number.isFinite(parsedStart) ? parsedStart : nowMs;
  const elapsedMs = Math.max(0, nowMs - startMs);
  const elapsedHours = Math.floor(elapsedMs / 3600000);
  const remainingMs = Math.max(0, VALIDATION_WINDOW_MS - elapsedMs);

  const isExpired = !isCompleted && elapsedMs >= VALIDATION_WINDOW_MS;
  const isWarning = !isCompleted && !isExpired && elapsedMs >= WARNING_THRESHOLD_MS;
  const progressPct = Math.min(100, Math.round((elapsedMs / VALIDATION_WINDOW_MS) * 100));

  let remainingLabel = '48h 00m restantes';
  if (isCompleted) {
    remainingLabel = 'MVP Validado';
  } else if (isExpired) {
    const overdueHours = Math.max(1, Math.floor((elapsedMs - VALIDATION_WINDOW_MS) / 3600000));
    if (overdueHours >= 24) {
      const days = Math.floor(overdueHours / 24);
      const remHours = overdueHours % 24;
      remainingLabel = remHours > 0 ? `Vencido hace ${days}d ${remHours}h` : `Vencido hace ${days}d`;
    } else {
      remainingLabel = `Vencido hace ${overdueHours}h`;
    }
  } else {
    const remHours = Math.floor(remainingMs / 3600000);
    const remMins = Math.floor((remainingMs % 3600000) / 60000);
    remainingLabel = `${String(remHours).padStart(2, '0')}h ${String(remMins).padStart(2, '0')}m restantes`;
  }

  return {
    elapsedHours,
    remainingMs,
    remainingLabel,
    isExpired,
    isWarning,
    isCompleted,
    progressPct,
  };
}
