# CortexFiltro - Backend API

Motor de ingesta, filtrado crítico con IA y embudo de ideas conectado a Telegram, Supabase y Google Gemini.

## 🚀 Arquitectura
1. **Telegram Webhook (`/webhook/telegram`):** Recibe texto, notas de voz (`.oga`/`.ogg`) o capturas de pantalla/fotos desde el móvil.
2. **Filtro Crítico IA (`GeminiService`):** Procesa con `gemini-2.5-flash` usando **Structured Outputs** (JSON estricto con Pydantic) y un prompt exigente anti-humo.
3. **Persistencia (`SupabaseService`):** Guarda la ficha técnica (Dossier) y gestiona la regla anti-saturación de 2 slots en foco.
4. **Simulador (`/api/simulate`):** Conectado al botón del dashboard `+ Simular Entrada Telegram / IA`.

---

## 🛠️ Puesta en Marcha Local

### 1. Crear entorno virtual e instalar dependencias
```bash
cd backend
python -m venv venv

# En Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Instalar paquetes:
pip install -r requirements.txt
```

### 2. Configurar variables de entorno
Copia `.env.example` a `.env` y completa tus credenciales:
```bash
cp .env.example .env
```

Campos requeridos:
* `TELEGRAM_BOT_TOKEN`: Token obtenido con `@BotFather`.
* `ALLOWED_TELEGRAM_CHAT_ID`: Tu ID de Telegram (para que solo tú puedas enviar ideas).
* `GEMINI_API_KEY`: Tu clave de Google AI Studio.
* `SUPABASE_URL` y `SUPABASE_KEY`: Credenciales de tu proyecto Supabase.

### 3. Configurar la Base de Datos
Abre el editor SQL de tu panel de **Supabase** y ejecuta el script completo:
```
supabase_schema.sql
```

### 4. Iniciar el servidor
```bash
uvicorn app.main:app --reload --port 8000
```
Visita `http://localhost:8000/docs` para ver la documentación interactiva Swagger.
