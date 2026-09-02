CREATE TABLE public.milhas_movimentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT CURRENT_DATE,
  programa text NOT NULL,
  tipo text NOT NULL DEFAULT 'compra',
  quantidade integer NOT NULL DEFAULT 0,
  valor_total numeric NOT NULL DEFAULT 0,
  banco text,
  forma_pagamento text,
  cartao text,
  parcelas integer,
  observacoes text,
  cotacao_id uuid REFERENCES public.cotacoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT milhas_movimentos_tipo_check CHECK (tipo IN ('compra','utilizacao','estorno','ajuste'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.milhas_movimentos TO authenticated;
GRANT ALL ON public.milhas_movimentos TO service_role;

ALTER TABLE public.milhas_movimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milhas_select_own" ON public.milhas_movimentos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "milhas_insert_own" ON public.milhas_movimentos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "milhas_update_own" ON public.milhas_movimentos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "milhas_delete_own" ON public.milhas_movimentos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX milhas_utilizacao_unica_por_cotacao
  ON public.milhas_movimentos (cotacao_id, programa)
  WHERE tipo = 'utilizacao' AND cotacao_id IS NOT NULL;

CREATE INDEX milhas_movimentos_user_programa_idx ON public.milhas_movimentos (user_id, programa, data);

CREATE TRIGGER milhas_movimentos_set_updated_at
  BEFORE UPDATE ON public.milhas_movimentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();