-- ==========================================================
-- OndeDoar.io - Galeria de imagens dos pontos
-- ==========================================================

CREATE TABLE IF NOT EXISTS ponto_imagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ponto_id UUID NOT NULL REFERENCES pontos_coleta(id) ON DELETE CASCADE,
  imagem_data TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ponto_imagens_ponto_id_idx
  ON ponto_imagens(ponto_id);

CREATE INDEX IF NOT EXISTS ponto_imagens_ordem_idx
  ON ponto_imagens(ponto_id, ordem);
