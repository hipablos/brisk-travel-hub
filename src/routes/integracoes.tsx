import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Pencil, Trash2, Plug, MessageSquare, Plane, Mail, Globe, CreditCard, Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/integracoes")({
  component: IntegracoesPage,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Integrações" },
      { name: "description", content: "Painel central de gerenciamento de APIs e integrações externas do sistema." },
    ],
  }),
});

type Categoria = "whatsapp" | "aviacao" | "smtp" | "google" | "pagamento";

type Integracao = {
  id: string;
  user_id: string;
  categoria: Categoria;
  nome: string;
  provedor: string | null;
  api_url: string | null;
  api_key: string | null;
  secret_key: string | null;
  ambiente: "producao" | "sandbox";
  ativo: boolean;
  last_sync_at: string | null;
  config: Record<string, unknown>;
};

const CATEGORIAS: { value: Categoria; label: string; icon: React.ComponentType<{ className?: string }>; provedores: string[] }[] = [
  { value: "whatsapp",  label: "WhatsApp",            icon: MessageSquare, provedores: ["Twilio", "Meta Cloud API", "Z-API", "Outro"] },
  { value: "aviacao",   label: "APIs de Aviação",     icon: Plane,         provedores: ["Amadeus", "Sabre", "Travelport", "Duffel", "Outro"] },
  { value: "smtp",      label: "E-mail SMTP",         icon: Mail,          provedores: ["SendGrid", "Mailgun", "Amazon SES", "SMTP Genérico", "Outro"] },
  { value: "google",    label: "Google",              icon: Globe,         provedores: ["Google OAuth", "Google Maps", "Google Calendar", "Outro"] },
  { value: "pagamento", label: "Gateways de Pagamento", icon: CreditCard,  provedores: ["Stripe", "Mercado Pago", "PagSeguro", "Pagar.me", "Asaas", "Outro"] },
];

const CAT_BY_VALUE = Object.fromEntries(CATEGORIAS.map((c) => [c.value, c]));

type Draft = {
  id: string | null;
  categoria: Categoria;
  nome: string;
  provedor: string;
  api_url: string;
  api_key: string;
  secret_key: string;
  ambiente: "producao" | "sandbox";
  ativo: boolean;
};

const emptyDraft = (categoria: Categoria): Draft => ({
  id: null,
  categoria,
  nome: "",
  provedor: "",
  api_url: "",
  api_key: "",
  secret_key: "",
  ambiente: "producao",
  ativo: true,
});

