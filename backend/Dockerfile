# API do CMMS — imagem enxuta, rodando como usuário não-root.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Proxies reversos confiáveis pelo uvicorn (lido por ele direto do ambiente).
# Vazio = nenhum: o IP do cliente é o do peer TCP e cabeçalhos X-Forwarded-*
# forjados são ignorados. O compose sobrescreve com o valor do .env.
ENV FORWARDED_ALLOW_IPS=""

WORKDIR /app

# libpq é necessária para o psycopg; curl serve ao healthcheck do compose.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Usuário não-root: dono apenas do código e do diretório de uploads.
RUN useradd --create-home --uid 1000 cmms \
    && mkdir -p /app/uploads \
    && chown -R cmms:cmms /app

USER cmms

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
