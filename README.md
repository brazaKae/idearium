# Idearium

> Comunidade de construção coletiva. Ideias abertas, builders voluntários, laboratórios temáticos.

Idearium é uma plataforma onde ideias com potencial de impacto social viram propostas estruturadas (RFCs) e atraem voluntários dispostos a co-construí-las abertamente, com crédito compartilhado e licenciamento livre.

Veja a visão completa em [`VISAO.md`](./VISAO.md).

## Co-criadores

- **Kae Brazauskas** — backend, infraestrutura, modelagem de dados.
- **Gabriele** — frontend, identidade visual, design.

## Estrutura do monorepo

```
idearium/
├── apps/
│   ├── api/         # backend NestJS (Kae)
│   └── web/         # frontend (Gabriele)
├── brainstorming-design/         # mockups e referências de design
├── docker-compose.yml
├── VISAO.md         # SSOT do projeto
└── ROADMAP_BACKEND.md
```

## Desenvolvimento local (backend)

Pré-requisitos: Node 20+, npm 10+, Docker.

```bash
# 1. Instalar dependências (raiz do monorepo)
npm install

# 2. Subir Postgres local
npm run db:up

# 3. Configurar env do backend
cp apps/api/.env.example apps/api/.env

# 4. Gerar Prisma Client
npm run prisma:generate -w apps/api

# 5. Rodar a API em modo dev
npm run dev:api
```

API disponível em `http://localhost:3000`. Health check: `GET /health`. Swagger UI: `http://localhost:3000/docs`.

### Testes (e2e)

```bash
# 1. Banco de testes (uma vez)
docker exec idearium-postgres psql -U idearium -d postgres -c "CREATE DATABASE idearium_test;"

# 2. Configurar env de teste
cp apps/api/.env.test.example apps/api/.env.test

# 3. Rodar suite e2e
npm run test:e2e -w apps/api
```

## Licença

Conteúdo: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
Código: AGPL-3.0-or-later.
