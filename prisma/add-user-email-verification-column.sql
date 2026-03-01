-- ==========================================================
-- OndeDoar.io - Verificação de e-mail para permissões admin
-- ==========================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verificado_em TIMESTAMPTZ;

-- Marque manualmente e-mails realmente verificados.
-- Exemplo:
-- UPDATE users
-- SET email_verificado_em = now()
-- WHERE email IN ('admin@seu-dominio.com');
