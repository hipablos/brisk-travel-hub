
CREATE TABLE public.formas_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  parcelas INTEGER NOT NULL DEFAULT 1,
  intervalo_dias INTEGER NOT NULL DEFAULT 30,
  desconto NUMERIC NOT NULL DEFAULT 0,
  acrescimo NUMERIC NOT NULL DEFAULT 0,
  observacao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "formas_select_own" ON public.formas_pagamento FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "formas_insert_own" ON public.formas_pagamento FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "formas_update_own" ON public.formas_pagamento FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "formas_delete_own" ON public.formas_pagamento FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_formas_pagamento_updated_at
BEFORE UPDATE ON public.formas_pagamento
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
