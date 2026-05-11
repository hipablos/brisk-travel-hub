import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Search, SlidersHorizontal, Pencil, Trash2, Users,
} from "lucide-react";
import { useClientes, deleteCliente, type TipoCliente } from "@/lib/cotacoes-store";
import { toast } from "sonner";

export const Route = createFileRoute("/clientes")({
  component: ClientesList,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Clientes" },
      { name: "description", content: "Lista de clientes cadastrados na Brisk Viagens." },
    ],
  }),
});

const TIPO_LABELS: Record<TipoCliente, string> = {
  passageiro: "Passageiro",
  cliente: "Cliente",
  fornecedor: "Fornecedor",
  representante: "Representante",
};

type SortKey = "nome" | "tipo" | "recente";

function ClientesList() {
  const clientes = useClientes();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<"" | TipoCliente>("");
  const [sortBy, setSortBy] = useState<SortKey>("recente");
  const [showWithEmail, setShowWithEmail] = useState(false);
  const [showWithPhone, setShowWithPhone] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = clientes.filter((c) => {
      const tipos = c.tipos && c.tipos.length ? c.tipos : (c.tipo ? [c.tipo] : []);
      if (tipoFilter && !tipos.includes(tipoFilter)) return false;
      if (showWithEmail && !c.email) return false;
      if (showWithPhone && !c.telefone) return false;
      if (!q) return true;
      const blob = [
        c.nome, c.email, c.telefone, c.cpf, c.documento, c.passaporte,
        ...tipos.map((t) => TIPO_LABELS[t]),
      ].filter(Boolean).join(" ").toLowerCase();
      return blob.includes(q);
    });
    if (sortBy === "nome") list = [...list].sort((a, b) => a.nome.localeCompare(b.nome));
    else if (sortBy === "tipo") {
      list = [...list].sort((a, b) => (a.tipo || a.tipos?.[0] || "").localeCompare(b.tipo || b.tipos?.[0] || ""));
    }
    return list;
  }, [clientes, search, tipoFilter, sortBy, showWithEmail, showWithPhone]);

  const handleDelete = (id: string, nome: string) => {
    deleteCliente(id);
    toast.success(`${nome} excluído`);
  };

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
                <span className="text-foreground">Clientes</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Users className="size-6" /> Clientes
              </h1>
            </div>
            <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/clientes/novo"><Plus className="size-4" /> Novo Cliente</Link>
            </Button>
          </div>

          <section className="bg-card border border-border/50 rounded-xl p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, CPF/CNPJ, e-mail, telefone..."
                  className="pl-9"
                />
              </div>
              <Select
                value={tipoFilter || "all"}
                onValueChange={(v) => setTipoFilter(v === "all" ? "" : (v as TipoCliente))}
              >
                <SelectTrigger className="md:w-56"><SelectValue placeholder="Tipo de cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="passageiro">Passageiro</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="fornecedor">Fornecedor</SelectItem>
                  <SelectItem value="representante">Representante</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="size-4" /> Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setSortBy("recente")}>Mais recentes</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("nome")}>Nome (A–Z)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("tipo")}>Tipo</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Exibir somente</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem checked={showWithEmail} onCheckedChange={setShowWithEmail}>
                    Com e-mail
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={showWithPhone} onCheckedChange={setShowWithPhone}>
                    Com telefone
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="border border-border/50 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>CPF / CNPJ</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        {clientes.length === 0
                          ? "Nenhum cliente cadastrado ainda."
                          : "Nenhum cliente encontrado para os filtros aplicados."}
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{c.telefone || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.cpf || c.documento || "—"}</TableCell>
                      <TableCell>
                        {(() => {
                          const tipos = c.tipos && c.tipos.length ? c.tipos : (c.tipo ? [c.tipo] : []);
                          if (!tipos.length) return "—";
                          return (
                            <div className="flex flex-wrap gap-1">
                              {tipos.map((t) => (
                                <Badge key={t} variant="secondary">{TIPO_LABELS[t]}</Badge>
                              ))}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" title="Editar">
                            <Link to="/clientes/novo" search={{ id: c.id }}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Excluir" className="text-destructive hover:text-destructive">
                                <Trash2 className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O cliente <strong>{c.nome}</strong> será removido.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(c.id, c.nome)}
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
              {filtered.length} de {clientes.length} cliente{clientes.length === 1 ? "" : "s"}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
