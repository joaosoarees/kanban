# Kanban — plano

Projeto de estudo para treinar as skills. Roda local em Docker Compose e em produção numa VPS com Coolify (ver [DEPLOY.md](DEPLOY.md)). O código é público no GitHub (o plano gratuito só tem branch protection em repositório público).

## Stack

- Next.js (App Router), TypeScript, Tailwind v4, shadcn/ui (Base UI, preset nova)
- Postgres 18 via Docker Compose, Prisma 7, IDs UUID v7
- Auth própria: e-mail + senha (bcrypt), sessão em JWT HS256 (`jose`) num cookie HttpOnly, `getCurrentUser()` como única checagem. Sem Auth.js: a v5 nunca saiu do beta.
- React Hook Form + Zod em todo campo digitado, sempre pelo hook `useActionForm`; ações de um clique (etiqueta, responsável, mover, arrastar) chamam a action pelo mesmo executor, sem `useForm`
- `useOptimistic` + Server Actions em toda interação do board (rollback + toast no erro)
- Zustand + persist só para preferências de UI (colunas recolhidas, sidebar)
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
- Membros entram quando um admin adiciona um usuário já cadastrado pelo e-mail. Como a resposta revela se o e-mail tem conta, a action fica sob rate limit; convites com aceite ficam para uma fatia futura.

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
- Rate limit no Traefik para o `POST` das telas de entrada e de conta (ver as fatias 13 e 15).
- Rollback por `git revert` em PR.

## Reorganização (fatias 10 e 11)

- Antes de mover qualquer arquivo, uma auditoria só de leitura com a skill `auditing-code-against-skills` e o vocabulário da `codebase-design` (módulo, interface, profundidade, costura). Os achados viram a lista de PRs da fatia 11.
- Módulos por funcionalidade, mantendo a convenção do Next. Cada `src/features/<feature>/` separa os arquivos pelo lugar onde rodam: `server/` (tudo que toca o banco: `queries.ts` para as leituras dos Server Components e `access.ts` para conferências e travas, com `server-only`, e `actions.ts` para as Server Actions, que o `"use server"` já mantém fora do cliente), `lib/` (lógica pura que roda nos dois lados, como schemas e regras, com teste), `components/` e `hooks/` (hooks de cliente da feature; os compartilhados ficam em `src/hooks`). `src/server/` guarda só a infraestrutura sem feature (`db`, erros do Prisma, sessão, e-mail), e `src/app` só monta as rotas.
- Server Actions e queries continuam usando o Prisma direto, sem use cases, repositórios ou DI. A única interface com dois adaptadores é o envio de e-mail.
- Um PR por feature, sem mudar comportamento. A conferência é feita com lint, typecheck, testes unitários e build, mais uma passada pelo app com Playwright fora do repositório. Sem teste E2E versionado.
- No fim, `CLAUDE.md` e a seção Arquitetura deste plano descrevem a estrutura nova.
- Skills: `auditing-code-against-skills`, `codebase-design`, `nextjs-server-actions`, `nextjs-server-data-fetching`, `nextjs-component-composition`, `nextjs-server-and-client-components`, `react-custom-hooks`, `react-hook-form-zod`, `shadcn-react-hook-form`.

### Resultado da auditoria (fatia 10)

Relatório: https://claude.ai/artifact/GKgUHkBcU9CF3zuHkvFzEq. Bugs confirmados no app: com o `localStorage` bloqueado nenhum workspace abre, e depois de sair a página guarda o conteúdo de quem estava logado. Decisões:

- Features: `auth`, `workspaces` (acesso: `requireMembership`, `loadActorAllowedTo`, `can`), `members` e `boards`. Colunas, cards e etiquetas ficam dentro de `boards`, com subpastas em `components/` (`board/`, `column/`, `card/`, `label/`, `filter/`): separados, criavam dependências nos dois sentidos, porque o quadro renderiza cards e etiquetas e as actions deles travam o quadro. `src/server` tem `db` e o módulo de sessão (`getCurrentUser`, `requireUser`, `startSession`, `endSession`).
- Os helpers de resultado (`invalidFields`, `FORBIDDEN`, `INVALID`) ficam, apesar de a `nextjs-server-action-results` dispensá-los; erros que o cliente precisa distinguir ganham um `code` em vez de comparar mensagens.
- `useActionForm({ schema, defaultValues, action, onSuccess })` devolve o `form` do React Hook Form e um `submit`, e cuida de `zodResolver`, erros de campo vindos do servidor, `unstable_rethrow` e o toast de falha. Editores inline salvam com `handleSubmit` no Enter ou no blur e cancelam com `reset()`.

