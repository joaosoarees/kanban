# Kanban — plano

Projeto de estudo para treinar as skills. Roda local em Docker Compose e em produção numa VPS com Coolify (ver [DEPLOY.md](DEPLOY.md)). O código é público no GitHub (o plano gratuito só tem branch protection em repositório público).

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

1. Erros esperados (validação, permissão, conflito): a action retorna `{ status: "error", message }`, sem lançar exceção.
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
Card (id, columnId, assigneeId?, title, description?, position: String) @@unique([columnId, position]) @@index([assigneeId])
Label (id, boardId, name, color: LabelColor) UNIQUE (boardId, lower(name))
CardLabel (cardId, labelId) @@id([cardId, labelId]) @@index([labelId])
```

Toda coluna `position` precisa de `COLLATE "C"` no SQL da migration: o Prisma não representa essa collation, e o `en_US` do banco ordenaria as chaves errado.

Deletes em cascata de Workspace até Card.

### Responsável, etiquetas e filtros (fatia 7)

- Cada card tem no máximo um responsável, que precisa ser membro do workspace. Atribuir trava o membership com `FOR KEY SHARE`; remover um membro ou sair limpa os cards dele na mesma transação, e a confirmação informa quantos.
- Etiquetas pertencem ao quadro e qualquer membro as gerencia. Paleta fixa de 8 cores, nome com até 30 caracteres, único no quadro sem diferenciar maiúsculas. Limites: 50 por quadro e 8 por card, sob o lock do quadro.
- Aplicar etiqueta usa um único `INSERT ... SELECT` que exige card e etiqueta no mesmo quadro. Excluir etiqueta pede confirmação com a quantidade de cards.
- Etiquetas e responsável salvam na hora, de forma otimista e idempotente; a última escrita vence.
- Filtros no cliente: `?labels=id,id&assignee=id|none`. Etiquetas valem como "qualquer uma", combinadas com o responsável por "e". IDs inválidos são ignorados.
- Com filtro ativo o arraste de cards fica desligado, o menu "Mover para" só troca de coluna e reordenar colunas continua permitido. Um card que deixa de bater com o filtro segue visível até o filtro mudar ou a página recarregar. A coluna mostra "3 de 12".
- Edição só no diálogo do card. O card mostra até 3 etiquetas, "+N" e o avatar. O cliente recebe só `id` e nome dos membros; a própria pessoa aparece primeiro, com "(você)", e nomes e etiquetas ficam em ordem alfabética.
- Entrega em três PRs: backend, telas e filtros.

## Qualidade

- `bun lint` e `bun fmt`, com a formatação aplicada no pre-commit.
- Ambiente local em Docker Compose: Postgres e app, com o bun só dentro do container.
- Hooks nativos do git em `.husky`, executados no container: lint-staged e typecheck (`bun check`) no pre-commit, commitlint (Conventional Commits em inglês) no commit-msg.
- CI no GitHub Actions: lint, format, typecheck, test, build. Branch protection na `main`.
- Testes: só o teste unitário da lógica de posição. Sem mocks e sem testes de componente.

## Deploy

- VPS ARM com Coolify. O Coolify builda o `compose.prod.yaml` na própria VPS; sem registry de imagens.
- Deploy automático na `main`: o job `deploy` do CI roda depois do `check` e chama a API do Coolify com um token só de `deploy`. Auto-deploy por webhook e previews de PR ficam desligados.
- Imagem de produção com `output: "standalone"`, build com Bun e runtime Node distroless, sem root.
- Postgres no mesmo compose, sem porta publicada. Migrations num serviço `migrate` que roda antes do `app`; elas são sempre compatíveis com a versão anterior do código.
- Segredos gerados pelo Coolify e só de runtime; nenhum segredo ou endereço de infraestrutura no repositório.
- Backup: `pg_dump` a cada hora e envio diário ao S3 com 7 dias de retenção.
- Rate limit no Traefik para `POST` de login e cadastro.
- Rollback por `git revert` em PR.

## Processo

- Commits pequenos, um assunto por commit.
- Toda mudança entra por branch e PR; merge só com o CI verde, por rebase, para manter os commits pequenos no histórico.
- Antes de criar qualquer página, o `craft` lista os estados e desenha as telas, e o João aprova; só então a página é implementada.

## Fatias

1. [x] Setup: Next, Tailwind/shadcn, Docker/Postgres, Prisma, lint, Husky, CI
2. [x] Auth: cadastro, login/logout, páginas protegidas
3. [x] Workspaces: criar, listar, slug, layout com membership, error/not-found
4. [x] Membros e papéis
5. [x] Boards e colunas: reorder optimistic, store Zustand de colunas recolhidas
6. [x] Cards: CRUD, drag optimistic, teste de posição
7. [x] Etiquetas e responsável, optimistic
8. [ ] Polimento: visual de loading/erro, dark mode, densidade, sidebar, revisão com `craft-critique`
9. [x] Deploy: imagem de produção, compose com Postgres e backup, deploy pelo CI no Coolify
