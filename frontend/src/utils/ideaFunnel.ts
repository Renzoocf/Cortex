import { EvidenceLevel, Idea } from '../types';
import { getFocusTimerState } from './focusTimer';

export const COLD_THRESHOLD_DAYS = 30;

export const EVIDENCE_META: Record<
  EvidenceLevel,
  { label: string; icon: string; badgeClass: string }
> = {
  intuicion: {
    label: 'Intuición',
    icon: '💭',
    badgeClass: 'border-borderHairline bg-cardSubtle text-inkMuted',
  },
  conversado: {
    label: 'Conversado',
    icon: '💬',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  con_demanda: {
    label: 'Con demanda',
    icon: '✅',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
};

const STOPWORDS_ES = new Set([
  'para', 'como', 'esta', 'este', 'esto', 'estos', 'estas', 'unas', 'unos',
  'sobre', 'desde', 'donde', 'cuando', 'quien', 'cual', 'pero', 'porque',
  'entre', 'hacia', 'hasta', 'contra', 'todo', 'toda', 'todos', 'todas',
  'cada', 'algo', 'nada', 'mucho', 'poco', 'solo', 'aqui', 'alli', 'idea',
  'proyecto', 'sistema', 'aplicacion', 'usuario', 'usuarios', 'tiempo',
  'forma', 'manera', 'puede', 'pueden', 'hacer', 'tener', 'usar', 'crear',
  'tiktok', 'telegram', 'video', 'short', 'shorts', 'reels', 'whatsapp',
]);

function tokenizeText(text: string): Set<string> {
  if (!text) return new Set();
  const withoutUrls = text.replace(/https?:\/\/\S+/gi, ' ');
  const normalized = withoutUrls
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const matches = normalized.match(/[a-z0-9]+/g) || [];
  return new Set(matches.filter((w) => w.length >= 4 && !STOPWORDS_ES.has(w)));
}

/**
 * Detector de Ideas Repetidas ("Señal de Obsesión").
 * Evita fichas duplicadas fusionando capturas equivalentes.
 */
export function findDuplicateIdea(candidateText: string, existingIdeas: Idea[]): Idea | null {
  const candTokens = tokenizeText(candidateText);
  if (candTokens.size < 2) return null;

  let bestMatch: Idea | null = null;
  let bestScore = 0;

  for (const idea of existingIdeas) {
    if (idea.status === 'Descartado' || idea.status === 'Lanzado') continue;

    const haystack = [idea.title, idea.problem, idea.summary, ...(idea.stack || [])].join(' ');
    const ideaTokens = tokenizeText(haystack);
    if (ideaTokens.size === 0) continue;

    let inter = 0;
    candTokens.forEach((tok) => {
      if (ideaTokens.has(tok)) inter += 1;
    });
    if (inter < 2) continue;

    const minLen = Math.min(candTokens.size, ideaTokens.size);
    const unionLen = candTokens.size + ideaTokens.size - inter;
    const containment = inter / minLen;
    const jaccard = inter / unionLen;

    if (containment >= 0.45 || jaccard >= 0.30) {
      const combined = containment * 0.65 + jaccard * 0.35;
      if (combined > bestScore) {
        bestScore = combined;
        bestMatch = idea;
      }
    }
  }

  return bestMatch;
}

/**
 * Días transcurridos desde la última actividad de una ficha en el Congelador.
 */
export function getFreezerAgeDays(idea: Idea, nowMs: number = Date.now()): number {
  const refDateStr = idea.last_touched_at || idea.created;
  if (!refDateStr) return 0;
  const parsed = Date.parse(refDateStr);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor((nowMs - parsed) / 86400000));
}

export function isColdFreezerIdea(idea: Idea, nowMs: number = Date.now()): boolean {
  if (idea.status !== 'Congelador') return false;
  return getFreezerAgeDays(idea, nowMs) >= COLD_THRESHOLD_DAYS;
}

export interface WeeklyDigestResult {
  markdown: string;
  stats: {
    total: number;
    focus: number;
    expiredFocus: number;
    freezer: number;
    coldFreezer: number;
    content: number;
    launched: number;
    discarded: number;
    obsessionCount: number;
    topFreezerTitle: string;
  };
}

/**
 * Construye el Resumen Semanal de Domingo listo para Telegram y vista previa.
 */
export function buildWeeklyDigest(
  ideas: Idea[],
  nowMs: number = Date.now()
): WeeklyDigestResult {
  const focusIdeas = ideas.filter((i) => i.status === 'En Foco');
  const freezerIdeas = ideas.filter((i) => i.status === 'Congelador');
  const contentIdeas = ideas.filter((i) => i.status === 'Contenido');
  const launchedIdeas = ideas.filter((i) => i.status === 'Lanzado');
  const discardedIdeas = ideas.filter((i) => i.status === 'Descartado');

  const expiredFocus = focusIdeas.filter((i) => getFocusTimerState(i, nowMs).isExpired);
  const coldFreezer = freezerIdeas.filter((i) => isColdFreezerIdea(i, nowMs));
  const obsessionIdeas = ideas
    .filter((i) => (i.mention_count || 1) >= 2 && i.status !== 'Descartado' && i.status !== 'Lanzado')
    .sort((a, b) => (b.mention_count || 1) - (a.mention_count || 1));

  const topFreezer = [...freezerIdeas].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.mention_count || 1) - (a.mention_count || 1);
  })[0];

  const topFreezerTitle = topFreezer
    ? `${topFreezer.title} (${topFreezer.score.toFixed(1)}/10)`
    : 'Sin fichas pendientes';

  const lines: string[] = [
    '📊 *CORTEXFILTRO — Resumen de Domingo*',
    '',
    `• *Total en bóveda:* ${ideas.length} ideas`,
    `• *En Foco:* ${focusIdeas.length}/2 | *Congelador:* ${freezerIdeas.length} | *Contenido:* ${contentIdeas.length}`,
    `• *Lanzados (cierre exitoso):* ${launchedIdeas.length} | *Descartados (humo):* ${discardedIdeas.length}`,
  ];

  if (expiredFocus.length > 0) {
    lines.push('');
    lines.push('⏰ *Alerta 48h en Foco:*');
    expiredFocus.forEach((item) => {
      const timer = getFocusTimerState(item, nowMs);
      lines.push(`  - ${item.title} (${timer.remainingLabel})`);
    });
  }

  if (obsessionIdeas.length > 0) {
    const topObs = obsessionIdeas[0];
    lines.push('');
    lines.push(
      `🔥 *Señal de Obsesión:* _${topObs.title}_ (mencionada ${topObs.mention_count || 2} veces)`
    );
  }

  if (topFreezer) {
    lines.push('');
    lines.push(`💎 *Mejor ficha esperando turno:* ${topFreezerTitle}`);
  }

  if (coldFreezer.length > 0) {
    lines.push(
      `🧊 *Purga recomendada:* ${coldFreezer.length} idea(s) llevan +${COLD_THRESHOLD_DAYS} días frías en el Congelador.`
    );
  }

  lines.push('');
  lines.push('🎯 _Decisión rápida: libera lo vencido y sube solo lo que tenga evidencia real._');

  return {
    markdown: lines.join('\n'),
    stats: {
      total: ideas.length,
      focus: focusIdeas.length,
      expiredFocus: expiredFocus.length,
      freezer: freezerIdeas.length,
      coldFreezer: coldFreezer.length,
      content: contentIdeas.length,
      launched: launchedIdeas.length,
      discarded: discardedIdeas.length,
      obsessionCount: obsessionIdeas.length,
      topFreezerTitle,
    },
  };
}
