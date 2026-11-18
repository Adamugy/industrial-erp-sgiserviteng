# Roadmap SGIServiteng — próximas melhorias

Pedido: app publicado e a funcionar como desktop; conversão PDF → Excel/Word fiel;
perfis CEO (all-in-one), Secretária, Gestor QA e Funcionários; agentes de IA que seguem
as regras do CEO; integrações Google Account e Microsoft 365.

Legenda de esforço: **P** (dias) · **M** (1–2 semanas) · **G** (3+ semanas).

---

## Fase 0 — Segurança e publicação (bloqueia o deploy)

| # | Item | Estado | Esforço |
|---|---|---|---|
| 0.1 | App instalável como desktop (PWA: manifest, ícones, service worker, atalhos) | ✅ feito | — |
| 0.2 | `render.yaml` (Static Site + API) | ✅ feito | — |
| 0.3 | **Fechar `POST /api/auth/register`**: hoje é público e aceita `role: ADMIN` → só um ADMIN autenticado cria utilizadores | ⛔ precisa de aprovação (mexe na API) | P |
| 0.4 | Remover fallback `JWT_SECRET = 'secret'` (falhar no arranque se não existir) | ⛔ idem | P |
| 0.5 | Esconder em produção o login demo (campos pré-preenchidos `admin@sgiman.pt / 123456` e botões "Login Rápido") | ⛔ idem (frontend) | P |
| 0.6 | Rate-limit no login (força bruta) | proposta | P |
| 0.7 | Primeiro admin criado com palavra-passe forte (sem seed demo em produção) | proposta | P |

**Desktop:** a PWA instala-se em Windows/macOS/ChromeOS a partir do Chrome/Edge (ícone ⊕ na barra de
endereço) e abre em janela própria, com atalhos para Obras, Agenda e SST. Se for preciso acesso a pastas
locais, impressoras ou modo offline completo, o passo seguinte é empacotar com **Tauri** (leve) — só se a
PWA não chegar.

---

## Fase 1 — Perfis por função + login Google / Microsoft 365

### 1A. Perfis (M)

O sistema já tem 4 perfis (`ADMIN`, `MANAGER`, `SAFETY`, `TECH`) com `RoleGuard` por rota.
Proposta de mapeamento (sem perder o que existe):

| Perfil pedido | Perfil no sistema | O que vê / faz |
|---|---|---|
| **CEO (all-in-one)** | `ADMIN` | Tudo + painel executivo consolidado (KPIs financeiros, ISO, SST, obras) |
| **Secretária** | **novo `SECRETARY`** | Agenda, CRM/Propostas, contactos, documentos, conversões PDF; sem configurações |
| **Gestor QA** | `SAFETY` (renomear rótulo para "Gestor QA/SST") | Qualidade ISO 9001/45001, NCs, auditorias, relatórios |
| **Funcionários** | `TECH` | As suas OS, diário, checklists SST, perfil |
| (mantém-se) | `MANAGER` | Gestão de obras/equipas |

Trabalho: enum Prisma + migração, `RoleGuard`/sidebar por perfil, dashboards específicos por perfil,
gestão de utilizadores no próprio app (o CEO convida e atribui perfis).

### 1B. Integrações principais (M–G)

| Integração | Para quê | Tecnologia |
|---|---|---|
| **Entrar com Google / Microsoft** (SSO) | Login sem palavra-passe; Microsoft para contas empresariais | OAuth 2.0 / OpenID Connect (Google Identity, Microsoft Entra ID) |
| **Calendário** | A "Agenda Integrada" sincroniza com Google Calendar / Outlook (os botões "Sincronizar Gmail" e "MSP Sync" já existem, hoje simulados) | Google Calendar API, Microsoft Graph |
| **Email** | Notificações, envio de propostas, agente da Secretária | Gmail API, Microsoft Graph (Outlook) |
| **Ficheiros** | Guardar/abrir documentos e resultados das conversões | Google Drive, OneDrive / SharePoint |

Pré-requisitos do lado da empresa: projeto no Google Cloud Console e registo de app no Azure (Entra ID),
domínio verificado e ecrã de consentimento aprovado (pode levar dias para scopes de Gmail/Drive).
Tokens guardados cifrados no servidor; nunca no browser.

---

## Fase 2 — Conversão de documentos PDF → Excel / Word (M–G)