Ordem dos PRs:

1. [x] Bug: armazenamento bloqueado.
2. [x] Bug: conteúdo depois de sair.
3. [x] `useActionForm` e o executor de actions.
4. [x] `src/server`.
5. [x] `features/auth`.
6. [x] `features/workspaces` e `features/members`.
7. [x] `features/boards`.
8. [x] Cards e etiquetas dentro de `features/boards`, com o route handler da descrição respondendo 401 e 404.
9. [x] Limites de erro (`w/[slug]/error.tsx` e `src/app/error.tsx`: a checagem de sessão de `(auth)` fica no próprio layout, que um `(auth)/error.tsx` não cobre), corridas devolvendo mensagem, papel conferido dentro da transação, `CLAUDE.md` atualizado.

Cada PR de feature migra os campos da feature para o `useActionForm` e ganha teste para as regras puras que mudam de lugar e ainda não têm.

## Contas e e-mail (fatias 12 a 14)

### Envio (fatia 12)

- Nodemailer com uma função `sendMail({ to, subject, html, text })` e dois transportes: SES (`@aws-sdk/client-sesv2`) em produção e SMTP para um Mailpit no `compose.yaml` em desenvolvimento, que mostra os e-mails em `localhost:8025`.
- Remetente em `MAIL_FROM`. Antes de configurar, conferir se o domínio está verificado no SES e se a conta saiu do sandbox.
- Usuário IAM `kanban-mailer`, criado pelo João no console, com só `ses:SendRawEmail` a partir da identidade do domínio. A chave vai para o Coolify como segredo.
- O e-mail é enviado dentro da Server Action, sem fila. Se o envio falhar, a conta continua pendente e a tela oferece reenviar.
- Templates em React Email com o ícone e a marca, mais uma versão em texto puro. O visual passa pelo `craft`. O layout e a caixa do código ficam em `src/server/mail/`, e os três e-mails da conta (código de verificação, aviso de cadastro repetido e código de redefinição) em `src/features/auth/emails/`.
- Skills: `choosing-email-sending-service`, `nodemailer-ses-transport`, `ses-domain-identity`, `ses-sandbox-and-production-access`, `craft`.

### Verificação de e-mail (fatia 13)

- Código de 8 dígitos por e-mail, válido por 15 minutos e guardado como HMAC-SHA256 com `EMAIL_CODE_SECRET`, separado do `SESSION_SECRET`. A comparação é em tempo constante. Em produção a chave vem de `SERVICE_BASE64_64_EMAILCODE`, gerada pelo Coolify.
- Depois de 5 tentativas erradas, o código deixa de valer. A linha fica, com o `sentAt`, para o intervalo de reenvio continuar valendo. Não há janela por conta: ela deixaria qualquer pessoa travar a verificação ou a redefinição de outra conta, e os 8 dígitos já deixam a força bruta em torno de 0,2% ao mês.
- Código errado e código vencido recebem a mesma mensagem: "Código inválido ou vencido. Peça um novo."
- Uma conta pendente não acessa nada:
  - o cadastro não abre sessão e leva para `/verify-email`;
  - o login de uma conta pendente com a senha certa leva à mesma tela e envia um código novo;
  - confirmar o código abre a sessão.
