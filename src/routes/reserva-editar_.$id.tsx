import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plane, Plus, Trash2 } from "lucide-react";
import { AirportAutocomplete } from "@/components/cotacoes/AirportAutocomplete";
import { getCotacao, saveCotacao, type Cotacao } from "@/lib/cotacoes-store";
import { toast } from "sonner";

export const Route = createFileRoute("/reserva-editar_/$id")({
  component: ReservaEditarPage,
  head: () => ({ meta: [{ title: "Brisk Viagens — Editar Reserva" }] }),
});

const COMPANHIAS = ["GOL", "LATAM", "AZUL"];

type Trecho = {
  numeroVoo?: string;
  classe?: string;
  horaSaida?: string;
  horaChegada?: string;
  origem?: string;
  destino?: string;
  data?: string;
};

type VooData = {
  companhia?: string;
  localizador?: string;
  data?: string;
  assento?: string;
  bagagens?: { pessoal?: number; maoCabine?: number; despachada23?: number; despachada32?: number };
  trechos?: Trecho[];
};

// Constrói os trechos a partir do voo da cotação,
// considerando escalas, origem/destino e horários.
function hydrateVoo(raw: any, fallbackOrigem?: string, fallbackDestino?: string, fallbackData?: string): VooData {
  const v = raw ?? {};
  let trechos: Trecho[] = Array.isArray(v.trechos) ? [...v.trechos] : [];

  // Se já há trechos definidos, mantém.
  if (trechos.length === 0) {
    const escalas = Array.isArray(v.escalas) ? v.escalas : [];
    const origemOriginal = v.origem ?? fallbackOrigem;
    const destinoOriginal = v.destino ?? fallbackDestino;
    const data = v.data ?? fallbackData;

    if (escalas.length > 0) {
      // Trecho 1: origem original → primeira escala (destino dela)
      // Trechos seguintes: escala anterior (origem) → próxima escala (destino)
      // Último trecho: última escala (origem) → destino original
      const arr: Trecho[] = [];
      let prevOrigem = origemOriginal;
      for (let i = 0; i < escalas.length; i++) {
        const esc = escalas[i];
        arr.push({
          numeroVoo: i === 0 ? v.numeroVoo : esc.numeroVoo,
          classe: i === 0 ? v.classe : esc.classe,
          horaSaida: i === 0 ? v.horaSaida : (escalas[i - 1]?.saida ?? esc.saida),
          horaChegada: esc.chegada,
          origem: prevOrigem,
          destino: esc.destino ?? esc.origem,
          data,
        });
        prevOrigem = esc.origem ?? esc.destino;
      }
      // Último trecho até o destino final
      const lastEsc = escalas[escalas.length - 1];
      arr.push({
        numeroVoo: lastEsc?.numeroVoo,
        classe: lastEsc?.classe,
        horaSaida: lastEsc?.saida,
        horaChegada: v.horaChegada,
        origem: prevOrigem,
        destino: destinoOriginal,
        data,
      });
      trechos = arr;
    } else if (origemOriginal || destinoOriginal || v.horaSaida || v.horaChegada || v.numeroVoo) {
      trechos = [{
        numeroVoo: v.numeroVoo,
        classe: v.classe,
        horaSaida: v.horaSaida,
        horaChegada: v.horaChegada,
        origem: origemOriginal,
        destino: destinoOriginal,
        data,
      }];
    }
  }

  // Default de bagagens: 1 mochila + 1 mala de mão se nada definido
  const bag = v.bagagens ?? {};
  const bagagens = {
    pessoal: bag.pessoal ?? 1,
    maoCabine: bag.maoCabine ?? 1,
    despachada23: bag.despachada23 ?? 0,
    despachada32: bag.despachada32 ?? 0,
  };

  return {
    companhia: v.companhia,
    localizador: v.localizador,
    data: v.data ?? fallbackData,
    assento: v.assento,
    bagagens,
    trechos,
  };
}

function ReservaEditarPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [vooIda, setVooIda] = useState<VooData>({ trechos: [] });
  const [vooVolta, setVooVolta] = useState<VooData>({ trechos: [] });
  const [passageiros, setPassageiros] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCotacao(id).then((c) => {
      if (!c) { navigate({ to: "/voos" }); return; }
      setCotacao(c);
      setVooIda(hydrateVoo(c.vooIda, c.origem, c.destino, c.ida));
      setVooVolta(hydrateVoo(c.vooVolta, c.destino, c.origem, c.volta));
      const total = (c.adultos ?? 0) + (c.criancas ?? 0);
      const nomes = c.passageirosNomes ?? [];
      const arr = Array.from({ length: total }, (_, i) => nomes[i] ?? (i === 0 ? c.cliente?.nome ?? "" : ""));
      setPassageiros(arr);
    });
  }, [id, navigate]);

  if (!cotacao) return null;

  const handleSave = async () => {
    setSaving(true);
    const updated: Cotacao = {
      ...cotacao,
      vooIda,
      vooVolta,
      passageirosNomes: passageiros,
    };
    await saveCotacao(updated);
    setSaving(false);
    toast.success("Reserva atualizada");
    navigate({ to: "/reserva/$id", params: { id } });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="p-6 max-w-4xl w-full mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="icon">
                <Link to="/voos"><ArrowLeft className="size-4" /></Link>
              </Button>
              <div>
                <div className="text-sm text-muted-foreground">Reserva #{cotacao.code}</div>
                <h1 className="text-2xl font-bold text-foreground">Editar Reserva</h1>
                <p className="text-xs text-muted-foreground mt-1">Dados preenchidos automaticamente a partir da cotação. Revise, edite o localizador e os voos conforme necessário.</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="size-4" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>

          <div className="bg-card border border-border/60 rounded-xl p-6 space-y-6">
            <section>
              <h2 className="font-semibold mb-3 text-foreground">Passageiros</h2>
              <div className="space-y-2">
                {passageiros.map((p, i) => (
                  <div key={i}>
                    <Label className="text-xs">Passageiro {i + 1}</Label>
                    <Input
                      value={p}
                      onChange={(e) => {
                        const arr = [...passageiros]; arr[i] = e.target.value; setPassageiros(arr);
                      }}
                    />
                  </div>
                ))}
                {passageiros.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum passageiro definido na cotação.</p>
                )}
              </div>
            </section>

            <VooForm
              titulo="Voo de IDA"
              voo={vooIda}
              onChange={setVooIda}
              dataDefault={cotacao.ida}
            />
            {(cotacao.volta || (vooVolta.trechos ?? []).length > 0) && (
              <VooForm
                titulo="Voo de VOLTA"
                voo={vooVolta}
                onChange={setVooVolta}
                dataDefault={cotacao.volta}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function VooForm({
  titulo, voo, onChange, dataDefault,
}: {
  titulo: string;
  voo: VooData;
  onChange: (v: VooData) => void;
  dataDefault?: string;
}) {
  const set = (patch: Partial<VooData>) => onChange({ ...voo, ...patch });
  const setBag = (k: "pessoal" | "maoCabine" | "despachada23" | "despachada32", v: number) =>
    onChange({ ...voo, bagagens: { ...(voo.bagagens ?? {}), [k]: v } });

  const trechos = voo.trechos ?? [];

  const updateTrecho = (i: number, patch: Partial<Trecho>) => {
    const arr = trechos.map((t, idx) => idx === i ? { ...t, ...patch } : t);
    set({ trechos: arr });
  };
  const addTrecho = () => {
    const last = trechos[trechos.length - 1];
    set({
      trechos: [
        ...trechos,
        {
          data: last?.data ?? dataDefault,
          origem: last?.destino ?? "",
          destino: "",
        },
      ],
    });
  };
  const removeTrecho = (i: number) => {
    set({ trechos: trechos.filter((_, idx) => idx !== i) });
  };

  return (
    <section className="border-t border-border/60 pt-5">
      <h2 className="font-semibold mb-3 flex items-center gap-2 text-foreground"><Plane className="size-4 text-primary" /> {titulo}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <Label className="text-xs">Companhia</Label>
          <Select value={voo.companhia ?? ""} onValueChange={(v) => set({ companhia: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COMPANHIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Localizador</Label>
          <Input value={voo.localizador ?? ""} onChange={(e) => set({ localizador: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Assentos</Label>
          <Input value={voo.assento ?? ""} onChange={(e) => set({ assento: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Item pessoal / mochila</Label>
          <Input type="number" min={0} value={voo.bagagens?.pessoal ?? 1} onChange={(e) => setBag("pessoal", Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Bagagem de mão (10kg)</Label>
          <Input type="number" min={0} value={voo.bagagens?.maoCabine ?? 1} onChange={(e) => setBag("maoCabine", Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Bagagem despachada (23kg)</Label>
          <Input type="number" min={0} value={voo.bagagens?.despachada23 ?? 0} onChange={(e) => setBag("despachada23", Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Bagagem despachada (32kg)</Label>
          <Input type="number" min={0} value={voo.bagagens?.despachada32 ?? 0} onChange={(e) => setBag("despachada32", Number(e.target.value))} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground">Trechos ({trechos.length})</Label>
          <Button type="button" variant="outline" size="sm" onClick={addTrecho} className="gap-2">
            <Plus className="size-3.5" /> Adicionar trecho
          </Button>
        </div>

        {trechos.length === 0 && (
          <p className="text-xs text-muted-foreground">Adicione o primeiro trecho. Se houver escala, adicione um trecho para cada perna do voo.</p>
        )}

        {trechos.map((t, i) => (
          <div key={i} className="border border-border/60 rounded-lg p-3 space-y-2 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-foreground">Trecho {i + 1}</div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeTrecho(i)} className="size-7">
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Número do voo</Label>
                <Input value={t.numeroVoo ?? ""} onChange={(e) => updateTrecho(i, { numeroVoo: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Data</Label>
                <DateInput value={t.data ?? dataDefault ?? ""} onChange={(iso) => updateTrecho(i, { data: iso })} />
              </div>
              <div>
                <Label className="text-xs">Hora de saída</Label>
                <Input type="time" value={t.horaSaida ?? ""} onChange={(e) => updateTrecho(i, { horaSaida: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Hora de chegada</Label>
                <Input type="time" value={t.horaChegada ?? ""} onChange={(e) => updateTrecho(i, { horaChegada: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Origem</Label>
                <AirportAutocomplete
                  value={t.origem}
                  onChange={(v) => updateTrecho(i, { origem: v })}
                  onSelect={(_a, formatted) => updateTrecho(i, { origem: formatted })}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Destino</Label>
                <AirportAutocomplete
                  value={t.destino}
                  onChange={(v) => updateTrecho(i, { destino: v })}
                  onSelect={(_a, formatted) => updateTrecho(i, { destino: formatted })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
