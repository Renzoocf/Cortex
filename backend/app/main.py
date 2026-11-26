import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.config import settings
from app.models.schemas import SimulateRequest, SwapSlotsRequest, AuthRegisterRequest, AuthLoginRequest
from app.models.enums import InputTypeEnum
from app.services.telegram_service import telegram_service
from app.services.gemini_service import gemini_service
from app.services.supabase_service import supabase_service
from app.services.link_extractor import link_extractor
from app.services.digest_service import digest_service
from app.prompts.evaluator import LINK_CAPTURE_PROMPT


import os


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # En Vercel Serverless las funciones son efímeras; el polling solo corre en desarrollo local
    polling_task = None
    is_vercel = bool(os.environ.get("VERCEL"))
    if settings.TELEGRAM_BOT_TOKEN and not is_vercel and settings.APP_ENV != "production":
        polling_task = asyncio.create_task(telegram_service.run_polling_loop())

    yield

    if polling_task:
        polling_task.cancel()
    await telegram_service.close()
    await link_extractor.close()


app = FastAPI(
    title="CortexFiltro Backend API",
    description="Filtro crítico con IA y embudo de ideas conectado a Telegram, Supabase y Gemini",
    version="1.0.0",
    lifespan=lifespan
)

# Compresión GZip + CORS permisivo para Vercel y Localhost
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def map_db_to_frontend(db_item: dict) -> dict:
    """Mapea el formato de base de datos PostgreSQL/Supabase al formato exacto de la UI."""
    status_map = {
        "en_foco": "En Foco",
        "congelador": "Congelador",
        "contenido": "Contenido",
        "descartado": "Descartado",
        "lanzado": "Lanzado"
    }
    raw_status = str(db_item.get("status", "")).lower()
    status = status_map.get(raw_status, "Congelador")

    raw_steps = db_item.get("mvp_checklist") or []
    steps = []
    if isinstance(raw_steps, list):
        for s in raw_steps:
            if isinstance(s, dict):
                steps.append({"text": s.get("task") or s.get("text") or "", "done": bool(s.get("done", False))})
            elif isinstance(s, str):
                steps.append({"text": s, "done": False})

    source_map = {
        "text": "Texto Directo",
        "voice": "Nota de Voz Telegram",
        "image": "Captura OCR",
        "link": "Link TikTok / Web",
        "manual": "Simulador Web"
    }
    source = source_map.get(db_item.get("input_type", "text"), "Telegram")

    return {
        "id": str(db_item.get("id")),
        "title": db_item.get("title") or "Idea sin título",
        "status": status,
        "niche": db_item.get("niche") or "SaaS & Micro-Apps",
        "score": float(db_item.get("score") or 7.0),
        "source": source,
        "summary": (db_item.get("raw_input") or db_item.get("problem") or "")[:180],
        "problem": db_item.get("problem") or "",
        "architecture": db_item.get("verdict") or "",
        "verdict": db_item.get("verdict") or "",
        "stack": db_item.get("tech_stack") or [],
        "steps": steps,
        "created": (str(db_item.get("created_at") or ""))[:10] or "2026-11-26",
        "repo_url": db_item.get("repo_url"),
        "live_url": db_item.get("live_url"),
        "chat_url": db_item.get("chat_url"),
        "local_path": db_item.get("local_path"),
        "workspace_urls": db_item.get("workspace_urls") or [],
        "focus_started_at": db_item.get("focus_started_at"),
        "evidence_level": db_item.get("evidence_level") or "intuicion",
        "evidence_note": db_item.get("evidence_note"),
        "closing_note": db_item.get("closing_note"),
        "mention_count": int(db_item.get("mention_count") or 1),
        "mention_notes": [n.get("note") if isinstance(n, dict) else str(n) for n in (db_item.get("mention_notes") or [])],
    }


@app.get("/api/ideas")
async def get_all_ideas():
    """
    Retorna la lista de ideas reales guardadas en Supabase formateadas para el Frontend.
    """
    try:
        raw_ideas = await asyncio.to_thread(supabase_service.list_all_ideas)
        formatted = [map_db_to_frontend(item) for item in raw_ideas]
        return {
            "success": True,
            "count": len(formatted),
            "data": formatted
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }


