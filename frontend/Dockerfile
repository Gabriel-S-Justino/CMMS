# ============================================================
# CMMS Frontend — Build Expo Web
# ============================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Instala dependências primeiro para aproveitar o cache do Docker
COPY package*.json ./

RUN npm ci

# Copia o projeto
COPY . .

# Variável usada pelo Expo durante o build
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

# Gera a aplicação Web estática
RUN npx expo export --platform web


# ============================================================
# Produção — Nginx
# ============================================================

FROM nginx:alpine

# Remove configuração padrão
RUN rm /etc/nginx/conf.d/default.conf

# Configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o build do Expo
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