- A tela sabe de quem é o código por um cookie `pending_verification`, com JWT de 30 minutos e `aud` próprio, que o `verifySessionToken` recusa. O e-mail não vai na URL.
- O cookie guarda também o `created_at` do cadastro que o emitiu e só vale enquanto ele for igual ao da linha. Um cadastro novo com o mesmo e-mail invalida os cookies anteriores: quem recebe o código no e-mail não consegue verificar a conta com a senha de outra pessoa que se cadastrou depois. O cookie vencido leva a "Esta tela expirou. Cadastre-se de novo."
- O novo cadastro de uma conta pendente e o login dela seguem o intervalo de 60 s do reenvio: dentro dele, os dados mudam e a tela abre, mas nenhum código novo sai. Sem isso, cadastrar de novo daria 5 chutes novos a cada vez.
- O e-mail sai depois do commit. Se o envio falhar, a action devolve "Não conseguimos enviar o e-mail. Tente de novo em instantes." no próprio formulário; o código fica salvo e pode ser reenviado depois do intervalo. O aviso de cadastro repetido falha com a mesma mensagem.
- Verificar e reenviar recusam conta já verificada, com a mesma resposta de um código errado e de um reenvio feito, para não revelar a conta.
- O aviso de cadastro repetido não tem limite próprio além do rate limit do Traefik por IP.
- `getCurrentUser` exige `email_verified_at`. Todos os usuários atuais ficam pendentes na migration, e o João verifica a conta logo depois do deploy.
- Cadastro com um e-mail já verificado recebe a mesma resposta de um cadastro novo e leva à mesma tela, sem criar código. O dono do endereço recebe um aviso ("alguém tentou criar uma conta com este e-mail"). O caminho calcula o hash da senha mesmo assim, para levar o mesmo tempo.
- Uma conta pendente não expira. Um novo cadastro com o mesmo e-mail substitui a conta pendente na mesma linha: nome, senha e `created_at` novos e um código novo no lugar do anterior. O id e os vínculos com workspaces ficam, e só quem recebe o código no e-mail entra. Apagar e recriar levaria os vínculos de uma conta antiga, como as que a migration deixa pendentes.
- O rate limit do Traefik passa a cobrir também o `POST` de `/verify-email`, `/forgot-password` e `/reset-password`.
- A tela `/verify-email` (campo de 8 dígitos, reenviar com contagem regressiva, trocar de conta) passa pelo `craft` antes de ser implementada.
- As fatias 13 e 14 vão juntas para produção, porque o aviso de cadastro repetido aponta para o "Esqueci a senha". O que não muda o comportamento (schema, regras, código, cookie, actions e templates sem uso) entra em PRs normais; a virada (`getCurrentUser` exigindo a verificação, o cadastro e o login novos e as telas) fica num PR final, depois das telas das duas fatias aprovadas.
- Skills: `designing-data-models`, `modeling-entity-relationships`, `normalizing-relational-schemas`, `relational-keys-and-column-types`, `postgres-constraints-and-keys`, `defining-access-patterns`, `prisma-schema-and-migrations`, `prisma-transactions`, `nextjs-jwt-session`, `nextjs-auth-cookies`, `nextjs-credentials-auth-routes`, `cognito-sign-up-and-confirmation` (fluxo e mensagens), `nextjs-server-action-results`, `shadcn-react-hook-form`, `react-hook-form-zod`, `craft`.

```
User + emailVerifiedAt?, passwordChangedAt?        CHECK (email = lower(email))
EmailCode (userId, purpose: VERIFY_EMAIL | RESET_PASSWORD, codeHash, sentAt, expiresAt, attempts)
  @@id([userId, purpose]), onDelete: Cascade
  CHECK (attempts BETWEEN 0 AND 5), CHECK (expiresAt > sentAt), CHECK (codeHash ~ '^[0-9a-f]{64}$')
```

As leituras usam a chave primária de `email_codes` e o `email` único de `users`. Não há índice novo; conferir com `EXPLAIN` depois da migration.

### Esqueci a senha (fatia 14)

- A resposta é a mesma para qualquer e-mail: "se houver conta, enviamos um código". Só existe código para conta que existe.
- O código `RESET_PASSWORD` usa a mesma tabela, a mesma tela de código e as mesmas regras. O código certo leva à tela de nova senha.
- Redefinir a senha também verifica o e-mail de uma conta pendente.
- `password_changed_at`: a sessão guarda a data da troca de senha que valia quando a senha foi conferida (claim `pwc`), e o `getCurrentUser` só aceita a sessão se ela for igual à da conta. Assim, a troca derruba toda sessão aberta com a senha antiga, inclusive um login que conferiu a senha antes da troca e terminou depois dela. Quem redefiniu a senha recebe uma sessão nova com a data nova. Um token sem `pwc` vale como data vazia, então quem já estava logado no deploy continua logado até a primeira troca. Segue a `nextjs-jwt-session` ("a token version on the user compared in the lookup").
- O cookie `password_reset` guarda primeiro o e-mail pedido (JWT de 30 minutos com `aud` próprio), para a resposta ser a mesma com ou sem conta. O código certo troca o cookie por uma permissão de 10 minutos com o id, que vale uma vez só: ela cai quando `password_changed_at` passa do seu `iat`.
- O e-mail de redefinição sai depois da resposta (`after`), para o tempo do envio não revelar se a conta existe. Por isso, uma falha no envio só fica no log; quem não recebeu pede de novo depois do intervalo.
- A contagem do reenvio parte do cookie para todos, então um e-mail sem conta segue o mesmo ritmo de um com conta.
- As telas passam pelo `craft`.
- Skills: `cognito-password-reset` (fluxo), `nextjs-jwt-session`, `password-hashing`, `craft`.