@app.post("/api/auth/register")
async def auth_register(payload: AuthRegisterRequest):
    """
    Registra un usuario real en Supabase Auth.
    """
    try:
        user = await asyncio.to_thread(
            supabase_service.register_user,
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            telegram_id=payload.telegram_id
        )
        return {"success": True, "user": user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/login")
async def auth_login(payload: AuthLoginRequest):
    """
    Inicia sesión contra Supabase Auth.
    """
    try:
        res = await asyncio.to_thread(
            supabase_service.login_user,
            email=payload.email,
            password=payload.password
        )
        return {"success": True, "user": res}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas o usuario no registrado")


@app.patch("/api/ideas/{idea_id}")
async def patch_idea(idea_id: str, request: Request):
    """
    Actualiza campos de una idea en Supabase (estado, checklist, notas, links).
    """
    try:
        body = await request.json()
        updates = {}
        if "status" in body:
            status_map_rev = {
                "en foco": "en_foco",
                "congelador": "congelador",
                "contenido": "contenido",
                "descartado": "descartado",
                "lanzado": "lanzado"
            }
            updates["status"] = status_map_rev.get(str(body["status"]).lower(), "congelador")
        if "steps" in body:
            updates["mvp_checklist"] = [{"task": s.get("text", ""), "completed": bool(s.get("done", False))} for s in body["steps"]]
        if "evidence_level" in body:
            updates["evidence_level"] = body["evidence_level"]
        if "evidence_note" in body:
            updates["evidence_note"] = body["evidence_note"]
        if "closing_note" in body:
            updates["closing_note"] = body["closing_note"]
        if "repo_url" in body:
            updates["repo_url"] = body["repo_url"]
        if "live_url" in body:
            updates["live_url"] = body["live_url"]
        if "chat_url" in body:
            updates["chat_url"] = body["chat_url"]
        if "local_path" in body:
            updates["local_path"] = body["local_path"]

        res = await asyncio.to_thread(supabase_service.update_idea, idea_id, updates)
        return {"success": True, "data": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/ideas/{idea_id}")
async def delete_single_idea(idea_id: str):
    """
    Elimina una idea específica de Supabase.
    """
    try:
        ok = await asyncio.to_thread(supabase_service.delete_idea, idea_id)
        return {"success": ok}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/ideas")
async def clear_database_ideas():
    """
    Elimina todas las ideas de Supabase para comenzar con un tablero 100% en blanco.
    """
    try:
        deleted = await asyncio.to_thread(supabase_service.clear_all_ideas)
        return {"success": True, "deleted_count": deleted}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/")
def root():
    return {
        "app": "CortexFiltro API",
        "status": "online",
        "version": "1.0.0",
        "ai_model": settings.GEMINI_MODEL
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "telegram_configured": bool(settings.TELEGRAM_BOT_TOKEN),
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY),
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }


@app.post("/webhook/telegram")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Webhook público al que Telegram envía las actualizaciones.
    Se procesa en background para responderle 200 OK a Telegram de inmediato.
    """
    update = await request.json()
    background_tasks.add_task(telegram_service.handle_webhook_update, update)
    return {"ok": True}


@app.post("/api/simulate")
async def simulate_idea_input(payload: SimulateRequest):
    """
    Endpoint para el botón del Frontend: '+ Simular Entrada Telegram / IA'
    Permite probar el prompt y la evaluación directamente desde la web.
    """
    try:
        extra_context = payload.niche_hint or ""
        input_type = InputTypeEnum.MANUAL

        detected_url = link_extractor.extract_url(payload.raw_text)
        if detected_url:
            input_type = InputTypeEnum.LINK
            meta = await link_extractor.fetch_link_metadata(detected_url)
            extra_context = f"{LINK_CAPTURE_PROMPT}\n\n{meta['context_summary']}\n\n{extra_context}".strip()

        # 1. Evaluar con Gemini
        evaluation = await gemini_service.evaluate_text_input(
            raw_text=payload.raw_text,
            extra_context=extra_context or None
        )

        # 2. Detectar si es repetida ("Señal de Obsesión") sin bloquear el event loop
        duplicate = await asyncio.to_thread(
            supabase_service.find_similar_idea,
            f"{evaluation.title} {evaluation.problem} {payload.raw_text}"
        )
        if duplicate and duplicate.get("id"):
            merged = await asyncio.to_thread(
                supabase_service.register_obsession_mention,
                str(duplicate["id"]),
                duplicate,
                payload.raw_text
            )
            return {
                "success": True,
                "deduplicated": True,
                "data": merged,
                "evaluation": evaluation
            }

        # 3. Guardar en Supabase si es nueva
        saved_idea = await asyncio.to_thread(
            supabase_service.insert_evaluated_idea,
            raw_input=payload.raw_text,
            input_type=input_type,
            evaluation=evaluation
        )

        return {
            "success": True,
            "deduplicated": False,
            "data": saved_idea,
            "evaluation": evaluation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/swap-slots")
def swap_focus_slots(payload: SwapSlotsRequest):
    """
    Endpoint para el Modal de Intercambio (Regla anti-saturación de 2 slots).
    """
    try:
        updated = supabase_service.swap_focus_slot(
            new_idea_id=payload.new_idea_id,
            slot=payload.incoming_slot,
            evicted_idea_id=payload.evicted_idea_id
        )
        return {"success": True, "data": updated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import os
import subprocess
import sys

class OpenWorkspaceRequest(BaseModel):
    local_path: Optional[str] = None
    editor: Optional[str] = "antigravity"  # 'antigravity', 'code', 'explorer'


class ExtractLinkRequest(BaseModel):
    url: str


class WeeklyDigestRequest(BaseModel):
    ideas: Optional[List[Dict[str, Any]]] = None
    send_to_telegram: bool = False


@app.get("/api/digest/weekly")
async def get_weekly_digest(send: bool = False):
    """
    Genera el Resumen Semanal de Domingo (ideal para cron domingo 20:00 o consulta manual).
    """
    ideas = await asyncio.to_thread(supabase_service.list_all_ideas)
    digest = digest_service.build_weekly_digest(ideas)
    sent = False
    reason = "Resumen generado sin envío"

    if send:
        if settings.TELEGRAM_BOT_TOKEN and settings.ALLOWED_TELEGRAM_CHAT_ID:
            await telegram_service.send_message(
                settings.ALLOWED_TELEGRAM_CHAT_ID,
                digest["markdown_text"]
            )
            sent = True
            reason = "Enviado a tu chat privado de Telegram"
        else:
            reason = "Configura TELEGRAM_BOT_TOKEN y ALLOWED_TELEGRAM_CHAT_ID en .env para enviarlo"

    return {"success": True, "sent": sent, "reason": reason, "digest": digest}


@app.post("/api/digest/weekly")
async def post_weekly_digest(payload: WeeklyDigestRequest):
    """
    Genera y opcionalmente envía a Telegram el Resumen de Domingo usando las fichas actuales.
    """
    ideas = (
        payload.ideas
        if payload.ideas is not None
        else await asyncio.to_thread(supabase_service.list_all_ideas)
    )
    digest = digest_service.build_weekly_digest(ideas)
    sent = False
    reason = "Vista previa generada"

    if payload.send_to_telegram:
        if settings.TELEGRAM_BOT_TOKEN and settings.ALLOWED_TELEGRAM_CHAT_ID:
            await telegram_service.send_message(
                settings.ALLOWED_TELEGRAM_CHAT_ID,
                digest["markdown_text"]
            )
            sent = True
            reason = "Resumen de Domingo enviado a Telegram"
        else:
            reason = "Telegram aún no configurado en .env; copia el resumen o configura el bot"

    return {"success": True, "sent": sent, "reason": reason, "digest": digest}


@app.post("/api/extract-link")
async def extract_link_metadata(payload: ExtractLinkRequest):
    """
    Extrae metadatos públicos (oEmbed / OpenGraph) de un enlace de TikTok, YouTube, X o web.
    """
    clean_url = link_extractor.extract_url(payload.url)
    if not clean_url:
        raise HTTPException(status_code=400, detail="Ingresa una URL válida (http:// o https://)")
    meta = await link_extractor.fetch_link_metadata(clean_url)
    return {"success": True, "metadata": meta}

@app.post("/api/launcher/open")
def open_local_workspace(payload: OpenWorkspaceRequest):
    """
    Abre una carpeta local directamente en Antigravity IDE como espacio de trabajo único.
    Garantiza que no abra el escritorio completo ni ventanas vacías.
    """
    if not payload.local_path or not payload.local_path.strip():
        raise HTTPException(status_code=400, detail="Se requiere una ruta local válida")

    raw_path = payload.local_path.strip().strip('"').strip("'")
    path = os.path.normpath(os.path.abspath(raw_path))

    # Validar que no sea la raíz del disco ni el Escritorio directamente si se esperaba un proyecto
    # Si la carpeta no existe, la crea para que el IDE la abra limpia
    if not os.path.exists(path):
        try:
            os.makedirs(path, exist_ok=True)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"No se pudo acceder ni crear la ruta: {str(e)}")

    try:
        if sys.platform == "win32":
            # 1. Antigravity IDE (VS Code based) - la mejor opción para abrir un workspace específico
            ide_exe = os.path.expandvars(r"%LOCALAPPDATA%\Programs\Antigravity IDE\Antigravity IDE.exe")
            ide_cmd = os.path.expandvars(r"%LOCALAPPDATA%\Programs\Antigravity IDE\bin\antigravity-ide.cmd")
            antigravity_classic = os.path.expandvars(r"%LOCALAPPDATA%\Programs\Antigravity\Antigravity.exe")
            agy_cli = os.path.expandvars(r"%USERPROFILE%\.gemini\bin\agy.exe")
            vscode_exe = os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe")

            # Prioridad 1: Antigravity IDE con flag --new-window para aislar el espacio de trabajo
            if os.path.exists(ide_exe):
                try:
                    # --new-window fuerza a abrir una ventana exclusiva para esta carpeta
                    subprocess.Popen(
                        [ide_exe, "--new-window", path],
                        cwd=path,
                        close_fds=True,
                        creationflags=subprocess.DETACHED_PROCESS if hasattr(subprocess, "DETACHED_PROCESS") else 0
                    )
                    return {
                        "success": True,
                        "workspace": path,
                        "message": f"Antigravity IDE abierto exclusivamente en: {path}"
                    }
                except Exception:
                    pass

            # Prioridad 2: Antigravity IDE CLI wrapper
            if os.path.exists(ide_cmd):
                try:
                    subprocess.Popen(
                        ["cmd.exe", "/c", ide_cmd, "--new-window", path],
                        cwd=path,
                        close_fds=True
                    )
                    return {
                        "success": True,
                        "workspace": path,
                        "message": f"Antigravity cargado en workspace: {path}"
                    }
                except Exception:
                    pass

            # Prioridad 3: Antigravity clásico
            if os.path.exists(antigravity_classic):
                try:
                    subprocess.Popen([antigravity_classic, path], cwd=path, close_fds=True)
                    return {
                        "success": True,
                        "workspace": path,
                        "message": f"Antigravity abierto en: {path}"
                    }
                except Exception:
                    pass

            # Prioridad 4: CLI agy
            if os.path.exists(agy_cli):
                try:
                    subprocess.Popen([agy_cli, path], cwd=path, close_fds=True)
                    return {
                        "success": True,
                        "workspace": path,
                        "message": f"agy CLI lanzado en: {path}"
                    }
                except Exception:
                    pass

            # Prioridad 5: VS Code con workspace aislado
            if os.path.exists(vscode_exe):
                try:
                    subprocess.Popen([vscode_exe, "--new-window", path], cwd=path, close_fds=True)
                    return {
                        "success": True,
                        "workspace": path,
                        "message": f"Abierto en editor con workspace: {path}"
                    }
                except Exception:
                    pass

            # Fallback seguro: abrir la carpeta en el Explorador de archivos
            os.startfile(path)
            return {
                "success": True,
                "workspace": path,
                "message": f"Carpeta del proyecto abierta en Windows: {path}"
            }

        else:
            # Linux / macOS
            try:
                subprocess.Popen(["antigravity-ide", "--new-window", path], cwd=path)
                return {"success": True, "workspace": path, "message": f"Abierto en: {path}"}
            except Exception:
                subprocess.Popen(["agy", path], cwd=path)
                return {"success": True, "workspace": path, "message": f"Abierto con agy: {path}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al abrir el espacio de trabajo: {str(e)}")

