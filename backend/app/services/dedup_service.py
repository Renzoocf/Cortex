import re
import unicodedata
from typing import Any, Dict, List, Optional, Set

STOPWORDS_ES = {
    "para", "como", "esta", "este", "esto", "estos", "estas", "unas", "unos",
    "sobre", "desde", "donde", "cuando", "quien", "cual", "pero", "porque",
    "entre", "hacia", "hasta", "contra", "todo", "toda", "todos", "todas",
    "cada", "algo", "nada", "mucho", "poco", "solo", "aqui", "alli", "idea",
    "proyecto", "sistema", "aplicacion", "usuario", "usuarios", "tiempo",
    "forma", "manera", "puede", "pueden", "hacer", "tener", "usar", "crear",
    "tiktok", "telegram", "video", "short", "shorts", "reels", "whatsapp",
}


class DedupService:
    """Detecta ideas repetidas ('Señal de Obsesión') mediante similitud léxica ligera."""

    def tokenize(self, text: str) -> Set[str]:
        if not text:
            return set()
        no_urls = re.sub(r"https?://\S+", " ", text)
        normalized = unicodedata.normalize("NFD", no_urls)
        without_accents = "".join(
            ch for ch in normalized if unicodedata.category(ch) != "Mn"
        ).lower()
        words = re.findall(r"[a-z0-9]+", without_accents)
        return {w for w in words if len(w) >= 4 and w not in STOPWORDS_ES}

    def find_duplicate(
        self,
        candidate_text: str,
        existing_ideas: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        cand_tokens = self.tokenize(candidate_text)
        if len(cand_tokens) < 2:
            return None

        best_match: Optional[Dict[str, Any]] = None
        best_score = 0.0

        for idea in existing_ideas:
            status = str(idea.get("status", "")).lower()
            if status in ("descartado", "lanzado"):
                continue

            haystack = " ".join(
                [
                    str(idea.get("title", "")),
                    str(idea.get("problem", "")),
                    str(idea.get("raw_input", "")),
                    str(idea.get("summary", "")),
                ]
            )
            idea_tokens = self.tokenize(haystack)
            if not idea_tokens:
                continue

            inter = len(cand_tokens & idea_tokens)
            if inter < 2:
                continue

            containment = inter / min(len(cand_tokens), len(idea_tokens))
            jaccard = inter / len(cand_tokens | idea_tokens)

            if containment >= 0.45 or jaccard >= 0.30:
                combined = containment * 0.65 + jaccard * 0.35
                if combined > best_score:
                    best_score = combined
                    best_match = idea

        return best_match


dedup_service = DedupService()
