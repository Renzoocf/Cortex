from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Optional


class Settings(BaseSettings):
    APP_ENV: str = "development"
    PORT: int = 8000
    DEBUG: bool = True

    # Telegram
    TELEGRAM_BOT_TOKEN: str = ""
    ALLOWED_TELEGRAM_CHAT_ID: Optional[int] = None

    @field_validator("ALLOWED_TELEGRAM_CHAT_ID", mode="before")
    @classmethod
    def parse_optional_int(cls, v):
        if v == "" or v is None:
            return None
        return int(v)

    # Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
