import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, Plane, Hotel, Car, Ship, Shield, MapPin } from "lucide-react";
import { getCotacao, formatBRL, STATUS_LABELS, type Cotacao } from "@/lib/cotacoes-store";

export const Route = createFileRoute("/cotacoes_/$id")({
  component: VisualizarCotacao,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Cotação" },
      { name: "description", content: "Visualização da cotação para envio ao cliente." },
    ],
  }),
});

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  voo: Plane, hospedagem: Hotel, transporte: Car,
  experiencia: MapPin, cruzeiro: Ship, seguro: Shield,
};
const labelMap: Record<string, string> = {
  voo: "Voo", hospedagem: "Hospedagem", transporte: "Transporte",
  experiencia: "Experiência", cruzeiro: "Cruzeiro", seguro: "Seguro",
};

function fmtDate(s?: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("pt-BR");
}

function VisualizarCotacao() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [cotacao, setCotacao] = useState<Cotacao | undefined>();

  useEffect(() => {
    const c = getCotacao(id);
    if (!c) {
      navigate({ to: "/cotacoes" });
      return;
    }
    setCotacao(c);
  }, [id, navigate]);

  if (!cotacao) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <div className="print:hidden"><Sidebar /></div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="print:hidden"><Topbar /></div>
        <main className="p-6 max-w-[900px] w-full mx-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 print:hidden">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="icon">
                <Link to="/cotacoes"><ArrowLeft className="size-4" /></Link>
              </Button>
              <div>
                <div className="text-sm text-muted-foreground">Cotação #{cotacao.code}</div>
                <h1 className="text-2xl font-bold text-foreground">Visualizar Cotação</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.print()} className="gap-2">
                <Printer className="size-4" /> Imprimir
              </Button>
              <Button onClick={() => window.print()} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Download className="size-4" /> Baixar PDF
              </Button>
            </div>
          </div>

          {/* Documento */}
          <div id="cotacao-doc" className="bg-white text-slate-900 rounded-xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
            {/* Header */}
            <div className="bg-[oklch(0.22_0.08_255)] text-white px-8 py-6 flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-yellow-400 font-bold">Brisk Viagens</div>
                <h2 className="text-2xl font-bold mt-1">Proposta de Viagem</h2>
                <p className="text-sm text-white/70 mt-1">Cotação #{cotacao.code}</p>
              </div>
              <div className="text-right text-sm">
                <div className="text-white/60">Emitida em</div>
                <div className="font-semibold">{fmtDate(cotacao.createdAt)}</div>
                {cotacao.validade && (
                  <>
                    <div className="text-white/60 mt-2">Válida até</div>
                    <div className="font-semibold">{fmtDate(cotacao.validade)}</div>
                  </>
                )}
                <div className="mt-2 inline-block px-2 py-0.5 rounded bg-yellow-400 text-slate-900 text-xs font-bold uppercase">
                  {STATUS_LABELS[cotacao.status]}
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Cliente */}
              <section>
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Cliente</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">Nome:</span> <strong>{cotacao.cliente.nome}</strong></div>
                  {cotacao.cliente.email && <div><span className="text-slate-500">E-mail:</span> {cotacao.cliente.email}</div>}
                  {cotacao.cliente.telefone && <div><span className="text-slate-500">Telefone:</span> {cotacao.cliente.telefone}</div>}
                  {cotacao.tag && <div><span className="text-slate-500">Identificador:</span> {cotacao.tag}</div>}
                </div>
              </section>

              {/* Viagem */}
              <section className="border-t pt-6">
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">Detalhes da Viagem</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div><div className="text-slate-500">Origem</div><div className="font-semibold">{cotacao.origem || "—"}</div></div>
                  <div><div className="text-slate-500">Destino</div><div className="font-semibold">{cotacao.destino || "—"}</div></div>
                  <div><div className="text-slate-500">Ida</div><div className="font-semibold">{fmtDate(cotacao.ida)}</div></div>
                  <div><div className="text-slate-500">Volta</div><div className="font-semibold">{fmtDate(cotacao.volta)}</div></div>
                  <div><div className="text-slate-500">Adultos</div><div className="font-semibold">{cotacao.adultos}</div></div>
                  <div><div className="text-slate-500">Crianças</div><div className="font-semibold">{cotacao.criancas}</div></div>
                  {cotacao.pagamento && <div className="col-span-2"><div className="text-slate-500">Pagamento</div><div className="font-semibold">{cotacao.pagamento}</div></div>}
                </div>
              </section>

              {/* Serviços */}
              <section className="border-t pt-6">
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">Serviços Inclusos</h3>
                <div className="space-y-2">
                  {cotacao.servicos.map((s) => {
                    const Icon = iconMap[s.type] || MapPin;
                    return (
                      <div key={s.id} className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-[oklch(0.22_0.08_255)]/10 grid place-items-center text-[oklch(0.22_0.08_255)]">
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 uppercase font-semibold">{labelMap[s.type]}</div>
                            <div className="text-sm font-medium text-slate-900">{s.description || "—"}</div>
                          </div>
                        </div>
                        <div className="font-bold text-slate-900">R$ {formatBRL(s.value)}</div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Total */}
              <section className="border-t pt-6 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Total da Proposta</div>
                  <div className="text-xs text-slate-500 mt-1">{cotacao.servicos.length} {cotacao.servicos.length === 1 ? "serviço" : "serviços"}</div>
                </div>
                <div className="text-3xl font-bold text-[oklch(0.22_0.08_255)]">R$ {formatBRL(cotacao.total)}</div>
              </section>

              {cotacao.observacoes && (
                <section className="border-t pt-6">
                  <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Observações</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{cotacao.observacoes}</p>
                </section>
              )}

              {/* Footer */}
              <section className="border-t pt-6 text-center text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Brisk Viagens</p>
                <p>Obrigado pela preferência! Entre em contato para confirmar sua reserva.</p>
              </section>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
}
