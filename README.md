# Kanban

Projeto de estudo: Next.js + Postgres, só local. O plano e as decisões estão em [docs/PLAN.md](docs/PLAN.md).

## Rodando

O app só precisa de Docker. Crie o `.env`:

```bash
cp .env.example .env
```

Preencha `SESSION_SECRET` no `.env` com o resultado de `openssl rand -base64 32` e suba tudo:

```bash
docker compose up -d
```

O container instala as dependências, aplica as migrations e abre o app em <http://localhost:3000>. Ele usa o UID 1000, então seu usuário no host precisa ter esse UID.

Depois de `git pull` ou de trocar de branch, reinicie para aplicar dependências e migrations novas:

```bash
docker compose restart app
```

Os hooks do git rodam dentro do container e são ativados na primeira subida, então suba antes do primeiro commit. Com o container desligado ou em uma git worktree, o commit é recusado. Se a subida falhar, o container fica ligado para você corrigir: veja o erro com `docker compose logs app`.

## Comandos

Rode cada um com `docker compose exec app` na frente.

| Comando                                                 | O que faz                                       |
| ------------------------------------------------------- | ----------------------------------------------- |
| `bun db:migrate --name <nome>`                          | cria e aplica migrations (`prisma migrate dev`) |
| `bun lint` / `bun check` / `bun test --isolate=modules` | checagens que o CI também roda                  |
| `bun fmt`                                               | formata tudo                                    |

O Prisma Studio roda fora do container e é o único comando que precisa de Node no host: `npx prisma studio`.
