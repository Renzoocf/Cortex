import asyncio
import httpx
from typing import Dict, Any, Optional
from app.config import settings
from app.models.enums import InputTypeEnum
from app.models.schemas import GeminiStructuredEvaluation
from app.prompts.evaluator import LINK_CAPTURE_PROMPT
from app.services.digest_service import digest_service
from app.services.gemini_service import gemini_service
from app.services.link_extractor import link_extractor
from app.services.supabase_service import supabase_service


class TelegramService:
    def __init__(self):
        self.base_url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}"
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def http_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=30.0,
                limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
            )
        return self._client

    async def close(self):
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def run_polling_loop(self):
        """
        Polling automático para desarrollo: escucha Telegram sin necesidad de ngrok ni webhook.
        """
        if not settings.TELEGRAM_BOT_TOKEN:
            print("[Telegram] Bot token no configurado. Polling desactivado.")
            return

        print("[Telegram] Polling en vivo activado. Escuchando mensajes de @RCortex_bot...")
        offset = None

        # Borrar cualquier webhook previo para permitir getUpdates
        try:
            await self.http_client.post(f"{self.base_url}/deleteWebhook", timeout=10.0)
        except Exception as e:
            print(f"[Telegram] Error al limpiar webhook: {e}")

        while True:
            try:
                params: Dict[str, Any] = {"timeout": 20, "allowed_updates": ["message"]}
                if offset:
                    params["offset"] = offset

                res = await self.http_client.get(
                    f"{self.base_url}/getUpdates",
                    params=params,
                    timeout=25.0
                )
                data = res.json()

                if data.get("ok"):
                    for update in data.get("result", []):
                        offset = update["update_id"] + 1
                        # Procesar update de forma asíncrona
                        asyncio.create_task(self.handle_webhook_update(update))
                else:
                    await asyncio.sleep(2.0)

            except asyncio.CancelledError:
                print("[Telegram] Polling loop cancelado.")
                break
            except Exception as e:
                # Evitar bucle ruidoso si hay error de red temporal
                await asyncio.sleep(3.0)

    async def send_chat_action(self, chat_id: int, action: str = "typing"):
        """Envía indicador de 'escribiendo...' a Telegram"""
        try:
            await self.http_client.post(
                f"{self.base_url}/sendChatAction",
                json={"chat_id": chat_id, "action": action},
                timeout=5.0
            )
        except Exception as e:
            print(f"[Telegram] Error enviando chat action: {e}")

    async def send_message(self, chat_id: int, text: str, parse_mode: str = "Markdown"):
        """Envía un mensaje de texto formateado al usuario"""
        await self.http_client.post(
            f"{self.base_url}/sendMessage",
            json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode
            },
            timeout=10.0
        )

    async def download_file_bytes(self, file_id: str) -> bytes:
        """Obtiene la ruta del archivo en Telegram y descarga sus bytes"""
        res = await self.http_client.get(f"{self.base_url}/getFile?file_id={file_id}", timeout=10.0)
        res_data = res.json()
        if not res_data.get("ok"):
            raise ValueError(f"No se pudo obtener el archivo de Telegram: {res_data}")

        file_path = res_data["result"]["file_path"]
        download_url = f"https://api.telegram.org/file/bot{settings.TELEGRAM_BOT_TOKEN}/{file_path}"
        file_res = await self.http_client.get(download_url, timeout=30.0)
        return file_res.content

    def format_telegram_reply(
        self,
        evaluation: GeminiStructuredEvaluation,
        capture_label: str = "💬 Texto"
    ) -> str:
        """
        Formatea el veredicto para Telegram usando el sistema de color/emoji semántico.
        """
        score = evaluation.overall_score
        if score >= 8.5:
            badge = f"🟢 *{score}/10* (VIABLE - ALTA PRIORIDAD)"
        elif score >= 7.0:
            badge = f"🟡 *{score}/10* (EN OBSERVACIÓN)"
        else:
            badge = f"🔴 *{score}/10* (DESCARTADO - HUMO / BAJO RETORNO)"

        bucket_display = {
            "congelador": "❄️ Congelador Técnico",
            "contenido": "🎬 Fábrica de Contenido",
            "descartado": "🗑️ Descartado (Anti-Humo)",
            "en_foco": "⚡ En Foco"
        }.get(evaluation.suggested_bucket.value, evaluation.suggested_bucket.value)

        checklist_items = "\n".join([f"  • {item.task}" for item in evaluation.mvp_checklist])

        stack_str = ", ".join(evaluation.tech_stack) if evaluation.tech_stack else "Mínimo necesario"

        return (
            f"🧠 *CORTEXFILTRO: EVALUACIÓN IA*\n\n"
            f"📌 *Proyecto:* {evaluation.title}\n"
            f"📥 *Captura:* `{capture_label}`\n"
            f"🏷️ *Nicho:* `{evaluation.niche.value}`\n"
            f"📊 *Puntaje:* {badge}\n"
            f"📁 *Destino:* `{bucket_display}`\n\n"
            f"⚖️ *Veredicto Crítico:*\n_{evaluation.verdict}_\n\n"
            f"🛠️ *Stack Sugerido:* `{stack_str}`\n\n"
            f"🚀 *Checklist MVP (48h):*\n{checklist_items}\n\n"
            f"🔗 _Ficha técnica guardada en tu Dashboard._"
        )

    async def handle_webhook_update(self, update: Dict[str, Any]):
        """
        Procesador principal de eventos del Webhook de Telegram
        """
        message = update.get("message")
        if not message:
            return

        chat_id = message.get("chat", {}).get("id")
        user_id = message.get("from", {}).get("id")

        # Control de acceso por ID privado
        if settings.ALLOWED_TELEGRAM_CHAT_ID and user_id != settings.ALLOWED_TELEGRAM_CHAT_ID:
            await self.send_message(
                chat_id,
                "⛔ *Acceso denegado:* Este bot es privado para uso personal de su creador."
            )
            return

        # Notificar al usuario que la IA está analizando
        await self.send_chat_action(chat_id, "typing")

        raw_input_text = ""
        input_type = InputTypeEnum.TEXT
        capture_label = "💬 Texto"
        evaluation: Optional[GeminiStructuredEvaluation] = None

        try:
            # Caso 0: Comandos de control del bot (/start, /help, /foco, /stats, /resumen)
            if "text" in message:
                cleaned_cmd = message["text"].strip().lower()

                # /start o /help
                if cleaned_cmd in ("/start", "/help", "hola", "/hola"):
                    welcome_text = (
                        "👋 *¡Hola! Bienvenido a Córtex Filtro.*\n\n"
                        "Soy tu segundo cerebro con IA para filtrar ideas y descartar humo antes de programar.\n\n"
                        "💡 *¿Cómo capturar ideas conmigo?*\n"
                        "• 🎙️ *Audio / Voz:* Grábame una nota de voz con una idea o dolor.\n"
                        "• 🔗 *Enlace:* Pega un link de TikTok, Shorts, Reels o X.\n"
                        "• 📸 *Foto:* Sube una captura de una queja o reseña.\n"
                        "• 💬 *Texto:* Escribe cualquier pensamiento rápido.\n\n"
                        "📋 *Comandos del Bot:*\n"
                        "/foco - Ver tus 2 proyectos en foco activo\n"
                        "/stats - Estadísticas de tu bóveda\n"
                        "/resumen - Resumen semanal para Obsidian"
                    )
                    await self.send_message(chat_id, welcome_text)
                    return

                # /foco
                if cleaned_cmd in ("/foco", "/focus"):
                    ideas = await asyncio.to_thread(supabase_service.list_all_ideas)
                    focused = [i for i in ideas if str(i.get("status", "")).lower() in ("en_foco", "en foco")]
                    if not focused:
                        await self.send_message(
                            chat_id,
                            "⚡ *En Foco Activo:* No tienes proyectos en foco actualmente.\n"
                            "Promueve una idea desde tu Dashboard para activar la ventana de validación de 48h."
                        )
                    else:
                        lines = ["⚡ *TUS PROYECTOS EN FOCO ACTIVO (MÁX. 2):*\n"]
                        for idx, p in enumerate(focused[:2], 1):
                            title = p.get("title", "Sin título")
                            score = float(p.get("score") or 8.0)
                            lines.append(f"*Slot {idx}:* {title} (⭐ {score:.1f}/10)")
                        lines.append("\n_Recuerda la regla: máximo 2 frentes activos simultáneamente._")
                        await self.send_message(chat_id, "\n".join(lines))
                    return

                # /stats
                if cleaned_cmd in ("/stats", "/estadisticas"):
                    ideas = await asyncio.to_thread(supabase_service.list_all_ideas)
                    total = len(ideas)
                    foco = sum(1 for i in ideas if str(i.get("status", "")).lower() in ("en_foco", "en foco"))
                    freezer = sum(1 for i in ideas if str(i.get("status", "")).lower() in ("congelador",))
                    discarded = sum(1 for i in ideas if str(i.get("status", "")).lower() in ("descartado",))
                    launched = sum(1 for i in ideas if str(i.get("status", "")).lower() in ("lanzado",))
                    stats_msg = (
                        "📊 *ESTADO DE TU BÓVEDA CORTEXFILTRO:*\n\n"
                        f"• Total procesadas: *{total}*\n"
                        f"• ⚡ En Foco: *{foco} / 2*\n"
                        f"• ❄️ Congelador Técnico: *{freezer}*\n"
                        f"• 🚀 Lanzados / Validados: *{launched}*\n"
                        f"• 🗑️ Descartados por Humo: *{discarded}*\n\n"
                        "🔗 _Consulta tu panel en vivo en tu navegador._"
                    )
                    await self.send_message(chat_id, stats_msg)
                    return

                # /resumen o /domingo
                if cleaned_cmd in ("/resumen", "/domingo"):
                    ideas = await asyncio.to_thread(supabase_service.list_all_ideas)
                    digest = digest_service.build_weekly_digest(ideas)
                    await self.send_message(chat_id, digest["markdown_text"])
                    return

            # Caso 1: Mensaje de Texto o Enlace (TikTok, Reels, YouTube, X)
            if "text" in message:
                raw_input_text = message["text"]
                detected_url = link_extractor.extract_url(raw_input_text)

                if detected_url:
                    input_type = InputTypeEnum.LINK
                    meta = await link_extractor.fetch_link_metadata(detected_url)
                    platform_names = {
                        "tiktok": "🔗 Link TikTok",
                        "youtube": "🔗 Link YouTube",
                        "twitter_x": "🔗 Post X/Twitter",
                        "instagram": "🔗 Link Instagram",
                        "web": "🔗 Enlace Web",
                    }
                    capture_label = platform_names.get(meta["platform"], "🔗 Enlace Web")
                    extra_ctx = f"{LINK_CAPTURE_PROMPT}\n\n{meta['context_summary']}"
                    evaluation = await gemini_service.evaluate_text_input(
                        raw_text=raw_input_text,
                        extra_context=extra_ctx
                    )
                else:
                    input_type = InputTypeEnum.TEXT
                    capture_label = "💬 Texto Rápido"
                    evaluation = await gemini_service.evaluate_text_input(raw_input_text)

            # Caso 2: Nota de Voz o Audio
            elif "voice" in message or "audio" in message:
                audio_obj = message.get("voice") or message.get("audio")
                file_id = audio_obj["file_id"]
                mime_type = audio_obj.get("mime_type", "audio/ogg")
                caption = message.get("caption")

                audio_bytes = await self.download_file_bytes(file_id)
                input_type = InputTypeEnum.VOICE
                capture_label = "🎙️ Nota de Voz sin Filtro"
                raw_input_text = caption or "[Nota de Voz de Telegram]"

                evaluation = await gemini_service.evaluate_media_input(
                    media_bytes=audio_bytes,
                    mime_type=mime_type,
                    caption=caption,
                    media_kind="voice"
                )

            # Caso 3: Foto / Screenshot (Quejas Twitter/X, WhatsApp, TikTok)
            elif "photo" in message:
                photos = message["photo"]
                largest_photo = photos[-1]
                file_id = largest_photo["file_id"]
                caption = message.get("caption")

                photo_bytes = await self.download_file_bytes(file_id)
                input_type = InputTypeEnum.IMAGE
                capture_label = "📸 Captura OCR / Queja"
                raw_input_text = caption or "[Captura de Pantalla / OCR de Telegram]"

                evaluation = await gemini_service.evaluate_media_input(
                    media_bytes=photo_bytes,
                    mime_type="image/jpeg",
                    caption=caption,
                    media_kind="image"
                )

            # Caso 4: Documento adjunto (imagen sin compresión o audio adjunto)
            elif "document" in message:
                doc = message["document"]
                mime_type = doc.get("mime_type", "")
                caption = message.get("caption")
                if mime_type.startswith("image/") or mime_type.startswith("audio/"):
                    doc_bytes = await self.download_file_bytes(doc["file_id"])
                    is_audio = mime_type.startswith("audio/")
                    input_type = InputTypeEnum.VOICE if is_audio else InputTypeEnum.IMAGE
                    capture_label = "🎙️ Audio Adjunto" if is_audio else "📸 Captura OCR"
                    raw_input_text = caption or f"[{doc.get('file_name', 'Archivo adjunto')}]"
                    evaluation = await gemini_service.evaluate_media_input(
                        media_bytes=doc_bytes,
                        mime_type=mime_type,
                        caption=caption,
                        media_kind="voice" if is_audio else "image"
                    )
                else:
                    await self.send_message(
                        chat_id,
                        "⚠️ Envía texto, enlaces de TikTok/X, notas de voz o capturas de pantalla."
                    )
                    return

            else:
                await self.send_message(
                    chat_id,
                    "⚠️ Tipo de mensaje no soportado. Envía texto, enlaces, audio o capturas."
                )
                return

            if evaluation:
                # Detector de Ideas Repetidas ("Señal de Obsesión") sin bloquear el event loop
                duplicate = await asyncio.to_thread(
                    supabase_service.find_similar_idea,
                    f"{evaluation.title} {evaluation.problem} {raw_input_text}"
                )
                if duplicate and duplicate.get("id"):
                    updated = await asyncio.to_thread(
                        supabase_service.register_obsession_mention,
                        str(duplicate["id"]),
                        duplicate,
                        raw_input_text
                    )
                    mentions = int(updated.get("mention_count") or 2)
                    obsession_msg = (
                        f"🔥 *SEÑAL DE OBSESIÓN (Mencionada {mentions} veces)*\n\n"
                        f"Esta idea ya existía en tu bóveda como:\n"
                        f"📌 *{updated.get('title', duplicate.get('title'))}*\n\n"
                        f"• No se creó duplicado: la nueva captura se fusionó como evidencia.\n"
                        f"• Nuevo puntaje: *{updated.get('score', evaluation.overall_score)}/10*\n"
                        f"• Si vuelve a repetirse, considera subirla a *En Foco*."
                    )
                    await self.send_message(chat_id, obsession_msg)
                    return

                # Guardar en Supabase si es una idea nueva
                await asyncio.to_thread(
                    supabase_service.insert_evaluated_idea,
                    raw_input=raw_input_text,
                    input_type=input_type,
                    evaluation=evaluation,
                    telegram_message_id=message.get("message_id")
                )

                # Responder a Telegram con el veredicto formateado
                reply_text = self.format_telegram_reply(evaluation, capture_label=capture_label)
                await self.send_message(chat_id, reply_text)

        except Exception as e:
            error_msg = f"❌ *Error al procesar con IA:* {str(e)}"
            print(error_msg)
            await self.send_message(chat_id, error_msg)


telegram_service = TelegramService()
