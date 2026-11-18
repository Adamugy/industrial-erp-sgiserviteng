# Plano de deploy

**Decisão:** tudo na Render (mesmo workspace do NeuralVault) + base de dados no Neon.
O `render.yaml` na raiz cria os dois serviços de uma vez (Render → **New → Blueprint**).

| Peça | Serviço Render | Plano | Gasta horas free? |
|---|---|---|---|
| **Frontend** (`client/`) | `sgiserviteng-web` — Static Site | grátis | **Não** |
| **API** (`server/`) | `sgiserviteng-api` — Web Service (Docker) | free → starter | Sim (partilha as 750 h/mês com o NeuralVault) |
| **Base de dados** | Neon (`aws-eu-central-1`) | free | — |

> No plano free, a API adormece após ~15 min sem uso (primeiro pedido ~30–60 s).
> Se as 750 h do workspace se esgotarem, **todos** os serviços free (incl. NeuralVault) ficam suspensos até ao mês seguinte.
> Para uso real: API em `starter`.

## ✅ Estado atual (publicado em 18/11/2026)

| Peça | Onde | URL |
|---|---|---|
| Frontend | Render Static Site `sgiserviteng-web` (free) | https://sgiserviteng-web.onrender.com |
| API | Render Web Service `sgiserviteng-api` (Docker, free, Frankfurt) | https://sgiserviteng-api.onrender.com |
| Base de dados | Neon, projeto `sgiserviteng` (`aws-eu-central-1`), base `sgi_erp` | — |

- Ambos fazem deploy automático a partir do branch `claude/kind-gates-djvang` (mudar para `master` depois do merge: Render → Settings → Branch).
- Login apenas por email/palavra-passe (Google/Microsoft desativados até haver credenciais).
- Primeiro administrador: `admin@smartgear.pt` (criado com a mesma lógica do `create-admin`). A palavra-passe inicial foi entregue uma única vez; **alterar no Perfil → Alterar Password**.
- Base de dados começa vazia (sem seed de demonstração).
- `FRONTEND_URL` já inclui `https://sgi.smartgear.pt` para o domínio próprio.

### Domínio próprio `sgi.smartgear.pt`
1. Render → `sgiserviteng-web` → **Settings → Custom Domains → Add** → `sgi.smartgear.pt`.
2. No fornecedor DNS de `smartgear.pt`: registo **CNAME** `sgi` → `sgiserviteng-web.onrender.com`.
3. Esperar a verificação e o certificado HTTPS (automático). Não é preciso mudar mais nada.

### Segurança implementada (antes de publicar)
O bloqueador do `/register` foi resolvido: contas novas ficam pendentes até aprovação de um ADMIN,
`JWT_SECRET` é obrigatório, há rate limiting, CORS por lista e revisão de segurança feita.

## 0. Pré-requisitos (feito)

- [x] Tailwind compilado no build; sem CDNs em runtime.
- [x] App instalável (PWA): manifest, ícones, service worker.
- [x] `render.yaml` (Blueprint) e `netlify.toml` (alternativa).
- [x] Build do frontend testado num clone limpo.

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

## 3. Frontend

**Render (recomendado):** criado pelo Blueprint como `sgiserviteng-web`; definir `VITE_API_URL`.

**Alternativa — Netlify:**

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

1. Depois do primeiro deploy, copiar a URL do frontend (Render ou Netlify) para `FRONTEND_URL` na Render e reiniciar a API (CORS e Socket.io usam este valor).
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
| Bundle JS de ~570 KB (146 KB gzip) | Carregamento inicial mais lento em 4G | Code-splitting por rota (`React.lazy`) — melhoria futura |
| Google Fonts externo | Depende de terceiros | Opcional: self-host das fontes Inter/Outfit |

## 6. Rollback

- Render (frontend e API): **Events → Rollback**. Netlify: **Deploys → Publish deploy** anterior.
- Render: **Events → Rollback** para a versão anterior.
- Código: o trabalho visual está isolado no branch `claude/kind-gates-djvang` (local: `melhoria-visual`).
