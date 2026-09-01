"""Configuração da aplicação, lida do ambiente via pydantic-settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Aplicação ---
    APP_NAME: str = "CMMS API"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    # --- Banco ---
    DATABASE_URL: str = "postgresql+psycopg://cmms:cmms@postgres:5432/cmms"

    # --- JWT ---
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    # Tokens de recuperação de senha e de download assinado
    RESET_TOKEN_EXPIRE_MINUTES: int = 30
    DOWNLOAD_TOKEN_EXPIRE_MINUTES: int = 10

    # --- CORS ---
    CORS_ORIGINS: str = "http://localhost:8081"

    # --- Uploads ---
    UPLOAD_DIR: str = "/app/uploads"
    MAX_UPLOAD_BYTES: int = 10 * 1024 * 1024  # 10 MB

    # --- Usuários iniciais (usados só pelo seed) ---
    # Sem default para as senhas de propósito: a app não sobe sem elas, em vez
    # de subir silenciosamente com uma senha de admin conhecida.
    # ADMIN_* é o administrador da empresa "Demo";
    # SUPERADMIN_* é o administrador da plataforma, na empresa "Plataforma".
    ADMIN_USERNAME: str = "admin"
    ADMIN_EMAIL: str = "admin@cmms.local"
    ADMIN_PASSWORD: str
    SUPERADMIN_USERNAME: str = "superadmin"
    SUPERADMIN_EMAIL: str = "superadmin@cmms.local"
    SUPERADMIN_PASSWORD: str

    @property
    def cors_origins_list(self) -> list[str]:
        return [origem.strip() for origem in self.CORS_ORIGINS.split(",") if origem.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
