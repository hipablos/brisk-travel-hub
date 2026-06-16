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
import { LogIn, Save, RotateCcw, Upload, Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useBrand, type LoginLayoutSettings } from "@/hooks/use-brand";
import { useIsAdmin } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/configuracoes/layout-login")({
  component: LayoutLoginPage,
  head: () => ({ meta: [{ title: "Brisk CRM — Layout Login" }] }),
});

const DEFAULTS: Partial<LoginLayoutSettings> = {
  fundo_tipo: "gradiente",
  fundo_valor: "linear-gradient(135deg, #1e3a8a, #0f2557)",
  cor_botao: "#f5b800",
  cor_botao_texto: "#1e3a8a",
  cor_secundaria: "#1e3a8a",
  cor_textos: "#ffffff",
  cor_campos: "#ffffff",
  cor_icones: "#94a3b8",
  cor_links: "#f5b800",
  cor_card: "#ffffff",
  logo_largura: 200,
  logo_altura: 60,
  logo_alinhamento: "left",
  titulo: "Gestão completa para sua agência de viagens.",
  subtitulo: "Cotações, clientes, voos e financeiro em um só lugar.",
};

async function fileToDataUrl(file: File, maxBytes = 800_000): Promise<string> {
  if (file.size > maxBytes) throw new Error(`Arquivo muito grande (máx. ${Math.round(maxBytes / 1024)}KB).`);
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
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-14 rounded border border-input bg-transparent cursor-pointer" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-sm" />
      </div>
    </div>
  );
}

