import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  startOfDay, endOfDay, isSameDay, isWithinInterval, addDays, addMonths, subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight,
  Plane, Hotel, MapPin, Bell, FileText, Trash2, Pencil,
} from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendario")({
  component: CalendarioPage,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Calendário Operacional" },
      { name: "description", content: "Calendário operacional unificado da agência." },
    ],
  }),
});

// ---------- Tipos de evento unificado ----------
type Categoria =
  | "voo"
  | "checkin_hotel"
  | "checkout_hotel"
  | "experiencia"
  | "anotacao"
  | "tarefa"
  | "follow_up"
  | "financeiro";

const CATEGORIA_INFO: Record<Categoria, { label: string; color: string; icon: any }> = {
  voo: { label: "Voo", color: "bg-blue-500", icon: Plane },
  checkin_hotel: { label: "Check-in Hotel", color: "bg-emerald-500", icon: Hotel },
  checkout_hotel: { label: "Check-out Hotel", color: "bg-amber-500", icon: Hotel },
  experiencia: { label: "Experiência", color: "bg-violet-500", icon: MapPin },
  anotacao: { label: "Anotação", color: "bg-slate-500", icon: FileText },
  tarefa: { label: "Tarefa", color: "bg-cyan-500", icon: FileText },
  follow_up: { label: "Follow-up", color: "bg-pink-500", icon: Bell },
  financeiro: { label: "Financeiro", color: "bg-rose-500", icon: FileText },
};

type EventoUnificado = {
  id: string;
  source: "manual" | "voo" | "hospedagem" | "experiencia";
  data: Date;
  hora: string | null;
  titulo: string;
  descricao: string | null;
  categoria: Categoria;
  cliente: string | null;
  cotacao_id: string | null;
  prioridade?: string | null;
  raw?: any;
};

type AnotacaoForm = {
  id?: string;
  titulo: string;
  data: string;
  hora: string;
  categoria: Categoria;
  prioridade: string;
  cliente_id: string | null;
  cotacao_id: string | null;
  descricao: string;
  responsavel: string;
  notif_um_dia_antes: boolean;
  notif_duas_horas_antes: boolean;
  notif_no_horario: boolean;
};

const emptyForm = (date?: Date): AnotacaoForm => ({
  titulo: "",
  data: format(date ?? new Date(), "yyyy-MM-dd"),
  hora: "",
  categoria: "anotacao",
  prioridade: "media",
  cliente_id: null,
  cotacao_id: null,
  descricao: "",
  responsavel: "",
  notif_um_dia_antes: false,
  notif_duas_horas_antes: false,
  notif_no_horario: false,
});

// ---------- Helpers para extrair eventos ----------
function parseBrDate(s?: string, t?: string): Date | null {
  if (!s) return null;
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const mt = t ? /^(\d{2}):(\d{2})$/.exec(t.trim()) : null;
  return new Date(+yyyy, +mm - 1, +dd, mt ? +mt[1] : 0, mt ? +mt[2] : 0);
}

function extractVoosEventos(cotacoes: any[]): EventoUnificado[] {
  const out: EventoUnificado[] = [];
  for (const c of cotacoes) {
    const d = (c.data ?? {}) as any;
    const cliente = d.cliente?.nome ?? null;
    const idas = Array.isArray(d.vooIdas) ? d.vooIdas : d.vooIda ? [d.vooIda] : [];
    const voltas = Array.isArray(d.vooVoltas) ? d.vooVoltas : d.vooVolta ? [d.vooVolta] : [];
    const todos = [
      ...idas.map((v: any, i: number) => ({ v, tipo: "Ida", i, total: idas.length })),
      ...voltas.map((v: any, i: number) => ({ v, tipo: "Volta", i, total: voltas.length })),
    ];
    todos.forEach((t) => {
      const dt = parseBrDate(t.v?.data, t.v?.horaSaida);
      if (!dt) return;
      const label = t.total > 1 ? `${t.tipo} – Trecho ${t.i + 1}` : t.tipo;
      out.push({
        id: `voo-${c.id}-${t.tipo}-${t.i}`,
        source: "voo",
        data: dt,
        hora: t.v?.horaSaida ?? null,
        titulo: `${label}: ${t.v?.origem ?? "—"} → ${t.v?.destino ?? "—"}`,
        descricao: `${t.v?.companhia ?? ""} ${t.v?.numeroVoo ?? ""}`.trim() || null,
        categoria: "voo",
        cliente,
        cotacao_id: c.id,
      });
    });
  }
  return out;
}

