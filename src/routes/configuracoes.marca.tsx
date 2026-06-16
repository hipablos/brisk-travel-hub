import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Save, RotateCcw, Upload, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useBrand, type BrandSettings } from "@/hooks/use-brand";
import { useIsAdmin } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/configuracoes/marca")({
  component: MarcaPage,
  head: () => ({ meta: [{ title: "Brisk CRM — Marca" }] }),
});

const DEFAULTS: Partial<BrandSettings> = {
  nome_sistema: "Brisk CRM",
  cor_primaria: "#1e3a8a",
  cor_secundaria: "#f5b800",
  cor_destaque: "#f5b800",
  cor_botoes: "#1e3a8a",
  cor_links: "#1e3a8a",
  tema_padrao: "dark",
  fundo_login_tipo: "gradiente",
  fundo_login_valor: "linear-gradient(135deg, #1e3a8a, #0f2557)",
  fundo_pdf_tipo: "cor",
  fundo_pdf_valor: "#ffffff",
  empresa_nome: "Brisk Viagens",
  cnpj: "",
  telefone: "",
  email: "",
  site: "",
  endereco: "",
};

async function fileToDataUrl(file: File, maxBytes = 800_000): Promise<string> {
  if (file.size > maxBytes) {
    throw new Error(`Arquivo muito grande (máx. ${Math.round(maxBytes / 1024)}KB).`);
  }
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("Falha ao ler arquivo"));
    r.readAsDataURL(file);
  });
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 rounded border border-input bg-transparent cursor-pointer"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-sm" />
      </div>
    </div>
  );
}