## Convites, conta, prazo e comentários (fatias 15 a 18)

- As quatro fatias formam um pacote: os PRs entram na branch `release/slices-15-18`, com o `check` do CI verde e merge por rebase, e ela vai para a `main` de uma vez no fim, com um único deploy.
- As telas novas passam pelo `craft` antes de serem implementadas: `/invite/[token]`, os convites pendentes em membros, `/account`, o prazo e o "concluído" no card e no diálogo, e os comentários no diálogo.
- Os únicos e-mails novos são o convite, o código de troca de e-mail e o aviso ao endereço antigo. Comentários e prazos não mandam e-mail.

### Convites com aceite (fatia 15)

- O convite substitui o "adicionar pelo e-mail". OWNER e ADMIN convidam com o papel MEMBER ou ADMIN, nunca OWNER. A resposta é sempre "Convite enviado para x", com ou sem conta, e o rate limit de enumeração do adicionar sai junto. A única recusa é para quem já é membro ("Esta pessoa já faz parte do workspace"), que quem convida já vê na lista.
- O link `/invite/<token>` leva um token de 32 bytes aleatórios. O banco guarda só o SHA-256: com essa entropia, um hash rápido basta. O convite vale por 7 dias e uma vez só.
- Aceitar exige estar logado com o e-mail convidado, já verificado. Com outra conta aberta, a tela diz "Este convite é para outro e-mail" e oferece trocar de conta.
- Sem sessão, a página mostra o workspace e quem convidou, com "Entrar" e "Criar conta"; o cadastro vem com o e-mail preenchido e travado. O token fica num cookie `pending_invite` (JWT com `aud` próprio e a validade do convite), e o aceite acontece depois do login ou da verificação do e-mail, levando ao workspace.
- Token errado, vencido ou revogado caem na mesma tela: "Este convite não vale mais. Peça um novo a quem convidou."
- O aceite roda numa transação com a linha do workspace travada (`recheckActor`): quem convidou ainda precisa ser OWNER ou ADMIN e o papel ainda precisa ser permitido. Aceitar cria o membership e apaga o convite. Quem já é membro só vê o convite sumir e entra no workspace.
- A página de membros ganha "Convites pendentes", só para OWNER e ADMIN, com reenviar e revogar. Reenviar gera um token novo e mais 7 dias; revogar apaga. O vencido continua na lista até um dos dois. Convidar de novo o mesmo e-mail substitui o convite anterior.
- Limites contra spam saindo do domínio no SES: 50 convites pendentes por workspace, 60 s entre reenvios do mesmo convite e 20 envios por dia por quem convida. Os envios do dia são contados numa tabela própria, para que revogar não devolva a cota.
- O rate limit do Traefik passa a cobrir também o `POST` de `/invite/<token>` e `/account`.
- Skills: `multi-tenant-data-model`, `tenant-role-authorization`, `role-based-access-control`, `relational-keys-and-column-types`, `postgres-constraints-and-keys`, `defining-access-patterns`, `postgres-indexes-and-explain`, `prisma-transactions`, `postgres-locking-and-isolation`, `password-hashing` (quando um hash rápido basta), `nextjs-jwt-session`, `nextjs-auth-cookies`, `nextjs-redirects`, `ses-sandbox-and-production-access`, `cognito-sign-up-and-confirmation` (fluxo), `craft`.

```
Invite (id, workspaceId, email, role: MEMBER | ADMIN, invitedById, tokenHash, sentAt, expiresAt)
  UNIQUE (workspaceId, email), UNIQUE (tokenHash), onDelete: Cascade
  CHECK (email = lower(email)), CHECK (expiresAt > sentAt), CHECK (tokenHash ~ '^[0-9a-f]{64}$')
InviteSend (id, invitedById, sentAt)   @@index([invitedById, sentAt])
```

### Perfil da conta (fatia 16)

