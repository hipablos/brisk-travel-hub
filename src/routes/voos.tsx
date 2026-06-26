import { createFileRoute, Link } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical, CalendarIcon, Filter, Search, Bell, FileText, Pencil, Plane,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useCotacoes } from "@/lib/cotacoes-store";
import { addDaysDateOnly, compareDateOnly, normalizeDateOnly, parseDateOnly, todayDateOnly } from "@/lib/dates";

export const Route = createFileRoute("/voos")({
  component: VoosPage,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Voos" },
      { name: "description", content: "Acompanhamento de voos vinculados às cotações." },
    ],
  }),
});

type TabKey = "realizados" | "proximos" | "distantes";

type VooItem = {
  id: string;
  cotacaoId: string;
  data: string;
  hora: string;
  horaIda: string;
  horaVolta: string;
  dateKey: string;
  localizador: string;
  cliente: string;
  passageiros: number;
  origem: string;
  origemSigla: string;
  destino: string;
  destinoSigla: string;
  trecho: "ida" | "volta";
  cia: string;
  codigoVoo: string;
};

function formatFlightDate(value?: string): string {
  const normalized = normalizeDateOnly(value);
  const parsed = parseDateOnly(normalized);
  if (!parsed.ok) return "—";
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${String(parsed.day).padStart(2, "0")} ${months[parsed.month - 1]} ${parsed.year}`;
}

function splitLocal(loc?: string): { nome: string; sigla: string } {
  if (!loc) return { nome: "—", sigla: "" };
  const m = loc.match(/^(.*)\s*\(([^)]+)\)\s*$/);
  if (m) return { nome: m[1].trim(), sigla: m[2].trim() };
  return { nome: loc, sigla: "" };
}

function VoosPage() {
  const [tab, setTab] = useState<TabKey>("proximos");
  const cotacoes = useCotacoes();

  const voos: VooItem[] = useMemo(() => {
    const items: VooItem[] = [];
    for (const c of cotacoes) {
      if (c.status !== "aprovado") continue;
      const vIda: any = (c as any).vooIdas?.[0] ?? (c as any).vooIda ?? null;
      const vVolta: any = (c as any).vooVoltas?.[0] ?? (c as any).vooVolta ?? null;


      const origemIda = splitLocal(vIda?.origem ?? c.origem);
      const destinoIda = splitLocal(vIda?.destino ?? c.destino);
      const origemVolta = splitLocal(vVolta?.origem ?? c.destino);
      const destinoVolta = splitLocal(vVolta?.destino ?? c.origem);

      const passageiros = (c.adultos ?? 0) + (c.criancas ?? 0);
      const localizador = (c.localizador ?? vIda?.localizador ?? vVolta?.localizador ?? "").trim() || "—";

      const horaIda = vIda?.horaSaida || "";
      const horaVolta = vVolta?.horaSaida || "";

      const ida = normalizeDateOnly(vIda?.data ?? c.ida);
      if (ida) {
        items.push({
          id: `${c.id}-ida`, cotacaoId: c.id, dateKey: ida,
          data: formatFlightDate(ida),
          hora: horaIda || "—",
          horaIda, horaVolta,
          localizador,
          cliente: c.cliente?.nome ?? "—", passageiros,
          origem: origemIda.nome, origemSigla: origemIda.sigla,
          destino: destinoIda.nome, destinoSigla: destinoIda.sigla,
          trecho: "ida",
          cia: vIda?.companhia || "—",
          codigoVoo: vIda?.numeroVoo || "—",
        });
      }
      const volta = normalizeDateOnly(vVolta?.data ?? c.volta);
      if (volta) {
        items.push({
          id: `${c.id}-volta`, cotacaoId: c.id, dateKey: volta,
          data: formatFlightDate(volta),
          hora: horaVolta || "—",
          horaIda, horaVolta,
          localizador,
          cliente: c.cliente?.nome ?? "—", passageiros,
          origem: origemVolta.nome, origemSigla: origemVolta.sigla,
          destino: destinoVolta.nome, destinoSigla: destinoVolta.sigla,
          trecho: "volta",
          cia: vVolta?.companhia || "—",
          codigoVoo: vVolta?.numeroVoo || "—",
        });
      }
    }


    return items.sort((a, b) => compareDateOnly(a.dateKey, b.dateKey));
  }, [cotacoes]);

  const hoje = todayDateOnly();
  const em30 = addDaysDateOnly(hoje, 30);
  const counts = {
    realizados: voos.filter((v) => compareDateOnly(v.dateKey, hoje) < 0).length,
    proximos:   voos.filter((v) => compareDateOnly(v.dateKey, hoje) >= 0 && compareDateOnly(v.dateKey, em30) <= 0).length,
    distantes:  voos.filter((v) => compareDateOnly(v.dateKey, em30) > 0).length,
  };
  const filtered = voos.filter((v) => {
    if (tab === "realizados") return compareDateOnly(v.dateKey, hoje) < 0;
    if (tab === "proximos")   return compareDateOnly(v.dateKey, hoje) >= 0 && compareDateOnly(v.dateKey, em30) <= 0;
    return compareDateOnly(v.dateKey, em30) > 0;
  });

  const tabs: { key: TabKey; label: string; count: number; cls: string }[] = [
    { key: "realizados", label: "Voos Realizados", count: counts.realizados, cls: "bg-muted text-muted-foreground hover:bg-muted/80" },
    { key: "proximos",   label: "Voos Próximos",   count: counts.proximos,   cls: "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300" },
    { key: "distantes",  label: "Voos Distantes",  count: counts.distantes,  cls: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="p-4 md:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Plane className="size-6 text-primary" /> Voos
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical className="size-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Exportar lista</DropdownMenuItem>
                <DropdownMenuItem>Imprimir</DropdownMenuItem>
                <DropdownMenuItem>Configurar notificações</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="space-y-1.5 lg:col-span-3">
                <label className="text-xs font-medium text-muted-foreground">Cliente</label>
                <Select defaultValue="todos">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="todos">Todos</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 lg:col-span-4">
                <label className="text-xs font-medium text-muted-foreground">Período de embarque</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input className="pl-9" />
                  </div>
                  <span className="text-xs text-muted-foreground">até</span>
                  <div className="relative flex-1">
                    <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input className="pl-9" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Localizador</label>
                <Input />
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Situação</label>
                <Select defaultValue="todas">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:col-span-1 flex items-end gap-2">
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Search className="size-4" /> <span className="hidden xl:inline">Pesquisar</span>
                </Button>
                <Button variant="outline" size="icon" className="shrink-0"><Filter className="size-4" /></Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  t.cls,
                  tab === t.key && "ring-2 ring-offset-2 ring-offset-background ring-primary/40 shadow-sm"
                )}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-card border border-dashed border-border/60 rounded-xl py-14 text-center text-muted-foreground">
                <Plane className="size-7 mx-auto mb-2 opacity-60" />
                <p className="text-sm">Nenhum voo nesta categoria.</p>
                <p className="text-xs mt-1 opacity-80">
                  Voos aparecem aqui quando uma cotação é movida para <strong>Aprovado</strong>.
                </p>
              </div>
            ) : (
              filtered.map((v) => <FlightCard key={v.id} voo={v} cotacaoId={v.cotacaoId} />)
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function FlightCard({ voo, cotacaoId }: { voo: VooItem; cotacaoId: string }) {
  const trechoCls = voo.trecho === "ida"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
    : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";

  return (
    <div className="group relative bg-card border border-border/60 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
      <div className="pl-5 pr-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Embarque</div>
          <div className="text-base font-semibold text-foreground">{voo.data}</div>
          <div className="text-xs text-muted-foreground">
            {voo.trecho === "ida" ? "Ida" : "Volta"}: <span className="text-foreground/90 font-medium">{voo.hora || "—"}</span>
          </div>
        </div>

        <div className="lg:col-span-3 min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 text-xs font-semibold">
            {voo.localizador}
          </span>
          <div className="font-semibold text-foreground mt-1 truncate">{voo.cliente}</div>
          <div className="text-xs text-muted-foreground">
            {voo.passageiros} {voo.passageiros === 1 ? "passageiro" : "passageiros"}
          </div>
        </div>
        <div className="lg:col-span-4 min-w-0">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <span className="truncate">
              {voo.origem} {voo.origemSigla && <span className="text-muted-foreground font-normal">({voo.origemSigla})</span>}
            </span>
            <Plane className="size-4 text-emerald-500 shrink-0" />
            <span className="truncate">
              {voo.destino} {voo.destinoSigla && <span className="text-muted-foreground font-normal">({voo.destinoSigla})</span>}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", trechoCls)}>
              {voo.trecho === "ida" ? "Ida" : "Volta"}
            </span>
            <span className="text-xs text-muted-foreground">{voo.cia}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{voo.codigoVoo}</span>
          </div>
        </div>
        <div className="lg:col-span-3 flex items-center justify-end gap-2">
          <Bell className="size-4 text-muted-foreground shrink-0" />
          <Select defaultValue="48h">
            <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Notificar Check-in 24h</SelectItem>
              <SelectItem value="48h">Notificar Check-in 48h</SelectItem>
              <SelectItem value="72h">Notificar Check-in 72h</SelectItem>
              <SelectItem value="off">Não notificar</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild variant="ghost" size="icon" title="Visualizar reserva (PDF)">
            <Link to="/reserva/$id" params={{ id: cotacaoId }}>
              <FileText className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" title="Editar reserva">
            <Link to="/reserva-editar/$id" params={{ id: cotacaoId }}>
              <Pencil className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
