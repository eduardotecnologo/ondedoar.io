# Contexto do Projeto — ondedoar.io

> Arquivo de referência para o assistente de IA. Sempre consulte este arquivo antes de iniciar uma nova feat, correção ou refatoração.

---

## Propósito

Plataforma de resposta a crises e solidariedade comunitária. Permite:

- Cadastrar e encontrar **pontos de coleta** de doações (alimentos, água, fraldas, roupas, voluntários, etc.)
- Reportar e consultar **pessoas desaparecidas**
- Reportar e consultar **animais desaparecidos**
- Registrar e gerenciar **pedidos de ajuda**
- Cadastrar **ruas interditadas** com mapa
- Consultar **risco por cidade** (enchentes, deslizamentos) e **alertas INMET**
- Painel **admin** para gestão de pedidos de ajuda, observabilidade e acessos

---

## Stack

| Camada          | Tecnologia                              |
| --------------- | --------------------------------------- |
| Framework       | Next.js 16 (App Router)                 |
| UI              | React 19 + Tailwind CSS 4               |
| Linguagem       | TypeScript 5                            |
| ORM             | Prisma 4 + PostgreSQL (Supabase)        |
| Auth            | NextAuth v4 (credentials + email/senha) |
| E-mail          | Resend (fallback: SMTP via nodemailer)  |
| Mapas           | Leaflet + react-leaflet                 |
| Testes          | Vitest + Testing Library                |
| Deploy          | Vercel (main branch)                    |
| Storage imagens | Supabase Storage                        |

---

## Estrutura de pastas relevante

```
app/
  page.tsx                  ← Home pública (Server Component)
  layout.tsx                ← Root layout com SessionProvider e TopMenu
  providers.tsx             ← SessionProvider wrapper
  middleware.ts             ← Protege /dashboard, /cadastrar, /admin
  actions/                  ← Server Actions (pontos, registro, encontrar, pedido-ajuda, etc.)
  admin/                    ← Painel admin (observabilidade, pedidos-ajuda)
  api/
    auth/[...nextauth]/     ← NextAuth handler
    geocode/                ← Reverse geocode via Nominatim ou OSM
    health/                 ← GET /api/health (healthcheck)
    track-visit/            ← POST /api/track-visit (rastreia visitas, filtra bots)
  acessos/                  ← Gateway de acesso admin (redireciona conforme role)
  health/                   ← Página de healthcheck visual
components/
  TopMenu.tsx               ← Menu superior (desktop + mobile)
  HomeMobileMenu.tsx        ← Menu flutuante da Home (mobile)
  MapaWrapper.tsx           ← Mapa de pontos de coleta
  MapaInterdicoesWrapper.tsx← Mapa de ruas interditadas
  VisitTracker.tsx          ← Client component que dispara track-visit
lib/
  prisma.ts                 ← Singleton do PrismaClient
  db.ts                     ← Helpers de banco (raw SQL)
  observability.ts          ← Funções de log de eventos de observabilidade
  city-risk.ts              ← Risco por cidade
prisma/
  schema.prisma             ← Schema principal
  postdeploy-checklist.sql  ← SQL de pós-deploy (rodar após deploys com schema novo)
```

---

## Modelos do banco (Prisma)

| Modelo Prisma        | Tabela real             | Descrição                      |
| -------------------- | ----------------------- | ------------------------------ |
| `User`               | `users`                 | Usuário autenticado            |
| `PasswordResetToken` | `password_reset_tokens` | Tokens de redefinição de senha |
| `TipoDoacao`         | `categorias`            | Categorias de doação           |
| `PontoColeta`        | `pontos_coleta`         | Pontos de coleta/voluntariado  |
| `PontoCategoria`     | `ponto_categorias`      | Relação N:N ponto↔categoria    |
| `RuaInterditada`     | `ruas_interditadas`     | Interdições de ruas            |
| `PedidoAjuda`        | `pedidos_ajuda`         | Pedidos de ajuda da comunidade |

