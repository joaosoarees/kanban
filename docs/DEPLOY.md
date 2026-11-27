# Deploy

Produção roda numa VPS ARM com Coolify, em dois recursos do mesmo projeto:

- a **Application** do app, que builda o `Dockerfile.prod` do repositório e troca o contêiner por rolling update, sem queda;
- o recurso **Docker Compose** `kanban`, que sobe o `compose.prod.yaml`: o banco, os dumps e o backup.

O Traefik do Coolify termina o HTTPS e encaminha o domínio para a Application.

## Como um deploy acontece

1. O PR entra na `main` por merge commit, com o `check` verde.
2. O CI roda de novo na `main`. Com o `check` verde, o job `deploy` chama `POST /api/v1/deploy` do Coolify para a Application e acompanha o deploy até `finished`.
3. O Coolify builda o estágio `runner` e sobe o contêiner novo ao lado do antigo. O contêiner novo roda `prisma migrate deploy` e só então inicia o servidor (`docker/start.mts`).
4. Quando o `HEALTHCHECK` da imagem passa, o Traefik passa a mandar requisições ao contêiner novo, e o Coolify para o antigo com `SIGTERM`.
5. O job termina consultando `/api/health` na URL pública.

Enquanto os dois contêineres convivem, o código antigo atende com o banco já migrado. Por isso toda migration é compatível com a versão anterior do código (expand/contract): primeiro se adiciona, num deploy seguinte se remove.

O auto-deploy por webhook do GitHub App fica desligado: quem decide o deploy é o CI.

Mudanças no `compose.prod.yaml` não entram pelo CI. Depois do merge, faça o redeploy do recurso `kanban` à mão no Coolify. Ele recria o `kanban-postgres`, e o app fica alguns segundos sem banco.

## A Application

