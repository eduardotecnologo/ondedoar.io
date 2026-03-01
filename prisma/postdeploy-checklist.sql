-- ==========================================================
-- OndeDoar.io - Pós-deploy DB checklist (produção)
-- Execute este arquivo no banco de produção após deploys
-- que adicionem categorias ou novos campos.
-- ==========================================================

-- 1) Garantir novas colunas do fluxo Voluntário/Fraudas
ALTER TABLE pontos_coleta
  ADD COLUMN IF NOT EXISTS voluntario_especialidades TEXT,
  ADD COLUMN IF NOT EXISTS voluntario_contato_agendamento TEXT,
  ADD COLUMN IF NOT EXISTS voluntario_disponivel BOOLEAN,
  ADD COLUMN IF NOT EXISTS fraldas_publico TEXT,
  ADD COLUMN IF NOT EXISTS foto_ponto TEXT,
  ADD COLUMN IF NOT EXISTS status_auto_ativar_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_auto_inativar_em TIMESTAMPTZ;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verificado_em TIMESTAMPTZ;

-- 2) Garantir categorias padrão mais recentes
INSERT INTO categorias (nome, icone)
VALUES
  ('ABRIGO', '🏠'),
  ('ABRIGO ANIMAIS', '🐶🐱'),
  ('ALIMENTO ANIMAIS', '🐾'),
  ('VOLUNTARIO', '🤝'),
  ('FRAUDAS', '👶'),
  ('DOCUMENTOS', '📄')
ON CONFLICT (nome) DO UPDATE
SET icone = EXCLUDED.icone;

-- 3) Corrigir variações antigas de nome
UPDATE categorias
SET nome = 'ABRIGO ANIMAIS', icone = '🐶🐱'
WHERE nome IN ('ABRIDO ANIMAIS', 'ABRIGO_ANIMAIS');

UPDATE categorias
SET nome = 'ALIMENTO ANIMAIS', icone = '🐾'
WHERE nome IN ('ALIMENTOS ANIMAIS', 'ALIMENTO_ANIMAIS');

UPDATE categorias
SET nome = 'FRAUDAS', icone = '👶'
WHERE nome IN ('FRAIUDAS', 'FRALDAS');

-- 4) (Opcional) Backfill: vincular pontos sem categoria em ALIMENTOS
-- Descomente se necessário.
-- INSERT INTO ponto_categorias (ponto_id, categoria_id)
-- SELECT p.id,
--        c.id
-- FROM pontos_coleta p
-- JOIN categorias c ON UPPER(c.nome) = 'ALIMENTOS'
-- WHERE NOT EXISTS (
--   SELECT 1 FROM ponto_categorias pc WHERE pc.ponto_id = p.id
-- )
-- ON CONFLICT (ponto_id, categoria_id) DO NOTHING;

-- 5) Verificações rápidas
-- SELECT nome, icone FROM categorias ORDER BY nome;
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'pontos_coleta'
--   AND column_name IN (
--     'voluntario_especialidades',
--     'voluntario_contato_agendamento',
--     'voluntario_disponivel',
--     'fraldas_publico',
--     'status_auto_ativar_em',
--     'status_auto_inativar_em'
--   )
-- ORDER BY column_name;

-- 6) Garantir tabela de pedidos de ajuda
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
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS pedidos_ajuda_status_idx
  ON pedidos_ajuda(status);

CREATE INDEX IF NOT EXISTS pedidos_ajuda_cidade_estado_idx
  ON pedidos_ajuda(cidade, estado);

ALTER TABLE pedidos_ajuda
  ADD COLUMN IF NOT EXISTS atendido_por_nome TEXT,
  ADD COLUMN IF NOT EXISTS atendido_por_anonimo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS atendido_em TIMESTAMPTZ;
