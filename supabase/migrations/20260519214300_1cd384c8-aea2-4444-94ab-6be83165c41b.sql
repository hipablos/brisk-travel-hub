
-- Clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clientes_user ON public.clientes(user_id);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_select_own" ON public.clientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clientes_insert_own" ON public.clientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clientes_update_own" ON public.clientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "clientes_delete_own" ON public.clientes FOR DELETE USING (auth.uid() = user_id);

-- Cotacoes
CREATE TABLE public.cotacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cotacoes_user ON public.cotacoes(user_id);
CREATE INDEX idx_cotacoes_status ON public.cotacoes(user_id, status);
ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cotacoes_select_own" ON public.cotacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cotacoes_insert_own" ON public.cotacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cotacoes_update_own" ON public.cotacoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cotacoes_delete_own" ON public.cotacoes FOR DELETE USING (auth.uid() = user_id);

-- Labels customizadas
CREATE TABLE public.labels_custom (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);
ALTER TABLE public.labels_custom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "labels_select_own" ON public.labels_custom FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "labels_insert_own" ON public.labels_custom FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "labels_delete_own" ON public.labels_custom FOR DELETE USING (auth.uid() = user_id);

-- Trigger genérico updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cotacoes_updated BEFORE UPDATE ON public.cotacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cotacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.labels_custom;
