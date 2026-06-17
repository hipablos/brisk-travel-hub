import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { Plus, Pencil, Trash2, Hotel, Star, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HotelAutocomplete, type PlaceResult } from "@/components/hospedagens/HotelAutocomplete";

export const Route = createFileRoute("/hospedagens")({
  component: HospedagensPage,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Hospedagens" },
      { name: "description", content: "Hospedagens vinculadas às cotações da Brisk Viagens." },
    ],
  }),
});

type Hospedagem = {
  id: string;
  cotacao_id: string | null;
  cliente_id: string | null;
  nome_hotel: string;
  estrelas: number | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  lat: number | null;
  lng: number | null;
  checkin: string | null;
  checkout: string | null;
  noites: number | null;
  hospedes: number | null;
  quartos: number | null;
  tipo_acomodacao: string | null;
  regime_alimentar: string | null;
  numero_reserva: string | null;
  codigo_confirmacao: string | null;
  observacoes_cliente: string | null;
  created_at: string;
};

const REGIMES = [
  { value: "sem_alimentacao", label: "Sem alimentação" },
  { value: "cafe_da_manha", label: "Café da manhã" },
  { value: "meia_pensao", label: "Meia pensão" },
  { value: "pensao_completa", label: "Pensão completa" },
  { value: "all_inclusive", label: "All Inclusive" },
];

const REGIME_LABEL: Record<string, string> = Object.fromEntries(
  REGIMES.map((r) => [r.value, r.label])
);

const emptyForm = (): Partial<Hospedagem> => ({
  nome_hotel: "",
  estrelas: null,
  endereco: "",
  cidade: "",
  estado: "",
  pais: "",
  google_place_id: null,
  google_maps_url: null,
  lat: null,
  lng: null,
  checkin: "",
  checkout: "",
  noites: null,
  hospedes: 1,
  quartos: 1,
  tipo_acomodacao: "",
  regime_alimentar: "sem_alimentacao",
  numero_reserva: "",
  codigo_confirmacao: "",
  observacoes_cliente: "",
  cotacao_id: null,
  cliente_id: null,
});

function HospedagensPage() {
  const [rows, setRows] = useState<Hospedagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Hospedagem | null>(null);
  const [form, setForm] = useState<Partial<Hospedagem>>(emptyForm());
  const [cotacoes, setCotacoes] = useState<{ id: string; titulo: string | null }[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from as any)("hospedagens")
      .select("*")
      .order("checkin", { ascending: false, nullsFirst: false });
    if (error) toast.error("Erro ao carregar hospedagens");
    setRows((data as Hospedagem[]) || []);
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

  const openEdit = (h: Hospedagem) => {
    setEditing(h);
    setForm({
      ...h,
      checkin: h.checkin ? h.checkin.slice(0, 16) : "",
      checkout: h.checkout ? h.checkout.slice(0, 16) : "",
    });
    setOpen(true);
  };

  const computedNoites = useMemo(() => {
    if (form.checkin && form.checkout) {
      const a = new Date(form.checkin);
      const b = new Date(form.checkout);
      const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
      return diff > 0 ? diff : null;
    }
    return form.noites ?? null;
  }, [form.checkin, form.checkout, form.noites]);

  const handlePlace = (p: PlaceResult) => {
    setForm((f) => ({
      ...f,
      nome_hotel: p.nome ?? f.nome_hotel,
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
    if (!form.nome_hotel?.trim()) {
      toast.error("Informe o nome do hotel");
      return;
    }
    const user = (await supabase.auth.getUser()).data.user;
    const payload: any = {
      ...form,
      noites: computedNoites,
      checkin: form.checkin ? new Date(form.checkin).toISOString() : null,
      checkout: form.checkout ? new Date(form.checkout).toISOString() : null,
      cotacao_id: form.cotacao_id || null,
      cliente_id: form.cliente_id || null,
      created_by: editing ? undefined : user?.id,
    };
    const q = editing
      ? (supabase.from as any)("hospedagens").update(payload).eq("id", editing.id)
      : (supabase.from as any)("hospedagens").insert(payload);
    const { error } = await q;
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Hospedagem atualizada" : "Hospedagem criada");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta hospedagem?")) return;
    const { error } = await (supabase.from as any)("hospedagens").delete().eq("id", id);
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
                <Hotel className="size-6" /> Hospedagens
              </h1>
              <p className="text-sm text-muted-foreground">
                Cadastre hotéis e vincule às cotações.
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNew}>
                  <Plus className="size-4 mr-2" />
                  Nova Hospedagem
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editing ? "Editar hospedagem" : "Nova hospedagem"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <HotelAutocomplete
                    value={form.nome_hotel || ""}
                    onChange={(v) => setForm((f) => ({ ...f, nome_hotel: v }))}
                    onPlaceSelected={handlePlace}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Classificação (estrelas)</Label>
                      <Select
                        value={form.estrelas?.toString() ?? ""}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, estrelas: v ? Number(v) : null }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {"★".repeat(n)} ({n})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Regime alimentar</Label>
                      <Select
                        value={form.regime_alimentar || "sem_alimentacao"}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, regime_alimentar: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REGIMES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Endereço completo</Label>
                    <Input
                      value={form.endereco || ""}
                      onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
                    />
                  </div>

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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Check-in</Label>
                      <Input
                        type="datetime-local"
                        value={form.checkin || ""}
                        onChange={(e) => setForm((f) => ({ ...f, checkin: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Check-out</Label>
                      <Input
                        type="datetime-local"
                        value={form.checkout || ""}
                        onChange={(e) => setForm((f) => ({ ...f, checkout: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label>Noites</Label>
                      <Input
                        type="number"
                        min={0}
                        value={computedNoites ?? ""}
                        readOnly={!!(form.checkin && form.checkout)}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            noites: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Hóspedes</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.hospedes ?? ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            hospedes: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Quartos</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.quartos ?? ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            quartos: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tipo de acomodação</Label>
                      <Input
                        placeholder="Ex: Suíte Luxo"
                        value={form.tipo_acomodacao || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, tipo_acomodacao: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Nº da reserva</Label>
                      <Input
                        value={form.numero_reserva || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, numero_reserva: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Código de confirmação</Label>
                      <Input
                        value={form.codigo_confirmacao || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, codigo_confirmacao: e.target.value }))
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
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome}
                            </SelectItem>
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
                          <SelectValue placeholder="Selecionar..." />
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
                    <Label>Observações ao cliente</Label>
                    <Textarea
                      rows={3}
                      value={form.observacoes_cliente || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, observacoes_cliente: e.target.value }))
                      }
                    />
                  </div>

                  {form.google_maps_url && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="size-3" />
                      Local Google Maps capturado (não será exibido ao cliente).
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={save}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Noites</TableHead>
                  <TableHead>Regime</TableHead>
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
                      Nenhuma hospedagem cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>
                        <div className="font-medium">{h.nome_hotel}</div>
                        {h.estrelas ? (
                          <div className="text-xs text-amber-500 flex items-center gap-0.5">
                            {Array.from({ length: h.estrelas }).map((_, i) => (
                              <Star key={i} className="size-3 fill-current" />
                            ))}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {[h.cidade, h.estado].filter(Boolean).join(" / ") || "—"}
                      </TableCell>
                      <TableCell>
                        {h.checkin ? new Date(h.checkin).toLocaleString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell>
                        {h.checkout ? new Date(h.checkout).toLocaleString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell>{h.noites ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {REGIME_LABEL[h.regime_alimentar || ""] || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(h)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => remove(h.id)}
                          >
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
