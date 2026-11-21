# Kanban

Projeto de estudo: Next.js + Postgres, só local. O plano e as decisões estão em [docs/PLAN.md](docs/PLAN.md).

## Rodando

Só precisa de Docker. Preencha `SESSION_SECRET` no `.env` com o resultado de `openssl rand -base64 32`.

```bash
cp .env.example .env
docker compose up -d
```

O container instala as dependências, aplica as migrations e abre o app em <http://localhost:3000>. Os hooks do git rodam dentro dele, então o container precisa estar ligado para commitar.

## Comandos

Rode cada um com `docker compose exec app` na frente.

| Comando                                                 | O que faz                                       |
| ------------------------------------------------------- | ----------------------------------------------- |
| `bun db:migrate --name <nome>`                          | cria e aplica migrations (`prisma migrate dev`) |
| `bun lint` / `bun check` / `bun test --isolate=modules` | checagens que o CI também roda                  |
| `bun fmt`                                               | formata tudo                                    |

O Prisma Studio roda fora do container, com `npx prisma studio`.
