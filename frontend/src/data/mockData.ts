import { Idea, ChartDataset } from '../types';

export const STORAGE_IDEAS_KEY = 'cortexfiltro_studio_ideas_v1';
export const STORAGE_CRITERIA_KEY = 'cortexfiltro_studio_criteria_v1';

export const DEFAULT_CRITERIA = [
  '1. Dolor real y urgente: ¿Resuelve un problema operativo o económico concreto (B2B o utilidad clara)? Si es solo novedad viral, puntaje < 5.0.',
  '2. Monetización directa: Debe existir un cliente dispuesto a pagar suscripción ($9-$29/mes) o pago por uso desde los primeros 5 usuarios.',
  '3. Velocidad de MVP: Construible por un solo desarrollador en un fin de semana usando stack moderno sin infraestructura pesada.',
  '4. Doble uso: Ideal si además sirve para documentar el proceso en TikTok/Shorts o fortalecer el portafolio técnico.'
].join('\n');

export const INITIAL_IDEAS: Idea[] = [
  {
    id: 'cf-1',
    title: 'POS Offline para Bodegas con Facturación SUNAT',
    status: 'En Foco',
    niche: 'SaaS & Micro-Apps',
    score: 9.3,
    source: 'Chat IA',
    summary: 'Punto de venta web local-first para bodegas de barrio en Perú que cobra sin internet, controla fiados y emite boletas electrónicas SUNAT al reconectarse.',
    problem: 'Las bodegas y minimarkets sufren cortes de señal y rechazan sistemas POS tradicionales porque son lentos, dependen 100% de la nube y complican el cuaderno de fiados diario.',
    architecture: 'PWA Local-First con IndexedDB (Dexie.js) como almacenamiento primario en el dispositivo. Cola de sincronización automática hacia Supabase + cola de envío de comprobantes XML/OSE cuando vuelve la conexión.',
    verdict: 'Alta viabilidad comercial: dolor operativo diario en miles de bodegas, ticket accesible ($12/mes) y ventaja clara frente a sistemas pesados.',
    stack: ['PWA', 'IndexedDB', 'React', 'Supabase', 'API SUNAT'],
    steps: [
      { text: 'Construir caja rápida offline con catálogo local y registro de fiados en 2 toques.', done: true },
      { text: 'Validar interfaz de cobro en 2 bodegas reales del barrio durante hora punta.', done: true },
      { text: 'Conectar cola de sincronización y envío de comprobante por WhatsApp.', done: false }
    ],
    created: '2026-11-20',
    local_path: 'C:\\Users\\ASUS\\Desktop\\Agente',
    workspace_urls: ['https://www.tiktok.com/creator-center', 'https://studio.youtube.com'],
    chat_url: 'https://chatgpt.com/share/674-bodegas-pos-offline',
    focus_started_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    evidence_level: 'con_demanda',
    evidence_note: '2 bodegueros del barrio pidieron probar el registro de fiados.',
    mention_count: 2,
    mention_notes: ['Chat IA inicial sobre POS local-first', 'Seguimiento sobre boletas SUNAT offline']
  },
  {
    id: 'cf-2',
    title: 'Bot Telegram + Gemini Filtro de Ideas y Nichos',
    status: 'En Foco',
    niche: 'Automatización & IA',
    score: 9.0,
    source: 'Chat IA',
    summary: 'Embudo personal conectado a Telegram donde reenvías screenshots de TikTok, audios o chats técnicos y Gemini los evalúa con criterio crítico.',
    problem: 'Guardar decenas de TikToks y chats técnicos sin procesar genera ruido mental y parálisis por análisis, haciendo que buenas ideas se pierdan en el historial.',
    architecture: 'Webhook en FastAPI / Node.js que recibe texto, imágenes y notas de voz de Telegram, consulta Gemini Flash con Structured Outputs (JSON estricto) y sincroniza este dashboard.',
    verdict: 'Retorno inmediato en productividad: elimina el cementerio de chats y convierte inspiración suelta en fichas técnicas listas para ejecutar o grabar.',
    stack: ['Telegram Bot API', 'Gemini Flash', 'FastAPI', 'Markdown'],
    steps: [
      { text: 'Diseñar esquema JSON estricto con puntaje, nicho, stack y veredicto anti-humo.', done: true },
      { text: 'Conectar webhook de Telegram para recibir texto y screenshots desde el móvil.', done: false },
      { text: 'Automatizar exportación semanal en Markdown hacia carpeta local de Obsidian.', done: false }
    ],
    created: '2026-11-21',
    repo_url: 'https://github.com/renzo/cortexfiltro-engine',
    live_url: 'https://t.me/CortexFiltroBot',
    local_path: 'C:\\Users\\ASUS\\Desktop\\Agente\\backend',
    workspace_urls: ['https://web.telegram.org', 'https://aistudio.google.com'],
    chat_url: 'https://claude.ai/chat/cortexfiltro-gemini-bot',
    focus_started_at: new Date(Date.now() - 54 * 3600 * 1000).toISOString(),
    evidence_level: 'con_demanda',
    evidence_note: 'Uso diario propio para filtrar capturas de TikTok y chats técnicos.',
    mention_count: 3,
    mention_notes: ['Idea base bot Telegram', 'Filtro anti-humo JSON', 'Integración Obsidian + reloj 48h']
  },
  {
    id: 'cf-3',
    title: 'Scraper de Depas en Lima por Distrito con Alertas',
    status: 'Congelador',
    niche: 'Automatización & IA',
    score: 8.6,
    source: 'Telegram Bot',
    summary: 'Rastreador automatizado que detecta departamentos recién publicados por debajo del precio promedio por m² en Miraflores, Barranco y Surco.',
    problem: 'Las mejores oportunidades de alquiler o compra desaparecen en pocas horas y los portales inmobiliarios están llenos de anuncios duplicados o sobrevalorados.',
    architecture: 'Worker en Python con Playwright ejecutado cada 20 minutos, deduplicación por hash de descripción/fotos, cálculo de desviación de precio/m² y alerta instantánea a Telegram.',
    verdict: 'Muy rápido de construir y útil tanto para búsqueda personal como para ofrecer acceso VIP a agentes e inversionistas.',
    stack: ['Python', 'Playwright', 'SQLite', 'Telegram Bot'],
    steps: [
      { text: 'Armar scraper para 2 portales inmobiliarios filtrando 3 distritos objetivo.', done: false },
      { text: 'Calcular precio promedio por m² y detectar gangas con >15% de descuento.', done: false },
      { text: 'Enviar ficha limpia a Telegram con enlace directo y teléfono de contacto.', done: false }
    ],
    created: '2026-11-19',
    repo_url: 'https://github.com/renzo/scraper-inmobiliario-lima',
    live_url: 'https://n8n.cloud/workflow/depas-alertas',
    local_path: 'C:\\Users\\ASUS\\Desktop\\Agente',
    workspace_urls: ['https://n8n.cloud/workflow/depas-alertas', 'https://urbania.pe'],
    evidence_level: 'conversado',
    evidence_note: '2 amigos buscando depa en Barranco confirmaron el problema.',
    mention_count: 2
  },
  {
    id: 'cf-4',
    title: 'Serie Corta: "Programando con IA sin Romper Producción"',
    status: 'Contenido',
    niche: 'Contenido & TikTok',
    score: 8.8,
    source: 'Screenshot TikTok',
    summary: 'Formato de videos de 50 segundos mostrando casos reales de cómo auditar, estructurar y frenar alucinaciones de agentes IA al programar.',
    problem: 'La audiencia tech está saturada de videos que prometen "crear una app en 1 clic", pero busca ver criterio real de ingeniería y arquitectura.',
    architecture: 'Guion fijo en 3 bloques: (0-5s) El error clásico al aceptar código IA a ciegas; (5-35s) Flujo real con reglas y diffs; (35-50s) Resultado limpio funcionando.',
    verdict: 'Excelente activo de marca personal: atrae reclutadores, clientes freelance y audiencia técnica reutilizando tu trabajo diario.',
    stack: ['Reels / TikTok', 'OBS Studio', 'CapCut', 'Build in Public'],
    steps: [
      { text: 'Anotar 5 errores reales cometidos por agentes IA durante la semana.', done: true },
      { text: 'Grabar Episodio #1 con captura de pantalla limpia y subtítulos de alto contraste.', done: false },
      { text: 'Publicar en TikTok, Shorts y LinkedIn midiendo retención y guardados.', done: false }
    ],
    created: '2026-11-22',
    local_path: 'C:\\Users\\ASUS\\Desktop\\Agente',
    workspace_urls: ['https://www.tiktok.com/creator-center', 'https://studio.youtube.com']
  },
  {
    id: 'cf-5',
    title: 'Traductor OCR de Manga Inglés-Español en Batch',
    status: 'Congelador',
    niche: 'SaaS & Micro-Apps',
    score: 7.9,
    source: 'Chat IA',
    summary: 'Herramienta por lotes que detecta globos de diálogo en capítulos completos de manga/cómics, limpia el fondo y coloca la traducción natural.',
    problem: 'Los lectores de series sin traducción oficial usan traductores de pantalla lentos que tapan el dibujo y rompen el ritmo de lectura.',
    architecture: 'Pipeline en Python con EasyOCR / PaddleOCR para bounding boxes, OpenCV para inpainting del globo y Gemini Flash para traducción contextual por página.',
    verdict: 'Proyecto técnico muy entretenido y con comunidad fiel, aunque el ajuste visual de tipografía requiere tiempo. Bien estacionado en el congelador.',
    stack: ['Python', 'OpenCV', 'EasyOCR', 'Gemini Vision'],
    steps: [
      { text: 'Procesar una página de prueba y validar detección exacta de globos de texto.', done: true },
      { text: 'Automatizar limpieza de fondo e inserción de fuente centrada.', done: false },
      { text: 'Empaquetar script CLI para traducir carpetas completas de capítulos.', done: false }
    ],
    created: '2026-10-15',
    last_touched_at: '2026-10-15',
    evidence_level: 'intuicion',
    mention_count: 1
  },
  {
    id: 'cf-6',
    title: 'Micro-SaaS de Catálogo WhatsApp para Viveros y Plantas',
    status: 'Congelador',
    niche: 'SaaS & Micro-Apps',
    score: 8.4,
    source: 'Nota de Voz Telegram',
    summary: 'Catálogo web ultra simple donde viveros y tiendas de plantas suben fotos desde el celular y reciben pedidos armados directo por WhatsApp.',
    problem: 'Los viveros pequeños envían decenas de fotos sueltas por WhatsApp cada vez que un cliente pregunta precios, perdiendo ventas por demora.',
    architecture: 'Frontend ligero en Next.js / Tailwind con compresión automática de fotos en cliente, actualización rápida de stock y carrito que genera mensaje estructurado de WhatsApp.',
    verdict: 'Nicho desatendido con bajo costo de soporte: fácil de vender mostrando una demo armada en 10 minutos con sus propias fotos.',
    stack: ['Next.js', 'Tailwind CSS', 'Supabase', 'WhatsApp API'],
    steps: [
      { text: 'Crear plantilla móvil rápida con filtro por luz/riego y botón de pedido WhatsApp.', done: false },
      { text: 'Armar demo gratuita con fotos reales de un vivero local y presentarla.', done: false },
      { text: 'Definir plan mensual simple ($10/mes) con dominio personalizado.', done: false }
    ],
    created: '2026-11-17'
  },
  {
    id: 'cf-7',
    title: 'App Genérica de Clima con IA (Ejemplo Descartado)',
    status: 'Descartado',
    niche: 'SaaS & Micro-Apps',
    score: 3.5,
    source: 'Screenshot TikTok',
    summary: 'Aplicación móvil que lee el pronóstico meteorológico y usa un prompt de IA para sugerir qué ropa usar cada mañana.',
    problem: 'Supuesta indecisión al elegir ropa según la temperatura.',
    architecture: 'Wrapper simple sobre OpenWeather API + llamada LLM sin datos reales del armario del usuario.',
    verdict: 'Descartada por el filtro anti-humo: cero disposición de pago recurrente, retención mínima tras 48 horas y costos de API sin retorno.',
    stack: ['React Native', 'OpenWeather', 'LLM Wrapper'],
    steps: [
      { text: 'Descartada automáticamente por puntaje < 6.0 y falta de monetización.', done: true }
    ],
    created: '2026-11-15',
    evidence_level: 'intuicion',
    mention_count: 1
  },
  {
    id: 'cf-8',
    title: 'Bot Facturador de Gastos Personales en Telegram',
    status: 'Lanzado',
    niche: 'Automatización & IA',
    score: 8.9,
    source: 'Nota de Voz Telegram',
    summary: 'Bot personal que lee fotos de boletas Yape/POS desde Telegram, categoriza el gasto y lo registra directo en Google Sheets.',
    problem: 'Anotar gastos diarios en Excel da flojera y termina abandonado en menos de una semana.',
    architecture: 'Webhook en FastAPI + Gemini Vision para OCR de montos/comercios + escritura directa en Google Sheets.',
    verdict: 'Ciclo completado con éxito: dolor cotidiano real resuelto en un fin de semana y en uso activo.',
    stack: ['Python', 'FastAPI', 'Gemini Vision', 'Google Sheets'],
    steps: [
      { text: 'Recibir foto de boleta por Telegram y extraer monto + categoría.', done: true },
      { text: 'Conectar hoja de cálculo mensual con resumen automático.', done: true },
      { text: 'Probar durante 7 días seguidos con gastos reales.', done: true }
    ],
    created: '2026-11-01',
    launched_at: '2026-11-10',
    evidence_level: 'con_demanda',
    evidence_note: 'En uso personal diario y 3 colegas pidieron la plantilla.',
    mention_count: 3,
    closing_note: 'MVP en producción usado a diario; bajó el registro de boletas de 15 min a 10 segundos.'
  }
];

