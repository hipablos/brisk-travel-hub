import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import faviconAsset from "@/assets/brisk-favicon.png.asset.json";

export type BrandSettings = {
  id: string;
  nome_sistema: string;
  logo_url: string | null;
  favicon_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  cor_destaque: string;
  cor_botoes: string;
  cor_links: string;
  tema_padrao: string;
  fundo_login_tipo: string;
  fundo_login_valor: string;
  fundo_pdf_tipo: string | null;
  fundo_pdf_valor: string | null;
  imagem_institucional_url: string | null;
  empresa_nome: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  site: string | null;
  endereco: string | null;
};

export type LoginLayoutSettings = {
  id: string;
  fundo_tipo: string;
  fundo_valor: string;
  cor_botao: string;
  cor_botao_texto: string;
  cor_secundaria: string;
  cor_textos: string;
  cor_campos: string;
  cor_icones: string;
  cor_links: string;
  cor_card: string;
  logo_url: string | null;
  logo_largura: number;
  logo_altura: number;
  logo_alinhamento: string;
  titulo: string;
  subtitulo: string;
};

type Ctx = {
  brand: BrandSettings | null;
  login: LoginLayoutSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const BrandContext = createContext<Ctx>({
  brand: null,
  login: null,
  loading: true,
  refresh: async () => {},
});

function applyBrandToDocument(brand: BrandSettings | null) {
  if (typeof document === "undefined") return;
  const faviconUrl = brand?.favicon_url || faviconAsset.url;
  const title = brand?.nome_sistema || "Brisk CRM";
  document.title = title;

  // Update favicon links
  const heads = document.head;
  const selectors = ["link[rel='icon']", "link[rel='shortcut icon']", "link[rel='apple-touch-icon']"];
  selectors.forEach((sel) => {
    const link = heads.querySelector(sel) as HTMLLinkElement | null;
    if (link) link.href = faviconUrl;
  });

  // Inject CSS variables (override design tokens)
  const root = document.documentElement;
  if (brand) {
    root.style.setProperty("--primary", brand.cor_primaria);
    root.style.setProperty("--secondary", brand.cor_secundaria);
    root.style.setProperty("--accent", brand.cor_destaque);
    root.style.setProperty("--ring", brand.cor_primaria);
  }
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const [login, setLogin] = useState<LoginLayoutSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const [b, l] = await Promise.all([
      supabase.from("brand_settings").select("*").limit(1).maybeSingle(),
      supabase.from("login_layout_settings").select("*").limit(1).maybeSingle(),
    ]);
    if (b.data) setBrand(b.data as BrandSettings);
    if (l.data) setLogin(l.data as LoginLayoutSettings);
    applyBrandToDocument((b.data as BrandSettings) || null);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyBrandToDocument(brand);
  }, [brand]);

  return (
    <BrandContext.Provider value={{ brand, login, loading, refresh: fetchAll }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
