# Kanban

Projeto de estudo: Next.js + Postgres, só local. O plano e as decisões estão em [docs/PLAN.md](docs/PLAN.md).

## Rodando

```bash
cp .env.example .env
bun install
bun db:up
bun db:migrate
bun dev
```

## Scripts

| Script                                    | O que faz                                                |
| ----------------------------------------- | -------------------------------------------------------- |
| `bun db:up`                               | sobe o Postgres (Docker Compose) e espera ficar saudável |
| `bun db:migrate`                          | cria e aplica migrations (`prisma migrate dev`)          |
| `bun db:studio`                           | abre o Prisma Studio                                     |
| `bun lint` / `bun check` / `bun run test` | checagens que o CI também roda                           |
| `bun fmt`                                 | formata tudo                                             |
