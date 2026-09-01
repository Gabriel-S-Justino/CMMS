"""Ponto de entrada da API do CMMS."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler

from app.core.config import settings
from app.core.rate_limit import limiter
from app.routers import (
    anexos,
    ativos,
    auditoria,
    auth,
    dashboard,
    manutencoes,
    pecas,
    planos,
    prestadores,
    usuarios,
)
from app.schemas.common import CamelModel

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    # /docs e /redoc só em desenvolvimento.
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# --- Rate limiting (slowapi) ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# --- CORS: só as origens do .env ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(CamelModel):
    status: str
    app: str
    versao: str


@app.get(f"{settings.API_V1_PREFIX}/health", response_model=HealthResponse, tags=["health"])
def health() -> HealthResponse:
    """Rota pública de verificação de vida."""
    return HealthResponse(status="ok", app=settings.APP_NAME, versao="1.0.0")


for modulo in (
    auth,
    usuarios,
    ativos,
    dashboard,
    manutencoes,
    planos,
    prestadores,
    pecas,
    anexos,
    auditoria,
):
    app.include_router(modulo.router, prefix=settings.API_V1_PREFIX)
