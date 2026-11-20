# Kanban — plano

Projeto de estudo para treinar as skills. Roda só local, sem deploy. O código é público no GitHub (o plano gratuito só tem branch protection em repositório público).

## Stack

- Next.js (App Router), TypeScript, Tailwind v4, shadcn/ui (Base UI, preset nova)
- Postgres 18 via Docker Compose, Prisma 7, IDs UUID v7
- Auth própria: e-mail + senha (bcrypt), sessão em JWT HS256 (`jose`) num cookie HttpOnly, `getCurrentUser()` como única checagem. Sem Auth.js: a v5 nunca saiu do beta.
- React Hook Form + Zod nos formulários
- `useOptimistic` + Server Actions em toda interação do board (rollback + toast no erro)
- Zustand + persist só para preferências de UI (colunas recolhidas, densidade, sidebar)
- Filtros e card aberto na URL (search params)
- `fractional-indexing` para ordenar colunas e cards

## Arquitetura

- Convenção do Next, sem camadas extras: Server Components e Server Actions usam o Prisma direto.
- Sem use cases, repositórios, containers de DI ou interfaces criadas só para testar.
- Membership e papel checados no layout e em cada Server Action.
- URLs: `/w/[workspaceSlug]/b/[boardId]`. Sem tempo real.

## Erros

1. Erros esperados (validação, permissão, conflito): a action retorna `{ ok: false, error }`, sem lançar exceção.
2. Recurso inexistente ou sem acesso: `notFound()` (404, não 403).
3. Erros inesperados: `error.tsx` em níveis (`global-error`, área logada, workspace, board).

Entra a partir da fatia 3; cada fatia nova ganha seu `error.tsx` e `loading.tsx` quando fizer sentido.

## Domínio

- Workspace → Board → Coluna → Card. O card tem título, descrição, responsável e etiquetas.
- Papéis fixos no código: OWNER, ADMIN, MEMBER.
- Membros entram quando um admin adiciona um usuário já cadastrado pelo e-mail.

```
User (id, name, email @unique, passwordHash)
Workspace (id, name, slug @unique)
Membership (userId, workspaceId, role) @@id([userId, workspaceId])
Board (id, workspaceId, name)
Column (id, boardId, name, position: String) @@index([boardId, position])
Card (id, columnId, title, description?, assigneeId?, position: String)
Label (id, boardId, name, color) @@unique([boardId, name])
CardLabel (cardId, labelId) @@id([cardId, labelId])
```

Deletes em cascata de Workspace até Card. O responsável precisa ser membro do workspace (validado na action).

## Qualidade

- ESLint, Prettier e formatação ao salvar.
- Husky: lint-staged e typecheck (`next typegen && tsc`) no pre-commit, commitlint (Conventional Commits em inglês) no commit-msg.
- CI no GitHub Actions: lint, format, typecheck, test, build. Branch protection na `main`.
- Testes: só o teste unitário da lógica de posição. Sem mocks e sem testes de componente.

## Processo

- Commits pequenos, um assunto por commit.
- Toda mudança entra por branch e PR; merge só com o CI verde, por rebase, para manter os commits pequenos no histórico.
- Antes de criar qualquer página, o `craft` lista os estados e desenha as telas, e o João aprova; só então a página é implementada.

## Fatias

1. [x] Setup: Next, Tailwind/shadcn, Docker/Postgres, Prisma, lint, Husky, CI
2. [x] Auth: cadastro, login/logout, páginas protegidas
3. [x] Workspaces: criar, listar, slug, layout com membership, error/not-found
4. [x] Membros e papéis
5. [ ] Boards e colunas: reorder optimistic, store Zustand de colunas recolhidas
6. [ ] Cards: CRUD, drag optimistic, teste de posição
7. [ ] Etiquetas e responsável, optimistic
8. [ ] Polimento: visual de loading/erro, dark mode, densidade, sidebar, revisão com `craft-critique`
