import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plane, PlaneTakeoff, PlaneLanding, ChevronDown, Hash, Edit3,
  Plus, Trash2, Clock, Briefcase, ShoppingBag, Luggage, Minus,
  MoreHorizontal, Copy,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AirportAutocomplete } from "@/components/cotacoes/AirportAutocomplete";
import type { Airport } from "@/lib/airports";
import { dateOnlyToBR, dateOnlyToNativeISO } from "@/lib/dates";
import { calcTempoDeVooTotal, calcDuracaoTrecho, calcDuracaoEscalaTrecho } from "@/lib/voos";

export type TipoVoo = "direto" | "com_escala" | "com_conexao" | "localizador";

export type Escala = {
  id: string;
  origem?: string;
  destino?: string;
  companhia?: string;
  numeroVoo?: string;
  dataInicio?: string;
  dataFim?: string;
  saida?: string;
  chegada?: string;
  duracaoEscala?: string; // mantido p/ compat (não usado na UI nova)
  duracaoTrecho?: string;
};

export type Bagagens = {
  pessoal: number;
  maoCabine: number;
  despachada23: number;
  despachada32: number;
};

export type Voo = {
  id: string;
  origem?: string;
  destino?: string;
  origemInfo?: Airport;
  destinoInfo?: Airport;
  data?: string;
  dataChegada?: string;
  horaSaida?: string;
  horaChegada?: string;
  duracao?: string;
  duracaoTrecho?: string;
  companhia?: string;
  numeroVoo?: string;
  classe?: string;
  tipo: TipoVoo;
  localizador?: string;
  escalas: Escala[];
  bagagens: Bagagens;
  refeicao: boolean;
  assento: boolean;
  alertaCheckin: boolean;
};

export function novoVoo(): Voo {
  return {
    id: crypto.randomUUID(),
    tipo: "direto",
    escalas: [],
    // Padrão: 1 mochila (item pessoal) + 1 mala de mão
    bagagens: { pessoal: 1, maoCabine: 1, despachada23: 0, despachada32: 0 },
    refeicao: false,
    assento: false,
    alertaCheckin: false,
  };
}

type Direction = "ida" | "volta";

interface Props {
  direction: Direction;
  voo: Voo;
  onChange: (patch: Partial<Voo>) => void;
  onRemove?: () => void;
  onDuplicate?: () => void;
  index?: number;
  total?: number;
  /** Data mínima (DD-MM-AAAA) — normalmente a data da cotação. */
  minData?: string;
}

function Counter({
  icon: Icon, label, value, onChange,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-background hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <div className="size-8 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{label}</div>
          <div className="text-xs text-muted-foreground">{value} {value === 1 ? "item" : "itens"}</div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => onChange(Math.max(0, value - 1))}>
          <Minus className="size-3" />
        </Button>
        <span className="w-6 text-center text-sm font-semibold">{value}</span>
        <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => onChange(value + 1)}>
          <Plus className="size-3" />
        </Button>
      </div>
    </div>
  );
}

