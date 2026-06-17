
-- Hospedagens
CREATE TYPE public.regime_alimentar AS ENUM ('sem_alimentacao','cafe_da_manha','meia_pensao','pensao_completa','all_inclusive');

CREATE TABLE public.hospedagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id uuid REFERENCES public.cotacoes(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  nome_hotel text NOT NULL,
  estrelas smallint CHECK (estrelas BETWEEN 0 AND 5),
  endereco text,
  cidade text,
  estado text,
  pais text,
  google_place_id text,
  google_maps_url text,
  lat double precision,
  lng double precision,
  checkin timestamptz,
  checkout timestamptz,
  noites integer,
  hospedes integer,
  quartos integer,
  tipo_acomodacao text,
  regime_alimentar public.regime_alimentar DEFAULT 'sem_alimentacao',
  numero_reserva text,
  codigo_confirmacao text,
  observacoes_cliente text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospedagens TO authenticated;
GRANT ALL ON public.hospedagens TO service_role;

ALTER TABLE public.hospedagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_hospedagens" ON public.hospedagens FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_hospedagens" ON public.hospedagens FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_hospedagens" ON public.hospedagens FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_hospedagens" ON public.hospedagens FOR DELETE TO authenticated USING (true);

CREATE TRIGGER hospedagens_set_updated_at BEFORE UPDATE ON public.hospedagens
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_hospedagens_cotacao ON public.hospedagens(cotacao_id);
CREATE INDEX idx_hospedagens_cliente ON public.hospedagens(cliente_id);
CREATE INDEX idx_hospedagens_checkin ON public.hospedagens(checkin);
