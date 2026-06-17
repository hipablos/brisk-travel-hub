
CREATE TABLE public.experiencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id uuid REFERENCES public.cotacoes(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  nome text NOT NULL,
  categoria text,
  endereco text,
  cidade text,
  estado text,
  pais text,
  google_place_id text,
  google_maps_url text,
  lat double precision,
  lng double precision,
  data date,
  hora_inicio time,
  hora_termino time,
  duracao_min integer,
  participantes integer,
  idioma text,
  idade_minima integer,
  descricao text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiencias TO authenticated;
GRANT ALL ON public.experiencias TO service_role;

ALTER TABLE public.experiencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_experiencias" ON public.experiencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_experiencias" ON public.experiencias FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_experiencias" ON public.experiencias FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_experiencias" ON public.experiencias FOR DELETE TO authenticated USING (true);

CREATE TRIGGER experiencias_set_updated_at BEFORE UPDATE ON public.experiencias
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_experiencias_cotacao ON public.experiencias(cotacao_id);
CREATE INDEX idx_experiencias_cliente ON public.experiencias(cliente_id);
CREATE INDEX idx_experiencias_data ON public.experiencias(data);
