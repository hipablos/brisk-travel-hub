import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plane } from "lucide-react";
import { getCotacao, saveCotacao, type Cotacao } from "@/lib/cotacoes-store";
import { toast } from "sonner";

export const Route = createFileRoute("/reserva-editar_/$id")({
  component: ReservaEditarPage,
  head: () => ({ meta: [{ title: "Brisk Viagens — Editar Reserva" }] }),
});

const COMPANHIAS = ["GOL", "LATAM", "AZUL"];

type VooData = {
  companhia?: string;
  localizador?: string;
  numeroVoo?: string;
  data?: string;
  horaSaida?: string;
  horaChegada?: string;
  origem?: string;
  destino?: string;
  assento?: string;
  bagagens?: { maoCabine?: number; despachada23?: number; despachada32?: number };
};

function ReservaEditarPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [vooIda, setVooIda] = useState<VooData>({});
  const [vooVolta, setVooVolta] = useState<VooData>({});
  const [passageiros, setPassageiros] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCotacao(id).then((c) => {
      if (!c) { navigate({ to: "/voos" }); return; }
      setCotacao(c);
      setVooIda((c.vooIda ?? {}) as VooData);
      setVooVolta((c.vooVolta ?? {}) as VooData);
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

            <VooForm titulo="Voo de IDA" voo={vooIda} onChange={setVooIda} origemDefault={cotacao.origem} destinoDefault={cotacao.destino} dataDefault={cotacao.ida} />
            <VooForm titulo="Voo de VOLTA" voo={vooVolta} onChange={setVooVolta} origemDefault={cotacao.destino} destinoDefault={cotacao.origem} dataDefault={cotacao.volta} />
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

  return (
    <section className="border-t border-border/60 pt-5">
      <h2 className="font-semibold mb-3 flex items-center gap-2"><Plane className="size-4 text-primary" /> {titulo}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        <div>
          <Label className="text-xs">Número do voo</Label>
          <Input value={voo.numeroVoo ?? ""} onChange={(e) => set({ numeroVoo: e.target.value })} placeholder="G3 1234" />
        </div>
        <div>
          <Label className="text-xs">Data</Label>
          <Input type="date" value={voo.data ?? dataDefault ?? ""} onChange={(e) => set({ data: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Hora de saída</Label>
          <Input type="time" value={voo.horaSaida ?? ""} onChange={(e) => set({ horaSaida: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Hora de chegada</Label>
          <Input type="time" value={voo.horaChegada ?? ""} onChange={(e) => set({ horaChegada: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Origem</Label>
          <Input value={voo.origem ?? origemDefault ?? ""} onChange={(e) => set({ origem: e.target.value })} placeholder="São Paulo (GRU) — Guarulhos Intl, Brasil" />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Destino</Label>
          <Input value={voo.destino ?? destinoDefault ?? ""} onChange={(e) => set({ destino: e.target.value })} placeholder="Rio de Janeiro (GIG) — Galeão, Brasil" />
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
    </section>
  );
}
