import asyncio
import json
from typing import Optional, Union
from google import genai
from google.genai import types

from app.config import settings
from app.models.schemas import GeminiStructuredEvaluation
from app.prompts.evaluator import (
    SYSTEM_EVALUATOR_PROMPT,
    VOICE_CAPTURE_PROMPT,
    COMPLAINT_OCR_PROMPT,
)


class GeminiService:
    def __init__(self):
        self._client: Optional[genai.Client] = None

    @property
    def client(self) -> genai.Client:
        if not self._client:
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY no está configurada en el archivo .env")
            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return self._client

    async def evaluate_text_input(
        self,
        raw_text: str,
        extra_context: Optional[str] = None
    ) -> GeminiStructuredEvaluation:
        """
        Evalúa una idea enviada como texto o transcripción con Structured Output.
        """
        user_prompt = f"Analiza críticamente esta idea:\n\n{raw_text}"
        if extra_context:
            user_prompt += f"\n\nContexto adicional provisto:\n{extra_context}"

        response = await asyncio.to_thread(
            self.client.models.generate_content,
            model=settings.GEMINI_MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_EVALUATOR_PROMPT,
                response_mime_type="application/json",
                response_schema=GeminiStructuredEvaluation,
                temperature=0.2, # Baja temperatura para análisis frío y analítico
            )
        )

        return GeminiStructuredEvaluation.model_validate_json(response.text)

    async def evaluate_media_input(
        self,
        media_bytes: bytes,
        mime_type: str,
        caption: Optional[str] = None,
        media_kind: str = "generic"
    ) -> GeminiStructuredEvaluation:
        """
        Evalúa una nota de voz (.ogg, .mp3) o imagen/screenshot con Gemini Vision/Audio nativo.
        """
        if media_kind == "voice" or mime_type.startswith("audio/"):
            user_prompt = (
                f"{VOICE_CAPTURE_PROMPT}\n\n"
                "Transcribe internamente este audio y evalúa críticamente la idea propuesta."
            )
        elif media_kind == "image" or mime_type.startswith("image/"):
            user_prompt = (
                f"{COMPLAINT_OCR_PROMPT}\n\n"
                "Examina esta captura de pantalla y evalúa críticamente la oportunidad detectada."
            )
        else:
            user_prompt = "Examina y evalúa críticamente este contenido multimedia (audio/imagen)."

        if caption:
            user_prompt += f"\nNota o contexto que acompañaba al archivo: {caption}"

        media_part = types.Part.from_bytes(
            data=media_bytes,
            mime_type=mime_type
        )

        response = await asyncio.to_thread(
            self.client.models.generate_content,
            model=settings.GEMINI_MODEL,
            contents=[media_part, user_prompt],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_EVALUATOR_PROMPT,
                response_mime_type="application/json",
                response_schema=GeminiStructuredEvaluation,
                temperature=0.2,
            )
        )

        return GeminiStructuredEvaluation.model_validate_json(response.text)


gemini_service = GeminiService()
