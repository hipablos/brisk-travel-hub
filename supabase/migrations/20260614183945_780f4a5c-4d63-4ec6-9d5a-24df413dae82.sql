CREATE TABLE public.telegram_alertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  referencia TEXT NOT NULL,
  cliente TEXT NOT NULL,
  numero_voo TEXT,
  origem TEXT,
  destino TEXT,
  evento_em TIMESTAMPTZ NOT NULL,
  enviar_em TIMESTAMPTZ NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente','Enviado','Falhou','Cancelado')),
  erro TEXT,
  processed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tipo, referencia)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_alertas TO authenticated;
GRANT ALL ON public.telegram_alertas TO service_role;

ALTER TABLE public.telegram_alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own telegram alerts"
  ON public.telegram_alertas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_telegram_alertas_user_status_send ON public.telegram_alertas (user_id, status, enviar_em);
CREATE INDEX idx_telegram_alertas_due ON public.telegram_alertas (status, enviar_em) WHERE status = 'Pendente';

CREATE TRIGGER telegram_alertas_set_updated_at
  BEFORE UPDATE ON public.telegram_alertas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.telegram_rotina_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  ultima_verificacao TIMESTAMPTZ,
  alertas_processados INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Inativa' CHECK (status IN ('Ativa','Inativa')),
  erro TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_rotina_status TO authenticated;
GRANT ALL ON public.telegram_rotina_status TO service_role;

ALTER TABLE public.telegram_rotina_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own telegram routine status"
  ON public.telegram_rotina_status FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER telegram_rotina_status_set_updated_at
  BEFORE UPDATE ON public.telegram_rotina_status
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('brisk-telegram-checkin-30min') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'brisk-telegram-checkin-30min'
);

SELECT cron.schedule(
  'brisk-telegram-processar-alertas-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://brisk-travel-crm.lovable.app/api/public/hooks/telegram-processar-alertas',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3dvdGpib3B1cmtjaW1jbWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTI0NzEsImV4cCI6MjA5Mzk2ODQ3MX0.5PV7AVg_028EGUrMBYyLhvXgE6V4461zRtxhfwIMj6U"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);