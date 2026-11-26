import React, { Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { KpiCards } from './components/KpiCards';
import { PixelMatrix } from './components/PixelMatrix';
import { FocusProjects } from './components/FocusProjects';
import { IdeasLibrary } from './components/IdeasLibrary';
import { ToastStack } from './components/ToastStack';
import { LoginView } from './components/LoginView';
import {
  DEFAULT_CRITERIA,
  STORAGE_IDEAS_KEY,
  STORAGE_CRITERIA_KEY,
} from './data/mockData';
import { EvidenceLevel, Idea, MainView, NicheType, ToastMessage, IdeaStatus, UserProfile } from './types';
import { generateAgentMasterPrompt } from './utils/promptBuilder';
import { findDuplicateIdea, isColdFreezerIdea } from './utils/ideaFunnel';
import { API_BASE_URL } from './config/api';

// Modales cargados bajo demanda para acelerar el arranque del Dashboard
const DossierModal = React.lazy(() =>
  import('./components/DossierModal').then((m) => ({ default: m.DossierModal }))
);
const SwapFocusModal = React.lazy(() =>
  import('./components/SwapFocusModal').then((m) => ({ default: m.SwapFocusModal }))
);
const SimulatorModal = React.lazy(() =>
  import('./components/SimulatorModal').then((m) => ({ default: m.SimulatorModal }))
);
const CriteriaModal = React.lazy(() =>
  import('./components/CriteriaModal').then((m) => ({ default: m.CriteriaModal }))
);
const WeeklyDigestModal = React.lazy(() =>
  import('./components/WeeklyDigestModal').then((m) => ({ default: m.WeeklyDigestModal }))
);

export default function App() {
  // Usuario autenticado en Supabase
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const raw = localStorage.getItem('cortexfiltro_user');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      email: 'renzo@cortexfiltro.com',
      full_name: 'Renzo',
      role: 'Creador',
    };
  });

  // Estado de autenticación (inicia en Login por defecto)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cortexfiltro_auth') === 'true';
  });

  // Estado de ideas 100% reales desde Supabase y localStorage (cero datos sintéticos)
  const [ideas, setIdeas] = useState<Idea[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_IDEAS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: Idea) => ({
            ...item,
            evidence_level: item.evidence_level || 'intuicion',
            mention_count: item.mention_count || 1,
          }));
        }
      }
    } catch (err) {
      console.warn('Error leyendo localStorage:', err);
    }
    return [];
  });

  // Criterios persistidos
  const [criteriaText, setCriteriaText] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_CRITERIA_KEY) || DEFAULT_CRITERIA;
    } catch {
      return DEFAULT_CRITERIA;
    }
  });

  // Vistas y Filtros
  const [activeView, setActiveView] = useState<MainView>('overview');
  const [activeNiche, setActiveNiche] = useState<string>('ALL');
  const [libraryPillFilter, setLibraryPillFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Extras para la gráfica (simulaciones añadidas)
  const [extraApproved, setExtraApproved] = useState<number>(0);
  const [extraDiscarded, setExtraDiscarded] = useState<number>(0);

  // Modales
  const [activeDossierId, setActiveDossierId] = useState<string | null>(null);
  const [pendingFocusIdeaId, setPendingFocusIdeaId] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isCriteriaOpen, setIsCriteriaOpen] = useState<boolean>(false);
  const [isDigestOpen, setIsDigestOpen] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Guardar en localStorage con debounce ligero (250ms) para no bloquear el hilo principal en clics rápidos
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_IDEAS_KEY, JSON.stringify(ideas));
      } catch (err) {
        console.warn('Error guardando en localStorage:', err);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [ideas]);

  // Sincronizar ideas en tiempo real desde Supabase vía Backend FastAPI
  useEffect(() => {
    let isMounted = true;
    const fetchSupabaseIdeas = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/ideas`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0 && isMounted) {
          setIdeas(json.data);
        }
      } catch {
        // Backend apagado, mantiene ideas locales sin romper la UI
      }
    };

    fetchSupabaseIdeas();
    // Re-consultar cada 6 segundos para mostrar de inmediato cualquier idea que mandes por Telegram
    const interval = setInterval(fetchSupabaseIdeas, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Bloquear scroll del dashboard trasero y soportar tecla Escape cuando hay un modal abierto
  const hasOpenModal = Boolean(
    activeDossierId || pendingFocusIdeaId || isSimulatorOpen || isCriteriaOpen || isDigestOpen
  );

  useEffect(() => {
    if (!hasOpenModal) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeDossierId) setActiveDossierId(null);
        else if (pendingFocusIdeaId) setPendingFocusIdeaId(null);
        else if (isSimulatorOpen) setIsSimulatorOpen(false);
        else if (isCriteriaOpen) setIsCriteriaOpen(false);
        else if (isDigestOpen) setIsDigestOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasOpenModal, activeDossierId, pendingFocusIdeaId, isSimulatorOpen, isCriteriaOpen, isDigestOpen]);

  const showToast = useCallback((message: string, variant: 'dark' | 'emerald' | 'rose' = 'dark') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  // Guardar criterios
  const handleSaveCriteria = useCallback((val: string) => {
    setCriteriaText(val);
    try {
      localStorage.setItem(STORAGE_CRITERIA_KEY, val);
      showToast('Criterios del Filtro IA actualizados');
    } catch {
      // ignore
    }
  }, [showToast]);

  const deferredSearch = useDeferredValue(searchQuery);

  // Manejador común de búsqueda y nicho
  const matchesSearchAndNiche = useCallback((idea: Idea) => {
    if (activeNiche !== 'ALL' && idea.niche !== activeNiche) return false;

    const trimmed = deferredSearch.trim();
    if (trimmed) {
      const q = trimmed.toLowerCase();
      const haystack = [
        idea.title,
        idea.summary,
        idea.niche,
        idea.source,
        idea.verdict,
        ...(idea.stack || []),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }, [activeNiche, deferredSearch]);

  // Contadores y promedio memoizados para el Sidebar y KPI Cards
  const counts = useMemo(() => ({
    focus: ideas.filter((i) => i.status === 'En Foco').length,
    freezer: ideas.filter((i) => i.status === 'Congelador').length,
    content: ideas.filter((i) => i.status === 'Contenido').length,
    launched: ideas.filter((i) => i.status === 'Lanzado').length,
    discarded: ideas.filter((i) => i.status === 'Descartado').length,
  }), [ideas]);

  const avgScore = useMemo(() => {
    const activeNonDiscarded = ideas.filter((i) => i.status !== 'Descartado');
    return activeNonDiscarded.length > 0
      ? Number(
          (
            activeNonDiscarded.reduce((acc, item) => acc + item.score, 0) /
            activeNonDiscarded.length
          ).toFixed(1)
        )
      : 0.0;
  }, [ideas]);

  const recentWeekCount = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    return ideas.filter((i) => {
      if (!i.created) return false;
      return new Date(i.created).getTime() >= oneWeekAgo;
    }).length;
  }, [ideas]);

  // Sincronización transparente de actualizaciones hacia Supabase
  const patchIdeaBackend = useCallback((id: string, updates: Record<string, any>) => {
    fetch(`${API_BASE_URL}/api/ideas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {});
  }, []);

  // Confirmar intercambio de slot
  const handleSwapOut = useCallback((outId: string) => {
    if (!pendingFocusIdeaId) return;
    const outIdea = ideas.find((i) => i.id === outId);
    const inIdea = ideas.find((i) => i.id === pendingFocusIdeaId);

    if (outIdea && inIdea) {
      const nowIso = new Date().toISOString();
      setIdeas((prev) =>
        prev.map((i) => {
          if (i.id === outId) {
            return { ...i, status: 'Congelador' as IdeaStatus, focus_started_at: undefined };
          }
          if (i.id === pendingFocusIdeaId) {
            return { ...i, status: 'En Foco' as IdeaStatus, focus_started_at: nowIso };
          }
          return i;
        })
      );
      setPendingFocusIdeaId(null);
      showToast(`"${inIdea.title}" ahora está En Foco (reloj 48h iniciado)`);
    }
  }, [pendingFocusIdeaId, ideas, showToast]);
  const handlePromoteToFocus = useCallback((ideaId: string) => {
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea || idea.status === 'En Foco') return;

    const currentFocus = ideas.filter((i) => i.status === 'En Foco');
    if (currentFocus.length < 2) {
      const nowIso = new Date().toISOString();
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === ideaId ? { ...i, status: 'En Foco' as IdeaStatus, focus_started_at: nowIso } : i
        )
      );
      showToast(`"${idea.title}" pasó a En Foco (reloj de 48h iniciado)`);
      return;
    }

    // Ya hay 2 en foco: abrir modal de intercambio
    setPendingFocusIdeaId(ideaId);
  }, [ideas, showToast]);

  // Mover a congelador
  const handleMoveToFreezer = useCallback((id: string) => {
    patchIdeaBackend(id, { status: 'congelador' });
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: 'Congelador' as IdeaStatus, focus_started_at: undefined } : i
      )
    );
    showToast('Ficha movida al Congelador Técnico');
  }, [patchIdeaBackend, showToast]);

  // Descartar idea
  const handleDiscardIdea = useCallback((id: string) => {
    patchIdeaBackend(id, { status: 'descartado' });
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: 'Descartado' as IdeaStatus, focus_started_at: undefined } : i
      )
    );
    showToast('Ficha enviada a Descartados', 'rose');
  }, [patchIdeaBackend, showToast]);

  // Restaurar desde descartados / reabrir lanzados
  const handleRestoreFreezer = useCallback((id: string) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    patchIdeaBackend(id, { status: 'congelador' });
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: 'Congelador' as IdeaStatus, last_touched_at: todayIso } : i
      )
    );
    showToast('Ficha movida al Congelador', 'emerald');
  }, [patchIdeaBackend, showToast]);

  // Cerrar ciclo como Lanzado / Validado
  const handleMarkLaunched = useCallback((id: string) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    patchIdeaBackend(id, { status: 'lanzado' });
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status: 'Lanzado' as IdeaStatus,
              focus_started_at: undefined,
              launched_at: todayIso,
              last_touched_at: todayIso,
            }
          : i
      )
    );
    setActiveDossierId(id);
    showToast('🚀 Proyecto marcado como Lanzado. Anota 1 línea de aprendizaje.', 'emerald');
  }, [patchIdeaBackend, showToast]);

  // Actualizar Nivel de Evidencia en la calle
  const handleUpdateEvidence = useCallback((id: string, level: EvidenceLevel, note: string) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    patchIdeaBackend(id, { evidence_level: level, evidence_note: note });
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              evidence_level: level,
              evidence_note: note,
              last_touched_at: todayIso,
            }
          : i
      )
    );
    showToast('Nivel de evidencia actualizado', 'emerald');
  }, [patchIdeaBackend, showToast]);

  // Guardar aprendizaje de cierre de ciclo
  const handleUpdateClosingNote = useCallback((id: string, closingNote: string) => {
    patchIdeaBackend(id, { closing_note: closingNote });
    setIdeas((prev) =>
      prev.map((i) => (i.id === id ? { ...i, closing_note: closingNote } : i))
    );
    showToast('Aprendizaje de cierre guardado', 'emerald');
  }, [patchIdeaBackend, showToast]);

  // Purga automática del Congelador (Anti-cementerio: frías +30 días)
  const handlePurgeColdIdeas = useCallback(() => {
    let purgedCount = 0;
    setIdeas((prev) => {
      const coldIds = new Set(prev.filter((i) => isColdFreezerIdea(i)).map((i) => i.id));
      purgedCount = coldIds.size;
      if (coldIds.size === 0) return prev;
      return prev.map((i) =>
        coldIds.has(i.id)
          ? { ...i, status: 'Descartado' as IdeaStatus, focus_started_at: undefined }
          : i
      );
    });
    if (purgedCount > 0) {
      showToast(`Purga aplicada: ${purgedCount} ficha(s) frías movidas a Descartados`, 'rose');
    }
  }, [showToast]);

  // Avivar ficha fría en Congelador
  const handleReviveIdea = useCallback((id: string) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    setIdeas((prev) =>
      prev.map((i) => (i.id === id ? { ...i, last_touched_at: todayIso } : i))
    );
    showToast('♻️ Ficha avivada en el Congelador', 'emerald');
  }, [showToast]);

  // Reiniciar ventana de validación de 48h
  const handleResetFocusTimer = useCallback((id: string) => {
    const nowIso = new Date().toISOString();
    setIdeas((prev) =>
      prev.map((i) => (i.id === id ? { ...i, focus_started_at: nowIso } : i))
    );
    showToast('Reloj de 48h reiniciado', 'emerald');
  }, [showToast]);

  // Copiar System Prompt Maestro para Antigravity / Cursor / Claude
  const handleCopyMasterPrompt = (idea: Idea) => {
    copyToClipboard(
      generateAgentMasterPrompt(idea),
      'Prompt Maestro copiado (listo para Antigravity / Cursor / Claude)'
    );
  };

  // Manejador de cambio de estado en el Dossier
  const handleDossierStatusChange = (newStatus: IdeaStatus) => {
    if (!activeDossierId) return;
    if (newStatus === 'En Foco') {
      const idToPromote = activeDossierId;
      setActiveDossierId(null);
      handlePromoteToFocus(idToPromote);
    } else {
      const todayIso = new Date().toISOString().slice(0, 10);
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === activeDossierId
            ? {
                ...i,
                status: newStatus,
                focus_started_at: undefined,
                launched_at: newStatus === 'Lanzado' ? i.launched_at || todayIso : i.launched_at,
                last_touched_at: todayIso,
              }
            : i
        )
      );
      showToast(
        newStatus === 'Lanzado'
          ? '🚀 Proyecto marcado como Lanzado. Añade tu aprendizaje de 1 línea.'
          : `Estado actualizado a ${newStatus}`,
        newStatus === 'Lanzado' ? 'emerald' : 'dark'
      );
    }
  };

  // Actualizar enlaces de Repo, Live URL, ruta local, workspace URLs y link de chat IA
  const handleUpdateLinks = (
    id: string,
    repoUrl: string,
    liveUrl: string,
    localPath?: string,
    workspaceUrls?: string[],
    chatUrl?: string
  ) => {
    patchIdeaBackend(id, {
      repo_url: repoUrl,
      live_url: liveUrl,
      local_path: localPath,
      chat_url: chatUrl,
    });
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              repo_url: repoUrl,
              live_url: liveUrl,
              local_path: localPath !== undefined ? localPath : i.local_path,
              workspace_urls: workspaceUrls !== undefined ? workspaceUrls : i.workspace_urls,
              chat_url: chatUrl !== undefined ? chatUrl : i.chat_url,
            }
          : i
      )
    );
    showToast('Entorno de trabajo, enlaces y chat IA guardados en Supabase', 'emerald');
  };

  // Abrir espacio de trabajo exclusivamente en Antigravity (sin abrir redes en masa)
  const handleLaunchWorkspace = useCallback(async (idea: Idea) => {
    if (!idea.local_path || !idea.local_path.trim()) {
      showToast('Configura la ruta de la carpeta local en la Ficha Técnica para abrirla', 'rose');
      return;
    }

    const cleanPath = idea.local_path.trim().replace(/^["']|["']$/g, '');
    try {
      const resp = await fetch(`${API_BASE_URL}/api/launcher/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          local_path: cleanPath,
          editor: 'antigravity',
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        showToast(`⚡ ${data.message || 'Antigravity abierto en ' + cleanPath}`, 'emerald');
      } else {
        const normalizedUri = cleanPath.replace(/\\/g, '/');
        window.location.href = `antigravity-ide://file/${encodeURI(normalizedUri)}`;
        showToast(`Abriendo espacio de trabajo: ${cleanPath}`, 'dark');
      }
    } catch {
      try {
        const normalizedUri = cleanPath.replace(/\\/g, '/');
        window.location.href = `antigravity-ide://file/${encodeURI(normalizedUri)}`;
        showToast(`Abriendo en Antigravity IDE (${cleanPath})`, 'dark');
      } catch {
        showToast('Inicia el backend en puerto 8000 para abrir Antigravity automáticamente', 'rose');
      }
    }
  }, [showToast]);

  // Toggle de pasos del checklist en el Dossier
  const handleToggleStep = (stepIdx: number) => {
    if (!activeDossierId) return;
    const nowIso = new Date().toISOString();
    setIdeas((prev) =>
      prev.map((i) => {
        if (i.id === activeDossierId) {
          const newSteps = [...i.steps];
          if (newSteps[stepIdx]) {
            newSteps[stepIdx] = { ...newSteps[stepIdx], done: !newSteps[stepIdx].done };
          }
          patchIdeaBackend(activeDossierId, { steps: newSteps });
          return { ...i, steps: newSteps, last_progress_at: nowIso };
        }
        return i;
      })
    );
  };

  // Generar Markdown para Obsidian
  const generateMarkdownForIdea = (idea: Idea) => {
    const slugTags = [
      'cortexfiltro',
      idea.niche.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      ...(idea.stack || []).map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    ];

    return [
      '---',
      `title: "${idea.title.replace(/"/g, '\\"')}"`,
      `status: "${idea.status}"`,
      `niche: "${idea.niche}"`,
      `score: ${idea.score.toFixed(1)}`,
      `source: "${idea.source}"`,
      `tags: [${slugTags.join(', ')}]`,
      `created: ${idea.created || '2026-11-23'}`,
      '---',
      '',
      `# ${idea.title}`,
      '',
      `> **Veredicto Crítico IA (${idea.score.toFixed(1)}/10):** ${idea.verdict}`,
      '',
      `## Resumen Ejecutivo`,
      `${idea.summary}`,
      '',
      `## Problema & Validación de Mercado`,
      `${idea.problem}`,
      '',
      `## Arquitectura Técnica & Stack`,
      `- **Stack:** ${(idea.stack || []).map((s) => `\`${s}\``).join(', ')}`,
      `- **Diseño técnico:** ${idea.architecture}`,
      '',
      `## Plan de Acción (Primeros Pasos)`,
      ...(idea.steps || []).map((s) => `- [${s.done ? 'x' : ' '}] ${s.text}`),
    ].join('\n');
  };

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    showToast(msg, 'emerald');
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Exportar Bóveda completa
  const handleExportVault = () => {
    const exportable = ideas.filter((i) => i.status !== 'Descartado');
    const combined = [
      `# CortexFiltro — Exportación de Bóveda (${new Date().toLocaleDateString('es-PE')})`,
      `> Total de fichas activas: ${exportable.length}`,
      '',
      ...exportable.map((item) => generateMarkdownForIdea(item) + '\n\n---\n'),
    ].join('\n');

    downloadFile(
      `cortexfiltro-boveda-${new Date().toISOString().slice(0, 10)}.md`,
      combined
    );
    showToast(`Bóveda exportada (${exportable.length} fichas en .md)`, 'emerald');
  };

  // Procesar entrada simulada (Link TikTok/X, Nota de Voz, Captura Queja OCR)
  const handleSimulateSubmit = async (
    rawText: string,
    source: string,
    niche: NicheType,
    capturedUrl?: string
  ) => {
    // Evaluación en vivo con Gemini 3.5 Flash y guardado real en Supabase
    try {
      showToast('Enviando a Gemini 3.5 Flash y Supabase...', 'dark');
      const resp = await fetch(`${API_BASE_URL}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: rawText,
          niche_hint: niche,
        }),
      });

      if (resp.ok) {
        const resJson = await resp.json();
        // Traer la lista actualizada real desde Supabase
        const freshRes = await fetch(`${API_BASE_URL}/api/ideas`);
        if (freshRes.ok) {
          const freshJson = await freshRes.json();
          if (freshJson.success && Array.isArray(freshJson.data)) {
            setIdeas(freshJson.data);
            showToast(
              resJson.deduplicated
                ? `🔥 Señal de obsesión detectada: idea fusionada en Supabase`
                : `Idea evaluada con Gemini 3.5 Flash y guardada en Supabase`,
              'emerald'
            );
            return;
          }
        }
      } else {
        const errData = await resp.json().catch(() => ({}));
        showToast(`Error al evaluar: ${errData.detail || 'Fallo en el servidor'}`, 'rose');
        return;
      }
    } catch {
      showToast(`No se pudo conectar con el backend (${API_BASE_URL}). Verifica tu conexión.`, 'rose');
      return;
    }
  };

  // Recargar datos reales desde Supabase
  const handleResetDemo = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ideas`);
      if (res.ok) {
        const json = await res.json();
        setIdeas(json.data || []);
      }
    } catch {
      setIdeas([]);
    }
    setActiveView('overview');
    setActiveNiche('ALL');
    setLibraryPillFilter('ALL');
    setSearchQuery('');
    showToast('Datos sincronizados desde Supabase en tiempo real');
  };

  // Listas memoizadas para evitar re-cálculos y mantener estables los props de hijos memoizados
  const focusedIdeas = useMemo(
    () => ideas.filter((i) => i.status === 'En Foco' && matchesSearchAndNiche(i)),
    [ideas, matchesSearchAndNiche]
  );

  const libraryIdeas = useMemo(() => {
    let list = ideas.filter(matchesSearchAndNiche);
    if (activeView === 'freezer') {
      list = list.filter((i) => i.status === 'Congelador');
    } else if (activeView === 'content') {
      list = list.filter((i) => i.status === 'Contenido');
    } else if (activeView === 'launched') {
      list = list.filter((i) => i.status === 'Lanzado');
    } else if (activeView === 'discarded') {
      list = list.filter((i) => i.status === 'Descartado');
    } else {
      // Vista General
      list = list.filter((i) => i.status === 'Congelador' || i.status === 'Contenido');
      if (libraryPillFilter === 'Congelador') {
        list = list.filter((i) => i.status === 'Congelador');
      } else if (libraryPillFilter === 'Contenido') {
        list = list.filter((i) => i.status === 'Contenido');
      } else if (libraryPillFilter === 'EVIDENCE') {
        list = list.filter(
          (i) => i.evidence_level === 'conversado' || i.evidence_level === 'con_demanda'
        );
      } else if (libraryPillFilter === 'GEMS') {
        list = list.filter((i) => i.score >= 8.5);
      }
    }
    return [...list].sort((a, b) => b.score - a.score);
  }, [ideas, matchesSearchAndNiche, activeView, libraryPillFilter]);

  const activeDossierIdea = useMemo(
    () => ideas.find((i) => i.id === activeDossierId) || null,
    [ideas, activeDossierId]
  );
  const currentFocusList = useMemo(
    () => ideas.filter((i) => i.status === 'En Foco'),
    [ideas]
  );

  const handleOpenDossier = useCallback((id: string) => setActiveDossierId(id), []);
  const handleClearMockData = useCallback(async () => {
    if (window.confirm('¿Deseas vaciar tu base de datos y empezar tu tablero 100% en limpio desde cero?')) {
      try {
        await fetch(`${API_BASE_URL}/api/ideas`, { method: 'DELETE' });
      } catch {}
      localStorage.removeItem(STORAGE_IDEAS_KEY);
      setIdeas([]);
      showToast('Bóveda 100% vaciada y limpia en Supabase.', 'emerald');
    }
  }, [showToast]);

  const handleOpenCriteria = useCallback(() => setIsCriteriaOpen(true), []);
  const handleOpenDigest = useCallback(() => setIsDigestOpen(true), []);
  const handleOpenSimulator = useCallback(() => setIsSimulatorOpen(true), []);
  const handleCloseMobile = useCallback(() => setIsMobileMenuOpen(false), []);
  const handleToggleMobile = useCallback(() => setIsMobileMenuOpen((prev) => !prev), []);
  const handleClearAllFilters = useCallback(() => {
    setActiveNiche('ALL');
    setLibraryPillFilter('ALL');
    setSearchQuery('');
  }, []);
  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('cortexfiltro_auth');
    setIsAuthenticated(false);
  }, []);

  // Si no está autenticado, muestra la pantalla de Login / Registro conectada a Supabase Auth
  if (!isAuthenticated) {
    return (
      <LoginView
        onAuthSuccess={(user) => {
          if (user) setCurrentUser(user);
          sessionStorage.setItem('cortexfiltro_auth', 'true');
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-inkPrimary selection:bg-inkPrimary selection:text-white">
      {/* 1. Left Sidebar */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        activeNiche={activeNiche}
        onSelectNiche={setActiveNiche}
        onOpenCriteria={handleOpenCriteria}
        onExportVault={handleExportVault}
        onOpenDigest={handleOpenDigest}
        onClearMockData={handleClearMockData}
        currentUser={currentUser}
        counts={counts}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={handleCloseMobile}
        onLogout={handleLogout}
      />

      {/* 2. Columna Derecha */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <Topbar
          activeView={activeView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenSimulator={handleOpenSimulator}
          onToggleMobileMenu={handleToggleMobile}
          onLogout={handleLogout}
        />

        {/* Main Content (Aprovecha todo el ancho de la pantalla) */}
        <main className="w-full flex-1 px-5 py-6 sm:px-8 xl:px-10 2xl:px-12">
          {/* Buscador móvil */}
          <div className="relative mb-5 sm:hidden">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkFaint"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar idea, nicho o stack..."
              className="h-10 w-full rounded-xl border border-borderHairline bg-searchBg pl-9 pr-4 text-sm text-inkPrimary placeholder-inkFaint focus:border-inkPrimary focus:bg-white focus:outline-none"
            />
          </div>

          {/* Greeting Header */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-inkPrimary">
                Bienvenido de nuevo, {currentUser.full_name}
              </h1>
              <p className="mt-1 text-[13.5px] text-inkMuted">
                Tu embudo inteligente de ideas capturadas desde Telegram, TikTok y chats técnicos.
              </p>
            </div>

            {/* Píldora de nicho activo */}
            {activeNiche !== 'ALL' && (
              <div className="inline-flex items-center gap-2 rounded-full border border-borderHairline bg-cardSubtle px-3 py-1 text-xs font-medium text-inkBody">
                <span>
                  Nicho filtrado: <strong className="text-inkPrimary">{activeNiche}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveNiche('ALL')}
                  className="text-inkFaint hover:text-inkPrimary"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* ROW 1: 3 KPI METRIC CARDS */}
          <KpiCards
            focusCount={counts.focus}
            freezerCount={counts.freezer}
            avgScore={avgScore}
            recentCount={recentWeekCount}
          />

          {/* ROW 2: SIGNATURE PIXEL MATRIX STACKED BAR CHART (100% DATOS REALES) */}
          <PixelMatrix ideas={ideas} />

          {/* ROW 3: EN FOCO ACTIVO — MÁXIMO 2 PROYECTOS */}
          {(activeView === 'overview' || activeView === 'focus') && (
            <FocusProjects
              ideas={focusedIdeas}
              onOpenDossier={handleOpenDossier}
              onMoveToFreezer={handleMoveToFreezer}
              onLaunchWorkspace={handleLaunchWorkspace}
              onResetFocusTimer={handleResetFocusTimer}
              onCopyMasterPrompt={handleCopyMasterPrompt}
              onMarkLaunched={handleMarkLaunched}
            />
          )}

          {/* ROW 4: IDEAS GRID (CONGELADOR & CONTENIDO) */}
          <IdeasLibrary
            ideas={libraryIdeas}
            activeView={activeView}
            libraryPillFilter={libraryPillFilter}
            onSelectPillFilter={setLibraryPillFilter}
            onOpenDossier={handleOpenDossier}
            onPromoteFocus={handlePromoteToFocus}
            onDiscardIdea={handleDiscardIdea}
            onRestoreFreezer={handleRestoreFreezer}
            onLaunchWorkspace={handleLaunchWorkspace}
            onPurgeColdIdeas={handlePurgeColdIdeas}
            onReviveIdea={handleReviveIdea}
            onClearAllFilters={handleClearAllFilters}
          />

          {/* Footer limpio */}
          <footer className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-borderHairline pt-5 text-xs text-inkMuted sm:flex-row">
            <span>CortexFiltro Studio • Conectado a Telegram Bot + Gemini API + Obsidian Markdown</span>
            <button
              type="button"
              onClick={handleResetDemo}
              className="font-medium text-inkMuted underline decoration-gray-300 underline-offset-4 transition hover:text-inkPrimary"
            >
              Resetear Demo
            </button>
          </footer>
        </main>
      </div>

      {/* Modales cargados bajo demanda */}
      <Suspense fallback={null}>
        {/* 1. Modal Dossier Técnico */}
        {activeDossierIdea && (
          <DossierModal
            idea={activeDossierIdea}
            onClose={() => setActiveDossierId(null)}
            onToggleStep={handleToggleStep}
            onStatusChange={handleDossierStatusChange}
            onUpdateLinks={handleUpdateLinks}
            onLaunchWorkspace={handleLaunchWorkspace}
            onResetFocusTimer={handleResetFocusTimer}
            onUpdateEvidence={handleUpdateEvidence}
            onUpdateClosingNote={handleUpdateClosingNote}
            onCopyMasterPrompt={() => {
              if (activeDossierIdea) {
                handleCopyMasterPrompt(activeDossierIdea);
              }
            }}
            onCopyMarkdown={() => {
              if (activeDossierIdea) {
                copyToClipboard(
                  generateMarkdownForIdea(activeDossierIdea),
                  'Ficha Markdown copiada (lista para Obsidian)'
                );
              }
            }}
            onDownloadMarkdown={() => {
              if (activeDossierIdea) {
                const slug = activeDossierIdea.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, '');
                downloadFile(`${slug || 'cortexfiltro-ficha'}.md`, generateMarkdownForIdea(activeDossierIdea));
                showToast(`Descargado ${slug}.md`, 'emerald');
              }
            }}
          />
        )}

        {/* 2. Modal Anti-Saturación (Swap) */}
        {Boolean(pendingFocusIdeaId) && (
          <SwapFocusModal
            isOpen={Boolean(pendingFocusIdeaId)}
            onClose={() => setPendingFocusIdeaId(null)}
            currentFocus={currentFocusList}
            onSwapOut={handleSwapOut}
          />
        )}

        {/* 3. Modal Simulador Telegram / Gemini */}
        {isSimulatorOpen && (
          <SimulatorModal
            isOpen={isSimulatorOpen}
            onClose={() => setIsSimulatorOpen(false)}
            onSubmit={handleSimulateSubmit}
          />
        )}

        {/* 4. Modal Criterios Filtro IA */}
        {isCriteriaOpen && (
          <CriteriaModal
            isOpen={isCriteriaOpen}
            onClose={() => setIsCriteriaOpen(false)}
            criteriaText={criteriaText}
            onSaveCriteria={handleSaveCriteria}
          />
        )}

        {/* 5. Modal Resumen de Domingo (Telegram) */}
        {isDigestOpen && (
          <WeeklyDigestModal
            isOpen={isDigestOpen}
            onClose={() => setIsDigestOpen(false)}
            ideas={ideas}
            onCopyDigest={(text) => copyToClipboard(text, 'Resumen de Domingo copiado')}
            onToast={showToast}
          />
        )}
      </Suspense>

      {/* Toast Notifications */}
      <ToastStack toasts={toasts} />
    </div>
  );
}
