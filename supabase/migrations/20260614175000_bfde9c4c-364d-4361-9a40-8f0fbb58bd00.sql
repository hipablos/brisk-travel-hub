ALTER TABLE public.telegram_envios ADD COLUMN IF NOT EXISTS referencia text;
CREATE UNIQUE INDEX IF NOT EXISTS telegram_envios_user_tipo_ref_uniq
  ON public.telegram_envios(user_id, tipo, referencia)
  WHERE referencia IS NOT NULL AND status = 'enviado';

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;