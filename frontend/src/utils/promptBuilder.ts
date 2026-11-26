import { Idea } from '../types';

/**
 * Construye un System Prompt maestro optimizado para pegar en Antigravity, Cursor o Claude.
 */
export function generateAgentMasterPrompt(idea: Idea): string {
  const steps = idea.steps || [];
  const nextPendingStep = steps.find((s) => !s.done);
  const firstTask = nextPendingStep
    ? nextPendingStep.text
    : 'Revisar pruebas finales, validar flujo completo y preparar despliegue ligero del MVP.';

  const stackLine = idea.stack && idea.stack.length > 0 ? idea.stack.join(', ') : 'Stack mínimo viable';
  const checklistLines =
    steps.length > 0
      ? steps.map((s, idx) => `${idx + 1}. [${s.done ? 'x' : ' '}] ${s.text}`).join('\n')
      : '1. [ ] Construir prototipo funcional mínimo en 48 horas.';

  const workspaceBlock = idea.local_path
    ? `- **Carpeta de trabajo local:** \`${idea.local_path}\``
    : '- **Carpeta de trabajo local:** Carpeta actual del workspace';

  const linkBlock = idea.captured_url
    ? `- **Referencia capturada:** ${idea.captured_url}\n`
    : '';

  return [
    `Actúa como un Senior Fullstack Architect ultra-pragmático y enfocado en velocidad de MVP.`,
    `Vamos a construir el proyecto **"${idea.title}"** (Nicho: ${idea.niche} | Puntaje CortexFiltro: ${idea.score.toFixed(1)}/10).`,
    ``,
    `## Contexto del Problema Real`,
    `${idea.problem}`,
    ``,
    `## Especificación Técnica y Entorno`,
    workspaceBlock,
    linkBlock + `- **Stack obligatorio:** ${stackLine}`,
    `- **Arquitectura base:** ${idea.architecture}`,
    `- **Veredicto crítico:** ${idea.verdict}`,
    ``,
    `## Plan de Acción del Proyecto`,
    checklistLines,
    ``,
    `## Tu Primera Tarea Inmediata`,
    `Empieza resolviendo específicamente este punto: **"${firstTask}"**.`,
    `Antes de escribir código complejo, propone la estructura mínima de archivos y dime qué validaremos primero.`,
    ``,
    `## Reglas No Negociables`,
    `1. Cero sobreingeniería: no agregues librerías pesadas, microservicios ni abstracciones innecesarias.`,
    `2. Prioriza un flujo funcional de extremo a extremo listo para probar en menos de 48 horas.`,
    `3. Mantén el código limpio, tipado y modular para poder iterar rápido.`,
  ].join('\n');
}

export interface ChatProviderMeta {
  name: string;
  shortName: string;
  icon: string;
  buttonClass: string;
}

/**
 * Detecta qué proveedor de IA es según la URL del chat para mostrar el logo y estilo correcto.
 */
export function getChatProviderMeta(url?: string): ChatProviderMeta {
  if (!url) {
    return {
      name: 'Chat de IA',
      shortName: 'Chat IA',
      icon: '💬',
      buttonClass: 'border-borderHairline bg-cardSubtle text-inkPrimary hover:border-inkPrimary',
    };
  }

  const clean = url.toLowerCase();
  if (clean.includes('chatgpt.com') || clean.includes('openai.com')) {
    return {
      name: 'ChatGPT',
      shortName: 'ChatGPT',
      icon: '🟢',
      buttonClass: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400',
    };
  }
  if (clean.includes('claude.ai') || clean.includes('anthropic.com')) {
    return {
      name: 'Claude',
      shortName: 'Claude',
      icon: '🟣',
      buttonClass: 'border-purple-200 bg-purple-50 text-purple-900 hover:border-purple-400',
    };
  }
  if (clean.includes('gemini.google.com') || clean.includes('google.com')) {
    return {
      name: 'Gemini',
      shortName: 'Gemini',
      icon: '🔵',
      buttonClass: 'border-blue-200 bg-blue-50 text-blue-900 hover:border-blue-400',
    };
  }
  if (clean.includes('perplexity.ai')) {
    return {
      name: 'Perplexity',
      shortName: 'Perplexity',
      icon: '🌐',
      buttonClass: 'border-teal-200 bg-teal-50 text-teal-900 hover:border-teal-400',
    };
  }

  return {
    name: 'Conversación IA',
    shortName: 'Chat IA',
    icon: '💬',
    buttonClass: 'border-borderHairline bg-white text-inkPrimary hover:border-inkPrimary',
  };
}

/**
 * Abre ChatGPT con el prompt pre-cargado en la URL y además lo copia al portapapeles.
 */
export function launchChatGPT(prompt: string): void {
  try {
    navigator.clipboard.writeText(prompt);
  } catch (err) {
    console.warn('Clipboard write failed:', err);
  }
  // Deep link oficial de ChatGPT con query pre-cargado
  const url = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Copia el prompt al portapapeles y abre Claude en una nueva pestaña.
 */
export function launchClaude(prompt: string): void {
  try {
    navigator.clipboard.writeText(prompt);
  } catch (err) {
    console.warn('Clipboard write failed:', err);
  }
  window.open('https://claude.ai/new', '_blank', 'noopener,noreferrer');
}

/**
 * Copia el prompt al portapapeles y abre Gemini en una nueva pestaña.
 */
export function launchGemini(prompt: string): void {
  try {
    navigator.clipboard.writeText(prompt);
  } catch (err) {
    console.warn('Clipboard write failed:', err);
  }
  window.open('https://gemini.google.com/app', '_blank', 'noopener,noreferrer');
}