| Configuração           | Valor                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Build pack             | Dockerfile, `/Dockerfile.prod`, estágio `runner`                                                                |
| Porta                  | 3000                                                                                                            |
| Health check da UI     | desligado: o Coolify usa o `HEALTHCHECK` do Dockerfile                                                          |
| Memória                | 1 GB                                                                                                            |
| Opções do `docker run` | `--read-only --tmpfs /app/.next/cache:uid=65532,gid=65532 --cap-drop ALL --security-opt no-new-privileges:true` |
| Rede                   | a do destino do servidor, `coolify`, onde o banco atende como `kanban-postgres`                                 |
| Labels                 | personalizados, com a regeneração automática desligada (ver [Rate limit](#rate-limit))                          |

## Serviços do `compose.prod.yaml`

| Serviço           | Papel                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `kanban-postgres` | Postgres 18, sem porta publicada, volume `pgdata`; também na rede `coolify`, onde qualquer contêiner dela o alcança e só a senha o protege |
| `db-dump`         | `pg_dump --format=custom` a cada hora para o volume `dumps`, com troca atômica do arquivo                                                  |
| `backup`          | `offen/docker-volume-backup`, envia o volume `dumps` para o S3 todo dia às 05:30 UTC e mantém 7 dias                                       |

## Variáveis

Na Application, todas só de runtime, para não virarem build args:

| Variável                                     | Origem                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                               | `postgresql://kanban:<SERVICE_PASSWORD_POSTGRES>@kanban-postgres:5432/kanban?schema=public`             |
| `SESSION_SECRET`                             | `openssl rand -base64 32`; trocar derruba todas as sessões                                              |
| `EMAIL_CODE_SECRET`                          | `openssl rand -base64 32`; chave do HMAC dos códigos por e-mail; trocar invalida os códigos já enviados |
| `APP_URL`                                    | o endereço público, usado nos links dos e-mails                                                         |
| `MAIL_FROM`                                  | remetente dos e-mails do app, num endereço do domínio verificado no SES                                 |
| `AWS_REGION`                                 | `sa-east-1`                                                                                             |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | chave do usuário IAM `kanban-mailer`, só com `ses:SendRawEmail` na identidade do domínio em `sa-east-1` |

No recurso `kanban`:

| Variável                                                   | Origem                                     |
| ---------------------------------------------------------- | ------------------------------------------ |
| `SERVICE_PASSWORD_POSTGRES`                                | gerada pelo Coolify                        |
| `BACKUP_S3_ENDPOINT`, `BACKUP_S3_BUCKET`, `BACKUP_S3_PATH` | destino do backup                          |
| `BACKUP_AWS_ACCESS_KEY_ID`, `BACKUP_AWS_SECRET_ACCESS_KEY` | credencial com acesso ao prefixo do backup |
| `BACKUP_NOTIFICATION_URLS`                                 | URL SMTP para avisar quando o backup falha |

No GitHub, no environment `production`:

| Nome               | Tipo                                                  |
| ------------------ | ----------------------------------------------------- |
| `COOLIFY_TOKEN`    | secret, token do Coolify com permissão só de `deploy` |
| `COOLIFY_URL`      | variable                                              |
| `COOLIFY_APP_UUID` | variable, o uuid da Application                       |
| `APP_URL`          | variable                                              |

## Rate limit

O middleware fica em `/data/coolify/proxy/dynamic/kanban-ratelimit.yaml`, fora dos labels. Declarado nos labels, o Coolify o anexaria ao roteador principal e limitaria o site inteiro.

```yaml
http:
  middlewares:
    kanban-auth-ratelimit:
      rateLimit:
        average: 10
        period: 1m
        burst: 10
```

Os labels da Application são os que o Coolify gera para os domínios, mais um roteador `kanban-app-auth`. Esse roteador tem prioridade 1000, o middleware `kanban-auth-ratelimit@file` e o serviço `https-0-<uuid da Application>`. Ele vale só para `POST` no domínio de produção em `/sign-in`, `/sign-up`, `/verify-email`, `/forgot-password`, `/reset-password`, `/invite` e `/account`. As Server Actions dessas telas fazem `POST` no caminho da própria página, então o limite cobre login, cadastro, confirmação de e-mail, redefinição de senha, os reenvios de código, o aceite de convite e as trocas da conta.

- **Regeneração dos labels desligada** (`is_container_label_readonly_enabled = false`). Ligada, qualquer mudança de domínio regera os labels e apaga o `kanban-app-auth`. Desligada, mudar o domínio exige editar os labels à mão.
- **Labels iguais entre deploys.** Se mudarem, o contêiner antigo e o novo declaram o mesmo roteador com configurações diferentes durante a troca, e o Traefik recusa o roteador (`HTTP router defined multiple times with different configurations`): o domínio fica sem rota até o antigo sair.

## Medir a queda de um deploy

`scripts/watch-health.mts` consulta `/api/health` a cada 0,5 s e imprime cada falha. Rode-o em outro terminal antes de disparar o deploy e pare com Ctrl+C quando ele terminar:

```sh
node scripts/watch-health.mts https://<domínio>
```

Ao parar, ele imprime o total de requisições e de falhas, e sai com 1 se houve alguma falha.

## Migrations longas

O contêiner do app roda `prisma migrate deploy` ao iniciar, antes do servidor. O `HEALTHCHECK` da imagem (início em 5 s, 30 tentativas a cada 10 s) dá a ele cerca de 5 minutos para ficar saudável; o Coolify lê esses valores do Dockerfile e espera o mesmo tempo. O `start-period` fica curto de propósito: o Coolify espera o `start-period` inteiro antes da primeira checagem, então um valor longo atrasaria todo deploy. Uma migration que passe de 5 minutos faz o contêiner ser dado como doente no meio dela; o Coolify o para, a migration fica pela metade, marcada como falha, e os deploys seguintes param com `P3018` até alguém resolvê-la com `prisma migrate resolve`.

Uma migration que possa passar de alguns minutos (um índice numa tabela grande, um backfill) roda à mão antes do merge, na VPS, a partir do commit do PR:

```sh
docker build -f Dockerfile.prod --target migrator -t kanban-migrate "<url do repositório>.git#<branch do PR>"
docker run --rm --network coolify -w /migrator \
  -e DATABASE_URL="postgresql://kanban:<senha>@kanban-postgres:5432/kanban" \
  kanban-migrate node node_modules/prisma/build/index.js migrate deploy
docker image rm kanban-migrate
```

A senha é a `SERVICE_PASSWORD_POSTGRES` do recurso do banco, e o host e a rede são os mesmos do `DATABASE_URL` da Application. Depois do merge, o deploy só encontra "No pending migrations".

## Rollback

Reverter o commit com `git revert` num PR. O merge dispara um deploy novo. As migrations são sempre compatíveis com a versão anterior do código (expand/contract), então voltar o código nunca exige desfazer o banco.

## Restaurar o backup

1. Baixe o arquivo mais recente de `s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PATH/` e extraia: `tar -xzf kanban-*.tar.gz` gera `backup/dumps/kanban.dump`.
2. Suba um Postgres temporário e restaure:

   ```sh
   docker run -d --name kanban-restore -e POSTGRES_PASSWORD=restore postgres:18
   docker cp backup/dumps/kanban.dump kanban-restore:/tmp/kanban.dump
   docker exec kanban-restore createdb -U postgres kanban
   docker exec kanban-restore pg_restore -U postgres -d kanban --no-owner /tmp/kanban.dump
   docker exec kanban-restore psql -U postgres -d kanban -c 'select count(*) from users'
   docker rm -f kanban-restore
   ```

3. Para restaurar em produção, pare a Application, rode o `pg_restore` com `--clean --if-exists` contra o serviço `kanban-postgres` do recurso e inicie a Application de novo.

Para forçar um backup fora do horário: `docker exec <container backup> backup`.
