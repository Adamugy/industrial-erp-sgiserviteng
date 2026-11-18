# Plano de deploy — Netlify

O SGIServiteng tem três peças. Só a primeira vai para o Netlify:

| Peça | Tecnologia | Onde correr | Porquê |
|---|---|---|---|
| **Frontend** (`client/`) | Vite + React, build estático | **Netlify** | É HTML/CSS/JS estático — o caso ideal do Netlify |
| **API** (`server/`) | Express + Socket.io + Prisma | **Render** (Web Service com o `server/Dockerfile`) | O Netlify não mantém servidores ligados nem WebSockets (Socket.io) |
| **Base de dados** | PostgreSQL | **Neon** | O repositório já tem o workflow `.github/workflows/neon_workflow.yml` |

> Alternativas à Render para a API: Railway, Fly.io ou um VPS com o `docker-compose.yml`. O resto do plano não muda.

---

## 0. Pré-requisitos (feito neste branch)

- [x] Tailwind compilado no build (antes vinha de CDN em runtime — não é suportado em produção).
- [x] `netlify.toml` na raiz com base `client`, comando de build, Node 22, cache de assets e headers de segurança.
- [x] Build testado num clone limpo: `npm ci --prefix .. && npm run build` → `client/dist`.

## 1. Base de dados (Neon)

1. Criar projeto no Neon (região próxima dos utilizadores, ex.: `aws-eu-central-1`).
2. Copiar a connection string **com pooler** → será o `DATABASE_URL` da API.
3. Criar o schema a partir da máquina local ou do CI:
   ```bash
   cd server && DATABASE_URL="<url-neon>" npx prisma db push
   ```
4. (Opcional, só para ambiente de demo) `DATABASE_URL="<url-neon>" npm run db:seed` — cria os utilizadores `admin@sgiman.pt` etc. com a palavra-passe `123456`. **Não usar em produção real.**

## 2. API (Render)

1. New → **Web Service** → repositório `Adamugy/industrial-erp-sgiserviteng`.
2. Runtime **Docker**, Dockerfile `server/Dockerfile`, contexto `.` (raiz — o Dockerfile copia `connectors/`).
3. Variáveis de ambiente:
   | Nome | Valor |
   |---|---|
   | `DATABASE_URL` | URL do Neon (passo 1) |
   | `JWT_SECRET` | segredo longo e aleatório (`openssl rand -base64 48`) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `FRONTEND_URL` | URL final do Netlify, ex.: `https://sgiserviteng.netlify.app` |
   | `PORT` | `8080` (já é o default do Dockerfile) |
4. Health check path: `/health`.
5. Anotar a URL pública, ex.: `https://sgiserviteng-api.onrender.com`.

> ⚠️ No plano gratuito da Render a API adormece após inatividade (primeiro pedido demora ~30–60 s). Para uso real, usar um plano pago.

## 3. Frontend (Netlify)

1. **Add new site → Import an existing project → GitHub** → escolher o repositório.
2. O Netlify lê o `netlify.toml` automaticamente (base `client`, publish `dist`). Não é preciso preencher nada no formulário de build.
3. **Site configuration → Environment variables**:
   | Nome | Valor |
   |---|---|
   | `VITE_API_URL` | URL da API (passo 2), **sem** barra final |
4. Branch de produção: `master` (depois do merge deste trabalho). Para pré-visualizar antes do merge, ativar **Branch deploys** para `claude/kind-gates-djvang`.
5. (Opcional) Domínio próprio em **Domain management**, com HTTPS automático.

> `VITE_API_URL` é embutido no JavaScript **no momento do build**. Se mudar a URL da API, é preciso fazer **Trigger deploy → Clear cache and deploy**.

## 4. Ligar as peças

1. Depois do primeiro deploy, copiar a URL do Netlify para `FRONTEND_URL` na Render e reiniciar a API (CORS e Socket.io usam este valor).
2. Smoke test:
   - [ ] `https://<api>/health` responde `{"status":"ok"}`
   - [ ] Login com um utilizador funciona (sem erro de CORS na consola)
   - [ ] Dashboard carrega dados; notificações aparecem
   - [ ] "Abrir OS" → abre o fluxo SST Pré-OS
   - [ ] Em telemóvel: menu abre/fecha, tabelas deslizam na horizontal

## 5. Riscos e decisões pendentes

| Risco | Impacto | Mitigação |
|---|---|---|
| `FRONTEND_URL` aceita **uma** origem | Deploy Previews do Netlify (URLs diferentes) são bloqueados pelo CORS | Testar previews contra uma API de staging, ou (mudança no backend, a aprovar) aceitar uma lista de origens |
| Seed com palavra-passe `123456` | Acesso indevido | Não correr o seed em produção; criar utilizadores reais |
| Render free adormece | Primeiro acesso lento | Plano pago ou keep-alive |
| Bundle JS de ~520 KB | Carregamento inicial mais lento em 4G | Code-splitting por rota (`React.lazy`) — melhoria futura |
| Google Fonts externo | Depende de terceiros | Opcional: self-host das fontes Inter/Outfit |

## 6. Rollback

- Netlify: **Deploys → escolher deploy anterior → Publish deploy** (instantâneo).
- Render: **Events → Rollback** para a versão anterior.
- Código: o trabalho visual está isolado no branch `claude/kind-gates-djvang` (local: `melhoria-visual`).