function extractHospedagensEventos(rows: any[]): EventoUnificado[] {
  const out: EventoUnificado[] = [];
  for (const h of rows) {
    if (h.checkin) {
      const dt = new Date(h.checkin);
      out.push({
        id: `hosp-in-${h.id}`,
        source: "hospedagem",
        data: dt,
        hora: format(dt, "HH:mm"),
        titulo: `Check-in: ${h.nome_hotel}`,
        descricao: h.cidade ?? h.endereco ?? null,
        categoria: "checkin_hotel",
        cliente: null,
        cotacao_id: h.cotacao_id,
      });
    }
    if (h.checkout) {
      const dt = new Date(h.checkout);
      out.push({
        id: `hosp-out-${h.id}`,
        source: "hospedagem",
        data: dt,
        hora: format(dt, "HH:mm"),
        titulo: `Check-out: ${h.nome_hotel}`,
        descricao: h.cidade ?? h.endereco ?? null,
        categoria: "checkout_hotel",
        cliente: null,
        cotacao_id: h.cotacao_id,
      });
    }
  }
  return out;
}

function extractExperienciasEventos(rows: any[]): EventoUnificado[] {
  return rows
    .filter((e) => e.data)
    .map((e) => {
      const [y, m, d] = String(e.data).split("-").map(Number);
      const [hh, mm] = (e.hora_inicio ?? "00:00").split(":").map(Number);
      const dt = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0);
      return {
        id: `exp-${e.id}`,
        source: "experiencia" as const,
        data: dt,
        hora: e.hora_inicio ?? null,
        titulo: e.nome ?? "Experiência",
        descricao: [e.categoria, e.cidade].filter(Boolean).join(" · ") || null,
        categoria: "experiencia" as Categoria,
        cliente: null,
        cotacao_id: e.cotacao_id ?? null,
        raw: e,
      };
    });
}

function extractAnotacoes(rows: any[]): EventoUnificado[] {
  return rows.map((a) => {
    const [y, m, d] = String(a.data).split("-").map(Number);
    const [hh, mm] = (a.hora ?? "00:00").split(":").map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0);
    return {
      id: `manual-${a.id}`,
      source: "manual" as const,
      data: dt,
      hora: a.hora ?? null,
      titulo: a.titulo,
      descricao: a.descricao,
      categoria: (a.categoria ?? "anotacao") as Categoria,
      cliente: null,
      cotacao_id: a.cotacao_id ?? null,
      prioridade: a.prioridade,
      raw: a,
    };
  });
}

