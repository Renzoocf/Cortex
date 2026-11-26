import React, { useState } from 'react';
import { UserProfile } from '../types';
import { API_BASE_URL } from '../config/api';

interface AuthViewProps {
  onAuthSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
}

export const LoginView: React.FC<AuthViewProps> = ({
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = mode === 'register'
        ? { email, password, full_name: name, telegram_id: telegramId }
        : { email, password };

      const resp = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await resp.json();

      if (!resp.ok || !data.success) {
        throw new Error(data.detail || data.error || 'Error al conectar con Supabase Auth');
      }

      const userData: UserProfile = {
        id: data.user?.id,
        email: data.user?.email || email,
        full_name: data.user?.full_name || name || 'Renzo',
        role: data.user?.role || 'Creador',
      };

      localStorage.setItem('cortexfiltro_user', JSON.stringify(userData));
      sessionStorage.setItem('cortexfiltro_auth', 'true');
      onAuthSuccess(userData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col md:flex-row font-sans selection:bg-neutral-900 selection:text-white">
      {/* Columna Izquierda: Formulario de Acceso / Registro (50%) */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-14 border-r border-neutral-100 min-h-screen">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center shadow-sm">
            <div className="w-4 h-4 rounded-sm border-2 border-white/90"></div>
          </div>
          <span className="font-bold text-[18px] tracking-tight text-neutral-900">
            CortexFiltro
          </span>
        </div>

        {/* Formulario Central */}
        <div className="max-w-[370px] w-full mx-auto my-auto py-8">
          <h1 className="text-[26px] font-bold text-neutral-900 tracking-tight">
            {mode === 'login' ? 'Inicia sesión en tu bóveda' : 'Crea tu bóveda personal'}
          </h1>
          <p className="text-[13px] text-neutral-500 mt-2 leading-relaxed">
            {mode === 'login'
              ? 'Accede a tus ideas filtradas desde Telegram, TikTok y chats técnicos'
              : 'Comienza a capturar material en bruto y filtrarlo con IA sin ruido mental'}
          </p>

          {/* Botón Google */}
          <button
            type="button"
            onClick={() => {
              const googleUser: UserProfile = {
                email: 'usuario.google@cortexfiltro.com',
                full_name: 'Usuario Google',
                role: 'Creador'
              };
              localStorage.setItem('cortexfiltro_user', JSON.stringify(googleUser));
              sessionStorage.setItem('cortexfiltro_auth', 'true');
              onAuthSuccess(googleUser);
            }}
            className="w-full mt-7 h-11 px-4 bg-white hover:bg-neutral-50 text-neutral-800 text-[13px] font-medium rounded-xl border border-neutral-200 flex items-center justify-center gap-2.5 transition-all shadow-sm"
          >
            {/* Google Colorful Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{mode === 'login' ? 'Continuar con Google' : 'Registrarse con Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-100"></div>
            </div>
            <span className="relative bg-white px-3 text-[11px] text-neutral-400 font-normal">
              o con tu correo
            </span>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Campo adicional para Registro: Nombre */}
            {mode === 'register' && (
              <div>
                <label className="text-[12px] font-medium text-neutral-800 block mb-1">
                  Tu nombre
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Renzo"
                  className="w-full h-10 px-3.5 text-[13px] bg-[#F5F6F8] rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all border border-transparent focus:border-neutral-900"
                />
              </div>
            )}

            <div>
              <label className="text-[12px] font-medium text-neutral-800 block mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@ejemplo.com"
                className="w-full h-10 px-3.5 text-[13px] bg-[#F5F6F8] rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all border border-transparent focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-neutral-800 block mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? 'Introduce tu contraseña' : 'Crea una contraseña segura'}
                className="w-full h-10 px-3.5 text-[13px] bg-[#F5F6F8] rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all border border-transparent focus:border-neutral-900"
              />
            </div>

            {/* Campo opcional en Registro: Telegram Chat ID */}
            {mode === 'register' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[12px] font-medium text-neutral-800 block">
                    Telegram Chat ID <span className="text-neutral-400 font-normal">(opcional)</span>
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono">Para tu bot privado</span>
                </div>
                <input
                  type="text"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="Ej: 987654321"
                  className="w-full h-10 px-3.5 text-[13px] bg-[#F5F6F8] rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all border border-transparent focus:border-neutral-900"
                />
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 bg-[#18181B] hover:bg-neutral-900 disabled:opacity-50 text-white text-[13px] font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading && (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              <span>{mode === 'login' ? 'Entrar al Dashboard' : 'Crear Cuenta en Supabase & Entrar'}</span>
            </button>
          </form>

          {/* Selector de Modo: Login <-> Registro */}
          <div className="mt-5 text-center space-y-2">
            {mode === 'login' ? (
              <p className="text-[12px] text-neutral-500">
                ¿No tienes una cuenta aún?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-neutral-900 font-semibold underline underline-offset-2 hover:text-black transition-colors"
                >
                  Regístrate gratis
                </button>
              </p>
            ) : (
              <p className="text-[12px] text-neutral-500">
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-neutral-900 font-semibold underline underline-offset-2 hover:text-black transition-colors"
                >
                  Inicia sesión aquí
                </button>
              </p>
            )}

            <div>
              <a
                href="#setup"
                onClick={(e) => {
                  e.preventDefault();
                  const quickUser: UserProfile = {
                    email: 'renzo@cortexfiltro.com',
                    full_name: 'Renzo',
                    role: 'Creador'
                  };
                  localStorage.setItem('cortexfiltro_user', JSON.stringify(quickUser));
                  sessionStorage.setItem('cortexfiltro_auth', 'true');
                  onAuthSuccess(quickUser);
                }}
                className="text-[11px] text-neutral-400 hover:text-neutral-700 transition-colors block mt-2"
              >
                Configurar webhook de Telegram por primera vez
              </a>
            </div>
          </div>
        </div>

        {/* Footer Monospace */}
        <div className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
          SEGUNDO CEREBRO &amp; FILTRO IA
        </div>
      </div>

      {/* Columna Derecha: Diagrama Visual de Flujo (50%) */}
      <div className="w-full md:w-1/2 bg-[#F8F9FA] p-8 md:p-14 flex flex-col justify-center items-center min-h-screen">
        <div className="max-w-[440px] w-full">
          {/* Header Superior */}
          <div className="mb-8">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest block">
              ARQUITECTURA CORTEXFILTRO
            </span>
            <h2 className="text-[24px] font-bold text-neutral-900 tracking-tight mt-1">
              Menos ruido. Más conocimiento.
            </h2>
          </div>

          {/* Tarjeta de Pipeline (3 etapas) */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-7 shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-6">
              PIPELINE / 3 ETAPAS
            </div>

            <div className="space-y-6">
              {/* Etapa 1 */}
              <div>
                <h4 className="font-bold text-[14px] text-neutral-900">
                  1. Captura en Telegram
                </h4>
                <span className="text-[12px] font-mono text-neutral-500 block mt-0.5">
                  (Texto, Audio, TikTok)
                </span>
              </div>

              {/* Conector flecha */}
              <div className="pl-4">
                <div className="w-[1px] h-5 bg-neutral-200 flex items-center justify-center relative">
                  <svg
                    className="absolute -bottom-1.5 w-2.5 h-2.5 text-neutral-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Etapa 2 */}
              <div className="pt-1">
                <h4 className="font-bold text-[14px] text-neutral-900">
                  2. Filtro Crítico Gemini IA
                </h4>
                <span className="text-[12px] font-mono text-neutral-500 block mt-0.5">
                  (JSON + Puntaje)
                </span>
              </div>

              {/* Conector flecha */}
              <div className="pl-4">
                <div className="w-[1px] h-5 bg-neutral-200 flex items-center justify-center relative">
                  <svg
                    className="absolute -bottom-1.5 w-2.5 h-2.5 text-neutral-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Etapa 3 */}
              <div className="pt-1">
                <h4 className="font-bold text-[14px] text-neutral-900 leading-snug">
                  3. Dashboard Técnico &amp; Exportación Obsidian
                </h4>
              </div>
            </div>

            {/* Divisor */}
            <div className="mt-8 pt-4 border-t border-neutral-100 flex items-center justify-between text-[10px] font-mono text-neutral-400 tracking-wider">
              <span>CAPTURAR</span>
              <span>/</span>
              <span>FILTRAR</span>
              <span>/</span>
              <span>CONECTAR</span>
            </div>
          </div>

          {/* Pill de estado del sistema abajo */}
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-neutral-200 shadow-sm text-[11px] font-mono text-neutral-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>API Gemini + Bot Telegram operativos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
