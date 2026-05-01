# Idearium — Roadmap do Backend

> Roadmap pragmático para Kae, backend dev solo, levar Idearium do zero ao MVP em produção.
> Premissa: **visão consolidada em `VISAO.md`** (SSOT). Base de UI: `mockups/home/index.html`.
> O backend existe para alimentar essa interface e nada além.
>
> **Decisões fundadoras já resolvidas** (ver `VISAO.md` §10): visão B, login email/senha + GitHub + Google, RFCs editáveis com histórico, identidade pseudônima, pós-moderação, comentários lineares, **bilíngue pt-BR/en desde o MVP**, hospedagem gerenciada.

---

## Status atual (atualizado 2026-05-01)

Branch `development`. **106 testes e2e passando**. Endpoints públicos `/labs`, `/rfcs`, `/tags`, `/search`, perfis e o fluxo completo de auth+inscrições+comentários estão funcionais.

| Etapa | Status | Commit | Notas |
|-------|--------|--------|-------|
| 0. Setup esqueleto | ✅ feito | `22b10b6` | Falta criar conta Sentry e fazer 1º deploy (Railway/Fly) |
| 1. Auth + Users | ✅ feito | `3fbbdb2` | email/senha + JWT + refresh. OAuth fica para Etapa 6 |
| 1.5 Tests infra | ✅ feito | `8bccf77` | Postgres como service no CI, suite e2e configurada |
| 2. Labs + RFCs CRUD | ✅ feito | `af579f2` | Sequência Postgres atômica para RFC-NNNN |
| 3. Inscrições + Comentários | ✅ feito | `a343d0b` | Transição IN_DISCUSSION ↔ IN_BUILDING automática |
| 4. Tags + Busca FTS | ✅ feito | `e9cebb6` | Cross-language adiada (ver §6.1) |
| **5. Notificações** | ⏳ próxima | — | Síncronas, sem WebSocket |
| 6. OAuth + email + verify | ⏳ planejada | — | GitHub + Google + Resend |
| 7. Moderação leve | ⏳ planejada | — | Reports, hide, suspend |
| 8. Hardening + RSS + API pública | ⏳ planejada | — | Rate limit, CSP, OpenAPI export |
| 9. Polimento + go-live | ⏳ planejada | — | Seeds reais, status page |

### Pendências externas (não-código)
- [ ] Criar projeto no Sentry e adicionar `SENTRY_DSN` ao `.env` (visualmente: Etapa 0 só fica 100% quando o primeiro erro real for capturado)
- [ ] Decidir provedor (Railway / Fly.io) e fazer primeiro deploy do branch `main` (e configurar deploy automático)
- [ ] Provisionar Postgres gerenciado em produção (Railway / Neon / Supabase)
- [ ] (opcional) Configurar domínio `idearium.community`
- [ ] Quando começar a Etapa 6: criar OAuth apps no GitHub e no Google Cloud Console; abrir conta no Resend

---

## 0. Princípios deste roadmap

1. **MVP feio e funcional > MVP bonito e ausente.** Cada etapa entrega um pedaço usável em produção.
2. **Stack mínima viável.** Cada dependência adicionada precisa pagar uma dor concreta. Sem otimismo de escala.
3. **Schema-first, não code-first.** Antes de cada etapa, o schema do banco está desenhado e revisado. ORM gera migration.
4. **Endpoints são contrato com o frontend.** A cada etapa, há documentação OpenAPI publicada e testes de contrato.
5. **Push deploy por etapa.** Não acumular 4 etapas para deployar tudo junto. CI/CD em produção desde a Etapa 1.

---

## 1. Stack final recomendada (justificativa por item)

| Camada | Escolha | Por quê |
|--------|---------|---------|
| Linguagem | TypeScript 5 | Tipos são essenciais no domínio (RFCs, status, papéis). |
| Framework | NestJS 10 | Já estava na documentação. Modular, testável, decorators reduzem boilerplate. |
| Runtime | Node.js 20 LTS | Suportado até 2026, ecossistema maduro. |
| ORM | **Prisma 5** | Migrations declarativas, types gerados, DX superior ao TypeORM em 2026. |
| Banco | PostgreSQL 16 | Single source of truth. JSONB para metadados flexíveis. FTS para busca. |
| Auth | Passport + JWT (access curto + refresh longo) | Padrão NestJS. 3 estratégias: local (email/senha), GitHub, Google. |
| i18n | nestjs-i18n | Mensagens de sistema, validações e emails em pt-BR/en desde o MVP. |
| Validação | class-validator + class-transformer | Integrado ao NestJS, DTOs ficam declarativos. |
| Hash | argon2 | Mais seguro que bcrypt em 2026. |
| Logs | pino + pino-pretty (dev) | JSON estruturado, baixo overhead. Sem ELK no MVP. |
| Erros | Sentry (free tier) | 5k erros/mês de graça, alertas ok. |
| Email transacional | Resend ou Postmark | Free tier generoso, API simples. |
| Storage de arquivos | Cloudflare R2 (S3-compatible) | Egress grátis, $0.015/GB. Para avatares e thumbs. |
| Hosting API | Railway ou Fly.io | Deploy via push, Postgres incluído, ~$5–15/mês para o MVP. |
| CI/CD | GitHub Actions | Lint + testes + deploy. |
| Container | Docker + docker-compose (dev local) | Sem Kubernetes. Sem Nx. |

### Stack adiada (não no MVP, vem com a dor)