// ---------- Página ----------
function CalendarioPage() {
  const [refDate, setRefDate] = useState(new Date());
  const [view, setView] = useState<"mes" | "semana" | "dia" | "lista">("mes");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [eventos, setEventos] = useState<EventoUnificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<string>("todas");
  const [filterCliente, setFilterCliente] = useState<string>("todos");

  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [cotacoes, setCotacoes] = useState<{ id: string; titulo: string | null }[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<AnotacaoForm>(emptyForm());

  const load = async () => {
    setLoading(true);
    try {
      const [anot, cots, hosp, exps, cli] = await Promise.all([
        (supabase.from as any)("calendario_eventos").select("*").order("data"),
        (supabase.from as any)("cotacoes").select("id, code, titulo, data"),
        (supabase.from as any)("hospedagens").select("id, nome_hotel, cidade, endereco, checkin, checkout, cotacao_id"),
        (supabase.from as any)("experiencias").select("*"),
        supabase.from("clientes").select("id, nome"),
      ]);
      const all: EventoUnificado[] = [
        ...extractAnotacoes(anot.data ?? []),
        ...extractVoosEventos(cots.data ?? []),
        ...extractHospedagensEventos(hosp.data ?? []),
        ...extractExperienciasEventos(exps.data ?? []),
      ];
      setEventos(all);
      setClientes((cli.data as any) ?? []);
      setCotacoes((cots.data as any) ?? []);
    } catch (e: any) {
      toast.error("Erro ao carregar calendário");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => {
      if (filterCat !== "todas" && e.categoria !== filterCat) return false;
      if (filterCliente !== "todos" && e.cliente !== filterCliente) return false;
      return true;
    });
  }, [eventos, filterCat, filterCliente]);

  // Ranges por view
  const range = useMemo(() => {
    if (view === "mes") return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
    if (view === "semana") return { start: startOfWeek(refDate, { weekStartsOn: 0 }), end: endOfWeek(refDate, { weekStartsOn: 0 }) };
    if (view === "dia") return { start: startOfDay(refDate), end: endOfDay(refDate) };
    return { start: new Date(), end: addDays(new Date(), 90) };
  }, [view, refDate]);

  const eventosVisiveis = useMemo(() => {
    return eventosFiltrados
      .filter((e) => isWithinInterval(e.data, range))
      .sort((a, b) => a.data.getTime() - b.data.getTime());
  }, [eventosFiltrados, range]);

  // ---------- Ações ----------
  const openNew = (date?: Date) => {
    setForm(emptyForm(date));
    setDialogOpen(true);
  };

  const openEdit = (ev: EventoUnificado) => {
    if (ev.source !== "manual" || !ev.raw) return;
    const a = ev.raw;
    setForm({
      id: a.id,
      titulo: a.titulo,
      data: a.data,
      hora: a.hora ?? "",
      categoria: (a.categoria ?? "anotacao") as Categoria,
      prioridade: a.prioridade ?? "media",
      cliente_id: a.cliente_id,
      cotacao_id: a.cotacao_id,
      descricao: a.descricao ?? "",
      responsavel: a.responsavel ?? "",
      notif_um_dia_antes: !!a.notif_um_dia_antes,
      notif_duas_horas_antes: !!a.notif_duas_horas_antes,
      notif_no_horario: !!a.notif_no_horario,
    });
    setDialogOpen(true);
  };

  const saveForm = async () => {
    if (!form.titulo.trim()) { toast.error("Informe o título"); return; }
    const user = (await supabase.auth.getUser()).data.user;
    const payload: any = {
      titulo: form.titulo,
      data: form.data,
      hora: form.hora || null,
      categoria: form.categoria,
      prioridade: form.prioridade,
      cliente_id: form.cliente_id || null,
      cotacao_id: form.cotacao_id || null,
      descricao: form.descricao || null,
      responsavel: form.responsavel || null,
      notif_um_dia_antes: form.notif_um_dia_antes,
      notif_duas_horas_antes: form.notif_duas_horas_antes,
      notif_no_horario: form.notif_no_horario,
      created_by: form.id ? undefined : user?.id,
    };
    const q = form.id
      ? (supabase.from as any)("calendario_eventos").update(payload).eq("id", form.id)
      : (supabase.from as any)("calendario_eventos").insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success(form.id ? "Anotação atualizada" : "Anotação criada");
    setDialogOpen(false);
    load();
  };

  const removeEvent = async (ev: EventoUnificado) => {
    if (ev.source !== "manual" || !ev.raw) return;
    if (!confirm("Excluir esta anotação?")) return;
    const { error } = await (supabase.from as any)("calendario_eventos").delete().eq("id", ev.raw.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removido");
    load();
  };

  // ---------- Render helpers ----------
  const monthGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(refDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(refDate), { weekStartsOn: 0 });
    const days: Date[] = [];
    let cur = start;
    while (cur <= end) { days.push(cur); cur = addDays(cur, 1); }
    return days;
  }, [refDate]);

  const eventsByDay = (d: Date) => eventosFiltrados.filter((e) => isSameDay(e.data, d));

  const navPrev = () => {
    if (view === "mes") setRefDate(subMonths(refDate, 1));
    else if (view === "semana") setRefDate(addDays(refDate, -7));
    else setRefDate(addDays(refDate, -1));
  };
  const navNext = () => {
    if (view === "mes") setRefDate(addMonths(refDate, 1));
    else if (view === "semana") setRefDate(addDays(refDate, 7));
    else setRefDate(addDays(refDate, 1));
  };

  const titulo = useMemo(() => {
    if (view === "mes") return format(refDate, "MMMM yyyy", { locale: ptBR });
    if (view === "semana") return `${format(startOfWeek(refDate, { weekStartsOn: 0 }), "dd MMM", { locale: ptBR })} – ${format(endOfWeek(refDate, { weekStartsOn: 0 }), "dd MMM yyyy", { locale: ptBR })}`;
    if (view === "dia") return format(refDate, "EEEE, dd MMMM yyyy", { locale: ptBR });
    return "Próximos 90 dias";
  }, [view, refDate]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-5 text-primary" />
              <h1 className="text-2xl font-semibold">Calendário Operacional</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setRefDate(new Date())}>Hoje</Button>
              <Button variant="outline" size="icon" onClick={navPrev}><ChevronLeft className="size-4" /></Button>
              <Button variant="outline" size="icon" onClick={navNext}><ChevronRight className="size-4" /></Button>
              <Button onClick={() => openNew()}><Plus className="size-4 mr-1" /> Nova anotação</Button>
            </div>
          </div>

          {/* Filtros + Tabs */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList>
                <TabsTrigger value="mes">Mês</TabsTrigger>
                <TabsTrigger value="semana">Semana</TabsTrigger>
                <TabsTrigger value="dia">Dia</TabsTrigger>
                <TabsTrigger value="lista">Lista</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterCat} onValueChange={setFilterCat}>
                <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas categorias</SelectItem>
                  {(Object.keys(CATEGORIA_INFO) as Categoria[]).map((k) => (
                    <SelectItem key={k} value={k}>{CATEGORIA_INFO[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCliente} onValueChange={setFilterCliente}>
                <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos clientes</SelectItem>
                  {Array.from(new Set(eventos.map((e) => e.cliente).filter(Boolean))).map((c) => (
                    <SelectItem key={c!} value={c!}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Título do período */}
          <div className="text-sm text-muted-foreground capitalize">{titulo}</div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-2 text-xs">
            {(Object.keys(CATEGORIA_INFO) as Categoria[]).map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-full", CATEGORIA_INFO[k].color)} />
                {CATEGORIA_INFO[k].label}
              </span>
            ))}
          </div>

          {/* Views */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : view === "mes" ? (
            <div className="rounded-lg border bg-card">
              <div className="grid grid-cols-7 text-xs font-medium text-muted-foreground border-b">
                {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d) => (
                  <div key={d} className="p-2 text-center">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthGrid.map((d) => {
                  const evs = eventsByDay(d);
                  const isCurrentMonth = d.getMonth() === refDate.getMonth();
                  const isToday = isSameDay(d, new Date());
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => { setSelectedDay(d); setRefDate(d); setView("dia"); }}
                      onDoubleClick={() => openNew(d)}
                      className={cn(
                        "min-h-[90px] border-b border-r p-1.5 text-left hover:bg-accent/40 transition-colors",
                        !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                      )}
                    >
                      <div className={cn("text-xs font-medium mb-1", isToday && "inline-flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground")}>
                        {format(d, "d")}
                      </div>
                      <div className="space-y-0.5">
                        {evs.slice(0, 3).map((e) => (
                          <div key={e.id} className="flex items-center gap-1 text-[10px] truncate">
                            <span className={cn("size-1.5 rounded-full shrink-0", CATEGORIA_INFO[e.categoria].color)} />
                            <span className="truncate">{e.hora ? `${e.hora} ` : ""}{e.titulo}</span>
                          </div>
                        ))}
                        {evs.length > 3 && (
                          <div className="text-[10px] text-muted-foreground">+{evs.length - 3} mais</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <EventList eventos={eventosVisiveis} onEdit={openEdit} onRemove={removeEvent} />
          )}
        </main>
      </div>

      {/* Dialog Nova/Editar Anotação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar anotação" : "Nova anotação"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div>
              <Label>Data *</Label>
              <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
            <div>
              <Label>Hora</Label>
              <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as Categoria })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORIA_INFO) as Categoria[]).map((k) => (
                    <SelectItem key={k} value={k}>{CATEGORIA_INFO[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cliente</Label>
              <Select value={form.cliente_id ?? "none"} onValueChange={(v) => setForm({ ...form, cliente_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cotação</Label>
              <Select value={form.cotacao_id ?? "none"} onValueChange={(v) => setForm({ ...form, cotacao_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {cotacoes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.titulo ?? c.id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-2 border rounded-md p-3">
              <div className="text-sm font-medium flex items-center gap-2"><Bell className="size-4" /> Notificações Telegram</div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.notif_um_dia_antes} onCheckedChange={(v) => setForm({ ...form, notif_um_dia_antes: !!v })} />
                Um dia antes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.notif_duas_horas_antes} onCheckedChange={(v) => setForm({ ...form, notif_duas_horas_antes: !!v })} />
                Duas horas antes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.notif_no_horario} onCheckedChange={(v) => setForm({ ...form, notif_no_horario: !!v })} />
                No horário do evento
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveForm}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventList({
  eventos, onEdit, onRemove,
}: {
  eventos: EventoUnificado[];
  onEdit: (e: EventoUnificado) => void;
  onRemove: (e: EventoUnificado) => void;
}) {
  if (eventos.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">Nenhum evento no período.</div>;
  }
  // Group by day
  const grupos: Record<string, EventoUnificado[]> = {};
  for (const e of eventos) {
    const key = format(e.data, "yyyy-MM-dd");
    (grupos[key] ||= []).push(e);
  }
  return (
    <div className="space-y-4">
      {Object.entries(grupos).map(([dia, evs]) => (
        <div key={dia} className="rounded-lg border bg-card">
          <div className="px-4 py-2 border-b text-sm font-medium bg-muted/30">
            {format(parseISO(dia), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </div>
          <div className="divide-y">
            {evs.map((e) => {
              const Icon = CATEGORIA_INFO[e.categoria].icon;
              return (
                <div key={e.id} className="px-4 py-3 flex items-start gap-3 hover:bg-accent/30">
                  <div className={cn("mt-1 size-8 rounded-md flex items-center justify-center text-white", CATEGORIA_INFO[e.categoria].color)}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{e.titulo}</span>
                      <Badge variant="outline" className="text-[10px]">{CATEGORIA_INFO[e.categoria].label}</Badge>
                      {e.hora && <span className="text-xs text-muted-foreground">{e.hora}</span>}
                      {e.cliente && <span className="text-xs text-muted-foreground">· {e.cliente}</span>}
                    </div>
                    {e.descricao && (
                      <div className="text-sm text-muted-foreground truncate">{e.descricao}</div>
                    )}
                  </div>
                  {e.source === "manual" && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(e)}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onRemove(e)}><Trash2 className="size-4" /></Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
