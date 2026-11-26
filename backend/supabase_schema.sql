-- ====================================================================
-- CORTEXFILTRO: ESQUEMA DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- ====================================================================

-- 1. Crear extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Eliminar tabla si ya existe para re-instalación limpia
DROP TABLE IF EXISTS ideas CASCADE;

-- 3. Tabla Principal: IDEAS & DOSSIERS
CREATE TABLE ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Vinculado al usuario autenticado en Supabase
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Metadatos de Captura
    raw_input TEXT NOT NULL,
    input_type VARCHAR(50) NOT NULL DEFAULT 'text', -- 'text', 'voice', 'image', 'link', 'manual'
    telegram_message_id BIGINT,
    
    -- Diagnóstico y Clasificación
    title VARCHAR(255) NOT NULL,
    niche VARCHAR(100) NOT NULL, -- 'SaaS & Micro-Apps', 'Contenido & TikTok', 'Automatización & IA'
    status VARCHAR(50) NOT NULL DEFAULT 'congelador', -- 'en_foco', 'congelador', 'contenido', 'descartado'
    focus_slot SMALLINT CHECK (focus_slot IN (1, 2) OR focus_slot IS NULL),
    
    -- Evaluación Cuantitativa del Filtro IA
    score NUMERIC(3, 1) NOT NULL CHECK (score >= 1.0 AND score <= 10.0),
    scores_breakdown JSONB NOT NULL DEFAULT '{
        "pain_urgency": 0.0,
        "direct_monetization": 0.0,
        "mvp_speed_weekend": 0.0,
        "content_potential": 0.0
    }'::jsonb,
    
    -- Ficha Técnica (Dossier)
    verdict TEXT NOT NULL,
    problem TEXT NOT NULL,
    tech_stack TEXT[] NOT NULL DEFAULT '{}',
    mvp_checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Enlaces Rápidos (GitHub, n8n, Webhook, Demo), Obsesión, Evidencia y Cierre
    repo_url VARCHAR(500),
    live_url VARCHAR(500),
    chat_url VARCHAR(500),
    focus_started_at TIMESTAMPTZ,
    last_progress_at TIMESTAMPTZ,
    mention_count INTEGER NOT NULL DEFAULT 1,
    mention_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_level VARCHAR(30) NOT NULL DEFAULT 'intuicion',
    evidence_note TEXT,
    closing_note TEXT,
    launched_at TIMESTAMPTZ
);

-- 4. Índices para optimizar el Dashboard (Consultas en 1ms)
CREATE INDEX idx_ideas_status ON ideas (status);
CREATE INDEX idx_ideas_focus_slot ON ideas (focus_slot) WHERE status = 'en_foco';
CREATE INDEX idx_ideas_created_at ON ideas (created_at DESC);
CREATE INDEX idx_ideas_score ON ideas (score DESC);

-- 5. Regla de Negocio en Base de Datos: Máximo 2 slots únicos en 'en_foco'
CREATE UNIQUE INDEX idx_unique_focus_slot ON ideas (focus_slot) 
WHERE status = 'en_foco' AND focus_slot IS NOT NULL;

-- 6. Trigger para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ideas_updated_at
    BEFORE UPDATE ON ideas
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 7. Vista para Métricas Rápidas (KPIs del Dashboard)
CREATE OR REPLACE VIEW dashboard_kpis AS
SELECT
    COUNT(*) FILTER (WHERE status = 'en_foco') AS en_foco_count,
    COUNT(*) FILTER (WHERE status = 'congelador') AS congelador_count,
    COUNT(*) FILTER (WHERE status = 'contenido') AS contenido_count,
    COUNT(*) FILTER (WHERE status = 'lanzado') AS lanzados_count,
    COUNT(*) FILTER (WHERE status = 'descartado') AS descartados_count,
    ROUND(AVG(score)::numeric, 1) AS score_promedio,
    COUNT(*) AS total_procesadas
FROM ideas;

-- 8. Comentarios descriptivos
COMMENT ON TABLE ideas IS 'Embudo inteligente y dossiers de ideas evaluadas por Gemini para CortexFiltro';
COMMENT ON COLUMN ideas.focus_slot IS 'Slot 1 o 2 para la regla anti-saturación de máximo 2 proyectos activos';
