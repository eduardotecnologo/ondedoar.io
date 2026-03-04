# Relatório de Testes

## Convenção

- Este arquivo é local (`*.local.md`) e não vai para o repositório remoto.
- Sempre que você escrever **"push"**, os testes serão executados e um novo bloco será adicionado aqui.

## Execuções

### 2026-03-04 19:40 - Suíte completa (push)

- Comando: `npm run test`
- Runner: `vitest run`
- Status: ✅ Aprovado
- Test Files: `5 passed (5)`
- Tests: `26 passed (26)`
- Duração: `6.88s`

#### Observações

- Commit `a6bf19e`: todos os pins do mapa exibidos independente da paginação (query separada sem skip/take em `app/page.tsx`).
- Sem falhas; stderrs são esperados.

### 2026-03-04 19:28 - Suíte completa (push)

- Comando: `npm run test`
- Runner: `vitest run`
- Status: ✅ Aprovado
- Test Files: `5 passed (5)`
- Tests: `26 passed (26)`
- Duração: `11.09s`

#### Observações

- Validação das feats: categoria TRANSPORTE 🚛, campos extras (porte do veículo + data/hora disponível), renomear HIGIENE → HIGIENE/LIMPEZA 🧼.
- Sem falhas; stderrs são esperados.

### 2026-03-04 12:52 - Suíte completa (feat: transporte)

- Comando: `npm run test`
- Runner: `vitest run`
- Status: ✅ Aprovado
- Test Files: `5 passed (5)`
- Tests: `26 passed (26)`
- Duração: `9.27s`

#### Observações

- Validação da feat de campos extras para categoria TRANSPORTE.
- Novos campos: `transporte_tipo_veiculo` (Pequeno/Médio/Grande) e `transporte_disponivel_em` (datetime).
- Campos persistidos via raw SQL, `prisma db push` aplicado no banco local.
- Sem falhas; stderrs são esperados (logs de erro simulado nos testes de ação).

### 2026-03-03 21:07 - Suíte completa (push)

- Comando: `npm run test`
- Runner: `vitest run`
- Status: ✅ Aprovado
- Test Files: `5 passed (5)`
- Tests: `26 passed (26)`
- Duração: `23.96s`

#### Observações

- Validação da feat de paginação server-side na Home (`?page=N`, 6 por página).
- Sem falhas; stderrs são esperados (logs de erro simulado nos testes de ação).

- Comando: `npm run build`
- Runner: `next build`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Compilação: `Compiled successfully`
  - TypeScript: `Finished TypeScript`
  - Rotas geradas: `23/23`

#### Observações

- Esta execução valida as últimas entregas:
  - Paginação na Home com limite de 6 cards + botões numéricos.
  - Healthcheck com métricas de visitas humanas e top páginas (24h).
  - MVP de `Apadrinhar Família` (página pública + gestão admin).
- Não houve falhas de build nesta rodada.

### 2026-03-01 15:07 - Suíte completa (push)

- Comando: `npm run test`
- Runner: `vitest run`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Test Files: `5 passed (5)`
  - Tests: `26 passed (26)`
  - Duration: `6.00s`

#### Observações

- Logs de `stderr` esperados em cenários de teste controlados:
  - `SMTP não configurado em produção` (`account.test.ts`)
  - `db fail` (`pontos.test.ts`)
- A suíte finalizou sem falhas.

### 2026-03-01 14:19 - Suíte completa (push)

- Comando: `npm run test`
- Runner: `vitest run`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Test Files: `5 passed (5)`
  - Tests: `26 passed (26)`
  - Duration: `7.23s`

#### Observações

- Logs de `stderr` esperados em cenários de teste controlados:
  - `SMTP não configurado em produção` (`account.test.ts`)
  - `db fail` (`pontos.test.ts`)
- A suíte finalizou sem falhas.

### 2026-03-01 14:00 - Suíte completa (push)

- Comando: `npm run test`
- Runner: `vitest run`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Test Files: `5 passed (5)`
  - Tests: `26 passed (26)`
  - Duration: `6.75s`

#### Observações

- Logs de `stderr` esperados em cenários de teste controlados:
  - `SMTP não configurado em produção` (`account.test.ts`)
  - `db fail` (`pontos.test.ts`)
- A suíte finalizou sem falhas.

### 2026-03-01 12:30 - Suíte completa (push)

- Comando: `npm run test`
- Runner: `vitest run`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Test Files: `5 passed (5)`
  - Tests: `26 passed (26)`
  - Duration: `8.30s`

#### Observações

- Logs de `stderr` esperados em cenários de teste controlados:
  - `SMTP não configurado em produção` (`account.test.ts`)
  - `db fail` (`pontos.test.ts`)
- A suíte finalizou sem falhas.

### 2026-03-01 12:28 - Suíte com cobertura (foco em pontos.ts)

- Comando: `npm run test:coverage`
- Runner: `vitest run --coverage`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Test Files: `5 passed (5)`
  - Tests: `26 passed (26)`
  - Duration: `7.43s`

#### Cobertura (V8)

- All files
  - Statements: `80.18%` (antes `74.30%`)
  - Branches: `62.11%` (antes `56.21%`)
  - Functions: `91.11%` (antes `86.66%`)
  - Lines: `80.32%` (antes `74.19%`)
- app/actions
  - `account.ts`: `67.93%` statements
  - `pontos.ts`: `87.90%` statements (antes `72.58%`)

### 2026-03-01 12:28 - Teste direcionado (pontos)

- Comando: `npm run test -- app/actions/pontos.test.ts`
- Runner: `vitest run app/actions/pontos.test.ts`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Test Files: `1 passed (1)`
  - Tests: `10 passed (10)`
  - Duration: `2.25s`

