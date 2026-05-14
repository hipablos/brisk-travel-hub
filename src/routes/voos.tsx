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
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCotacoes } from "@/lib/cotacoes-store";

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

// Mocked single flight (linked to a sample cotação id when available).
const MOCK_VOO = {
  data: "12 Mai 2026",
  hora: "08:45",
  localizador: "BRK-29X4",
  cliente: "Karla Mendes",
  passageiros: 2,
  origem: "Fortaleza",
  origemSigla: "FOR",
  destino: "São Paulo",
  destinoSigla: "GRU",
  trecho: "ida" as "ida" | "volta",
  cia: "LATAM",
  codigoVoo: "LA 3471",
  cotacaoId: "mock-cotacao-1",
};

function VoosPage() {
  const [tab, setTab] = useState<TabKey>("proximos");
  const cotacoes = useCotacoes();
  // Reserved for future: link mock voo to a real cotação id when one exists.
  const cotacaoVinculada = cotacoes[0]?.id ?? MOCK_VOO.cotacaoId;

  const tabs: { key: TabKey; label: string; cls: string }[] = [
    { key: "realizados", label: "Voos Realizados", cls: "bg-muted text-muted-foreground hover:bg-muted/80" },
    { key: "proximos",   label: "Voos Próximos",   cls: "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300" },
    { key: "distantes",  label: "Voos Distantes",  cls: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="p-4 md:p-6 space-y-5">
          {/* Header */}
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

          {/* Filters */}
          <div className="bg-card border border-border/50 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="space-y-1.5 lg:col-span-3">
                <label className="text-xs font-medium text-muted-foreground">Cliente</label>
                <Select defaultValue="todos">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 lg:col-span-4">
                <label className="text-xs font-medium text-muted-foreground">Período de embarque</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input placeholder="Inicial" className="pl-9" />
                  </div>
                  <span className="text-xs text-muted-foreground">até</span>
                  <div className="relative flex-1">
                    <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input placeholder="Final" className="pl-9" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Localizador</label>
                <Input placeholder="Ex.: BRK-29X4" />
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

          {/* Quick tabs */}
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
                {t.label}
              </button>
            ))}
          </div>

          {/* Lista de voos */}
          <div className="space-y-3">
            <FlightCard voo={MOCK_VOO} cotacaoId={cotacaoVinculada} />
          </div>
        </main>
      </div>
    </div>
  );
}

function FlightCard({
  voo,
  cotacaoId,
}: {
  voo: typeof MOCK_VOO;
  cotacaoId: string;
}) {
  const trechoCls = voo.trecho === "ida"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
    : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";

  return (
    <div className="group relative bg-card border border-border/60 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden">
      {/* Faixa verde lateral */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />

      <div className="pl-5 pr-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Data / hora */}
        <div className="lg:col-span-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Embarque</div>
          <div className="text-base font-semibold text-foreground">{voo.data}</div>
          <div className="text-sm text-muted-foreground">{voo.hora}</div>
        </div>

        {/* Cliente */}
        <div className="lg:col-span-3 min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 text-xs font-semibold">
            {voo.localizador}
          </span>
          <div className="font-semibold text-foreground mt-1 truncate">{voo.cliente}</div>
          <div className="text-xs text-muted-foreground">
            {voo.passageiros} {voo.passageiros === 1 ? "passageiro" : "passageiros"}
          </div>
        </div>

        {/* Trecho */}
        <div className="lg:col-span-4 min-w-0">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <span className="truncate">{voo.origem} <span className="text-muted-foreground font-normal">({voo.origemSigla})</span></span>
            <Plane className="size-4 text-emerald-500 shrink-0" />
            <span className="truncate">{voo.destino} <span className="text-muted-foreground font-normal">({voo.destinoSigla})</span></span>
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

        {/* Ações */}
        <div className="lg:col-span-3 flex items-center justify-end gap-2">
          <Bell className="size-4 text-muted-foreground shrink-0" />
          <Select defaultValue="48h">
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Notificar Check-in 24h</SelectItem>
              <SelectItem value="48h">Notificar Check-in 48h</SelectItem>
              <SelectItem value="72h">Notificar Check-in 72h</SelectItem>
              <SelectItem value="off">Não notificar</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild variant="ghost" size="icon" title="Visualizar orçamento (PDF)">
            <Link to="/cotacoes_/$id" params={{ id: cotacaoId }}>
              <FileText className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" title="Editar cotação">
            <Link to="/cotacoes_/$id" params={{ id: cotacaoId }}>
              <Pencil className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
