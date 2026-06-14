ALTER TABLE public.telegram_alertas DROP CONSTRAINT IF EXISTS telegram_alertas_status_check;
ALTER TABLE public.telegram_alertas ADD CONSTRAINT telegram_alertas_status_check
  CHECK (status IN ('Pendente','Processando','Enviado','Falhou','Cancelado'));

CREATE INDEX IF NOT EXISTS idx_telegram_alertas_processing ON public.telegram_alertas (status, updated_at) WHERE status = 'Processando';