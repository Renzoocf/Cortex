from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.enums import NicheEnum, IdeaStatusEnum, InputTypeEnum


class MVPStep(BaseModel):
    step: int = Field(description="Número de paso (1, 2, 3...)")
    task: str = Field(description="Acción concreta técnica para el MVP")
    completed: bool = Field(default=False, description="Estado de completado en el dashboard")


class ScoresBreakdown(BaseModel):
    pain_urgency: float = Field(
        ge=1.0, le=10.0,
        description="Dolor real y urgente que resuelve. ¿La gente ya paga por parches para esto?"
    )
    direct_monetization: float = Field(
        ge=1.0, le=10.0,
        description="Claridad y facilidad para cobrar desde el día 1 (SaaS, pago por uso, servicio)."
    )
    mvp_speed_weekend: float = Field(
        ge=1.0, le=10.0,
        description="Velocidad para construir y lanzar un MVP funcional en 48 horas (un fin de semana)."
    )
    content_potential: float = Field(
        ge=1.0, le=10.0,
        description="Potencial para generar videos de alto impacto, tutoriales o series en TikTok/Shorts."
    )


class GeminiStructuredEvaluation(BaseModel):
    """Esquema estricto exigido a Gemini para Structured Outputs"""
    title: str = Field(
        description="Título conciso y profesional del proyecto o idea (máx 5 palabras)."
    )
    niche: NicheEnum = Field(
        description="Nicho al que pertenece la idea."
    )
    scores: ScoresBreakdown = Field(
        description="Desglose numérico de los 4 criterios fundamentales (1.0 a 10.0)."
    )
    overall_score: float = Field(
        ge=1.0, le=10.0,
        description="Puntaje ponderado final del 1.0 al 10.0."
    )
    suggested_bucket: IdeaStatusEnum = Field(
        description="Bucket sugerido: 'congelador' si puntaje >= 8.0, 'contenido' si es para TikTok/redes, 'descartado' si puntaje < 6.0 o es inviable/humo. NUNCA 'en_foco' (eso lo decide el usuario)."
    )
    verdict: str = Field(
        description="Veredicto crítico, cínico y sin rodeos. Explica en 2 frases por qué tiene futuro o por qué es humo/pérdida de tiempo."
    )
    problem: str = Field(
        description="Definición precisa del problema real y a qué perfil exacto le duele."
    )
    tech_stack: List[str] = Field(
        description="Stack tecnológico mínimo y eficiente sugerido (ej. Next.js, FastAPI, Stripe, Whisper, etc.)."
    )
    mvp_checklist: List[MVPStep] = Field(
        description="Lista de 3 a 4 pasos estrictos y concretos para construir el MVP en un fin de semana."
    )


class IdeaCreate(BaseModel):
    raw_input: str
    input_type: InputTypeEnum = InputTypeEnum.TEXT
    telegram_message_id: Optional[int] = None
    title: str
    niche: NicheEnum
    status: IdeaStatusEnum = IdeaStatusEnum.CONGELADOR
    focus_slot: Optional[int] = None
    score: float
    scores_breakdown: Dict[str, float]
    verdict: str
    problem: str
    tech_stack: List[str]
    mvp_checklist: List[Dict[str, Any]]


class SimulateRequest(BaseModel):
    raw_text: str = Field(..., description="Idea en texto o transcripción simulada")
    niche_hint: Optional[str] = Field(None, description="Pista opcional de nicho")


class SwapSlotsRequest(BaseModel):
    new_idea_id: str
    incoming_slot: int = Field(ge=1, le=2)
    evicted_idea_id: str


class AuthRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    telegram_id: Optional[str] = None


class AuthLoginRequest(BaseModel):
    email: str
    password: str
