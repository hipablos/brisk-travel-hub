
-- Tabela de identidade visual da marca (single-row)
CREATE TABLE public.brand_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  nome_sistema text NOT NULL DEFAULT 'Brisk CRM',
  logo_url text,
  favicon_url text,
  cor_primaria text NOT NULL DEFAULT '#1e3a8a',
  cor_secundaria text NOT NULL DEFAULT '#f5b800',
  cor_destaque text NOT NULL DEFAULT '#f5b800',
  cor_botoes text NOT NULL DEFAULT '#1e3a8a',
  cor_links text NOT NULL DEFAULT '#1e3a8a',
  tema_padrao text NOT NULL DEFAULT 'dark',
  fundo_login_tipo text NOT NULL DEFAULT 'gradiente',
  fundo_login_valor text NOT NULL DEFAULT 'linear-gradient(135deg, #1e3a8a, #0f2557)',
  fundo_pdf_tipo text DEFAULT 'cor',
  fundo_pdf_valor text DEFAULT '#ffffff',
  imagem_institucional_url text,
  empresa_nome text DEFAULT 'Brisk Viagens',
  cnpj text,
  telefone text,
  email text,
  site text,
  endereco text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.brand_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.brand_settings TO authenticated;
GRANT ALL ON public.brand_settings TO service_role;

ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_settings_select_all" ON public.brand_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "brand_settings_insert_admin" ON public.brand_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "brand_settings_update_admin" ON public.brand_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_brand_settings_updated_at
  BEFORE UPDATE ON public.brand_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.brand_settings (singleton) VALUES (true);

-- Tabela de layout do login (single-row)
CREATE TABLE public.login_layout_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  fundo_tipo text NOT NULL DEFAULT 'gradiente',
  fundo_valor text NOT NULL DEFAULT 'linear-gradient(135deg, #1e3a8a, #0f2557)',
  cor_botao text NOT NULL DEFAULT '#f5b800',
  cor_botao_texto text NOT NULL DEFAULT '#1e3a8a',
  cor_secundaria text NOT NULL DEFAULT '#1e3a8a',
  cor_textos text NOT NULL DEFAULT '#ffffff',
  cor_campos text NOT NULL DEFAULT '#ffffff',
  cor_icones text NOT NULL DEFAULT '#94a3b8',
  cor_links text NOT NULL DEFAULT '#f5b800',
  cor_card text NOT NULL DEFAULT '#ffffff',
  logo_url text,
  logo_largura int NOT NULL DEFAULT 200,
  logo_altura int NOT NULL DEFAULT 60,
  logo_alinhamento text NOT NULL DEFAULT 'left',
  titulo text NOT NULL DEFAULT 'Gestão completa para sua agência de viagens.',
  subtitulo text NOT NULL DEFAULT 'Cotações, clientes, voos e financeiro em um só lugar.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.login_layout_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.login_layout_settings TO authenticated;
GRANT ALL ON public.login_layout_settings TO service_role;

ALTER TABLE public.login_layout_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "login_layout_select_all" ON public.login_layout_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "login_layout_insert_admin" ON public.login_layout_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "login_layout_update_admin" ON public.login_layout_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_login_layout_updated_at
  BEFORE UPDATE ON public.login_layout_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.login_layout_settings (singleton) VALUES (true);
