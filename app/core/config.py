"""Application configuration (pydantic-settings)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings from environment and .env."""

    app_name: str = "aura"
    app_version: str = "0.1.0"
    env: str = "development"
    debug: bool = False
    database_url: str = ""
    database_echo: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings.

    Returns:
        Loaded Settings instance.
    """
    return Settings()
