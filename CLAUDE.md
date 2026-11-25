@AGENTS.md

# Kanban — regras do projeto

Projeto de estudo. Decisões, modelo de dados e as fatias de construção estão em [docs/PLAN.md](docs/PLAN.md): leia antes de começar uma fatia e marque a fatia como feita quando ela entrar na `main`.

## Commits

- Commits pequenos, um assunto por commit. Dentro de uma fatia, commite a cada passo coerente (schema e migration, depois a action, depois a UI), nunca tudo no final.
- Conventional Commits em inglês (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`). O commitlint valida no hook `commit-msg`.
- **Sem atribuição ao Claude**: nada de `Co-Authored-By: Claude`, nem "Generated with Claude Code" em commits ou PRs. O autor é o João (git config local). O hook `commit-msg` rejeita esses trailers.
- O `pre-commit` roda lint-staged e o typecheck completo (`bun check`). Não use `--no-verify`.

## Branches e PRs

- A `main` é protegida: toda mudança entra por branch e PR, com o check `check` do CI verde.
- Merge só por rebase, para os commits pequenos ficarem no histórico.
- Nunca faça push direto nem force push na `main`.

## Páginas e UI

- O fluxo de design é o do plugin `craft` (`/craft:craft`). O `DESIGN.md` na raiz é o brief que todas as skills leem; se ele não existir, comece por `/craft:craft-setup`.
- **Antes de criar qualquer página**, o `craft` confirma o escopo, lista os estados e apresenta as telas desenhadas. **Espere o João aprovar**; só então implemente.
- O trabalho sem UI de uma fatia (schema, migration, actions) pode andar antes da aprovação.

## Arquitetura

- Convenção do Next: Server Components e Server Actions usam o Prisma direto (`@/server/db`).
- Cada feature em `src/features/<feature>/` tem `server/` (queries, actions e access, que tocam o banco), `lib/` (schemas e regras puras), `components/` e `hooks/`. `src/server/` é só infraestrutura sem feature; `src/app` só monta as rotas.
- Sem use cases, repositórios, containers de DI ou interfaces criadas só para testar. Camadas extras só quando o código pedir de verdade.
- Testes só para lógica pura não trivial (ex.: cálculo de posição). Sem mocks, sem testes de componente.
- Erros esperados: a action retorna `{ status: "error", message }`. Recurso inexistente ou sem acesso: `notFound()`. Erros inesperados ao carregar a página: `error.tsx` por segmento; um bloco secundário da página, como a lista de quadros, pode mostrar a falha no próprio lugar. Ao enviar uma action, o `useActionForm` e o `runAction` mostram a falha no próprio lugar, sem perder o que foi digitado.
- Membership e papel checados no layout, em toda página e em toda Server Action. O layout do workspace não segura as rotas filhas enquanto verifica, então cada página de `/w/[slug]` precisa chamar `requireMembership`.
- Zustand só para preferências de UI; dados do servidor nunca vão para o store.
- Todo campo digitado usa React Hook Form + Zod pelo `useActionForm` (`@/hooks/use-action-form`). Ações de um clique (etiqueta, responsável, mover) chamam a action por `runAction` (`@/lib/run-action`), que repassa o controle do Next e transforma exceção em `ActionError`.

## Código

- **Sem comentários no código.** Nomes de variáveis e funções devem bastar. Componentes gerados pelo shadcn em `src/components/ui/` ficam como vieram.

## Comandos

O bun roda só no container `app`; não instale bun, hk ou pkl na máquina.

- `docker compose up -d`: sobe Postgres e app, instala dependências, aplica migrations e inicia o Next
- `docker compose exec app bun db:migrate --name <nome>`: cria e aplica uma migration
- `docker compose exec app bun lint` / `bun check` / `bun test --isolate=modules` / `bun run build`: o mesmo que o CI roda
- `npx prisma studio`: abre o Prisma Studio fora do container

- `docker compose restart app`: reaplica dependências e migrations depois de `git pull` ou troca de branch

Os hooks nativos do git ficam em `.husky` e rodam no container: ele precisa estar ligado para commitar, e commits a partir de git worktrees são recusados.

Variáveis em `.env` (modelo em `.env.example`): `DATABASE_URL` e `SESSION_SECRET` (`openssl rand -base64 32`).