- Página `/account`, fora de qualquer workspace, aberta pelo item "Conta" do menu do usuário, com três blocos: nome, senha e e-mail. Excluir a conta fica de fora: esbarra em ser o único OWNER e pede uma fatia própria.
- Nome: troca simples.
- Senha: pede a atual. A troca atualiza `password_changed_at`, o que derruba as outras sessões; a sessão atual recebe um token novo.
- E-mail: começar a troca pede a senha atual. Um código `CHANGE_EMAIL` vai para o endereço novo, com as regras dos outros códigos (8 dígitos, 15 minutos, 5 tentativas, 60 s entre envios), e o e-mail só muda depois do código certo. O endereço antigo recebe um aviso. As sessões continuam.
- Um e-mail novo que já tem conta recebe a mesma resposta ("Enviamos um código"), mas nenhum código sai. A unicidade é conferida de novo na confirmação.
- Skills: `password-hashing`, `nextjs-jwt-session`, `nextjs-auth-cookies`, `cognito-password-reset` (fluxo), `normalizing-relational-schemas`, `postgres-constraints-and-keys`, `prisma-schema-and-migrations`, `nextjs-server-action-forms`, `react-hook-form-zod`, `nextjs-app-router-routing`, `craft`.

```
EmailCodePurpose + CHANGE_EMAIL
EmailCode + newEmail?   CHECK ((purpose = 'CHANGE_EMAIL') = (newEmail IS NOT NULL)), CHECK (newEmail = lower(newEmail))
```

### Prazo no card (fatia 17)

- O prazo é só a data (`due_on date`), sem hora. "Atrasado" é uma data anterior a hoje no fuso de quem vê, calculado no cliente.
- O card ganha `completed_at`, marcado por uma caixa no diálogo, com ou sem prazo. Card concluído nunca conta como atrasado e mostra o selo verde.
- Qualquer membro define e remove o prazo e marca como concluído, salvando na hora, de forma otimista e idempotente, como as etiquetas.
- O selo no card mostra "12 nov" ("12 nov 2027" em outro ano), vermelho se atrasado e destacado se vence hoje.
- Filtro `?due=overdue|week|none`, combinado por "e" com etiquetas e responsável: `overdue` são os atrasados não concluídos, `week` os que vencem de hoje até 7 dias à frente, sem os concluídos, e `none` os sem prazo.
- Skills: `relational-keys-and-column-types` (date contra timestamptz), `defining-access-patterns`, `prisma-schema-and-migrations`, `react-query-optimistic-updates` (padrão otimista), `craft`.

```
Card + dueOn? @db.Date, completedAt? @db.Timestamptz(3)
```

### Comentários no card (fatia 18)

- Só comentários: autor, texto puro de até 5.000 caracteres e data, sem formatação nem menções. O histórico automático fica de fora, porque exigiria registrar eventos em todas as actions.
- O autor edita e exclui os próprios comentários; ADMIN e OWNER excluem qualquer um. Comentário editado mostra "(editado)". Excluir pede confirmação.
- Quem sai do workspace deixa os comentários, com o nome.
- Os comentários carregam quando o diálogo abre, fora da consulta do quadro: os 30 mais recentes, e "Ver anteriores" busca mais com cursor pelo id (uuid v7, já em ordem).
- O card no quadro mostra um ícone com o número de comentários, contado com `_count` na consulta do quadro, sem coluna de contador.
- Comentário novo vai pelo `useActionForm` e aparece quando a action termina, com o botão em "enviando", sem ser otimista, para o texto não sumir numa falha. Editar e excluir chamam `runAction`.
- Skills: `modeling-entity-relationships`, `postgres-constraints-and-keys`, `sql-cursor-pagination`, `prisma-read-queries`, `precomputed-counters` (por que não ter contador), `nextjs-server-action-forms`, `react-hook-form-zod`, `craft`.

```
Comment (id, cardId, authorId, body, createdAt, editedAt?)
  @@index([cardId, id]), card onDelete: Cascade
  CHECK (char_length(body) BETWEEN 1 AND 5000)
```

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
8. [x] Polimento: visual de loading/erro, dark mode, sidebar, revisão com `craft-critique`. A densidade saiu do escopo: os quadros de times pequenos têm poucos cards por coluna, e um modo compacto pediria duas versões do card nos dois temas. Volta como fatia própria se um quadro cheio pedir.
9. [x] Deploy: imagem de produção, compose com Postgres e backup, deploy pelo CI no Coolify
10. [x] Auditoria da arquitetura contra as skills
11. [x] Módulos por funcionalidade
12. [x] Envio de e-mail: Mailpit, SES e templates
13. [x] Verificação de e-mail
14. [x] Esqueci a senha
15. [ ] Convites com aceite
16. [ ] Perfil da conta
17. [ ] Prazo no card
18. [ ] Comentários no card
