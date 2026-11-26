import React, { useState, useRef, useEffect } from 'react';
import { NicheType } from '../types';
import { REAL_SIM_SAMPLES } from '../data/mockData';

type CaptureMode = 'link' | 'voice' | 'ocr';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rawText: string, source: string, niche: NicheType, capturedUrl?: string) => void;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function detectPlatformBadge(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('tiktok.com')) return 'TikTok detectado';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube / Shorts';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'Post de X / Twitter';
  if (lower.includes('instagram.com')) return 'Instagram Reels';
  return 'Enlace Web';
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [captureMode, setCaptureMode] = useState<CaptureMode>('link');
  const [niche, setNiche] = useState<NicheType>('Automatización & IA');
  const [linkUrl, setLinkUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [ocrImageName, setOcrImageName] = useState('');
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceWarning, setVoiceWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (ocrPreviewUrl) {
        URL.revokeObjectURL(ocrPreviewUrl);
      }
    };
  }, [ocrPreviewUrl]);

  if (!isOpen) return null;

  const sourceByMode: Record<CaptureMode, string> = {
    link: 'Link TikTok / Web',
    voice: 'Nota de Voz Telegram',
    ocr: 'Captura Queja (OCR)',
  };

  const handleModeChange = (mode: CaptureMode) => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    setVoiceWarning(null);
    setCaptureMode(mode);
  };

  const handleFillSample = () => {
    const modeIdx = captureMode === 'link' ? 0 : captureMode === 'voice' ? 1 : 2;
    const sample = REAL_SIM_SAMPLES[modeIdx] || REAL_SIM_SAMPLES[0];
    setNiche(sample.niche);
    setLinkUrl(sample.url || '');
    setRawText(sample.text);
  };

  const handleToggleVoiceDictation = () => {
    setVoiceWarning(null);
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceWarning('Tu navegador no soporta dictado directo. Escribe o pega la transcripción abajo.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'es-PE';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        let spoken = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            spoken += event.results[i][0].transcript + ' ';
          }
        }
        if (spoken.trim()) {
          setRawText((prev) => (prev ? `${prev.trim()} ${spoken.trim()}` : spoken.trim()));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setVoiceWarning('No se pudo acceder al micrófono. Puedes escribir la nota manualmente.');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
      setVoiceWarning('No se pudo iniciar el micrófono en este navegador.');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (ocrPreviewUrl) URL.revokeObjectURL(ocrPreviewUrl);
    setOcrImageName(file.name);
    setOcrPreviewUrl(URL.createObjectURL(file));
    if (!rawText.trim()) {
      setRawText(`[Captura: ${file.name}] Queja de cliente detectada: `);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = linkUrl.trim();
    const cleanText = rawText.trim();

    if (captureMode === 'link' && !cleanUrl && !cleanText) return;
    if (captureMode !== 'link' && !cleanText) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsLoading(true);
    let enrichedText = cleanText;

    if (captureMode === 'link' && cleanUrl) {
      setLoadingStep('Extrayendo metadatos de TikTok / YouTube / X...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const resp = await fetch('http://localhost:8000/api/extract-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: cleanUrl }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (resp.ok) {
          const data = await resp.json();
          const metaTitle = data?.metadata?.title;
          if (metaTitle && !cleanText.includes(metaTitle)) {
            enrichedText = cleanText
              ? `${metaTitle} — ${cleanText}`
              : `${metaTitle} (${cleanUrl})`;
          }
        }
      } catch {
        // Fallback silencioso si el backend local no está encendido
      }
      if (!enrichedText) {
        enrichedText = `Idea capturada desde enlace: ${cleanUrl}`;
      }
    } else if (captureMode === 'voice') {
      setLoadingStep('Estructurando dolor real, cobro y stack desde nota de voz...');
    } else {
      setLoadingStep('Aplicando OCR de quejas y detectando oportunidad de micro-app...');
    }

    setTimeout(() => {
      setLoadingStep('Aplicando criterios anti-humo con Gemini y creando ficha...');
    }, 100);

    setTimeout(() => {
      setIsLoading(false);
      onSubmit(enrichedText, sourceByMode[captureMode], niche, cleanUrl || undefined);
      setRawText('');
      setLinkUrl('');
      setOcrImageName('');
      if (ocrPreviewUrl) {
        URL.revokeObjectURL(ocrPreviewUrl);
        setOcrPreviewUrl(null);
      }
      onClose();
    }, 220);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulatorModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-borderHairline bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] animate-pop-in">
        <div className="flex shrink-0 items-center justify-between border-b border-borderHairline bg-cardSubtle px-6 py-4">
          <div>
            <h3 id="simulatorModalTitle" className="text-base font-bold text-inkPrimary">
              Superpoderes de Captura Telegram / Gemini IA
            </h3>
            <p className="text-xs text-inkMuted">
              Envía un link de TikTok/X, dicta una nota de voz o captura una queja para filtrarla.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar simulador"
            className="rounded-xl border border-borderHairline bg-white p-2 text-inkMuted hover:border-inkPrimary hover:text-inkPrimary"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-6">
          {/* 3 Pestañas de Superpoder de Captura */}
          <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-borderHairline bg-searchBg p-1">
            <button
              type="button"
              onClick={() => handleModeChange('link')}
              className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                captureMode === 'link'
                  ? 'bg-white text-inkPrimary shadow-xs'
                  : 'text-inkMuted hover:text-inkPrimary'
              }`}
            >
              🔗 Link TikTok / X
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('voice')}
              className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                captureMode === 'voice'
                  ? 'bg-white text-inkPrimary shadow-xs'
                  : 'text-inkMuted hover:text-inkPrimary'
              }`}
            >
              🎙️ Nota de Voz
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('ocr')}
              className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                captureMode === 'ocr'
                  ? 'bg-white text-inkPrimary shadow-xs'
                  : 'text-inkMuted hover:text-inkPrimary'
              }`}
            >
              📸 Queja / OCR
            </button>
          </div>

          {/* Modo 1: Extractor de Links */}
          {captureMode === 'link' && (
            <div className="space-y-2 rounded-xl border border-borderHairline bg-cardSubtle p-3">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="simLinkInput" className="text-xs font-semibold text-inkPrimary">
                  Enlace de TikTok, YouTube Shorts o X/Twitter
                </label>
                {linkUrl.trim() && (
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-emerald-700">
                    {detectPlatformBadge(linkUrl)}
                  </span>
                )}
              </div>
              <input
                id="simLinkInput"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@usuario/video/..."
                className="h-9 w-full rounded-xl border border-borderHairline bg-white px-3 font-mono text-xs text-inkPrimary placeholder-inkFaint focus:border-inkPrimary focus:outline-none"
              />
            </div>
          )}

          {/* Modo 2: Nota de Voz */}
          {captureMode === 'voice' && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-borderHairline bg-cardSubtle p-3">
              <div className="text-xs text-inkBody">
                <span className="font-semibold text-inkPrimary">Dictado rápido en voz alta:</span>{' '}
                habla sin filtro y Gemini ordenará dolor, cobro y stack.
              </div>
              <button
                type="button"
                onClick={handleToggleVoiceDictation}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  isRecording
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-inkCharcoal text-white hover:bg-black'
                }`}
              >
                <span>{isRecording ? '⏹ Detener dictado' : '🎙️ Dictar ahora'}</span>
              </button>
              {voiceWarning && (
                <p className="w-full text-[11px] font-medium text-amber-700">{voiceWarning}</p>
              )}
            </div>
          )}

          {/* Modo 3: Captura OCR de Queja */}
          {captureMode === 'ocr' && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-borderHairline bg-cardSubtle p-3">
              <div className="min-w-0 flex-1">
                <label className="block text-xs font-semibold text-inkPrimary">
                  Subir captura de queja (Twitter/X o WhatsApp)
                </label>
                <p className="mt-0.5 truncate text-[11px] text-inkMuted">
                  {ocrImageName ? `Archivo listo: ${ocrImageName}` : 'En Telegram envías la foto directo; aquí puedes adjuntar una prueba.'}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-2 block w-full text-[11px] text-inkMuted file:mr-2.5 file:rounded-lg file:border file:border-borderHairline file:bg-white file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-inkPrimary hover:file:border-inkPrimary"
                />
              </div>
              {ocrPreviewUrl && (
                <img
                  src={ocrPreviewUrl}
                  alt="Vista previa captura"
                  className="h-14 w-14 shrink-0 rounded-lg border border-borderHairline object-cover"
                />
              )}
            </div>
          )}

          <div>
            <label htmlFor="simNicheSelect" className="mb-1.5 block text-xs font-semibold text-inkPrimary">
              Nicho / Categoría
            </label>
            <select
              id="simNicheSelect"
              value={niche}
              onChange={(e) => setNiche(e.target.value as NicheType)}
              className="h-9 w-full rounded-xl border border-borderHairline bg-searchBg px-3 text-xs font-medium text-inkPrimary focus:border-inkPrimary focus:bg-white focus:outline-none"
            >
              <option value="SaaS & Micro-Apps">SaaS &amp; Micro-Apps</option>
              <option value="Contenido & TikTok">Contenido &amp; TikTok</option>
              <option value="Automatización & IA">Automatización &amp; IA</option>
            </select>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="simRawInput" className="text-xs font-semibold text-inkPrimary">
                {captureMode === 'link'
                  ? 'Resumen / contexto del enlace (opcional si pegaste URL)'
                  : captureMode === 'voice'
                  ? 'Transcripción de tu nota de voz'
                  : 'Texto visible en la captura / queja del usuario'}
              </label>
              <button
                type="button"
                onClick={handleFillSample}
                className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                ✨ Rellenar ejemplo real
              </button>
            </div>
            <textarea
              id="simRawInput"
              rows={4}
              required={captureMode !== 'link' || !linkUrl.trim()}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={
                captureMode === 'link'
                  ? 'Ej: Muestra una automatización en n8n que lee boletas SUNAT y las manda a Sheets...'
                  : captureMode === 'voice'
                  ? 'Dicta o escribe tu idea tal como te vino a la cabeza...'
                  : 'Pega la queja que viste en X/WhatsApp para que Gemini detecte el dolor comercial...'
              }
              className="w-full rounded-xl border border-borderHairline bg-searchBg p-3 text-[13px] text-inkPrimary placeholder-inkFaint focus:border-inkPrimary focus:bg-white focus:outline-none"
            ></textarea>
          </div>

          {/* Estado de análisis animado */}
          {isLoading && (
            <div className="rounded-xl border border-borderHairline bg-cardSubtle p-3.5 animate-pop-in">
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 animate-spin text-inkPrimary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <div>
                  <p className="text-xs font-semibold text-inkPrimary">{loadingStep}</p>
                  <p className="font-mono text-[11px] text-inkMuted">Extrayendo JSON estructurado &amp; filtrando humo</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-borderHairline bg-white px-4 py-2 text-xs font-semibold text-inkMuted hover:border-inkPrimary hover:text-inkPrimary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-inkCharcoal px-4 py-2 text-xs font-semibold text-white transition hover:bg-black disabled:opacity-50"
            >
              Procesar con Filtro IA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
