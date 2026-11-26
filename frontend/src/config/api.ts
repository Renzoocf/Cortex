// Configuración centralizada de la URL del Backend
// En Vercel se configura la variable de entorno: VITE_API_URL
// Localmente toma por defecto http://localhost:8000
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');
