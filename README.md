# CMMS
## Terminal 1: 
cd ~/Documentos/CMMS
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

## Terminal 2:
cd ~/Documentos/CMMS/frontend
npx expo start --web --port 8082

Acesso em http://localhost:8082

* Ambiente produção:
cd ~/Documentos/CMMS
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d

Acesso em http://localhost:8081