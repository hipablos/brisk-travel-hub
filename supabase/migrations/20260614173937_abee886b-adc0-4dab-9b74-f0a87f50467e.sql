CREATE TABLE public.telegram_envios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('enviado','falhou')),
  erro TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_envios TO authenticated;
GRANT ALL ON public.telegram_envios TO service_role;

ALTER TABLE public.telegram_envios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own telegram_envios"
  ON public.telegram_envios FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_telegram_envios_user_created ON public.telegram_envios (user_id, created_at DESC);