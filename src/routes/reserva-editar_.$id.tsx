import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plane, Plus, Trash2 } from "lucide-react";
import { getCotacao, saveCotacao, type Cotacao } from "@/lib/cotacoes-store";
import { toast } from "sonner";

export const Route = createFileRoute("/reserva-editar_/$id")({
  component: ReservaEditarPage,
  head: () => ({ meta: [{ title: "Brisk Viagens — Editar Reserva" }] }),
});

const COMPANHIAS = ["GOL", "LATAM", "AZUL"];

type Trecho = {
  numeroVoo?: string;
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
  bagagens?: { maoCabine?: number; despachada23?: number; despachada32?: number };
  trechos?: Trecho[];
};

function hydrateVoo(raw: any): VooData {
  const v = raw ?? {};
  let trechos: Trecho[] = Array.isArray(v.trechos) ? [...v.trechos] : [];
  if (trechos.length === 0 && (v.origem || v.destino || v.horaSaida || v.horaChegada || v.numeroVoo)) {
    trechos = [{
      numeroVoo: v.numeroVoo,
      horaSaida: v.horaSaida,
      horaChegada: v.horaChegada,
      origem: v.origem,
      destino: v.destino,
      data: v.data,
    }];
  }
  return {
    companhia: v.companhia,
    localizador: v.localizador,
    data: v.data,
    assento: v.assento,
    bagagens: v.bagagens,
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
      setVooIda(hydrateVoo(c.vooIda));
      setVooVolta(hydrateVoo(c.vooVolta));
      const total = (c.adultos ?? 0) + (c.criancas ?? 0);
      const nomes = (c as any).passageirosNomes ?? [];
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
      ...({ passageirosNomes: passageiros } as any),
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
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="size-4" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>

          <div className="bg-card border border-border/60 rounded-xl p-6 space-y-6">
            <section>
              <h2 className="font-semibold mb-3">Passageiros</h2>
              <div className="space-y-2">
                {passageiros.map((p, i) => (
                  <div key={i}>
                    <Label className="text-xs">Passageiro {i + 1}</Label>
                    <Input
                      value={p}
                      onChange={(e) => {
                        const arr = [...passageiros]; arr[i] = e.target.value; setPassageiros(arr);
                      }}
                      placeholder="Nome completo"
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
              origemDefault={cotacao.origem}
              destinoDefault={cotacao.destino}
              dataDefault={cotacao.ida}
            />
            <VooForm
              titulo="Voo de VOLTA"
              voo={vooVolta}
              onChange={setVooVolta}
              origemDefault={cotacao.destino}
              destinoDefault={cotacao.origem}
              dataDefault={cotacao.volta}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function VooForm({
  titulo, voo, onChange, origemDefault, destinoDefault, dataDefault,
}: {
  titulo: string;
  voo: VooData;
  onChange: (v: VooData) => void;
  origemDefault?: string;
  destinoDefault?: string;
  dataDefault?: string;
}) {
  const set = (patch: Partial<VooData>) => onChange({ ...voo, ...patch });
  const setBag = (k: "maoCabine" | "despachada23" | "despachada32", v: number) =>
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
      <h2 className="font-semibold mb-3 flex items-center gap-2"><Plane className="size-4 text-primary" /> {titulo}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <Label className="text-xs">Companhia</Label>
          <Select value={voo.companhia ?? ""} onValueChange={(v) => set({ companhia: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {COMPANHIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Localizador</Label>
          <Input value={voo.localizador ?? ""} onChange={(e) => set({ localizador: e.target.value })} placeholder="ABC123" />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Assentos</Label>
          <Input value={voo.assento ?? ""} onChange={(e) => set({ assento: e.target.value })} placeholder="12A, 12B" />
        </div>
        <div>
          <Label className="text-xs">Bagagem de mão (10kg)</Label>
          <Input type="number" min={0} value={voo.bagagens?.maoCabine ?? 0} onChange={(e) => setBag("maoCabine", Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Bagagem despachada (23kg)</Label>
          <Input type="number" min={0} value={voo.bagagens?.despachada23 ?? 0} onChange={(e) => setBag("despachada23", Number(e.target.value))} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Trechos ({trechos.length})</Label>
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
                <Input value={t.numeroVoo ?? ""} onChange={(e) => updateTrecho(i, { numeroVoo: e.target.value })} placeholder="G3 1234" />
              </div>
              <div>
                <Label className="text-xs">Data</Label>
                <Input type="date" value={t.data ?? dataDefault ?? ""} onChange={(e) => updateTrecho(i, { data: e.target.value })} />
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
                <Input
                  value={t.origem ?? (i === 0 ? origemDefault ?? "" : "")}
                  onChange={(e) => updateTrecho(i, { origem: e.target.value })}
                  placeholder="Fortaleza (FOR) — Pinto Martins, Brasil"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Destino</Label>
                <Input
                  value={t.destino ?? (i === trechos.length - 1 ? destinoDefault ?? "" : "")}
                  onChange={(e) => updateTrecho(i, { destino: e.target.value })}
                  placeholder="Salvador (SSA) — Dep. Luís Eduardo Magalhães, Brasil"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