export function FlightCard({ direction, voo: rawVoo, onChange, onRemove, onDuplicate, index, total }: Props) {
  const voo = {
    ...rawVoo,
    escalas: rawVoo.escalas ?? [],
    bagagens: rawVoo.bagagens ?? { pessoal: 0, maoCabine: 0, despachada23: 0, despachada32: 0 },
  };
  const [open, setOpen] = useState(false);
  const isIda = direction === "ida";
  const Icon = isIda ? PlaneTakeoff : PlaneLanding;
  const baseTitle = isIda ? "Voo de Ida" : "Voo de Volta";
  const title = typeof index === "number" && typeof total === "number" && total > 1
    ? `${baseTitle} ${index + 1}`
    : baseTitle;


  const addEscala = () => {
    onChange({ escalas: [...voo.escalas, { id: crypto.randomUUID() }] });
  };
  const updEscala = (id: string, patch: Partial<Escala>) => {
    onChange({ escalas: voo.escalas.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  };
  const delEscala = (id: string) => {
    onChange({ escalas: voo.escalas.filter((e) => e.id !== id) });
  };

  const totalEscalas = voo.escalas.length;
  const duracaoTrechoCalculada = useMemo(() => calcDuracaoTrecho(voo), [voo]);
  const duracaoTotal = useMemo(() => calcTempoDeVooTotal(voo), [voo]);

  // Mantém voo.duracao sincronizado com a duração TOTAL (principal + escalas).
  useEffect(() => {
    if (voo.duracao !== duracaoTotal) {
      onChange({ duracao: duracaoTotal });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duracaoTotal]);

  // Duração do trecho principal calculada automaticamente.
  useEffect(() => {
    if (voo.duracaoTrecho !== duracaoTrechoCalculada) {
      onChange({ duracaoTrecho: duracaoTrechoCalculada });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duracaoTrechoCalculada]);

  // Sincroniza a duração de cada escala (calculada das suas datas+horários).
  useEffect(() => {
    if (voo.tipo !== "com_escala") return;
    const patches: Array<{ id: string; patch: Partial<Escala> }> = [];
    voo.escalas.forEach((e) => {
      const dt = calcDuracaoEscalaTrecho(e);
      if (dt && e.duracaoTrecho !== dt) {
        patches.push({ id: e.id, patch: { duracaoTrecho: dt } });
      }
    });
    if (patches.length === 0) return;
    onChange({
      escalas: voo.escalas.map((e) => {
        const p = patches.find((x) => x.id === e.id);
        return p ? { ...e, ...p.patch } : e;
      }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voo.escalas, voo.tipo]);

  const setBag = (k: keyof Bagagens, n: number) =>
    onChange({ bagagens: { ...voo.bagagens, [k]: n } });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section className="bg-card border border-border/50 rounded-xl overflow-hidden transition-all hover:border-primary/30 hover:shadow-sm">
        <div className="flex items-center justify-between p-6 gap-3 flex-wrap">
          <CollapsibleTrigger className="flex items-center gap-3 flex-1 min-w-0 text-left group">
            <div className={cn(
              "size-10 rounded-xl grid place-items-center text-primary-foreground shrink-0",
              isIda ? "bg-gradient-to-br from-primary to-primary/70" : "bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground",
            )}>
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                {title}
                {totalEscalas > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-secondary/15 text-secondary">
                    {totalEscalas} {totalEscalas === 1 ? "escala" : "escalas"}
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {voo.origem || voo.destino
                  ? `${voo.origem || "—"} → ${voo.destino || "—"}${voo.data ? ` · ${dateOnlyToBR(voo.data)}` : ""}`
                  : "Clique para preencher os dados do voo"}
              </p>
            </div>
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform ml-auto", open && "rotate-180")} />
          </CollapsibleTrigger>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => { setOpen(true); onChange({ tipo: "localizador" }); }}>
              <Hash className="size-3.5" /> Incluir via localizador
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => { setOpen(true); onChange({ tipo: voo.tipo === "localizador" ? "direto" : voo.tipo }); }}>
              <Edit3 className="size-3.5" /> Incluir manualmente
            </Button>
            {(onDuplicate || onRemove) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Mais opções">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {onDuplicate && (
                    <DropdownMenuItem onClick={onDuplicate}>
                      <Copy className="size-4 mr-2" /> Duplicar campo
                    </DropdownMenuItem>
                  )}
                  {onRemove && (
                    <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
                      <Trash2 className="size-4 mr-2" /> Excluir campo
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>


        <CollapsibleContent>
          <div className="px-6 pb-6 pt-2 space-y-6 border-t border-border/50">
            {voo.tipo === "localizador" ? (
              <div className="grid grid-cols-1 gap-6 pt-4">
                <div className="space-y-2">
                  <Label>Localizador</Label>
                  <Input value={voo.localizador ?? ""} onChange={(e) => onChange({ localizador: e.target.value.toUpperCase() })} />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <Label>Aeroporto / Cidade de origem</Label>
                    <AirportAutocomplete
                      value={voo.origem}
                      onChange={(v) => onChange({ origem: v, origemInfo: undefined })}
                      onSelect={(a, formatted) => onChange({ origem: formatted, origemInfo: a })}
                      placeholder=""
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Aeroporto / Cidade de destino</Label>
                    <AirportAutocomplete
                      value={voo.destino}
                      onChange={(v) => onChange({ destino: v, destinoInfo: undefined })}
                      onSelect={(a, formatted) => onChange({ destino: formatted, destinoInfo: a })}
                      placeholder=""
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de início do voo</Label>
                    <DateInput value={voo.data ?? ""} onChange={(iso) => onChange({ data: iso })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de fim do voo</Label>
                    <DateInput value={voo.dataChegada ?? ""} onChange={(iso) => onChange({ dataChegada: iso })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário de saída</Label>
                    <Input type="time" value={voo.horaSaida ?? ""} onChange={(e) => onChange({ horaSaida: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário de chegada</Label>
                    <Input type="time" value={voo.horaChegada ?? ""} onChange={(e) => onChange({ horaChegada: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Duração total do voo</Label>
                    <div className="relative">
                      <Input
                        value={duracaoTotal === "—" ? "" : duracaoTotal}
                        readOnly
                        tabIndex={-1}
                        placeholder=""
                        className="pl-9 bg-muted text-muted-foreground cursor-not-allowed"
                        aria-label="Duração total do voo"
                      />
                      <Clock className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Soma de todos os trechos e escalas.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Duração do trecho</Label>
                    <Input
                      value={duracaoTrechoCalculada}
                      readOnly
                      tabIndex={-1}
                      placeholder=""
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Calculada automaticamente pelos horários.
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Número do voo</Label>
                    <Input value={voo.numeroVoo ?? ""} onChange={(e) => onChange({ numeroVoo: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Classe do voo</Label>
                    <Select value={voo.classe ?? ""} onValueChange={(v) => onChange({ classe: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="economica">Econômica</SelectItem>
                        <SelectItem value="premium">Premium Economy</SelectItem>
                        <SelectItem value="executiva">Executiva</SelectItem>
                        <SelectItem value="primeira">Primeira Classe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo do voo</Label>
                    <Select value={voo.tipo} onValueChange={(v: TipoVoo) => onChange({ tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direto">Direto</SelectItem>
                        <SelectItem value="com_escala">Com escala</SelectItem>
                        <SelectItem value="com_conexao">Com conexão</SelectItem>
                        <SelectItem value="localizador">Localizador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {voo.tipo === "com_escala" && (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plane className="size-4 text-secondary" />
                    <h3 className="text-sm font-semibold text-foreground">Escalas</h3>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-secondary/15 text-secondary">
                      {totalEscalas}
                    </span>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={addEscala}>
                    <Plus className="size-3.5" /> Adicionar escala
                  </Button>
                </div>

                {voo.escalas.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhuma escala adicionada ainda.</p>
                )}

                {voo.escalas.map((e, idx) => (
                  <div key={e.id} className="rounded-lg border border-border/60 bg-card p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Escala {idx + 1}</span>
                      <Button type="button" variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => delEscala(e.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Aeroporto de origem</Label>
                        <AirportAutocomplete
                          value={e.origem}
                          onChange={(v) => updEscala(e.id, { origem: v })}
                          onSelect={(_a, formatted) => updEscala(e.id, { origem: formatted })}
                          placeholder=""
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Aeroporto de destino</Label>
                        <AirportAutocomplete
                          value={e.destino}
                          onChange={(v) => updEscala(e.id, { destino: v })}
                          onSelect={(_a, formatted) => updEscala(e.id, { destino: formatted })}
                          placeholder=""
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Data de início</Label>
                        <DateInput value={e.dataInicio ?? ""} onChange={(iso) => updEscala(e.id, { dataInicio: iso })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Data de fim</Label>
                        <DateInput value={e.dataFim ?? ""} onChange={(iso) => updEscala(e.id, { dataFim: iso })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Horário de saída</Label>
                        <Input type="time" value={e.saida ?? ""} onChange={(ev) => updEscala(e.id, { saida: ev.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Horário de chegada</Label>
                        <Input type="time" value={e.chegada ?? ""} onChange={(ev) => updEscala(e.id, { chegada: ev.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Duração do trecho</Label>
                        <div className="h-9 px-3 flex items-center rounded-md border border-border/60 bg-muted text-sm text-muted-foreground">
                          {calcDuracaoEscalaTrecho(e) || e.duracaoTrecho || "—"}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Número do voo</Label>
                        <Input value={e.numeroVoo ?? ""} onChange={(ev) => updEscala(e.id, { numeroVoo: ev.target.value })} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bagagens */}
            <div className="rounded-xl border border-border/50 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Luggage className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Bagagens</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Counter icon={ShoppingBag} label="Item pessoal / Bolsa" value={voo.bagagens.pessoal} onChange={(n) => setBag("pessoal", n)} />
                <Counter icon={Briefcase} label="Bagagem de mão" value={voo.bagagens.maoCabine} onChange={(n) => setBag("maoCabine", n)} />
                <Counter icon={Luggage} label="Despachada 23kg" value={voo.bagagens.despachada23} onChange={(n) => setBag("despachada23", n)} />
                <Counter icon={Luggage} label="Despachada 32kg" value={voo.bagagens.despachada32} onChange={(n) => setBag("despachada32", n)} />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

// --- helpers ---
function parseDur(s?: string): number {
  if (!s) return 0;
  const h = /(\d+)\s*h/i.exec(s)?.[1];
  const m = /(\d+)\s*m/i.exec(s)?.[1];
  if (!h && !m) {
    const n = parseInt(s);
    return isNaN(n) ? 0 : n;
  }
  return (parseInt(h ?? "0") || 0) * 60 + (parseInt(m ?? "0") || 0);
}
function formatDur(mins: number): string {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h ? `${h}h` : ""}${h && m ? " " : ""}${m ? `${m}m` : ""}`.trim();
}
