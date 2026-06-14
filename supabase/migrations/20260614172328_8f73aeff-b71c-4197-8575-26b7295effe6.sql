
CREATE TABLE public.telegram_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  token_bot TEXT,
  chat_id TEXT,
  ativo BOOLEAN NOT NULL DEFAULT false,
  notificar_checkin BOOLEAN NOT NULL DEFAULT true,
  notificar_embarque BOOLEAN NOT NULL DEFAULT true,
  notificar_followup BOOLEAN NOT NULL DEFAULT true,
  notificar_pagamentos BOOLEAN NOT NULL DEFAULT true,
  notificar_tarefas BOOLEAN NOT NULL DEFAULT true,
  notificar_vendas BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_config TO authenticated;
GRANT ALL ON public.telegram_config TO service_role;

ALTER TABLE public.telegram_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own telegram config" ON public.telegram_config
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER telegram_config_set_updated_at
  BEFORE UPDATE ON public.telegram_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