| Item | Quando adicionar |
|------|------------------|
| Redis | Quando feed lento ou sessões precisarem ser invalidadas em massa. |
| Bull/BullMQ | Primeiro job assíncrono real (envio de email em batch, indexação). |
| Elasticsearch / Meilisearch | Quando Postgres FTS começar a engasgar (>10k RFCs ou requisitos de fuzzy/multi-idioma). |
| WebSockets | Quando notificação em tempo real virar requisito de produto. |
| Kubernetes | Provavelmente nunca. Se chegar lá, contrate alguém. |

---

## 2. Modelo de dados — visão consolidada

Schema canonizado para a visão B. Difere significativamente do `idearium_ssot.md` (sem `votes`, sem `points`, sem `badges`, sem `transactions`).

```prisma
// Núcleo

model User {
  id            String   @id @default(uuid())
  username      String   @unique           // @luisa
  email         String   @unique
  passwordHash  String?                    // null se só OAuth
  githubId      String?  @unique
  googleId      String?  @unique
  fullName      String?                    // opcional (pseudônimo respeitado)
  bio           String?
  avatarUrl     String?
  preferredLocale String @default("pt-BR") // "pt-BR" | "en"
  emailVerified Boolean  @default(false)
  isActive      Boolean  @default(true)
  role          UserRole @default(USER)    // USER | MAINTAINER
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  rfcs           Rfc[]    @relation("AuthoredRfcs")
  enrollments    Enrollment[]
  comments       Comment[]
  builderProfile BuilderProfile?
}

enum UserRole { USER MAINTAINER }

model Lab {
  id          String   @id @default(uuid())
  slug        String   @unique           // "educacao", "cidades"
  name        String                     // "Lab. Educação"
  glyph       String                     // "◈" — o caractere usado no mockup
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  rfcs        Rfc[]
}

model Rfc {
  id            String     @id @default(uuid())
  number        Int        @unique         // 7 → exibido como RFC-0007
  slug          String     @unique         // "biblioteca-cooperativa-de-bairro"
  title         String
  summary       String                     // 1-2 frases (preview)
  body          String                     // markdown
  locale        String                     // "pt-BR" | "en" — idioma do conteúdo
  status        RfcStatus  @default(DRAFT)
  visibility    Visibility @default(PUBLIC)
  authorId      String
  author        User       @relation("AuthoredRfcs", fields: [authorId], references: [id])
  labId         String
  lab           Lab        @relation(fields: [labId], references: [id])
  // Tradução comunitária opcional: aponta para a RFC original
  translationOfId String?
  translationOf Rfc?       @relation("Translations", fields: [translationOfId], references: [id])
  translations  Rfc[]      @relation("Translations")
  publishedAt   DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  enrollments   Enrollment[]
  comments      Comment[]
  versions      RfcVersion[]
  tags          TagsOnRfcs[]
  reports       Report[]   @relation("RfcReports")

  @@index([status, publishedAt])
  @@index([labId])
  @@index([locale, status])
}

model RfcVersion {
  id        String   @id @default(uuid())
  rfcId     String
  rfc       Rfc      @relation(fields: [rfcId], references: [id], onDelete: Cascade)
  body      String
  version   Int
  createdBy String
  createdAt DateTime @default(now())

  @@unique([rfcId, version])
}

enum RfcStatus {
  DRAFT          // só autor vê
  IN_DISCUSSION  // publicada, aceitando inscritos e comentários
  IN_BUILDING    // tem builders ativos
  PUBLISHED      // foi efetivamente construída
  ARCHIVED       // sem atividade há muito tempo
}

enum Visibility {
  PUBLIC
  UNLISTED      // acessível por link
  PRIVATE       // só autor (rascunho)
}

// Inscrições de builders

model Enrollment {
  id        String   @id @default(uuid())
  rfcId     String
  rfc       Rfc      @relation(fields: [rfcId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      EnrollmentRole @default(BUILDER)
  message   String?  // "ei, tenho experiência com X"
  createdAt DateTime @default(now())
  leftAt    DateTime?

  @@unique([rfcId, userId])
  @@index([userId])
}

enum EnrollmentRole {
  BUILDER
  REVIEWER
  MAINTAINER
}

model BuilderProfile {
  userId       String   @id
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  headline     String?  // "front + ilustração · procura cultura"
  topics       String[] // ["cultura", "saúde"]
  isOpenToWork Boolean  @default(true)
  updatedAt    DateTime @updatedAt
}

// Discussão

model Comment {
  id         String   @id @default(uuid())
  rfcId      String
  rfc        Rfc      @relation(fields: [rfcId], references: [id], onDelete: Cascade)
  authorId   String
  author     User     @relation(fields: [authorId], references: [id])
  body       String   // markdown
  locale     String?  // idioma do comentário (opcional, default = autor.preferredLocale)
  isEdited   Boolean  @default(false)
  isDeleted  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([rfcId, createdAt])
}

// Tags livres (folksonomy)

model Tag {
  id        String   @id @default(uuid())
  slug      String   @unique
  name      String
  rfcs      TagsOnRfcs[]
  createdAt DateTime @default(now())
}

model TagsOnRfcs {
  rfcId String
  tagId String
  rfc   Rfc @relation(fields: [rfcId], references: [id], onDelete: Cascade)
  tag   Tag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([rfcId, tagId])
}

// Notificações

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // "new_enrollment", "new_comment", etc
  title     String
  body      String?
  payload   Json?
  readAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId, readAt])
}

// Reportes / moderação leve

model Report {
  id           String   @id @default(uuid())
  reporterId   String
  targetType   String   // "rfc", "comment", "user"
  targetId     String
  reason       String
  status       ReportStatus @default(OPEN)
  resolvedAt   DateTime?
  createdAt    DateTime @default(now())
}

enum ReportStatus { OPEN RESOLVED DISMISSED }
```

