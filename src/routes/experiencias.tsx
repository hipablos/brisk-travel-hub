import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlaceAutocomplete, type PlaceResult } from "@/components/places/PlaceAutocomplete";

export const Route = createFileRoute("/experiencias")({
  component: ExperienciasPage,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Experiências Turísticas" },
      { name: "description", content: "Passeios e experiências turísticas vinculadas às cotações." },
    ],
  }),
});

type Experiencia = {
  id: string;
  cotacao_id: string | null;
  cliente_id: string | null;
  nome: string;
  categoria: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  lat: number | null;
  lng: number | null;
  data: string | null;
  hora_inicio: string | null;
  hora_termino: string | null;
  duracao_min: number | null;
  participantes: number | null;
  idioma: string | null;
  idade_minima: number | null;
  descricao: string | null;
  created_at: string;
};

const CATEGORIAS = [
  "Passeio", "City Tour", "Ingresso", "Aventura", "Gastronômico",
  "Cultural", "Show / Evento", "Transfer", "Outro",
];

const emptyForm = (): Partial<Experiencia> => ({
  nome: "",
  categoria: "Passeio",
  endereco: "",
  cidade: "",
  estado: "",
  pais: "",
  google_place_id: null,
  google_maps_url: null,
  lat: null,
  lng: null,
  data: "",
  hora_inicio: "",
  hora_termino: "",
  duracao_min: null,
  participantes: 1,
  idioma: "Português",
  idade_minima: null,
  descricao: "",
  cotacao_id: null,
  cliente_id: null,
});

function minutesBetween(a: string, b: string): number | null {
  if (!a || !b) return null;
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  if ([ah, am, bh, bm].some((n) => Number.isNaN(n))) return null;
  const diff = bh * 60 + bm - (ah * 60 + am);
  return diff > 0 ? diff : null;
}

function ExperienciasPage() {
  const [rows, setRows] = useState<Experiencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Experiencia | null>(null);
  const [form, setForm] = useState<Partial<Experiencia>>(emptyForm());
  const [cotacoes, setCotacoes] = useState<{ id: string; titulo: string | null }[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from as any)("experiencias")
      .select("*")
      .order("data", { ascending: false, nullsFirst: false });
    if (error) toast.error("Erro ao carregar experiências");
    setRows((data as Experiencia[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    (supabase.from as any)("cotacoes").select("id, titulo").then(({ data }: any) => {
      if (data) setCotacoes(data);
    });
    supabase.from("clientes").select("id, nome").then(({ data }) => {
      if (data) setClientes(data as any);
    });
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (e: Experiencia) => {
    setEditing(e);
    setForm({
      ...e,
      hora_inicio: e.hora_inicio ? e.hora_inicio.slice(0, 5) : "",
      hora_termino: e.hora_termino ? e.hora_termino.slice(0, 5) : "",
    });
    setOpen(true);
  };

  const handlePlace = (p: PlaceResult) => {
    setForm((f) => ({
      ...f,
      endereco: p.endereco ?? f.endereco,
      cidade: p.cidade ?? f.cidade,
      estado: p.estado ?? f.estado,
      pais: p.pais ?? f.pais,
      google_place_id: p.google_place_id ?? null,
      google_maps_url: p.google_maps_url ?? null,
      lat: p.lat ?? null,
      lng: p.lng ?? null,
    }));
  };

  const save = async () => {
    if (!form.nome?.trim()) {
      toast.error("Informe o nome da experiência");
      return;
    }
    const user = (await supabase.auth.getUser()).data.user;
    const duracao =
      form.duracao_min ??
      minutesBetween(form.hora_inicio || "", form.hora_termino || "");
    const payload: any = {
      ...form,
      duracao_min: duracao,
      data: form.data || null,
      hora_inicio: form.hora_inicio || null,
      hora_termino: form.hora_termino || null,
      cotacao_id: form.cotacao_id || null,
      cliente_id: form.cliente_id || null,
      created_by: editing ? undefined : user?.id,
    };
    const q = editing
      ? (supabase.from as any)("experiencias").update(payload).eq("id", editing.id)
      : (supabase.from as any)("experiencias").insert(payload);
    const { error } = await q;
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Experiência atualizada" : "Experiência criada");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta experiência?")) return;
    const { error } = await (supabase.from as any)("experiencias").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Excluída");
    load();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="size-6" /> Experiências Turísticas
              </h1>
              <p className="text-sm text-muted-foreground">
                Cadastre passeios, ingressos e atividades dos clientes.
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNew}>
                  <Plus className="size-4 mr-2" />
                  Nova Experiência
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editing ? "Editar experiência" : "Nova experiência"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Nome do passeio / experiência</Label>
                      <Input
                        value={form.nome || ""}
                        onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Categoria</Label>
                      <Select
                        value={form.categoria || "Passeio"}
                        onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <PlaceAutocomplete
                    label="Endereço / local"
                    value={form.endereco || ""}
                    onChange={(v) => setForm((f) => ({ ...f, endereco: v }))}
                    onPlaceSelected={handlePlace}
                    types={["establishment"]}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Cidade</Label>
                      <Input
                        value={form.cidade || ""}
                        onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Estado</Label>
                      <Input
                        value={form.estado || ""}
                        onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>País</Label>
                      <Input
                        value={form.pais || ""}
                        onChange={(e) => setForm((f) => ({ ...f, pais: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={form.data || ""}
                        onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Início</Label>
                      <Input
                        type="time"
                        value={form.hora_inicio || ""}
                        onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Término</Label>
                      <Input
                        type="time"
                        value={form.hora_termino || ""}
                        onChange={(e) => setForm((f) => ({ ...f, hora_termino: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Duração (min)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.duracao_min ?? minutesBetween(form.hora_inicio || "", form.hora_termino || "") ?? ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            duracao_min: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Participantes</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.participantes ?? ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            participantes: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Idioma</Label>
                      <Input
                        value={form.idioma || ""}
                        onChange={(e) => setForm((f) => ({ ...f, idioma: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Idade mínima</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.idade_minima ?? ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            idade_minima: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Cliente</Label>
                      <Select
                        value={form.cliente_id || ""}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, cliente_id: v || null }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cotação vinculada</Label>
                      <Select
                        value={form.cotacao_id || ""}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, cotacao_id: v || null }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {cotacoes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.titulo || c.id.slice(0, 8)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Descrição</Label>
                    <Textarea
                      rows={3}
                      value={form.descricao || ""}
                      onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={save}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Experiência</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma experiência cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.nome}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{e.categoria || "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        {e.data ? new Date(e.data + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell>
                        {e.hora_inicio
                          ? `${e.hora_inicio.slice(0, 5)}${e.hora_termino ? " – " + e.hora_termino.slice(0, 5) : ""}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {[e.cidade, e.estado].filter(Boolean).join(" / ") || "—"}
                      </TableCell>
                      <TableCell>{e.participantes ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(e)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => remove(e.id)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    </div>
  );
}