### 2026-03-01 12:24 - Suíte com cobertura (após novos testes)

- Comando: `npm run test:coverage`
- Runner: `vitest run --coverage`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Test Files: `5 passed (5)`
  - Tests: `19 passed (19)`
  - Duration: `6.27s`

#### Cobertura (V8)

- All files
  - Statements: `74.30%` (antes `52.94%`)
  - Branches: `56.21%` (antes `42.54%`)
  - Functions: `86.66%` (antes `66.66%`)
  - Lines: `74.19%` (antes `52.58%`)
- app/actions
  - `account.ts`: `67.93%` statements (antes `15.26%`)
  - `pontos.ts`: `72.58%` statements
- components
  - `AuthButton.tsx`: `100%`
  - `PontoDetalhesButton.tsx`: `79.16%` statements
  - `PontoImagemUploadField.tsx`: `94.28%` statements

### 2026-03-01 12:23 - Suíte completa (após novos testes)

- Comando: `npm run test`
- Runner: `vitest run`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Test Files: `5 passed (5)`
  - Tests: `19 passed (19)`
  - Duration: `5.14s`

### 2026-03-01 12:18 - Suíte com cobertura

- Comando: `npm run test:coverage`
- Runner: `vitest run --coverage`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Test Files: `5 passed (5)`
  - Tests: `14 passed (14)`
  - Duration: `6.78s`

#### Cobertura (V8)

- All files
  - Statements: `52.94%`
  - Branches: `42.54%`
  - Functions: `66.66%`
  - Lines: `52.58%`
- app/actions
  - `account.ts`: `15.26%` statements
  - `pontos.ts`: `72.58%` statements
- components
  - `AuthButton.tsx`: `100%`
  - `PontoDetalhesButton.tsx`: `79.16%` statements
  - `PontoImagemUploadField.tsx`: `94.28%` statements

### 2026-03-01 12:14 - Suíte completa

- Comando: `npm run test`
- Runner: `vitest run`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Test Files: `5 passed (5)`
  - Tests: `14 passed (14)`
  - Duration: `5.70s`

#### Cobertura da execução

- `app/actions/pontos.test.ts` (3)
- `app/actions/account.test.ts` (3)
- `components/PontoImagemUploadField.test.tsx` (2)
- `components/PontoDetalhesButton.test.tsx` (2)
- `components/AuthButton.test.tsx` (4)

#### Observações

- Houve logs de `stderr` esperados em testes de ação (`app/actions/pontos.test.ts`) por mocks sem `$executeRaw` e por cenário de erro proposital (`db fail`).
- Esses logs não impactaram o resultado final da suíte.

### 2026-03-01 15:23 - Suíte completa

- Comando: `npm run test`
- Runner: `vitest run`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Test Files: `5 passed (5)`
  - Tests: `26 passed (26)`
  - Duration: `11.42s`

#### Cobertura da execução

- `app/actions/account.test.ts` (8)
- `app/actions/pontos.test.ts` (10)
- `components/AuthButton.test.tsx` (4)
- `components/PontoImagemUploadField.test.tsx` (2)
- `components/PontoDetalhesButton.test.tsx` (2)

#### Observações

- Logs de `stderr` esperados permaneceram nos cenários de produção sem SMTP e falha proposital de banco (`db fail`).
- Execução concluída sem falhas de teste.

### 2026-03-01 17:15 - Suíte completa

- Comando: `npm run test`
- Runner: `vitest run`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Test Files: `5 passed (5)`
  - Tests: `26 passed (26)`
  - Duration: `7.28s`

#### Cobertura da execução

- `app/actions/account.test.ts` (8)
- `app/actions/pontos.test.ts` (10)
- `components/AuthButton.test.tsx` (4)
- `components/PontoImagemUploadField.test.tsx` (2)
- `components/PontoDetalhesButton.test.tsx` (2)

#### Observações

- Logs de `stderr` esperados permaneceram nos cenários de produção sem SMTP e falha proposital de banco (`db fail`).
- Execução concluída sem falhas de teste.

### 2026-03-01 16:45 - Suíte completa

- Comando: `npm run test`
- Runner: `vitest run`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Test Files: `5 passed (5)`
  - Tests: `26 passed (26)`
  - Duration: `8.48s`

#### Cobertura da execução

- `app/actions/account.test.ts` (8)
- `app/actions/pontos.test.ts` (10)
- `components/AuthButton.test.tsx` (4)
- `components/PontoImagemUploadField.test.tsx` (2)
- `components/PontoDetalhesButton.test.tsx` (2)

#### Observações

- Logs de `stderr` esperados permaneceram nos cenários de produção sem SMTP e falha proposital de banco (`db fail`).
- Execução concluída sem falhas de teste.

### 2026-03-01 16:39 - Suíte completa

- Comando: `npm run test`
- Runner: `vitest run`
- Status: ✅ Aprovado
- Exit code: `0`
- Resultado:
  - Test Files: `5 passed (5)`
  - Tests: `26 passed (26)`
  - Duration: `9.83s`

#### Cobertura da execução

- `app/actions/account.test.ts` (8)
- `app/actions/pontos.test.ts` (10)
- `components/AuthButton.test.tsx` (4)
- `components/PontoImagemUploadField.test.tsx` (2)
- `components/PontoDetalhesButton.test.tsx` (2)

#### Observações

- Logs de `stderr` esperados permaneceram nos cenários de produção sem SMTP e falha proposital de banco (`db fail`).
- Execução concluída sem falhas de teste.
