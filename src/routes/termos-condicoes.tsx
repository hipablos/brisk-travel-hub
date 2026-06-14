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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, FileSignature, Star } from "lucide-react";
import {
  useTermosModelos, saveTermoModelo, deleteTermoModelo,
  toggleTermoModeloAtivo, setTermoModeloPadrao,
  type TermoModelo, type TermoCategoria,
  DEFAULT_TERMOS, DEFAULT_OUTRAS_INFORMACOES,
} from "@/lib/cotacoes-store";
import { toast } from "sonner";

export const Route = createFileRoute("/termos-condicoes")({
  component: TermosCondicoesPage,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Termos e Condições" },
      { name: "description", content: "Gerencie modelos de termos, condições e outras informações para suas cotações." },
    ],
  }),
});

type Draft = {
  id: string;
  categoria: TermoCategoria;
  nome: string;
  conteudo: string;
  padrao: boolean;
  ativo: boolean;
};

const emptyDraft = (categoria: TermoCategoria): Draft => ({
  id: crypto.randomUUID(),
  categoria,
  nome: "",
  conteudo: categoria === "termos" ? DEFAULT_TERMOS : DEFAULT_OUTRAS_INFORMACOES,
  padrao: false,
  ativo: true,
});

const CAT_LABEL: Record<TermoCategoria, string> = {
  termos: "Termos e Condições",
  outras: "Outras Informações",
};

function TermosCondicoesPage() {
  const modelos = useTermosModelos();
  const [tab, setTab] = useState<TermoCategoria>("termos");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft("termos"));
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () => modelos.filter((m) => m.categoria === tab),
    [modelos, tab],
  );

  function openNew() {
    setDraft(emptyDraft(tab));
    setOpen(true);
  }

  function openEdit(m: TermoModelo) {
    setDraft({
      id: m.id,
      categoria: m.categoria,
      nome: m.nome,
      conteudo: m.conteudo,
      padrao: m.padrao,
      ativo: m.ativo,
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!draft.nome.trim()) {
      toast.error("Informe o nome do modelo");
      return;
    }
    setSaving(true);
    const saved = await saveTermoModelo({
      ...draft,
      nome: draft.nome.trim(),
    });
    setSaving(false);
    if (!saved) { toast.error("Não foi possível salvar"); return; }
    toast.success("Modelo salvo");
    setOpen(false);
  }

  async function handleDelete(m: TermoModelo) {
    await deleteTermoModelo(m.id);
    toast.success(`${m.nome} excluído`);
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
                <span className="text-foreground">Termos e Condições</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <FileSignature className="size-6" /> Termos e Condições
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Cadastre, edite e defina modelos padrão de termos e outras informações usadas nas cotações.
              </p>
            </div>
            <Button onClick={openNew} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="size-4" /> Novo Modelo
            </Button>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as TermoCategoria)}>
            <TabsList className="mb-4">
              <TabsTrigger value="termos">Termos e Condições</TabsTrigger>
              <TabsTrigger value="outras">Outras Informações</TabsTrigger>
            </TabsList>

            {(["termos", "outras"] as TermoCategoria[]).map((cat) => (
              <TabsContent key={cat} value={cat} className="mt-0">
                <section className="bg-card border border-border/50 rounded-xl p-4 md:p-6">
                  <div className="border border-border/50 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead>Nome</TableHead>
                          <TableHead>Prévia</TableHead>
                          <TableHead>Padrão</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                              Nenhum modelo cadastrado.
                            </TableCell>
                          </TableRow>
                        )}
                        {filtered.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium align-top">{m.nome}</TableCell>
                            <TableCell className="text-muted-foreground text-xs max-w-[480px] align-top">
                              <div className="line-clamp-2 whitespace-pre-wrap">{m.conteudo}</div>
                            </TableCell>
                            <TableCell className="align-top">
                              {m.padrao ? (
                                <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 gap-1">
                                  <Star className="size-3" /> Padrão
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs h-7"
                                  onClick={() => setTermoModeloPadrao(m.id, m.categoria)}
                                >
                                  Definir padrão
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className="align-top">
                              <Badge variant={m.ativo ? "default" : "secondary"} className={m.ativo ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15" : ""}>
                                {m.ativo ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right align-top">
                              <div className="flex items-center justify-end gap-2">
                                <Switch
                                  checked={m.ativo}
                                  onCheckedChange={(c) => toggleTermoModeloAtivo(m.id, c)}
                                  title={m.ativo ? "Desativar" : "Ativar"}
                                />
                                <Button variant="ghost" size="icon" onClick={() => openEdit(m)} title="Editar">
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
                                      <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        O modelo <strong>{m.nome}</strong> será removido. Cotações já emitidas não serão afetadas.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(m)}
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
                </section>
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modelo de {CAT_LABEL[draft.categoria]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria *</Label>
                <Select value={draft.categoria} onValueChange={(v) => setDraft({ ...draft, categoria: v as TermoCategoria })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="termos">Termos e Condições</SelectItem>
                    <SelectItem value="outras">Outras Informações</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex.: Modelo padrão internacional"
                  value={draft.nome}
                  onChange={(e) => setDraft({ ...draft, nome: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Conteúdo</Label>
              <Textarea
                rows={12}
                placeholder="Texto que aparecerá no PDF da cotação..."
                value={draft.conteudo}
                onChange={(e) => setDraft({ ...draft, conteudo: e.target.value })}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Quebras de linha e espaçamentos serão preservados no PDF.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft.ativo}
                  onCheckedChange={(c) => setDraft({ ...draft, ativo: c })}
                />
                <Label className="cursor-pointer" onClick={() => setDraft({ ...draft, ativo: !draft.ativo })}>
                  Ativo
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft.padrao}
                  onCheckedChange={(c) => setDraft({ ...draft, padrao: c })}
                />
                <Label className="cursor-pointer" onClick={() => setDraft({ ...draft, padrao: !draft.padrao })}>
                  Usar como padrão em novas cotações
                </Label>
              </div>
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
