# Kanban

Projeto de estudo: Next.js + Postgres, só local. O plano e as decisões estão em [docs/PLAN.md](docs/PLAN.md).

## Rodando

```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm db:migrate
pnpm dev
```

## Scripts

| Script                                       | O que faz                                                |
| -------------------------------------------- | -------------------------------------------------------- |
| `pnpm db:up`                                 | sobe o Postgres (Docker Compose) e espera ficar saudável |
| `pnpm db:migrate`                            | cria e aplica migrations (`prisma migrate dev`)          |
| `pnpm db:studio`                             | abre o Prisma Studio                                     |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | checagens que o CI também roda                           |
| `pnpm format`                                | formata tudo com Prettier                                |
