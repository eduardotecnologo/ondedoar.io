-- ==========================================================
-- OndeDoar.io - Adicionar colunas de timer de status
-- Executar em local e/ou produção antes de usar timer automático
-- ==========================================================

ALTER TABLE pontos_coleta
  ADD COLUMN IF NOT EXISTS status_auto_ativar_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_auto_inativar_em TIMESTAMPTZ;

-- Verificação rápida
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'pontos_coleta'
  AND column_name IN ('status_auto_ativar_em', 'status_auto_inativar_em')
ORDER BY column_name;
