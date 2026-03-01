## Pós-deploy (produção)

Para deploys que envolvem novas categorias ou campos no banco, execute o script:

- `prisma/postdeploy-checklist.sql`

Checklist rápido após execução:

- validar categorias em `categorias` (`ABRIGO ANIMAIS`, `ALIMENTO ANIMAIS`, `VOLUNTARIO`, `FRAUDAS`, `DOCUMENTOS`)
- validar colunas em `pontos_coleta` (`voluntario_*`, `fraldas_publico`)
- atualizar a Home e testar filtros de categoria

## Monitoramento e Observabilidade

O projeto possui um MVP de observabilidade com persistência de eventos e endpoint de saúde.

- Healthcheck: `GET /api/health`
  - Retorna status do serviço, tempo de resposta e verificação de banco.
- Dashboard admin: `/admin/observabilidade`
  - Exibe eventos das últimas 24h, top erros por origem e últimos eventos.
- Persistência de eventos:
  - Tabela `observability_events` (criada no `prisma/postdeploy-checklist.sql`).
  - Ações críticas de `encontrar` já publicam eventos de sucesso, erro e bloqueio de autenticação.

Para produção, rode o `prisma/postdeploy-checklist.sql` para garantir a estrutura da tabela de observabilidade.

## SQL já executados no projeto

Resumo dos SQL usados até agora (local e produção), com finalidade e como rodar.

- Timer de status automático (`ATIVO`/`INATIVO`)

- Arquivo: `prisma/add-status-timer-columns.sql`
- Objetivo: adicionar colunas `status_auto_ativar_em` e `status_auto_inativar_em` em `pontos_coleta`
- Execução:

```bash
npx prisma db execute --schema prisma/schema.prisma --file prisma/add-status-timer-columns.sql
```

- Estrutura de pedidos de ajuda

- Arquivo: `prisma/add-pedidos-ajuda-table.sql`
- Objetivo: criar/garantir tabela `pedidos_ajuda`, índices e colunas de atendimento (`atendido_por_*`, `atendido_em`)
- Execução:

```bash
npx prisma db execute --schema prisma/schema.prisma --file prisma/add-pedidos-ajuda-table.sql
```

- Checklist completo de produção

- Arquivo: `prisma/postdeploy-checklist.sql`
- Objetivo: consolidar alterações de pós-deploy (colunas em `pontos_coleta`, categorias padrão e estrutura de `pedidos_ajuda`)
- Execução:

```bash
npx prisma db execute --schema prisma/schema.prisma --file prisma/postdeploy-checklist.sql
```

- Upsert pontual da categoria nova

- Objetivo: garantir categoria `ALIMENTO ANIMAIS`
- Execução usada:

```bash
$sql = @'
INSERT INTO categorias (nome, icone)
VALUES ('ALIMENTO ANIMAIS', '🐾')
ON CONFLICT (nome) DO UPDATE SET icone = EXCLUDED.icone;
'@; $sql | npx prisma db execute --schema prisma/schema.prisma --stdin
```

### Observação importante

Os SQL acima são de criação/ajuste incremental (idempotentes) e não incluem `DELETE`, `TRUNCATE` ou `DROP`.

## Timer automático (Ativo/Inativo)

Para usar ativação/desativação automática de pontos por data/hora:

1. Execute o SQL de colunas:

- `prisma/add-status-timer-columns.sql`

2. Se necessário, regenere o Prisma Client:

- `npx prisma generate`

3. Valide no app:

- em `/cadastrar` ou `/pontos/[id]/editar`, preencha os campos de data/hora do timer
- confira na Home e no Dashboard se o badge muda para `ATIVO`/`INATIVO` automaticamente quando o horário chega

### Troubleshooting (Windows) - `EPERM` no `prisma generate`

Se aparecer erro como `EPERM: operation not permitted, unlink ... query_engine-windows.dll.node`:

1. Pare o servidor de desenvolvimento (`npm run dev`) e qualquer terminal com Prisma aberto.
2. Feche processos Node que podem manter lock no arquivo.
3. Rode novamente:

- `npx prisma generate`

4. Inicie o app de novo:

- `npm run dev`

Se ainda persistir, feche e reabra o VS Code/terminal e repita os comandos acima.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Login com Google

Para habilitar login social com Google, configure no `.env`:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Sem essas variáveis, o projeto continua funcionando com login por e-mail e senha.

## Recuperação de senha por e-mail

Para o fluxo de `Esqueci minha senha` enviar e-mail de redefinição, configure no `.env`:

### Opção A (recomendada): Resend

- `RESEND_API_KEY`
- `RESEND_FROM` (ex.: `OndeDoar <no-reply@seu-dominio.com>`)

### Opção B: SMTP

- `SMTP_HOST`
- `SMTP_PORT` (ex.: `587`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (ex.: `ondedoar.io <no-reply@seu-dominio.com>`)
- `SMTP_SECURE` (`true` para SSL direto, comum em porta `465`)

Também configure `NEXTAUTH_URL` (ou `APP_URL`) com a URL pública do sistema para gerar links corretos.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