**Diferenças propositais vs. brainstorms iniciais (descartados):**

- ❌ Removido: `votes`, `bookmarks`, `user_points`, `badges`, `user_badges`, `progress_updates`, `transactions`, `analytics_events`. Não pertencem à visão (ver `VISAO.md` §9 — anti-features).
- ✅ Adicionado: `RfcVersion` (RFCs precisam ter histórico — decisão fundadora #3), `BuilderProfile` (mockup tem aside "Builders em busca").
- ✅ `number` separado de `id` para preservar a estética RFC-0007 sem expor UUIDs na URL.
- ✅ **`locale` em `Rfc` e `Comment`**, `preferredLocale` em `User` — bilíngue desde o MVP (decisão fundadora #7).
- ✅ **`googleId`** em `User` — terceira estratégia OAuth (decisão fundadora #2).
- ✅ **`UserRole`** desde o início — pseudonimato + pós-moderação demandam papel administrativo claro (decisões #4 e #5).
- ✅ **`Rfc.translationOf`** — permite tradução comunitária opcional (uma RFC `en` pode apontar para sua original `pt-BR`).

---

## 2.5. Estado atual do código — referência rápida

> Esta seção é o "TL;DR" do que já existe no repo, para Claude (ou Kae voltando depois) entender rápido o ponto em que estamos sem ler todas as etapas.

### Repo

```
idearium/  (branch development)
├── apps/api/                    ← backend NestJS (Kae)
│   ├── src/
│   │   ├── auth/                ← register, login, refresh rotativo, logout, /me
│   │   ├── users/               ← /users/me, /users/:username, /users/:username/rfcs
│   │   ├── builders/            ← BuilderProfile + lista para sidebar
│   │   ├── labs/                ← /labs com contadores
│   │   ├── rfcs/                ← CRUD, publish (sequence Postgres), versions, archive
│   │   ├── enrollments/         ← /rfcs/:id/enroll + transição IN_DISCUSSION ↔ IN_BUILDING
│   │   ├── comments/            ← lista, create, edit, soft delete
│   │   ├── tags/                ← /tags, /tags/:slug, POST /rfcs/:id/tags
│   │   ├── search/              ← FTS bilíngue via tsquery + ts_rank
│   │   ├── health/              ← /health com check de DB
│   │   ├── prisma/              ← PrismaService global
│   │   ├── common/              ← decorators, filters, pagination, slug.util
│   │   ├── config/              ← validateEnv (handcrafted, sem class-validator)
│   │   ├── i18n/{pt-BR,en}/     ← errors.json, validation.json, email.json
│   │   ├── instrument.ts        ← Sentry init (precisa ser primeiro import)
│   │   ├── app.module.ts
│   │   └── main.ts              ← Swagger /docs em dev, I18nValidationPipe global
│   ├── prisma/
│   │   ├── schema.prisma        ← User, BuilderProfile, RefreshToken, Lab, Rfc,
│   │   │                          RfcVersion, Enrollment, Comment, Tag, TagsOnRfcs
│   │   ├── migrations/          ← 4 migrations aplicadas
│   │   └── seed.ts              ← 6 labs do mockup
│   └── test/
│       ├── *.e2e-spec.ts        ← 9 suites, 106 testes
│       ├── helpers/             ← createTestApp, cleanDatabase, registerUser, createPublishedRfc
│       └── setup-e2e.ts         ← roda migrations + seed antes do Jest
├── apps/web/                    ← (não criado ainda — Gabriele faz)
├── mockups/home/index.html      ← referência de design
├── docker-compose.yml           ← Postgres 16 local
├── .github/workflows/ci.yml     ← lint + build + e2e com Postgres como service
├── VISAO.md                     ← SSOT do projeto
└── ROADMAP_BACKEND.md           ← este arquivo
```

### Endpoints públicos (resumo)

| Verbo | Path | Descrição | Auth |
|-------|------|-----------|------|
| `GET` | `/health` | health + db check | — |
| `POST` | `/auth/register` | criar conta | — |
| `POST` | `/auth/login` | login email/senha | — |
| `POST` | `/auth/refresh` | rotaciona tokens | — |
| `POST` | `/auth/logout` | revoga refresh | — |
| `GET` | `/auth/me` | user atual (compacto) | sim |
| `GET` | `/users/:username` | perfil público | — |
| `GET/PATCH` | `/users/me` | perfil próprio | sim |
| `GET` | `/users/:username/rfcs` | RFCs do user | — |
| `GET` | `/users/:username/enrollments` | inscrições do user | — |
| `GET` | `/builders` | lista paginada | — |
| `GET/PATCH` | `/builders/me` | upsert BuilderProfile | sim |
| `GET` | `/builders/:username` | profile específico | — |
| `GET` | `/labs` | labs + rfcsCount | — |
| `GET` | `/labs/:slug` | detalhe | — |
| `POST` | `/rfcs` | criar DRAFT | sim |
| `GET` | `/rfcs?lab=&status=&locale=&sort=` | feed | — |
| `GET` | `/rfcs/featured` | top 3 | — |
| `GET` | `/rfcs/:slug` | detalhe (rascunho 404 a outros) | opcional |
| `PATCH` | `/rfcs/:id` | edita; body novo cria versão | sim (autor) |
| `POST` | `/rfcs/:id/publish` | DRAFT → IN_DISCUSSION + número | sim (autor) |
| `POST` | `/rfcs/:id/archive` | → ARCHIVED | sim (autor) |
| `GET` | `/rfcs/:id/versions` | histórico | opcional |
| `POST/DELETE` | `/rfcs/:id/enroll` | inscrever-se / sair | sim |
| `GET` | `/rfcs/:id/enrollments` | inscritos ativos | opcional |
| `GET/POST` | `/rfcs/:id/comments` | discussão linear | sim para POST |
| `PATCH/DELETE` | `/comments/:id` | editar/deletar (autor) | sim |
| `GET` | `/rfcs/:id/tags` | tags da RFC | — |
| `POST` | `/rfcs/:id/tags` | sync tags da RFC | sim (autor) |
| `GET` | `/tags` | lista por uso | — |
| `GET` | `/tags/:slug` | tag + RFCs | — |
| `GET` | `/search?q=&locale=&lab=` | FTS por idioma | — |

### Decisões executivas tomadas durante a implementação

- **Refresh tokens** são opacos (random base64url 48 bytes), armazenados **hashados** (sha256) em `RefreshToken`. Rotação a cada refresh, com `revokedAt` para logout/audit.
- **Numeração de RFCs** via `nextval('rfc_number_seq')` — atribuída só na publicação, em transação atômica.
- **Versões** são snapshots do `body` apenas (não title/summary). Criação gera versão 1; edição só cria nova versão se body mudou de fato.
- **Tags** são criadas on-the-fly via slugify, sync substitui o set inteiro. `usageCount` é computado via `_count` (não denormalizado).
- **Status transições** das RFCs (`IN_DISCUSSION` ↔ `IN_BUILDING`) são automáticas via `EnrollmentsService.recomputeRfcStatus`, em transação após cada enroll/leave.
- **Comentários** soft-deletados retornam `body: '[removido]'` na API. Edição em comentário deletado dá 403.
- **Visibilidade de DRAFT**: rascunhos só aparecem ao autor (e `MAINTAINER`); rotas como `/rfcs/:slug`, `/rfcs/:id/comments`, `/rfcs/:id/versions`, `/rfcs/:id/enrollments` usam `OptionalJwtAuthGuard` para fazer essa diferenciação.
- **Sentry** carregado via `instrument.ts` (`import './instrument'` deve ser a primeira linha de `main.ts`).
- **i18n em dev** lê de `src/i18n/` direto (não `dist/i18n/`) para evitar `ENOENT` durante recompilação. Em prod e test, usa `__dirname/i18n`.

### Cross-language search — limite conhecido

A busca filtra por `locale` (`pt-BR` ou `en`, default `pt-BR`). Não há "buscar em tudo" porque o `search_vector` é construído com `regconfig` específico do idioma da RFC; uma `tsquery` em `simple` não casa com tokens stemmados. Se virar requisito, adicionar coluna `search_vector_simple` paralela (~30min).

### Variáveis de ambiente em uso

```env
NODE_ENV=development|test|production
PORT=3000
APP_URL=http://localhost:3000
WEB_URL=http://localhost:4200
APP_VERSION=0.1.0
LOG_LEVEL=debug|info|warn|error|fatal
DATABASE_URL=postgresql://idearium:idearium_dev@localhost:5432/idearium?schema=public
JWT_ACCESS_SECRET=<32-byte hex>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES_DAYS=30
SENTRY_DSN=               # vazio desabilita
SENTRY_ENVIRONMENT=development
```

### Como rodar localmente

```bash
npm install
npm run db:up                                    # postgres 16 em docker
cp apps/api/.env.example apps/api/.env           # gerar JWT_ACCESS_SECRET
cd apps/api && npx prisma migrate dev && npx prisma db seed && cd ../..
npm run dev:api                                  # API em :3000, Swagger em :3000/docs

# testes (precisa criar o DB de testes uma vez):
docker exec idearium-postgres psql -U idearium -d postgres -c "CREATE DATABASE idearium_test;"
cp apps/api/.env.test.example apps/api/.env.test
npm run test:e2e -w apps/api
```

---

## 3. Etapas

Cada etapa: objetivo, deliverables, dependências adicionadas, endpoints novos, deploy, definition of done.

---

### **Etapa 0 — Setup esqueleto** *(1 fim de semana, ~8h)* — ✅ CONCLUÍDA `22b10b6`

**Objetivo:** ter um repo com NestJS rodando, conectado a Postgres local via Prisma, com 1 endpoint trivial em produção.

**Deliverables:**
- Monorepo organizado dentro do repo atual `idearium/`: `apps/api/` (Kae), `apps/web/` (Gabriele), `mockups/` (já existe). `package.json` na raiz com **npm workspaces** ativado. Sem Nx/Lerna/Turborepo — overkill para 2 apps.
- `apps/api` rodando com `npm run start:dev` da raiz ou da pasta da app.
- Docker Compose com Postgres 16.
- Prisma instalado, schema vazio, primeira migration vazia, `prisma generate`.
- Endpoint `GET /health` retornando `{ status: "ok", uptime, version }`.
- GitHub Actions: lint + build em todo PR.
- Deploy em Railway/Fly: app público, mesmo que só tenha `/health`.
- Sentry conectado, capturando o primeiro erro de teste.

**Dependências novas:**
```json
"@nestjs/core", "@nestjs/common", "@nestjs/platform-express",
"@nestjs/config", "@prisma/client", "prisma",
"pino", "nestjs-pino",
"@sentry/node",
"nestjs-i18n"
```

**i18n setup desde o dia 0:**
- Pastas `src/i18n/pt-BR/` e `src/i18n/en/` com `errors.json`, `validation.json`, `email.json`.
- Resolver de locale: header `Accept-Language` → query `?lang=` → cookie → fallback `pt-BR`.
- DTOs usam `i18nValidationMessage('validation.IS_EMAIL')` em vez de strings cruas.

**Definition of done:**
- [ ] `curl https://idearium-api.fly.dev/health` retorna 200 em produção.
- [ ] Push em `main` faz deploy automaticamente.
- [ ] Sentry recebeu pelo menos 1 evento (acionado de propósito).
- [ ] Endpoint dummy retorna mensagem de erro em pt-BR ou en conforme `Accept-Language`.

---

### **Etapa 1 — Auth + Users** *(1 semana, ~15h)* — ✅ CONCLUÍDA `3fbbdb2`

**Objetivo:** alguém consegue criar conta, fazer login, ver seu perfil.

**Schema:** `User`, `BuilderProfile`.

**Endpoints:**
```
POST   /auth/register              { username, email, password }
POST   /auth/login                 { email, password } → { accessToken, refreshToken }
POST   /auth/refresh               { refreshToken } → { accessToken }
POST   /auth/logout                (revoga refresh)
GET    /auth/me                    → user atual

GET    /users/:username            → perfil público
PATCH  /users/me                   { fullName?, bio?, avatarUrl? }

GET    /builders                   → lista paginada (mockup "BUILDERS EM BUSCA")
       ?topic=cultura&isOpenToWork=true
GET    /builders/:username
PATCH  /builders/me                { headline, topics, isOpenToWork }
```

**Decisões implícitas:**
- Email não verificado pode logar (verificação async via Resend, badge "verificado" depois).
- JWT access: 15min. Refresh: 30 dias, armazenado em DB com `revokedAt` para logout real.
- Senha: argon2id, mínimo 10 caracteres. Sem regras de "1 maiúscula 1 número 1 símbolo" (estudos mostram que pioram segurança real).

**Dependências novas:**
```json
"@nestjs/passport", "@nestjs/jwt",
"passport", "passport-jwt", "passport-local",
"argon2", "class-validator", "class-transformer"
```

**Não fazer ainda:**
- OAuth (GitHub e Google ficam para Etapa 6).
- Reset de senha por email (Etapa 6, junto com email transacional).
- Verificação de email obrigatória (Etapa 6).

**Definition of done:**
- [ ] É possível criar conta, logar, ver `/auth/me`, atualizar perfil, logar em outro dispositivo.
- [ ] Tokens expirados retornam 401 corretamente.
- [ ] Testes de integração para fluxo register → login → /me.

---

### **Etapa 2 — Labs + RFCs CRUD** *(2 semanas, ~25h)* — ✅ CONCLUÍDA `af579f2`

**Objetivo:** o coração do produto. Criar, listar, ver, editar, publicar RFCs.

**Schema:** `Lab`, `Rfc`, `RfcVersion`.

**Seeds obrigatórios:**
- 6 Labs (os do mockup): Educação, Cidades, Saúde, Cultura, Tec. Cívica, Econ. Solidária.
- Numeração de RFC: sequência atomica via Postgres (`SELECT nextval('rfc_number_seq')`).

**Endpoints:**
```
GET    /labs                       → todos com contadores: { id, slug, name, glyph, rfcsCount, buildersCount }
GET    /labs/:slug                 → detalhes + RFCs do lab

GET    /rfcs                       → lista paginada (alimenta home feed)
       ?lab=educacao&status=IN_DISCUSSION&locale=pt-BR&page=1&limit=20&sort=recent|popular
GET    /rfcs/:slug                 → detalhe completo (RFC + autor + lab + tags + contadores)
POST   /rfcs                       → cria como DRAFT
PATCH  /rfcs/:id                   → edita (cria nova RfcVersion)
POST   /rfcs/:id/publish           → DRAFT → IN_DISCUSSION (atomico, atribui number)
POST   /rfcs/:id/archive
GET    /rfcs/:id/versions          → histórico

GET    /rfcs/featured              → 3 em destaque para a home (manual ou heurística)

POST   /upload/avatar              → R2 (cloudflare), retorna URL
POST   /upload/rfc-thumbnail
```

**Pontos sutis:**
- `number` só é atribuído na publicação (rascunho não vira RFC oficial).
- Slug auto-gerado do título, mas editável pelo autor antes da primeira publicação.
- Edição depois de publicado **não muda slug nem number** (URLs estáveis).
- Quando edita, cria entrada em `RfcVersion`. Não sobrescrever histórico.
- Permissão: só autor edita/arquiva (maintainers ganham permissão global na Etapa 7).
- Campo `locale` é obrigatório na criação. Default: `user.preferredLocale`. Front pode oferecer toggle.
- Tradução: criar nova `Rfc` com `translationOfId = original.id` e `locale != original.locale`. Recebe número próprio. Vira "RFC-0042 (tradução de RFC-0007)".

**Definition of done:**
- [ ] Front consegue popular a home do mockup com dados reais (RFCs, labs, contadores).
- [ ] É possível: criar rascunho → publicar → ver na listagem → editar → ver histórico.
- [ ] Slugs e numbers são imutáveis pós-publicação.

---

### **Etapa 3 — Inscrições e comentários** *(1 semana, ~12h)* — ✅ CONCLUÍDA `a343d0b`

**Objetivo:** uma RFC pode ter discussão e gente se inscrevendo para construir.

**Schema:** `Enrollment`, `Comment`.

**Endpoints:**
```
POST   /rfcs/:id/enroll            { role?, message? }      → cria Enrollment
DELETE /rfcs/:id/enroll            → leave (soft, marca leftAt)
GET    /rfcs/:id/enrollments       → lista de inscritos visíveis

GET    /rfcs/:id/comments          → comentários ordenados cronologicamente
POST   /rfcs/:id/comments          { body }
PATCH  /comments/:id               { body }      → marca isEdited
DELETE /comments/:id               → soft delete (mantém placeholder "[removido]")

GET    /users/:username/enrollments  → "RFCs em que esse builder está"
GET    /users/:username/rfcs         → "RFCs que esse usuário escreveu"
```

**Pontos sutis:**
- Inscrição é leve por design — não envolve aprovação. Só registra. Quem se inscreve pode sair quando quiser.
- Quando uma RFC ganha o primeiro `BUILDER` ativo, status muda automaticamente de `IN_DISCUSSION` para `IN_BUILDING`. Quando o último sai, volta para `IN_DISCUSSION`.
- Comentários em árvore **não são suportados no MVP** (decisão consciente — ver `ANALISE_PROJETO.md` §12.6). Linear apenas.

**Definition of done:**
- [ ] Mockup "8 builders inscritos" mostra número real.
- [ ] É possível discutir uma RFC pública via comentários.
- [ ] Status da RFC muda corretamente entre `IN_DISCUSSION` ↔ `IN_BUILDING`.

---

### **Etapa 4 — Tags + descoberta + busca** *(1 semana, ~12h)* — ✅ CONCLUÍDA `e9cebb6`

**Objetivo:** filtros, busca textual, navegação por tag.

**Schema:** `Tag`, `TagsOnRfcs`.

**Stack adicionada:** Postgres FTS (sem Elasticsearch).

**Endpoints:**
```
GET    /tags                       → todas, ordenadas por uso
GET    /tags/:slug                 → RFCs com essa tag
POST   /rfcs/:id/tags              { tagSlugs: [...] }   (autor only)

GET    /search?q=enchente          → busca em título + summary + body via tsvector
       ?lab=cidades&type=rfcs|users
```

**Implementação FTS bilíngue:**
```sql
-- Diferentes "regconfigs" por locale
ALTER TABLE "Rfc" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(
      to_tsvector(
        CASE WHEN locale = 'pt-BR' THEN 'portuguese' ELSE 'english' END::regconfig,
        coalesce(title, '')
      ), 'A') ||
    setweight(
      to_tsvector(
        CASE WHEN locale = 'pt-BR' THEN 'portuguese' ELSE 'english' END::regconfig,
        coalesce(summary, '')
      ), 'B') ||
    setweight(
      to_tsvector(
        CASE WHEN locale = 'pt-BR' THEN 'portuguese' ELSE 'english' END::regconfig,
        coalesce(body, '')
      ), 'C')
  ) STORED;

CREATE INDEX rfc_search_idx ON "Rfc" USING GIN(search_vector);
```

A busca, por padrão, filtra pelo locale do usuário (ou do header). Pode ser desabilitada via `?locale=all`.

**Definition of done:**
- [ ] Busca por "enchente" devolve `RFC-0011` em <100ms com seed de 1000 RFCs sintéticas.
- [ ] Busca por "flooding" devolve a tradução em inglês de `RFC-0011` (se existir).
- [ ] Filtro por lab + status + locale funciona combinado com busca.

---

### **Etapa 5 — Notificações (assíncronas, sem WebSocket)** *(4 dias, ~10h)* — ⏳ PRÓXIMA

**Objetivo:** quando algo relevante acontece, o usuário recebe notificação. Sem real-time — polling do front basta.

**Schema:** `Notification` (já existe).

**Eventos que geram notificação:**
- Nova inscrição numa RFC sua.
- Novo comentário numa RFC que você escreveu ou onde está inscrito.
- Sua RFC mudou de status (publicada, em construção, arquivada por inatividade).
- Alguém te mencionou em comentário (`@username`).

**Endpoints:**
```
GET    /notifications              → paginadas, badge de unread
PATCH  /notifications/:id/read
PATCH  /notifications/read-all
```

**Implementação sugerida:**
- Síncrona no MVP. Direto no service que dispara o evento (`commentsService.create()` chama `notificationsService.create()` na sequência). Sem fila.
- Email opcional (Resend) para notificações importantes — adicionar em **Etapa 5.5** se necessário.

**Definition of done:**
- [ ] Comentário disparado por outro usuário gera notificação no autor da RFC.
- [ ] Badge de unread é consistente após refresh.

---

### **Etapa 6 — OAuth (GitHub + Google) + reset de senha + email verification** *(1 semana, ~12h)* — ⏳ PLANEJADA

**Objetivo:** fechar o loop de autenticação para algo aceitável em produção pública. As três estratégias decididas na fundação (`VISAO.md` §10, decisão #2) ficam disponíveis.

**Endpoints:**
```
GET    /auth/github                  → redirect
GET    /auth/github/callback         → cria/encontra user, retorna tokens

GET    /auth/google                  → redirect
GET    /auth/google/callback         → cria/encontra user, retorna tokens

POST   /auth/forgot-password         { email }
POST   /auth/reset-password          { token, newPassword }
POST   /auth/verify-email/:token
POST   /auth/resend-verification

POST   /users/me/link-github         → vincular GitHub a conta existente
POST   /users/me/link-google         → vincular Google a conta existente
DELETE /users/me/link-github
DELETE /users/me/link-google
```

**Stack adicionada:**
- `passport-github2`
- `passport-google-oauth20`
- Resend (transactional email) — templates em pt-BR e en

**Pontos sutis:**
- OAuth pode resultar em conflito de email: se já existe conta com aquele email, oferecer "vincular contas" em vez de criar duplicata.
- Username vindo de OAuth precisa ser único — sufixar com número se colidir (`@kae`, `@kae2`).
- Templates de email respeitam `user.preferredLocale`.

**Definition of done:**
- [ ] Login via GitHub e via Google criam ou encontram usuário corretamente.
- [ ] Linking/unlinking funciona sem perder a conta.
- [ ] Email de verificação chega em <30s no idioma do usuário.
- [ ] Reset de senha funciona end-to-end.

---

### **Etapa 7 — Moderação leve + admin endpoints** *(3 dias, ~8h)* — ⏳ PLANEJADA

**Objetivo:** dar ao Kae (e quem mais virar `MAINTAINER`) ferramentas mínimas para responder a abuso.

**Schema:** `Report` (já existe). `UserRole` já está no User desde a Etapa 1.

**Endpoints:**
```
POST   /reports                     { targetType, targetId, reason }
GET    /admin/reports               (MAINTAINER)
PATCH  /admin/reports/:id           { status, resolution? }

PATCH  /admin/rfcs/:id/hide         (MAINTAINER) — soft hide
PATCH  /admin/users/:id/suspend     (MAINTAINER)
GET    /admin/stats                 → contagens globais
```

**Pontos sutis:**
- Suspender usuário **não deleta** RFCs e comentários — anonimiza autor para `[suspenso]`.
- Hide é reversível, delete não existe (questão legal e de histórico de moderação).

**Definition of done:**
- [ ] Maintainer consegue ocultar uma RFC, suspender um usuário, ver fila de reports.
- [ ] Usuário suspenso não consegue logar mas seu conteúdo histórico permanece (anonimizado).

---

### **Etapa 8 — Hardening + observabilidade + RSS + API pública** *(1 semana, ~15h)* — ⏳ PLANEJADA

**Objetivo:** o sistema fica resistente a ataques bobos, observável e tem ganchos públicos.

**Hardening:**
- Rate limiting global (@nestjs/throttler) e por endpoint sensível (login, register, comments).
- Helmet (CSP, HSTS).
- CORS configurado.
- CSRF para endpoints com cookies (se for usar cookies para refresh — alternativa: header `X-Refresh-Token`).
- Validação obrigatória de DTOs (class-validator already in place).
- Tamanho máximo de payload, timeout, etc.
- Política de senha publicada no `/docs`.

**Observabilidade:**
- Logs estruturados em todas requests (request ID, user ID, latency).
- Métricas básicas via `prom-client` ou Grafana Cloud.
- Health check com checks reais (`db: ok`, `email: ok`).

**RSS:**
- `GET /rss/labs/:slug.xml` — feed por laboratório.
- `GET /rss/rfcs.xml` — todas as RFCs publicadas.
- (Atende explicitamente o link "RSS" do footer do mockup.)

**API pública (read-only inicialmente):**
- `GET /api/v1/public/rfcs` — JSON, paginado, mesmas RFCs públicas. Rate limit mais agressivo.
- Documentação OpenAPI publicada em `/docs`.

**Definition of done:**
- [ ] Lighthouse / pentest manual básico passa sem alertas críticos.
- [ ] Brute force em /auth/login é bloqueado após N tentativas.
- [ ] RSS valida em validators online.
- [ ] OpenAPI accessível e correta.

---

### **Etapa 9 — Polimento, fixtures e go-live** *(1 semana, ~15h)* — ⏳ PLANEJADA

**Objetivo:** o backend está pronto para o lançamento real.

**Antes de anunciar:**
- 10–20 RFCs seed escritas pelo Kae + amigos próximos. Não lançar com banco vazio.
- 6 laboratórios com glyphs corretos.
- Página de "sobre", "código de conduta", "governança", "transparência" — mesmo que retornem markdown estático servido pela API.
- Política de privacidade + ToS publicados (usar templates como base, mas revisar).
- Backup automatizado do Postgres (Railway/Fly fazem; verificar).
- Domínio `idearium.community` apontado.
- HTTPS obrigatório.
- Página de status (Cronitor / UptimeRobot free).

**Definition of done:**
- [ ] Lançamento controlado para 20 amigos antes do público amplo.
- [ ] Loop de feedback de 1 semana antes de "soft launch".

---

## 4. Cronograma realista (solo, ~15h/semana)

| Etapa | Tempo | Acumulado |
|-------|-------|-----------|
| 0. Setup | 1 sem | 1 sem |
| 1. Auth + Users | 1 sem | 2 sem |
| 2. Labs + RFCs | 2 sem | 4 sem |
| 3. Inscrições + Comentários | 1 sem | 5 sem |
| 4. Tags + Busca | 1 sem | 6 sem |
| 5. Notificações | 4 dias | 7 sem |
| 6. OAuth + Email | 4 dias | 8 sem |
| 7. Moderação | 3 dias | 8.5 sem |
| 8. Hardening + RSS + API pública | 1 sem | 9.5 sem |
| 9. Polimento + go-live | 1 sem | **~10–11 sem** |

**Realista:** **3 meses** do zero ao MVP em produção, dado 15h/semana.
**Otimista:** 8 semanas com 25h/semana.
**Pessimista:** 5–6 meses com vida fora do projeto.

**Frontend:** Gabriele é responsável (já fez o mockup atual). O cronograma do backend acima é independente do frontend, mas para lançamento real é preciso alinhamento de etapas: idealmente o frontend chega às telas de auth quando o backend conclui a Etapa 1, ao feed/RFC detalhe quando conclui a Etapa 2, etc. Ver `ROADMAP_FRONTEND.md` (a criar) para o espelho.

Pontos de coordenação Kae ↔ Gabriele importantes:
- Contrato OpenAPI publicado a cada etapa (API documentada antes de Gabriele consumir).
- Shapes de resposta validados em conjunto antes de virarem definitivos.
- Fixtures de seed combinadas entre as duas pontas (mesmas RFCs aparecem em dev local).

---

## 5. Anexos

### 5.1. Variáveis de ambiente esperadas

```env
# App
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
WEB_URL=http://localhost:4200

# Database
DATABASE_URL=postgres://idearium:idearium@localhost:5432/idearium

# Auth
JWT_ACCESS_SECRET=...           # 32+ bytes random
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRES=30d

# OAuth (Etapa 6)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Email (Etapa 6)
RESEND_API_KEY=
EMAIL_FROM=hello@idearium.community

# Storage (Etapa 2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=idearium-uploads
R2_PUBLIC_URL=https://uploads.idearium.community

# Observability (Etapa 0)
SENTRY_DSN=
LOG_LEVEL=info
```

### 5.2. Estrutura de pastas sugerida (monorepo + NestJS)

Visão geral do repo:

```
idearium/
├── apps/
│   ├── api/           # backend NestJS (Kae)
│   └── web/           # frontend (Gabriele)
├── mockups/           # já existe
├── docker-compose.yml # postgres local compartilhado
├── package.json       # root: workspaces + scripts agregados
├── VISAO.md
├── ROADMAP_BACKEND.md
└── ROADMAP_FRONTEND.md
```

`package.json` raiz com npm workspaces:

```json
{
  "name": "idearium",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev:api": "npm run start:dev -w apps/api",
    "dev:web": "npm run start -w apps/web",
    "build": "npm run build --workspaces",
    "lint":  "npm run lint --workspaces"
  }
}
```

Detalhe interno de `apps/api/`:

```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   └── env.config.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── prisma/
│   │   └── prisma.service.ts
│   ├── i18n/             # pt-BR/, en/ — JSONs de mensagens
│   ├── auth/
│   ├── users/
│   ├── builders/
│   ├── labs/
│   ├── rfcs/
│   ├── enrollments/
│   ├── comments/
│   ├── tags/
│   ├── search/
│   ├── notifications/
│   ├── reports/
│   ├── admin/
│   ├── feeds/             # RSS
│   ├── uploads/
│   └── health/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
│   └── e2e/
├── Dockerfile
├── package.json
└── tsconfig.json
```

**Tipos compartilhados:** o backend expõe OpenAPI via `@nestjs/swagger`; o frontend gera tipos com `openapi-typescript` apontando para o spec local. Sem package compartilhado — sem fricção de versionamento.

### 5.3. Scripts npm úteis

```json
{
  "scripts": {
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "build": "nest build",
    "start:prod": "node dist/main",
    "lint": "eslint src --ext .ts --fix",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down"
  }
}
```

### 5.4. Decisões técnicas tomadas

Decisões fundadoras (de produto): ver `VISAO.md` §10.

Decisões técnicas adicionais já resolvidas:

1. **URL pública:** slug primário (`/rfcs/biblioteca-cooperativa-de-bairro`), com redirect via número (`/rfcs/0007` → resolve para o slug).
2. **Markdown:** armazenado puro. Front renderiza com sanitização (DOMPurify). Backend nunca emite HTML.
3. **Avatares:** upload em Cloudflare R2 + fallback para Gravatar baseado em hash do email.
4. **Rate limiting:** ambos. IP global + usuário autenticado por endpoint sensível.
5. **Soft delete:** RFCs e comments fazem soft delete. Rascunhos não-publicados podem ser hard-deletados pelo autor.
6. **i18n de conteúdo:** `locale` em `Rfc` e `Comment`. Tradução comunitária via `Rfc.translationOfId`. Postgres FTS configurado por idioma.
7. **i18n de UI/sistema:** `nestjs-i18n` com pt-BR e en desde a Etapa 0. Resolução de locale: `Accept-Language` header → query → cookie → default `pt-BR`.

### 5.5. Anti-roadmap (o que **não** entrar até PMF claro)

- ❌ Sistema de pontos / badges / leaderboard
- ❌ Revenue share / pagamentos / bounties
- ❌ Tier premium
- ❌ WebSockets para real-time
- ❌ Elasticsearch
- ❌ Kubernetes / autoscaling
- ❌ Mobile app
- ❌ Integração GitHub commits/PRs (parece útil, é caro de manter)
- ❌ ML / detecção de originalidade

Cada item desses é trivial de adicionar **depois** que houver tração. Adicionar **antes** mata o cronograma sem trazer usuário nenhum.

---

## 6. Critérios de "vivo" pós-lançamento

Sugestão de marcos para revisitar prioridades em 3 e 6 meses:

| Em 3 meses | Sinal positivo | Sinal negativo |
|-----------|----------------|----------------|
| RFCs publicadas | ≥30 (sendo ≥15 não escritas pelo Kae) | <10 ou todas escritas pelo Kae |
| Builders inscritos em algo | ≥20 | <5 |
| Comentários em RFCs alheias | ≥50 | <10 |
| Visitantes únicos / semana | ≥200 | <50 |
| Etapas 0–6 do roadmap | concluídas | atrasadas em mais de 50% |

Se 4 dos 5 estão em "negativo" aos 3 meses, **vale repensar tudo** — pode ser problema de produto, não de execução.

---

*Documento operacional. Atualizar após cada etapa concluída.*
