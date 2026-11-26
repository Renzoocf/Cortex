export type IdeaStatus = 'En Foco' | 'Congelador' | 'Contenido' | 'Lanzado' | 'Descartado';

export type NicheType = 'SaaS & Micro-Apps' | 'Contenido & TikTok' | 'Automatización & IA';

export type MainView = 'overview' | 'focus' | 'freezer' | 'content' | 'launched' | 'discarded';

export type EvidenceLevel = 'intuicion' | 'conversado' | 'con_demanda';

export interface StepItem {
  text: string;
  done: boolean;
}

export interface Idea {
  id: string;
  title: string;
  status: IdeaStatus;
  niche: NicheType;
  score: number;
  source: string;
  summary: string;
  problem: string;
  architecture: string;
  verdict: string;
  stack: string[];
  steps: StepItem[];
  created: string;
  repo_url?: string;
  live_url?: string;
  local_path?: string;
  workspace_urls?: string[];
  chat_url?: string;
  focus_started_at?: string;
  last_progress_at?: string;
  captured_url?: string;
  mention_count?: number;
  mention_notes?: string[];
  evidence_level?: EvidenceLevel;
  evidence_note?: string;
  closing_note?: string;
  launched_at?: string;
  last_touched_at?: string;
}

export interface ChartColumnItem {
  label: string;
  fullLabel: string;
  approved: number;
  discarded: number;
  cols: [number, number][]; // 3 sub-columns, each with [approvedCount, discardedCount]
}

export interface ChartDataset {
  totalLabel: string;
  periodSuffix: string;
  defaultIndex: number;
  items: ChartColumnItem[];
}

export interface ToastMessage {
  id: string;
  message: string;
  variant?: 'dark' | 'emerald' | 'rose';
}

export interface UserProfile {
  id?: string;
  email: string;
  full_name: string;
  role?: string;
}
