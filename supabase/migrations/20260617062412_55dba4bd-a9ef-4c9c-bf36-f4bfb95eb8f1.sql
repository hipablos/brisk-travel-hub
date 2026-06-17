
CREATE TABLE public.calendario_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  data DATE NOT NULL,
  hora TIME,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  cotacao_id UUID REFERENCES public.cotacoes(id) ON DELETE SET NULL,
  categoria TEXT NOT NULL DEFAULT 'anotacao',
  prioridade TEXT NOT NULL DEFAULT 'media',
  descricao TEXT,
  responsavel TEXT,
  notif_um_dia_antes BOOLEAN NOT NULL DEFAULT false,
  notif_duas_horas_antes BOOLEAN NOT NULL DEFAULT false,
  notif_no_horario BOOLEAN NOT NULL DEFAULT false,
  notif_um_dia_enviado_em TIMESTAMPTZ,
  notif_duas_horas_enviado_em TIMESTAMPTZ,
  notif_no_horario_enviado_em TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendario_eventos TO authenticated;
GRANT ALL ON public.calendario_eventos TO service_role;

ALTER TABLE public.calendario_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view calendario_eventos"
  ON public.calendario_eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert calendario_eventos"
  ON public.calendario_eventos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update calendario_eventos"
  ON public.calendario_eventos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete calendario_eventos"
  ON public.calendario_eventos FOR DELETE TO authenticated USING (true);

CREATE TRIGGER set_calendario_eventos_updated_at
  BEFORE UPDATE ON public.calendario_eventos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_calendario_eventos_data ON public.calendario_eventos(data);
CREATE INDEX idx_calendario_eventos_cliente ON public.calendario_eventos(cliente_id);
CREATE INDEX idx_calendario_eventos_cotacao ON public.calendario_eventos(cotacao_id);
