import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, CreditCard } from "lucide-react";
import {
  useFormasPagamento, saveFormaPagamento, deleteFormaPagamento,
  toggleFormaPagamentoAtivo, type FormaPagamento,
} from "@/lib/cotacoes-store";
import { toast } from "sonner";

export const Route = createFileRoute("/formas-pagamento")({
  component: FormasPagamentoPage,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Formas de Pagamento" },
      { name: "description", content: "Gerencie as opções de pagamento disponíveis para orçamentos e vendas." },
    ],
  }),
});

type FilterKey = "todos" | "ativos" | "inativos" | "parcelados";

type Draft = {
  id: string;
  nome: string;
  parcelas: number;
  intervaloDias: number;
  desconto: number;
  acrescimo: number;
  observacao: string;
  ativo: boolean;
};

const emptyDraft = (): Draft => ({
  id: crypto.randomUUID(),
  nome: "",
  parcelas: 1,
  intervaloDias: 30,
  desconto: 0,
  acrescimo: 0,
  observacao: "",
  ativo: true,
});

function FormasPagamentoPage() {
  const formas = useFormasPagamento();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("todos");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return formas.filter((f) => {
      if (filter === "ativos" && !f.ativo) return false;
      if (filter === "inativos" && f.ativo) return false;
      if (filter === "parcelados" && f.parcelas <= 1) return false;
      if (!q) return true;
      return f.nome.toLowerCase().includes(q);
    });
  }, [formas, search, filter]);

  function openNew() {
    setDraft(emptyDraft());
    setOpen(true);
  }

  function openEdit(f: FormaPagamento) {
    setDraft({
      id: f.id,
      nome: f.nome,
      parcelas: f.parcelas,
      intervaloDias: f.intervaloDias,
      desconto: f.desconto,
      acrescimo: f.acrescimo,
      observacao: f.observacao ?? "",
      ativo: f.ativo,
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!draft.nome.trim()) {
      toast.error("Informe o nome da forma de pagamento");
      return;
    }
    setSaving(true);
    const saved = await saveFormaPagamento({
      ...draft,
      nome: draft.nome.trim(),
      observacao: draft.observacao.trim() || undefined,
    });
    setSaving(false);
    if (!saved) {
      toast.error("Não foi possível salvar");
      return;
    }
    toast.success("Forma de pagamento salva");
    setOpen(false);
  }

  async function handleDelete(f: FormaPagamento) {
    await deleteFormaPagamento(f.id);
    toast.success(`${f.nome} excluída`);
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="p-6 max-w-[1400px] w-full mx-auto">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Cadastros</span>
                <span>/</span>
                <span className="text-foreground">Formas de Pagamento</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <CreditCard className="size-6" /> Formas de Pagamento
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie as opções de pagamento disponíveis para orçamentos e vendas.
              </p>
            </div>
            <Button onClick={openNew} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="size-4" /> Nova Forma de Pagamento
            </Button>
          </div>

          <section className="bg-card border border-border/50 rounded-xl p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar forma de pagamento"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-1 bg-muted/40 rounded-md p-1">
                {(["todos", "ativos", "inativos", "parcelados"] as FilterKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setFilter(k)}
                    className={`px-3 py-1.5 text-xs rounded capitalize transition-colors ${
                      filter === k
                        ? "bg-background text-foreground shadow-sm font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-border/50 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Nome</TableHead>
                    <TableHead>Parcelas</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Acréscimo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        {formas.length === 0
                          ? "Nenhuma forma de pagamento cadastrada."
                          : "Nenhum resultado para os filtros aplicados."}
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.nome}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {f.parcelas > 1 ? `Até ${f.parcelas}x` : "À vista"}
                      </TableCell>
                      <TableCell className="text-emerald-600">
                        {f.desconto > 0 ? `${f.desconto}%` : "—"}
                      </TableCell>
                      <TableCell className="text-rose-600">
                        {f.acrescimo > 0 ? `${f.acrescimo}%` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={f.ativo ? "default" : "secondary"} className={f.ativo ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15" : ""}>
                          {f.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(f.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={f.ativo}
                            onCheckedChange={(c) => toggleFormaPagamentoAtivo(f.id, c)}
                            title={f.ativo ? "Desativar" : "Ativar"}
                          />
                          <Button variant="ghost" size="icon" onClick={() => openEdit(f)} title="Editar">
                            <Pencil className="size-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Excluir" className="text-destructive hover:text-destructive">
                                <Trash2 className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir forma de pagamento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  A forma <strong>{f.nome}</strong> será removida.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(f)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="text-xs text-muted-foreground mt-3">
              {filtered.length} de {formas.length} forma{formas.length === 1 ? "" : "s"}
            </div>
          </section>
        </main>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Forma de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex.: Pix, Cartão de Crédito, Transferência Bancária"
                value={draft.nome}
                onChange={(e) => setDraft({ ...draft, nome: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label>Número de parcelas *</Label>
                <Input
                  type="number"
                  min={1}
                  value={draft.parcelas}
                  onChange={(e) => setDraft({ ...draft, parcelas: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Intervalo de dias</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.intervaloDias}
                  onChange={(e) => setDraft({ ...draft, intervaloDias: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Desconto</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    className="pl-7"
                    value={draft.desconto}
                    onChange={(e) => setDraft({ ...draft, desconto: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Acréscimo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    className="pl-7"
                    value={draft.acrescimo}
                    onChange={(e) => setDraft({ ...draft, acrescimo: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observação</Label>
              <Textarea
                rows={4}
                placeholder="Observações internas sobre esta forma de pagamento..."
                value={draft.observacao}
                onChange={(e) => setDraft({ ...draft, observacao: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={draft.ativo}
                onCheckedChange={(c) => setDraft({ ...draft, ativo: c })}
              />
              <Label className="cursor-pointer" onClick={() => setDraft({ ...draft, ativo: !draft.ativo })}>
                Ativo
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