function useIntegracoes() {
  const [data, setData] = useState<Integracao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("integracoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (error) toast.error("Erro ao carregar integrações");
      else setData((data ?? []) as Integracao[]);
      setLoading(false);
    };
    load();
    const channel = supabase
      .channel("integracoes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "integracoes" }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  return { data, loading };
}

function IntegracoesPage() {
  const { data, loading } = useIntegracoes();
  const [tab, setTab] = useState<Categoria>("whatsapp");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const filtered = useMemo(() => data.filter((i) => i.categoria === tab), [data, tab]);
  const catMeta = CAT_BY_VALUE[tab];

  const openNew = () => setDraft(emptyDraft(tab));
  const openEdit = (i: Integracao) => setDraft({
    id: i.id,
    categoria: i.categoria,
    nome: i.nome,
    provedor: i.provedor ?? "",
    api_url: i.api_url ?? "",
    api_key: i.api_key ?? "",
    secret_key: i.secret_key ?? "",
    ambiente: i.ambiente,
    ativo: i.ativo,
  });

  const save = async () => {
    if (!draft) return;
    if (!draft.nome.trim()) { toast.error("Informe o nome da integração"); return; }
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) { toast.error("Sessão expirada"); return; }
    const payload = {
      user_id: userId,
      categoria: draft.categoria,
      nome: draft.nome.trim(),
      provedor: draft.provedor || null,
      api_url: draft.api_url || null,
      api_key: draft.api_key || null,
      secret_key: draft.secret_key || null,
      ambiente: draft.ambiente,
      ativo: draft.ativo,
    };
    const res = draft.id
      ? await supabase.from("integracoes").update(payload).eq("id", draft.id)
      : await supabase.from("integracoes").insert(payload);
    if (res.error) { toast.error("Erro ao salvar"); return; }
    toast.success(draft.id ? "Integração atualizada" : "Integração criada");
    setDraft(null);
  };

  const remove = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("integracoes").delete().eq("id", deleteId);
    if (error) toast.error("Erro ao excluir");
    else toast.success("Integração removida");
    setDeleteId(null);
  };

  const toggleAtivo = async (i: Integracao) => {
    const { error } = await supabase.from("integracoes").update({ ativo: !i.ativo }).eq("id", i.id);
    if (error) toast.error("Erro ao atualizar status");
  };

  const testConnection = async (i: Integracao) => {
    setTestingId(i.id);
    try {
      let ok = true;
      if (i.api_url) {
        try {
          await fetch(i.api_url, { method: "HEAD", mode: "no-cors" });
        } catch { ok = false; }
      }
      const now = new Date().toISOString();
      await supabase.from("integracoes").update({ last_sync_at: now }).eq("id", i.id);
      if (ok) toast.success(`Conexão com ${i.nome} testada com sucesso`);
      else toast.error(`Falha ao conectar em ${i.nome}`);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Plug className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Integrações</h1>
                <p className="text-sm text-muted-foreground">
                  Painel central de gerenciamento de APIs e integrações do sistema.
                </p>
              </div>
            </div>
            <Button onClick={openNew}>
              <Plus className="size-4" /> Nova integração
            </Button>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as Categoria)}>
            <TabsList className="flex flex-wrap h-auto">
              {CATEGORIAS.map((c) => (
                <TabsTrigger key={c.value} value={c.value} className="gap-2">
                  <c.icon className="size-4" /> {c.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Ambiente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última sincronização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma integração de {catMeta.label} cadastrada.
                  </TableCell></TableRow>
                ) : filtered.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.nome}</TableCell>
                    <TableCell>{i.provedor ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={i.ambiente === "producao" ? "default" : "secondary"}>
                        {i.ambiente === "producao" ? "Produção" : "Sandbox"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={i.ativo} onCheckedChange={() => toggleAtivo(i)} />
                        <span className="text-xs text-muted-foreground">{i.ativo ? "Ativo" : "Inativo"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {i.last_sync_at ? new Date(i.last_sync_at).toLocaleString("pt-BR") : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => testConnection(i)} disabled={testingId === i.id}>
                          <Activity className="size-4" /> Testar
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(i)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(i.id)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar integração" : "Nova integração"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Categoria</Label>
                <Select value={draft.categoria} onValueChange={(v) => setDraft({ ...draft, categoria: v as Categoria, provedor: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Provedor</Label>
                <Select value={draft.provedor} onValueChange={(v) => setDraft({ ...draft, provedor: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAT_BY_VALUE[draft.categoria].provedores.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>URL da API</Label>
                <Input value={draft.api_url} onChange={(e) => setDraft({ ...draft, api_url: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input type="password" value={draft.api_key} onChange={(e) => setDraft({ ...draft, api_key: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Secret Key</Label>
                <Input type="password" value={draft.secret_key} onChange={(e) => setDraft({ ...draft, secret_key: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <Select value={draft.ambiente} onValueChange={(v) => setDraft({ ...draft, ambiente: v as "producao" | "sandbox" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="producao">Produção</SelectItem>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-3 h-9">
                  <Switch checked={draft.ativo} onCheckedChange={(v) => setDraft({ ...draft, ativo: v })} />
                  <span className="text-sm text-muted-foreground">{draft.ativo ? "Ativo" : "Inativo"}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir integração?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
