from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def _parse_iso_dt(value: Optional[str]) -> Optional[datetime]:
    if not value or not isinstance(value, str):
        return None
    try:
        cleaned = value.strip().replace("Z", "+00:00")
        dt = datetime.fromisoformat(cleaned)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def _normalize_status(raw: Any) -> str:
    val = str(raw or "").strip().lower()
    mapping = {
        "en foco": "en_foco",
        "en_foco": "en_foco",
        "congelador": "congelador",
        "contenido": "contenido",
        "lanzado": "lanzado",
        "descartado": "descartado",
    }
    return mapping.get(val, val)


class DigestService:
    """Construye el Resumen Semanal de Domingo para Telegram y el Dashboard."""

    def build_weekly_digest(
        self,
        ideas: List[Dict[str, Any]],
        now: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        ref_now = now or datetime.now(timezone.utc)

        counts = {
            "en_foco": 0,
            "congelador": 0,
            "contenido": 0,
            "lanzado": 0,
            "descartado": 0,
        }
        expired_focus: List[str] = []
        cold_freezer: List[str] = []
        obsession_ideas: List[Dict[str, Any]] = []
        freezer_candidates: List[Dict[str, Any]] = []

        for idea in ideas:
            status = _normalize_status(idea.get("status"))
            if status in counts:
                counts[status] += 1

            title = str(idea.get("title") or "Sin título")
            mentions = int(idea.get("mention_count") or 1)
            if mentions >= 2 and status not in ("descartado", "lanzado"):
                obsession_ideas.append(idea)

            if status == "en_foco":
                started = _parse_iso_dt(idea.get("focus_started_at"))
                if started and (ref_now - started).total_seconds() >= 48 * 3600:
                    overdue_h = int((ref_now - started).total_seconds() // 3600) - 48
                    expired_focus.append(f"{title} (+{max(1, overdue_h)}h vencido)")

            if status == "congelador":
                freezer_candidates.append(idea)
                touched = (
                    _parse_iso_dt(idea.get("last_touched_at"))
                    or _parse_iso_dt(idea.get("updated_at"))
                    or _parse_iso_dt(idea.get("created_at"))
                    or _parse_iso_dt(idea.get("created"))
                )
                if touched and (ref_now - touched).days >= 30:
                    cold_freezer.append(title)

        freezer_candidates.sort(
            key=lambda i: (float(i.get("score") or 0), int(i.get("mention_count") or 1)),
            reverse=True,
        )
        top_freezer = freezer_candidates[0] if freezer_candidates else None
        top_freezer_title = (
            f"{top_freezer.get('title')} ({float(top_freezer.get('score') or 0):.1f}/10)"
            if top_freezer
            else "Sin fichas pendientes"
        )

        lines = [
            "📊 *CORTEXFILTRO — Resumen de Domingo*",
            "",
            f"• *Total en bóveda:* {len(ideas)} ideas",
            f"• *En Foco:* {counts['en_foco']}/2 | *Congelador:* {counts['congelador']} | *Contenido:* {counts['contenido']}",
            f"• *Lanzados (cierre exitoso):* {counts['lanzado']} | *Descartados (humo):* {counts['descartado']}",
        ]

        if expired_focus:
            lines.append("")
            lines.append("⏰ *Alerta 48h en Foco:*")
            for item in expired_focus:
                lines.append(f"  - {item}")

        if obsession_ideas:
            obsession_ideas.sort(key=lambda i: int(i.get("mention_count") or 1), reverse=True)
            top_obs = obsession_ideas[0]
            lines.append("")
            lines.append(
                f"🔥 *Señal de Obsesión:* _{top_obs.get('title')}_ "
                f"(mencionada {int(top_obs.get('mention_count') or 1)} veces)"
            )

        if top_freezer:
            lines.append("")
            lines.append(f"💎 *Mejor ficha esperando turno:* {top_freezer_title}")

        if cold_freezer:
            lines.append(
                f"🧊 *Purga recomendada:* {len(cold_freezer)} idea(s) llevan +30 días frías en el Congelador."
            )

        lines.append("")
        lines.append("🎯 _Decisión rápida: libera lo vencido y sube solo lo que tenga evidencia real._")

        return {
            "markdown_text": "\n".join(lines),
            "stats": {
                "total": len(ideas),
                **counts,
                "expired_focus_count": len(expired_focus),
                "cold_freezer_count": len(cold_freezer),
                "obsession_count": len(obsession_ideas),
                "top_freezer_title": top_freezer_title,
            },
        }


digest_service = DigestService()