function LayoutLoginPage() {
  const { login, refresh } = useBrand();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginLayoutSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (login) setForm(login); }, [login]);
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

  const update = <K extends keyof LoginLayoutSettings>(k: K, v: LoginLayoutSettings[K]) =>
    setForm((p) => (p ? { ...p, [k]: v } : p));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { update("logo_url", await fileToDataUrl(f)); toast.success("Logo carregado."); }
    catch (err) { toast.error((err as Error).message); }
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    const { id, ...rest } = form;
    const { error } = await supabase.from("login_layout_settings").update(rest).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Layout do login salvo.");
    await refresh();
  };

  const restore = () => {
    setForm((p) => p ? { ...p, ...DEFAULTS, logo_url: null } as LoginLayoutSettings : p);
    toast.info("Padrões restaurados. Clique em Salvar para aplicar.");
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><LogIn className="size-6" /> Layout do Login</h1>
              <p className="text-sm text-muted-foreground">Personalize totalmente a tela de entrada do sistema.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={restore}><RotateCcw className="size-4" /> Restaurar padrão</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Formulário */}
            <div className="space-y-4">
              <Tabs defaultValue="fundo">
                <TabsList className="flex flex-wrap h-auto">
                  <TabsTrigger value="fundo">Fundo</TabsTrigger>
                  <TabsTrigger value="cores">Cores</TabsTrigger>
                  <TabsTrigger value="logo">Logo</TabsTrigger>
                  <TabsTrigger value="textos">Textos</TabsTrigger>
                </TabsList>

                <TabsContent value="fundo" className="space-y-4">
                  <Card>
                    <CardHeader><CardTitle>Fundo</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <select value={form.fundo_tipo} onChange={(e) => update("fundo_tipo", e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                          <option value="cor">Cor sólida</option>
                          <option value="gradiente">Gradiente CSS</option>
                          <option value="imagem">Imagem (URL/data)</option>
                        </select>
                      </div>
                      {form.fundo_tipo === "cor" ? (
                        <ColorField label="Cor" value={form.fundo_valor} onChange={(v) => update("fundo_valor", v)} />
                      ) : (
                        <div className="space-y-2">
                          <Label>Valor</Label>
                          <Textarea rows={2} value={form.fundo_valor} onChange={(e) => update("fundo_valor", e.target.value)} className="font-mono text-xs" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="cores" className="space-y-4">
                  <Card>
                    <CardHeader><CardTitle>Cores</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <ColorField label="Botão" value={form.cor_botao} onChange={(v) => update("cor_botao", v)} />
                      <ColorField label="Texto do botão" value={form.cor_botao_texto} onChange={(v) => update("cor_botao_texto", v)} />
                      <ColorField label="Secundária" value={form.cor_secundaria} onChange={(v) => update("cor_secundaria", v)} />
                      <ColorField label="Textos" value={form.cor_textos} onChange={(v) => update("cor_textos", v)} />
                      <ColorField label="Campos (fundo)" value={form.cor_campos} onChange={(v) => update("cor_campos", v)} />
                      <ColorField label="Ícones" value={form.cor_icones} onChange={(v) => update("cor_icones", v)} />
                      <ColorField label="Links" value={form.cor_links} onChange={(v) => update("cor_links", v)} />
                      <ColorField label="Card (formulário)" value={form.cor_card} onChange={(v) => update("cor_card", v)} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="logo" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Logotipo</CardTitle>
                      <CardDescription>Se vazio, usa o logo da Marca Brisk.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-3 border border-input rounded-md bg-muted/30 h-24">
                        {form.logo_url ? <img src={form.logo_url} alt="" className="h-full max-w-[160px] object-contain" /> : <span className="text-xs text-muted-foreground">Usando logo da marca</span>}
                      </div>
                      <label className="inline-flex">
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        <span className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-input rounded-md cursor-pointer hover:bg-accent">
                          <Upload className="size-4" /> Enviar logo
                        </span>
                      </label>
                      {form.logo_url && <Button variant="ghost" size="sm" onClick={() => update("logo_url", null)}>Remover</Button>}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Largura (px)</Label><Input type="number" value={form.logo_largura} onChange={(e) => update("logo_largura", Number(e.target.value))} /></div>
                        <div className="space-y-2"><Label>Altura (px)</Label><Input type="number" value={form.logo_altura} onChange={(e) => update("logo_altura", Number(e.target.value))} /></div>
                      </div>
                      <div className="space-y-2">
                        <Label>Alinhamento</Label>
                        <select value={form.logo_alinhamento} onChange={(e) => update("logo_alinhamento", e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                          <option value="left">Esquerda</option>
                          <option value="center">Centro</option>
                          <option value="right">Direita</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="textos" className="space-y-4">
                  <Card>
                    <CardHeader><CardTitle>Textos da apresentação</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2"><Label>Título</Label><Textarea rows={2} value={form.titulo} onChange={(e) => update("titulo", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Subtítulo</Label><Textarea rows={2} value={form.subtitulo} onChange={(e) => update("subtitulo", e.target.value)} /></div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Preview */}
            <div className="lg:sticky lg:top-6 self-start">
              <Card>
                <CardHeader><CardTitle>Pré-visualização ao vivo</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border min-h-[520px] flex" style={{ background: form.fundo_valor }}>
                    <div className="flex-1 p-6 flex flex-col justify-between" style={{ color: form.cor_textos }}>
                      <div style={{ textAlign: form.logo_alinhamento as "left" | "center" | "right" }}>
                        {form.logo_url ? (
                          <img src={form.logo_url} alt="" style={{ width: form.logo_largura, height: form.logo_altura, objectFit: "contain", display: "inline-block" }} />
                        ) : (
                          <div className="text-2xl font-bold">Brisk</div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold mb-2">{form.titulo}</h2>
                        <p className="text-sm opacity-80">{form.subtitulo}</p>
                      </div>
                    </div>
                    <div className="w-[260px] p-5 flex flex-col justify-center gap-3" style={{ background: form.cor_card }}>
                      <div className="text-sm font-semibold" style={{ color: "#0f172a" }}>Entrar</div>
                      <div className="relative">
                        <Mail className="absolute left-2 top-1/2 -translate-y-1/2 size-4" style={{ color: form.cor_icones }} />
                        <input disabled className="w-full h-9 pl-7 pr-2 rounded border text-xs" style={{ background: form.cor_campos, color: "#0f172a" }} placeholder="email@exemplo.com" />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-2 top-1/2 -translate-y-1/2 size-4" style={{ color: form.cor_icones }} />
                        <input disabled type="password" className="w-full h-9 pl-7 pr-2 rounded border text-xs" style={{ background: form.cor_campos, color: "#0f172a" }} placeholder="••••••" />
                      </div>
                      <button className="h-9 rounded text-xs font-semibold" style={{ background: form.cor_botao, color: form.cor_botao_texto }}>Entrar</button>
                      <a className="text-xs underline text-center" style={{ color: form.cor_links }}>Esqueci minha senha</a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
