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

    # Auth (optional; for RBAC and audit changed_by)
    auth_disabled: bool = False
    api_key: str | None = None
    auth_default_user_id: str | None = None

    # JWT settings
    jwt_secret_key: str = "CHANGE-ME-IN-PRODUCTION"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 5
    jwt_refresh_token_expire_days: int = 7

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
