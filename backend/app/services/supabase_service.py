from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from app.config import settings
from app.models.schemas import GeminiStructuredEvaluation
from app.models.enums import IdeaStatusEnum, InputTypeEnum
from app.services.dedup_service import dedup_service


class SupabaseService:
    def __init__(self):
        self._client: Optional[Client] = None

    @property
    def client(self) -> Client:
        if not self._client:
            if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
                raise ValueError("SUPABASE_URL y SUPABASE_KEY deben estar configuradas en .env")
            self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return self._client

    def insert_evaluated_idea(
        self,
        raw_input: str,
        input_type: InputTypeEnum,
        evaluation: GeminiStructuredEvaluation,
        telegram_message_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Inserta una idea evaluada en Supabase respetando la estructura del dossier.
        """
        data = {
            "raw_input": raw_input,
            "input_type": input_type.value,
            "telegram_message_id": telegram_message_id,
            "title": evaluation.title,
            "niche": evaluation.niche.value,
            "status": evaluation.suggested_bucket.value,
            "focus_slot": None, # Siempre entra en congelador, contenido o descartado
            "score": round(evaluation.overall_score, 1),
            "scores_breakdown": evaluation.scores.model_dump(),
            "verdict": evaluation.verdict,
            "problem": evaluation.problem,
            "tech_stack": evaluation.tech_stack,
            "mvp_checklist": [step.model_dump() for step in evaluation.mvp_checklist],
            "mention_count": 1,
            "mention_notes": [],
            "evidence_level": "intuicion"
        }

        response = self.client.table("ideas").insert(data).execute()
        return response.data[0] if response.data else data

    def list_all_ideas(self) -> List[Dict[str, Any]]:
        """Retorna todas las ideas ordenadas por fecha de creación descendente."""
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            return []
        res = self.client.table("ideas").select("*").order("created_at", desc=True).execute()
        return res.data or []

    def find_similar_idea(self, candidate_text: str) -> Optional[Dict[str, Any]]:
        """Busca si ya existe una idea equivalente trayendo solo las columnas ligeras necesarias."""
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            return None
        res = (
            self.client.table("ideas")
            .select("id,title,status,problem,raw_input,score,mention_count,mention_notes")
            .not_.in_("status", [IdeaStatusEnum.DESCARTADO.value, IdeaStatusEnum.LANZADO.value])
            .order("created_at", desc=True)
            .execute()
        )
        return dedup_service.find_duplicate(candidate_text, res.data or [])

    def register_obsession_mention(
        self,
        idea_id: str,
        existing_idea: Dict[str, Any],
        new_note: str
    ) -> Dict[str, Any]:
        """Incrementa la Señal de Obsesión y fusiona la nueva mención en la ficha existente."""
        current_mentions = int(existing_idea.get("mention_count") or 1)
        next_mentions = current_mentions + 1
        notes = list(existing_idea.get("mention_notes") or [])
        notes.append({
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "note": (new_note or "")[:240]
        })
        current_score = float(existing_idea.get("score") or 8.0)
        boosted_score = min(9.8, round(current_score + 0.2, 1))

        res = self.client.table("ideas").update({
            "mention_count": next_mentions,
            "mention_notes": notes,
            "score": boosted_score
        }).eq("id", idea_id).execute()
        return res.data[0] if res.data else {
            **existing_idea,
            "mention_count": next_mentions,
            "mention_notes": notes,
            "score": boosted_score
        }

    def mark_idea_launched(self, idea_id: str, closing_note: Optional[str] = None) -> Dict[str, Any]:
        """Cierra el ciclo del proyecto pasándolo a 'lanzado' y liberando su slot."""
        now_iso = datetime.now(timezone.utc).isoformat()
        payload: Dict[str, Any] = {
            "status": IdeaStatusEnum.LANZADO.value,
            "focus_slot": None,
            "focus_started_at": None,
            "launched_at": now_iso,
        }
        if closing_note is not None:
            payload["closing_note"] = closing_note
        res = self.client.table("ideas").update(payload).eq("id", idea_id).execute()
        return res.data[0] if res.data else payload

    def get_active_focus_slots(self) -> List[Dict[str, Any]]:
        """
        Devuelve los proyectos que ocupan los slots activos (máximo 2).
        """
        res = self.client.table("ideas")\
            .select("*")\
            .eq("status", IdeaStatusEnum.EN_FOCO.value)\
            .order("focus_slot")\
            .execute()
        return res.data or []

    def swap_focus_slot(self, new_idea_id: str, slot: int, evicted_idea_id: str) -> Dict[str, Any]:
        """
        Aplica la regla anti-saturación:
        Envía la idea desalojada al 'congelador' y coloca la nueva en el slot indicado (1 o 2).
        """
        # 1. Desalojar la idea previa y liberarle el slot
        self.client.table("ideas").update({
            "status": IdeaStatusEnum.CONGELADOR.value,
            "focus_slot": None,
            "focus_started_at": None
        }).eq("id", evicted_idea_id).execute()

        # 2. Asignar el nuevo proyecto al slot activo e iniciar reloj de 48h
        res = self.client.table("ideas").update({
            "status": IdeaStatusEnum.EN_FOCO.value,
            "focus_slot": slot,
            "focus_started_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", new_idea_id).execute()

        return res.data[0] if res.data else {}

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """
        Consulta las métricas consolidadas para las 3 KPI Cards.
        """
        res = self.client.table("dashboard_kpis").select("*").execute()
        if res.data:
            return res.data[0]
        return {
            "en_foco_count": 0,
            "congelador_count": 0,
            "contenido_count": 0,
            "descartados_count": 0,
            "score_promedio": 0.0,
            "total_procesadas": 0
        }

    def update_idea(self, idea_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Actualiza campos de una idea en Supabase."""
        res = self.client.table("ideas").update(updates).eq("id", idea_id).execute()
        return res.data[0] if res.data else updates

    def delete_idea(self, idea_id: str) -> bool:
        """Elimina una idea por ID en Supabase."""
        res = self.client.table("ideas").delete().eq("id", idea_id).execute()
        return bool(res.data)

    def clear_all_ideas(self) -> int:
        """Elimina todas las ideas de Supabase (inicio en limpio)."""
        res = self.client.table("ideas").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        return len(res.data) if res.data else 0

    def register_user(self, email: str, password: str, full_name: str, telegram_id: Optional[str] = None) -> Dict[str, Any]:
        """Crea un usuario real en Supabase Auth con confirmación inmediata."""
        metadata = {
            "full_name": full_name,
            "role": "Creador",
            "telegram_id": telegram_id or ""
        }
        res = self.client.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": metadata
        })
        user = res.user
        return {
            "id": user.id,
            "email": user.email,
            "full_name": full_name,
            "role": "Creador"
        }

    def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Inicia sesión con credenciales reales en Supabase Auth."""
        res = self.client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        user = res.user
        metadata = user.user_metadata or {}
        return {
            "id": user.id,
            "email": user.email,
            "full_name": metadata.get("full_name") or email.split("@")[0].capitalize(),
            "role": metadata.get("role") or "Creador",
            "access_token": res.session.access_token if res.session else ""
        }


supabase_service = SupabaseService()
