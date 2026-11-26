import html
import re
from typing import Dict, Optional
from urllib.parse import quote_plus, urlparse

import httpx

URL_REGEX = re.compile(r"https?://[^\s<>\"']+", re.IGNORECASE)
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "es-PE,es;q=0.9,en;q=0.8",
}


class LinkExtractorService:
    """Extrae URLs y metadatos públicos de TikTok, YouTube, X/Twitter y páginas web con pool HTTP reutilizable."""

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def http_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=8.0,
                follow_redirects=True,
                limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
            )
        return self._client

    async def close(self):
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    def extract_url(self, text: str) -> Optional[str]:
        if not text:
            return None
        match = URL_REGEX.search(text)
        if not match:
            return None
        return match.group(0).rstrip(".,);!?")

    def detect_platform(self, url: str) -> str:
        host = urlparse(url).netloc.lower()
        if "tiktok.com" in host:
            return "tiktok"
        if "youtube.com" in host or "youtu.be" in host:
            return "youtube"
        if "instagram.com" in host:
            return "instagram"
        if "twitter.com" in host or "x.com" in host:
            return "twitter_x"
        return "web"

    def _extract_html_meta(self, html_text: str) -> Dict[str, str]:
        def _find_meta(prop: str) -> str:
            patterns = [
                rf'<meta[^>]+(?:property|name)=["\']{re.escape(prop)}["\'][^>]+content=["\']([^"\']+)["\']',
                rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']{re.escape(prop)}["\']',
            ]
            for pat in patterns:
                m = re.search(pat, html_text, re.IGNORECASE)
                if m:
                    return html.unescape(m.group(1)).strip()
            return ""

        title = _find_meta("og:title")
        if not title:
            title_match = re.search(r"<title[^>]*>(.*?)</title>", html_text, re.IGNORECASE | re.DOTALL)
            if title_match:
                title = html.unescape(re.sub(r"\s+", " ", title_match.group(1))).strip()

        description = _find_meta("og:description") or _find_meta("description")
        author = _find_meta("author")
        return {"title": title, "description": description, "author": author}

    async def _fetch_oembed(
        self, client: httpx.AsyncClient, endpoint: str, target_url: str
    ) -> Optional[Dict[str, str]]:
        res = await client.get(
            f"{endpoint}?url={quote_plus(target_url)}&format=json",
            headers=DEFAULT_HEADERS,
        )
        if res.status_code != 200:
            return None
        data = res.json()
        raw_html = data.get("html", "")
        clean_tweet = ""
        if raw_html:
            clean_tweet = html.unescape(re.sub(r"<[^>]+>", " ", raw_html))
            clean_tweet = re.sub(r"\s+", " ", clean_tweet).strip()
        return {
            "title": str(data.get("title") or clean_tweet or "").strip(),
            "author": str(data.get("author_name") or "").strip(),
            "description": clean_tweet,
        }

    async def fetch_link_metadata(self, url: str) -> Dict[str, str]:
        platform = self.detect_platform(url)
        title = ""
        author = ""
        description = ""

        try:
            client = self.http_client
            oembed_map = {
                "tiktok": "https://www.tiktok.com/oembed",
                "youtube": "https://www.youtube.com/oembed",
                "twitter_x": "https://publish.twitter.com/oembed",
            }
            if platform in oembed_map:
                oembed = await self._fetch_oembed(client, oembed_map[platform], url)
                if oembed:
                    title = oembed.get("title", "")
                    author = oembed.get("author", "")
                    description = oembed.get("description", "")

            if not title and not description:
                res = await client.get(url, headers=DEFAULT_HEADERS)
                if res.status_code < 400 and res.text:
                    meta = self._extract_html_meta(res.text[:250000])
                    title = meta["title"]
                    description = meta["description"]
                    author = author or meta["author"]
        except Exception:
            pass

        parts = [f"Plataforma detectada: {platform.upper()}", f"URL: {url}"]
        if author:
            parts.append(f"Autor: {author}")
        if title:
            parts.append(f"Título/Caption extraído: {title}")
        if description and description != title:
            parts.append(f"Descripción/Texto: {description}")

        return {
            "url": url,
            "platform": platform,
            "title": title,
            "author": author,
            "description": description,
            "context_summary": "\n".join(parts),
        }


link_extractor = LinkExtractorService()