export const CHART_DATASETS: Record<string, ChartDataset> = {
  weekly: {
    totalLabel: '68 Ideas Procesadas',
    periodSuffix: '2026',
    defaultIndex: 5,
    items: [
      { label: 'S1', fullLabel: 'Semana 01', approved: 3, discarded: 2, cols: [[2, 1], [3, 2], [2, 1]] },
      { label: 'S2', fullLabel: 'Semana 02', approved: 4, discarded: 3, cols: [[3, 2], [4, 3], [2, 2]] },
      { label: 'S3', fullLabel: 'Semana 03', approved: 2, discarded: 2, cols: [[1, 2], [2, 2], [2, 1]] },
      { label: 'S4', fullLabel: 'Semana 04', approved: 5, discarded: 2, cols: [[3, 1], [5, 2], [4, 1]] },
      { label: 'S5', fullLabel: 'Semana 05', approved: 4, discarded: 4, cols: [[3, 3], [4, 4], [2, 2]] },
      { label: 'S6', fullLabel: 'Semana 06', approved: 6, discarded: 3, cols: [[4, 2], [6, 3], [4, 2]] },
      { label: 'S7', fullLabel: 'Semana 07', approved: 3, discarded: 1, cols: [[2, 1], [3, 1], [2, 1]] },
      { label: 'S8', fullLabel: 'Semana 08', approved: 5, discarded: 3, cols: [[3, 2], [5, 3], [3, 2]] },
      { label: 'S9', fullLabel: 'Semana 09', approved: 4, discarded: 2, cols: [[2, 2], [4, 2], [3, 1]] },
      { label: 'S10', fullLabel: 'Semana 10', approved: 6, discarded: 2, cols: [[4, 1], [6, 2], [4, 2]] },
      { label: 'S11', fullLabel: 'Semana 11', approved: 3, discarded: 3, cols: [[2, 2], [3, 3], [2, 1]] },
      { label: 'S12', fullLabel: 'Semana 12', approved: 5, discarded: 2, cols: [[3, 1], [5, 2], [3, 1]] }
    ]
  },
  monthly: {
    totalLabel: '24 Ideas Procesadas',
    periodSuffix: '2026',
    defaultIndex: 5, // JUN resaltado por defecto
    items: [
      { label: 'ENE', fullLabel: 'Ene 2026', approved: 5, discarded: 4, cols: [[2, 2], [5, 4], [3, 2]] },
      { label: 'FEB', fullLabel: 'Feb 2026', approved: 7, discarded: 5, cols: [[4, 3], [7, 5], [4, 2]] },
      { label: 'MAR', fullLabel: 'Mar 2026', approved: 4, discarded: 4, cols: [[2, 2], [4, 4], [3, 2]] },
      { label: 'ABR', fullLabel: 'Abr 2026', approved: 8, discarded: 6, cols: [[4, 3], [8, 6], [5, 3]] },
      { label: 'MAY', fullLabel: 'May 2026', approved: 5, discarded: 3, cols: [[3, 2], [5, 3], [2, 2]] },
      { label: 'JUN', fullLabel: 'Jun 2026', approved: 8, discarded: 5, cols: [[4, 3], [8, 5], [5, 3]] },
      { label: 'JUL', fullLabel: 'Jul 2026', approved: 9, discarded: 4, cols: [[5, 2], [9, 4], [6, 2]] },
      { label: 'AGO', fullLabel: 'Ago 2026', approved: 4, discarded: 3, cols: [[2, 2], [4, 3], [3, 1]] },
      { label: 'SEP', fullLabel: 'Sep 2026', approved: 6, discarded: 4, cols: [[3, 2], [6, 4], [4, 2]] },
      { label: 'OCT', fullLabel: 'Oct 2026', approved: 8, discarded: 5, cols: [[4, 3], [8, 5], [4, 2]] },
      { label: 'NOV', fullLabel: 'Nov 2026', approved: 6, discarded: 3, cols: [[3, 2], [6, 3], [4, 2]] },
      { label: 'DIC', fullLabel: 'Dic 2026', approved: 7, discarded: 4, cols: [[4, 2], [7, 4], [5, 2]] }
    ]
  },
  yearly: {
    totalLabel: '214 Ideas Procesadas',
    periodSuffix: '',
    defaultIndex: 10,
    items: [
      { label: '2015', fullLabel: 'Año 2015', approved: 3, discarded: 4, cols: [[2, 2], [3, 4], [2, 2]] },
      { label: '2016', fullLabel: 'Año 2016', approved: 4, discarded: 4, cols: [[2, 2], [4, 4], [3, 2]] },
      { label: '2017', fullLabel: 'Año 2017', approved: 5, discarded: 5, cols: [[3, 3], [5, 5], [3, 2]] },
      { label: '2018', fullLabel: 'Año 2018', approved: 4, discarded: 3, cols: [[2, 2], [4, 3], [3, 2]] },
      { label: '2019', fullLabel: 'Año 2019', approved: 6, discarded: 4, cols: [[3, 2], [6, 4], [4, 2]] },
      { label: '2020', fullLabel: 'Año 2020', approved: 7, discarded: 5, cols: [[4, 3], [7, 5], [4, 3]] },
      { label: '2021', fullLabel: 'Año 2021', approved: 6, discarded: 4, cols: [[3, 2], [6, 4], [4, 2]] },
      { label: '2022', fullLabel: 'Año 2022', approved: 8, discarded: 5, cols: [[4, 3], [8, 5], [5, 3]] },
      { label: '2023', fullLabel: 'Año 2023', approved: 9, discarded: 6, cols: [[5, 3], [9, 6], [6, 3]] },
      { label: '2024', fullLabel: 'Año 2024', approved: 10, discarded: 5, cols: [[6, 3], [10, 5], [7, 2]] },
      { label: '2025', fullLabel: 'Año 2025', approved: 11, discarded: 4, cols: [[7, 2], [11, 4], [7, 2]] },
      { label: '2026', fullLabel: 'Año 2026', approved: 9, discarded: 3, cols: [[6, 2], [9, 3], [6, 2]] }
    ]
  }
};

export const REAL_SIM_SAMPLES = [
  {
    source: 'Link TikTok / Web',
    niche: 'Automatización & IA' as const,
    url: 'https://www.tiktok.com/@techbuilder/video/7439182736451',
    text: 'https://www.tiktok.com/@techbuilder/video/7439182736451 — Bot en WhatsApp para contadores en Perú que recibe fotos de boletas y facturas y extrae RUC, monto e IGV directo a Google Sheets.'
  },
  {
    source: 'Nota de Voz Telegram',
    niche: 'SaaS & Micro-Apps' as const,
    url: '',
    text: 'Vengo pensando en una micro-app web para dentistas y consultorios pequeños que mande recordatorios automáticos por WhatsApp 24h antes de la cita y cobre reserva para evitar inasistencias.'
  },
  {
    source: 'Captura Queja (OCR)',
    niche: 'SaaS & Micro-Apps' as const,
    url: '',
    text: '[OCR Captura X/WhatsApp] "Otro cliente me canceló a última hora y además perdí 2 horas cuadrando boletas de la semana en Excel porque cada proveedor manda un formato distinto."'
  }
];