### Tabelas fora do schema Prisma (raw SQL)

| Tabela                  | Origem                               | Finalidade                        |
| ----------------------- | ------------------------------------ | --------------------------------- |
| `observability_events`  | `prisma/postdeploy-checklist.sql`    | Log de eventos de observabilidade |
| `pessoas_desaparecidas` | raw SQL                              | Registro de pessoas desaparecidas |
| `animais_desaparecidos` | raw SQL                              | Registro de animais desaparecidos |
| `ponto_imagens`         | `prisma/add-ponto-imagens-table.sql` | Galeria de imagens por ponto      |

---

## Autenticação e Permissões

- **NextAuth** com provider `credentials` (email + senha com bcrypt).
- Middleware protege rotas: `/dashboard`, `/cadastrar`, `/admin`.
- **Admin** é definido por e-mail hardcoded em `app/page.tsx` e em páginas admin:
  - `edudeveloperctk@gmail.com`
  - `eduardotecnologo@hotmail.com`
- `canSeeAcessos` controla a seção de Monitoramento (24h) na Home e o link pro painel de acessos.

---

## Convenções de desenvolvimento

- **"push"** = coletar mudanças → rodar `npm run test` → **se algum teste falhar, parar e reportar; NÃO commitar** → fazer `git add` + `git commit` com mensagem Conventional Commits → atualizar `test-report.local.md` → atualizar `deploy-report.md` → atualizar `Contexto.md` → `git push` → entregar resumo do deploy.
- **Toda nova feat, fix ou mudança relevante deve ser refletida em `Contexto.md` e `deploy-report.md`** antes ou durante o push.
- **Commit só é feito se todos os testes passarem.** Se houver falha, reportar o erro e aguardar correção.
- Commits seguem **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:`.
- Server Actions ficam em `app/actions/`.
- Lógica de banco reutilizável fica em `lib/`.
- Componentes client obrigatoriamente têm `"use client"` no topo.
- Páginas admin sempre verificam sessão e role no server (não confiar só no middleware).
- Banco: **sem `DROP`, `TRUNCATE` ou `DELETE` em massa** nos scripts versionados — apenas operações idempotentes.

---

## Categorias de doação ativas

`ALIMENTO`, `AGUA`, `ROUPA`, `HIGIENE/LIMPEZA`, `MOVEIS`, `ELETRONICOS`, `ABRIGO ANIMAIS`, `ALIMENTO ANIMAIS`, `VOLUNTARIO`, `FRALDAS`, `DOCUMENTOS`, `TRANSPORTE`

---

## Backlog / Checklist de features

Itens pendentes no `checklist.md`:

- [ ] Login com Google
- [ ] Notícias
- [ ] Sistema de Estoque
- [ ] Se Liga — Boatos
- [ ] Voluntário de Limpeza
- [x] Categoria "Transporte" — **OK** (TRANSPORTE 🚛 com porte do veículo + data/hora disponível)
- [ ] Paginação nos cards de pontos da Home — **OK** (6 por página, server-side via `?page=N`)
- [ ] Notificação a cada novo registro
- [ ] Recolocação Profissional

---

## Observabilidade

- `GET /api/health` → status do serviço + banco + métricas (cadastros 24h, visitas 24h, top páginas).
- `POST /api/track-visit` → rastreamento de visitas com detecção de bots via `user-agent`.
- Tabela `observability_events` persiste eventos críticos (ações de encontrar, erros, bloqueios de auth).
- Dashboard em `/admin/observabilidade` (restrito a admin).
- Resumo na Home na seção "Monitoramento (24h)" (restrito a `canSeeAcessos`).

---

## Deploy

- **Plataforma**: Vercel (deploy automático no push para `main`).
- **Banco**: Supabase (PostgreSQL).
- Após deploys com alterações de schema, executar:
  ```bash
  npx prisma db execute --schema prisma/schema.prisma --file prisma/postdeploy-checklist.sql
  ```
- Variáveis de ambiente necessárias: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY` (ou `SMTP_*`), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
