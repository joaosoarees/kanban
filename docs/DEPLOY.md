# Deploy

Produção roda numa VPS ARM com Coolify. O Coolify builda o `compose.prod.yaml` do repositório na própria VPS, e o Traefik dele termina o HTTPS com o certificado wildcard do domínio.

## Como um deploy acontece

1. O PR entra na `main` por merge commit, com o `check` verde.
2. O CI roda de novo na `main`. Com o `check` verde, o job `deploy` chama `POST /api/v1/deploy` do Coolify e acompanha o deploy até `finished`.
3. O Coolify builda as imagens, sobe o `postgres`, roda o `migrate` e só então troca o `app`.
4. O job termina consultando `/api/health` na URL pública.

O auto-deploy por webhook do GitHub App fica desligado: quem decide o deploy é o CI.

## Serviços do `compose.prod.yaml`

| Serviço    | Papel                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| `postgres` | Postgres 18, sem porta publicada, volume `pgdata`                                                            |
| `migrate`  | `prisma migrate deploy`, roda e sai; o `app` só sobe se ele terminar com sucesso                             |
| `app`      | servidor standalone do Next em imagem distroless, só leitura, sem capabilities, healthcheck em `/api/health` |
| `db-dump`  | `pg_dump --format=custom` a cada hora para o volume `dumps`, com troca atômica do arquivo                    |
| `backup`   | `offen/docker-volume-backup`, envia o volume `dumps` para o S3 todo dia às 05:30 UTC e mantém 7 dias         |

## Variáveis

No Coolify, no recurso `kanban`:

| Variável                                                   | Origem                                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `SERVICE_PASSWORD_POSTGRES`                                | gerada pelo Coolify                                                                                     |
| `SERVICE_BASE64_64_SESSION`                                | gerada pelo Coolify; trocar derruba todas as sessões                                                    |
| `SERVICE_BASE64_64_EMAILCODE`                              | gerada pelo Coolify; chave do HMAC dos códigos por e-mail; trocar invalida os códigos já enviados       |
| `SERVICE_FQDN_APP`                                         | preenchida pelo Coolify a partir do domínio do serviço `app`                                            |
| `BACKUP_S3_ENDPOINT`, `BACKUP_S3_BUCKET`, `BACKUP_S3_PATH` | destino do backup                                                                                       |
| `BACKUP_AWS_ACCESS_KEY_ID`, `BACKUP_AWS_SECRET_ACCESS_KEY` | credencial com acesso ao prefixo do backup                                                              |
| `BACKUP_NOTIFICATION_URLS`                                 | URL SMTP para avisar quando o backup falha                                                              |
| `MAIL_FROM`                                                | remetente dos e-mails do app, num endereço do domínio verificado no SES                                 |
| `MAIL_AWS_ACCESS_KEY_ID`, `MAIL_AWS_SECRET_ACCESS_KEY`     | chave do usuário IAM `kanban-mailer`, só com `ses:SendRawEmail` na identidade do domínio em `sa-east-1` |

Os segredos ficam marcados como só de runtime, para não virarem build args.

No GitHub, no environment `production`:

| Nome               | Tipo                                                            |
| ------------------ | --------------------------------------------------------------- |
| `COOLIFY_TOKEN`    | secret, token com permissão só de `deploy`, restrito ao recurso |
| `COOLIFY_URL`      | variable                                                        |
| `COOLIFY_APP_UUID` | variable                                                        |
| `APP_URL`          | variable                                                        |

## Configuração do Coolify fora do repositório

- **Escape de labels desligado** no recurso (`is_container_label_escape_enabled = false`). Sem isso, o `${SERVICE_FQDN_APP}` do roteador `kanban-auth` não é interpolado.
- **Middleware de rate limit** em `/data/coolify/proxy/dynamic/kanban-ratelimit.yaml`. Ele não pode ser declarado nos labels do `app`: o Coolify anexa todo middleware declarado ali ao roteador principal e limitaria o site inteiro.

```yaml
http:
  middlewares:
    kanban-auth-ratelimit:
      rateLimit:
        average: 10
        period: 1m
        burst: 10
```

O roteador `kanban-auth` aplica esse limite só a `POST` em `/sign-in`, `/sign-up`, `/verify-email`, `/forgot-password` e `/reset-password`. As Server Actions das telas de entrada fazem `POST` no caminho da própria página, então o limite cobre login, cadastro, confirmação de e-mail, redefinição de senha e os reenvios de código.

## Migrations longas

O contêiner do app roda `prisma migrate deploy` ao iniciar, antes do servidor, e o `HEALTHCHECK` da imagem dá a ele até 300 s para ficar saudável. Uma migration que passe disso faz o contêiner ser dado como doente no meio dela; se o Coolify o parar, a migration fica pela metade, marcada como falha, e os deploys seguintes param com `P3018` até alguém resolvê-la com `prisma migrate resolve`.

Uma migration que possa passar de alguns minutos (um índice numa tabela grande, um backfill) roda à mão antes do deploy, com `prisma migrate deploy` contra o banco de produção; o deploy depois só encontra "No pending migrations".

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

3. Para restaurar em produção, pare o `app`, rode o `pg_restore` com `--clean --if-exists` contra o serviço `postgres` do recurso e suba o `app` de novo.

Para forçar um backup fora do horário: `docker exec <container backup> backup`.