**Expectativa honesta:** "exatamente igual ao PDF" depende do tipo de PDF.
- PDF digital (gerado por software): conversão de alta fidelidade é viável.
- PDF digitalizado (scan/foto): precisa de OCR; tabelas ficam bem, o layout exato nem sempre.

**Arquitetura proposta (híbrida):**

| Caso | Motor | Saída |
|---|---|---|
| Layout fiel (Word) e tabelas de PDFs digitais | Serviço de conversão dedicado (ex.: Adobe PDF Services "Export PDF", ou LibreOffice no servidor como opção gratuita com menos fidelidade) | `.docx` / `.xlsx` |
| Tabelas complexas, scans, faturas, mapas de medições | **Claude** com o PDF como entrada (até 600 páginas / 32 MB por pedido) + *structured outputs* para devolver as tabelas em JSON validado | `.xlsx` gerado no servidor (ex.: exceljs) |
| Verificação | Claude compara o resultado com o PDF e assinala células duvidosas | relatório de confiança |

Fluxo no app: carregar PDF → escolher Excel ou Word → tarefa em segundo plano com progresso → pré-visualizar
→ descarregar ou guardar no Drive/OneDrive. Ficheiros em armazenamento de objetos, não na base de dados.

---

## Fase 3 — Agentes de IA com as "regras do CEO" (G)

**Ideia:** cada perfil tem um assistente que só pode fazer o que esse perfil pode fazer, e todos seguem
um **Regulamento do CEO** (políticas, prioridades, limites de aprovação) que o CEO edita no app.

| Agente | Perfil | Exemplos |
|---|---|---|
| Briefing executivo | CEO | Resumo diário: obras atrasadas, NCs abertas, propostas por fechar, alertas SST |
| Assistente administrativo | Secretária | Rascunhos de email/propostas, marcar reuniões, converter e arquivar documentos |
| Assistente de qualidade | Gestor QA | Verificar NCs vs ISO 9001/45001, preparar auditorias, lembrar calibrações |
| Assistente de campo | Funcionários | Ajudar a preencher checklists SST, diário de obra, dúvidas de procedimento |

**Regras de segurança (não negociáveis):**
1. O agente atua **com as permissões do utilizador** — as ferramentas chamam a API existente com o JWT do
   utilizador, por isso o `RoleGuard`/backend continuam a decidir o que é permitido.
2. **Ações com impacto exigem aprovação humana** (enviar email, criar OS, adjudicar proposta).
3. Tudo fica registado no `AuditLog` (já existe no schema).
4. O Regulamento do CEO é versionado; cada resposta guarda a versão usada.

**Tecnologia recomendada (Claude API, TypeScript):**
- Modelo: `claude-opus-5-5` (o mais recente da linha Opus).
- **Managed Agents** (beta): a Anthropic aloja o ciclo do agente; as ferramentas do SGI entram como
  *custom tools* que chamam a nossa API. Atenção: é beta, cobra tempo de sessão além dos tokens e guarda o
  histórico das sessões até ser apagado.
  Alternativa: alojar o ciclo no nosso backend Express com a Messages API + *Tool Runner* do SDK
  `@anthropic-ai/sdk` — mais controlo sobre os dados, mais código nosso.
- Regulamento do CEO no *system prompt* com **prompt caching** (reduz custo e latência em pedidos repetidos);
  atualizações a meio da conversa via mensagens de sistema.
- Antes de produção: um conjunto de testes (evals) com casos reais para medir qualidade e custo.

---

## Ordem sugerida

1. **Fase 0** (segurança) → publicar na Render.
2. **Fase 1A** perfis + **1B** login Google/Microsoft (base para tudo o resto).
3. **Fase 2** conversão PDF (valor imediato para Secretária e QA).
4. **Fase 3** agentes, começando pelo briefing do CEO (só leitura, risco baixo) e depois os que executam ações.

## Decisões necessárias

- [ ] Aprovar as correções de segurança da Fase 0 (mexem na API).
- [ ] API na Render: plano free ou Starter.
- [ ] Motor de conversão: serviço pago de alta fidelidade vs. opção gratuita.
- [ ] Agentes: Managed Agents (alojado pela Anthropic) vs. ciclo alojado no nosso backend.
- [ ] Contas Google Cloud / Azure da empresa para as integrações.
