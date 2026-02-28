-- ==========================================================
-- OndeDoar.io - Tabela de Pedidos de Ajuda
-- Execute no banco (local/prod) para habilitar o cadastro.
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS pedidos_ajuda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  contato TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'OUTRO',
  descricao TEXT NOT NULL,
  urgencia TEXT NOT NULL DEFAULT 'MEDIA',
  status TEXT NOT NULL DEFAULT 'ABERTO',
  anonimo BOOLEAN NOT NULL DEFAULT false,
  atendido_por_nome TEXT,
  atendido_por_anonimo BOOLEAN NOT NULL DEFAULT false,
  atendido_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ
);

ALTER TABLE pedidos_ajuda
  ADD COLUMN IF NOT EXISTS atendido_por_nome TEXT,
  ADD COLUMN IF NOT EXISTS atendido_por_anonimo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS atendido_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS pedidos_ajuda_status_idx
  ON pedidos_ajuda(status);

CREATE INDEX IF NOT EXISTS pedidos_ajuda_cidade_estado_idx
  ON pedidos_ajuda(cidade, estado);

-- Verificação rápida
-- SELECT id, nome, cidade, estado, categoria, urgencia, status, criado_em
-- FROM pedidos_ajuda
-- ORDER BY criado_em DESC
-- LIMIT 20;
