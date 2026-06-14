
CREATE TABLE public.termos_modelos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('termos','outras')),
  nome text NOT NULL,
  conteudo text NOT NULL DEFAULT '',
  padrao boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.termos_modelos TO authenticated;
GRANT ALL ON public.termos_modelos TO service_role;

ALTER TABLE public.termos_modelos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "termos_modelos_select_own" ON public.termos_modelos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "termos_modelos_insert_own" ON public.termos_modelos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "termos_modelos_update_own" ON public.termos_modelos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "termos_modelos_delete_own" ON public.termos_modelos FOR DELETE USING (auth.uid() = user_id);

CREATE UNIQUE INDEX termos_modelos_one_default_per_cat
  ON public.termos_modelos (user_id, categoria) WHERE padrao = true;

CREATE TRIGGER set_termos_modelos_updated_at
  BEFORE UPDATE ON public.termos_modelos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
