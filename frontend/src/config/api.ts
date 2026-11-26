// Configuración centralizada de la URL del Backend
// Si está en Vercel u otro dominio web, se conecta automáticamente a tu backend en Vercel
// Si está en tu computadora local, se conecta a http://localhost:8000
const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (isLocal ? 'http://localhost:8000' : 'https://backend-gamma-eight-58.vercel.app')
).replace(/\/+$/, '');
