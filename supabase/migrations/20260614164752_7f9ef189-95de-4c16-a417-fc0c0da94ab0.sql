CREATE TABLE public.integracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  nome TEXT NOT NULL,
  provedor TEXT,
  api_url TEXT,
  api_key TEXT,
  secret_key TEXT,
  ambiente TEXT NOT NULL DEFAULT 'producao',
  ativo BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integracoes TO authenticated;
GRANT ALL ON public.integracoes TO service_role;

ALTER TABLE public.integracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own integracoes" ON public.integracoes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own integracoes" ON public.integracoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own integracoes" ON public.integracoes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own integracoes" ON public.integracoes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER set_integracoes_updated_at BEFORE UPDATE ON public.integracoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();