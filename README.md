## Pós-deploy (produção)

Para deploys que envolvem novas categorias ou campos no banco, execute o script:

- `prisma/postdeploy-checklist.sql`

Checklist rápido após execução:

- validar categorias em `categorias` (`ABRIGO ANIMAIS`, `VOLUNTARIO`, `FRAUDAS`, `DOCUMENTOS`)
- validar colunas em `pontos_coleta` (`voluntario_*`, `fraldas_publico`)
- atualizar a Home e testar filtros de categoria

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
