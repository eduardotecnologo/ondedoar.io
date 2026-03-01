-- ==========================================================
-- OndeDoar.io - Foto do ponto de coleta
-- ==========================================================

ALTER TABLE pontos_coleta
  ADD COLUMN IF NOT EXISTS foto_ponto TEXT;