function MarcaPage() {
  const { brand, refresh } = useBrand();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [form, setForm] = useState<BrandSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (brand) setForm(brand);
  }, [brand]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Acesso restrito a administradores.");
      navigate({ to: "/" });
    }
  }, [roleLoading, isAdmin, navigate]);

  if (!form) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center"><Loader2 className="size-6 animate-spin" /></div>
      </div>
    );
  }

  const update = <K extends keyof BrandSettings>(k: K, v: BrandSettings[K]) =>
    setForm((p) => (p ? { ...p, [k]: v } : p));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logo_url" | "favicon_url" | "imagem_institucional_url") => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const max = field === "favicon_url" ? 200_000 : 800_000;
      const url = await fileToDataUrl(f, max);
      update(field, url);
      toast.success("Imagem carregada.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    const { id, ...rest } = form;
    const { error } = await supabase.from("brand_settings").update(rest).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas.");
    await refresh();
  };

  const restore = () => {
    setForm((p) => (p ? { ...p, ...DEFAULTS, logo_url: null, favicon_url: null, imagem_institucional_url: null } as BrandSettings : p));
    toast.info("Padrões restaurados. Clique em Salvar para aplicar.");
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Palette className="size-6" /> Marca Brisk
              </h1>
              <p className="text-sm text-muted-foreground">
                Personalize a identidade visual do sistema. Alterações aplicam em todo o CRM.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={restore}><RotateCcw className="size-4" /> Restaurar padrão</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar
              </Button>
            </div>
          </div>

          <Tabs defaultValue="identidade">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="identidade">Identidade</TabsTrigger>
              <TabsTrigger value="cores">Cores</TabsTrigger>
              <TabsTrigger value="fundos">Fundos</TabsTrigger>
              <TabsTrigger value="empresa">Empresa</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="identidade" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Identidade do sistema</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do sistema</Label>
                    <Input value={form.nome_sistema} onChange={(e) => update("nome_sistema", e.target.value)} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Logotipo principal</Label>
                      <div className="flex items-center gap-3 p-3 border border-input rounded-md bg-muted/30 h-24">
                        {form.logo_url ? (
                          <img src={form.logo_url} alt="logo" className="h-full max-w-[160px] object-contain" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Nenhum logo definido (usa padrão Brisk)</span>
                        )}
                      </div>
                      <label className="inline-flex">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, "logo_url")} />
                        <span className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-input rounded-md cursor-pointer hover:bg-accent">
                          <Upload className="size-4" /> Enviar logo
                        </span>
                      </label>
                      {form.logo_url && (
                        <Button variant="ghost" size="sm" onClick={() => update("logo_url", null)}>Remover</Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Favicon (aba do navegador)</Label>
                      <div className="flex items-center gap-3 p-3 border border-input rounded-md bg-muted/30 h-24">
                        {form.favicon_url ? (
                          <img src={form.favicon_url} alt="favicon" className="size-12 object-contain" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Usando favicon padrão Brisk</span>
                        )}
                      </div>
                      <label className="inline-flex">
                        <input type="file" accept="image/png,image/x-icon,image/svg+xml" className="hidden" onChange={(e) => handleLogoUpload(e, "favicon_url")} />
                        <span className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-input rounded-md cursor-pointer hover:bg-accent">
                          <Upload className="size-4" /> Enviar favicon
                        </span>
                      </label>
                      {form.favicon_url && (
                        <Button variant="ghost" size="sm" onClick={() => update("favicon_url", null)}>Remover</Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tema padrão do sistema</Label>
                    <select
                      value={form.tema_padrao}
                      onChange={(e) => update("tema_padrao", e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="dark">Escuro</option>
                      <option value="light">Claro</option>
                      <option value="auto">Automático</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cores" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Paleta de cores</CardTitle>
                  <CardDescription>Aplica em botões, links, destaques e elementos do sistema.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <ColorField label="Cor primária" value={form.cor_primaria} onChange={(v) => update("cor_primaria", v)} />
                  <ColorField label="Cor secundária" value={form.cor_secundaria} onChange={(v) => update("cor_secundaria", v)} />
                  <ColorField label="Cor de destaque" value={form.cor_destaque} onChange={(v) => update("cor_destaque", v)} />
                  <ColorField label="Cor dos botões" value={form.cor_botoes} onChange={(v) => update("cor_botoes", v)} />
                  <ColorField label="Cor dos links" value={form.cor_links} onChange={(v) => update("cor_links", v)} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fundos" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Fundo do login</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <select
                      value={form.fundo_login_tipo}
                      onChange={(e) => update("fundo_login_tipo", e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="cor">Cor sólida</option>
                      <option value="gradiente">Gradiente CSS</option>
                      <option value="imagem">Imagem (URL ou upload)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    {form.fundo_login_tipo === "cor" ? (
                      <ColorField label="" value={form.fundo_login_valor} onChange={(v) => update("fundo_login_valor", v)} />
                    ) : (
                      <Textarea
                        rows={2}
                        value={form.fundo_login_valor}
                        onChange={(e) => update("fundo_login_valor", e.target.value)}
                        placeholder={form.fundo_login_tipo === "gradiente" ? "linear-gradient(135deg, #1e3a8a, #0f2557)" : "URL da imagem ou data URL"}
                        className="font-mono text-xs"
                      />
                    )}
                  </div>
                  <div className="h-32 rounded-md border border-input" style={{ background: form.fundo_login_valor }} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Fundo dos PDFs</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <select
                      value={form.fundo_pdf_tipo || "cor"}
                      onChange={(e) => update("fundo_pdf_tipo", e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="cor">Cor sólida</option>
                      <option value="imagem">Imagem</option>
                    </select>
                  </div>
                  <ColorField label="Valor" value={form.fundo_pdf_valor || "#ffffff"} onChange={(v) => update("fundo_pdf_valor", v)} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="empresa" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da empresa</CardTitle>
                  <CardDescription>Aparecem em cabeçalhos de PDF e documentos institucionais.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Nome</Label><Input value={form.empresa_nome || ""} onChange={(e) => update("empresa_nome", e.target.value)} /></div>
                  <div className="space-y-2"><Label>CNPJ</Label><Input value={form.cnpj || ""} onChange={(e) => update("cnpj", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone || ""} onChange={(e) => update("telefone", e.target.value)} /></div>
                  <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email || ""} onChange={(e) => update("email", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Site</Label><Input value={form.site || ""} onChange={(e) => update("site", e.target.value)} /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Endereço</Label><Textarea rows={2} value={form.endereco || ""} onChange={(e) => update("endereco", e.target.value)} /></div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Pré-visualização</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border overflow-hidden">
                    <div className="p-4 flex items-center gap-3" style={{ background: form.cor_primaria, color: "#fff" }}>
                      {form.logo_url ? (
                        <img src={form.logo_url} alt="" className="h-8 object-contain" />
                      ) : (
                        <div className="text-lg font-bold">{form.nome_sistema}</div>
                      )}
                      <span className="ml-auto text-sm opacity-80">Topbar</span>
                    </div>
                    <div className="p-6 space-y-3 bg-background">
                      <h3 className="text-lg font-semibold">Exemplo de conteúdo</h3>
                      <p className="text-sm text-muted-foreground">Veja como os botões e links ficam.</p>
                      <div className="flex gap-2">
                        <button style={{ background: form.cor_botoes, color: "#fff" }} className="px-4 py-2 rounded-md text-sm font-medium">Botão primário</button>
                        <button style={{ background: form.cor_secundaria, color: "#000" }} className="px-4 py-2 rounded-md text-sm font-medium">Botão secundário</button>
                        <a style={{ color: form.cor_links }} className="px-4 py-2 text-sm underline">Um link de exemplo</a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-md text-xs text-muted-foreground">
                    <AlertTriangle className="size-4 text-amber-500" />
                    O cabeçalho dos PDFs lerá automaticamente a logo e os dados da empresa quando o módulo de geração de PDF for ativado.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
