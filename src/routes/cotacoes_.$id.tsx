import { BriskLogo } from "@/components/BriskLogo";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Download, Printer, Plane, Hotel, Car, Ship, Shield, MapPin,
  Phone, Mail, Instagram, FileText, Clock, ArrowRight,
  ShoppingBag, Briefcase, Luggage, UtensilsCrossed, Armchair, BellRing, PlaneTakeoff, PlaneLanding,
} from "lucide-react";
import { getCotacao, formatBRL, STATUS_LABELS, useFormasPagamento, computeFormaTotal, type Cotacao } from "@/lib/cotacoes-store";

export const Route = createFileRoute("/cotacoes_/$id")({
  component: VisualizarCotacao,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Orçamento de Viagem" },
      { name: "description", content: "Orçamento de viagem para envio ao cliente." },
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

function parseLocalDate(s?: string): Date | null {
  if (!s) return null;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    let y = +dmy[3]; if (y < 100) y += 2000;
    return new Date(y, +dmy[2] - 1, +dmy[1]);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(s?: string) {
  const d = parseLocalDate(s);
  return d ? d.toLocaleDateString("pt-BR") : (s ?? "—");
}

function fmtShortDate(s?: string) {
  const d = parseLocalDate(s);
  return d ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : (s ?? "");
}

function classeLabel(c?: string) {
  if (!c) return "";
  const map: Record<string, string> = {
    economica: "Econômica",
    premium: "Premium Economy",
    executiva: "Executiva",
    primeira: "Primeira Classe",
  };
  return map[c] ?? c;
}

function airportShort(s?: string) {
  if (!s) return "—";
  // "São Paulo (GRU) — Guarulhos Intl, Brasil" → "São Paulo (GRU)"
  const m = s.match(/^([^—\-·]+\([A-Z]{3}\))/);
  return m ? m[1].trim() : s;
}

function VisualizarCotacao() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [cotacao, setCotacao] = useState<Cotacao | undefined>();
  const formasPagamento = useFormasPagamento();

  useEffect(() => {
    getCotacao(id).then((c) => {
      if (!c) { navigate({ to: "/cotacoes" }); return; }
      setCotacao(c);
    });
  }, [id, navigate]);

  if (!cotacao) return null;

  const vooIda = cotacao.vooIda as any;
  const vooVolta = cotacao.vooVolta as any;

  return (
    <div className="min-h-screen bg-background flex">
      <div className="print:hidden"><Sidebar /></div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="print:hidden"><Topbar /></div>
        <main className="p-6 max-w-[960px] w-full mx-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 print:hidden">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="icon">
                <Link to="/cotacoes"><ArrowLeft className="size-4" /></Link>
              </Button>
              <div>
                <div className="text-sm text-muted-foreground">Cotação #{cotacao.code}</div>
                <h1 className="text-2xl font-bold text-foreground">Orçamento de Viagem</h1>
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
          <div id="cotacao-doc" className="bg-white text-slate-800 rounded-xl shadow-lg overflow-hidden print:shadow-none print:rounded-none border border-slate-200 print:border-0">
            {/* Header */}
            <div className="px-6 pt-4 pb-3 border-b border-slate-200 flex items-center justify-between gap-4">
              <BriskLogo variant="color" className="h-10 w-auto" />
              <div className="text-center flex-1">
                <h2 className="text-base font-bold text-[oklch(0.22_0.08_255)] uppercase tracking-wide">Orçamento de Viagem</h2>
                <div className="mt-0.5 text-[10px] text-slate-500">
                  Emitido em <span className="font-semibold text-slate-700">{fmtDate(cotacao.createdAt)}</span>
                  {cotacao.validade && <> · Válido até <span className="font-semibold text-slate-700">{fmtDate(cotacao.validade)}</span></>}
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-600 space-y-0 min-w-[180px]">
                <div className="font-bold text-slate-800 text-xs">BRISK VIAGENS</div>
                <div className="flex items-center justify-end gap-1"><FileText className="size-2.5" /> 64.827.486/0001-19</div>
                <div className="flex items-center justify-end gap-1"><Phone className="size-2.5" /> (85) 99647-7568</div>
                <div className="flex items-center justify-end gap-1"><Mail className="size-2.5" /> briskviagens@gmail.com</div>
                <div className="flex items-center justify-end gap-1"><Instagram className="size-2.5" /> briskviagens</div>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Cliente + Status */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Cliente</h3>
                  <div className="mt-0.5 text-sm font-bold text-slate-900">{cotacao.cliente.nome}</div>
                  <div className="text-[11px] text-slate-500 space-x-3">
                    {cotacao.cliente.email && <span>{cotacao.cliente.email}</span>}
                    {cotacao.cliente.telefone && <span>{cotacao.cliente.telefone}</span>}
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-yellow-400 text-slate-900 text-[9px] font-bold uppercase tracking-wider">
                  {STATUS_LABELS[cotacao.status]}
                </span>
              </div>

              {/* Passageiros + dados gerais */}
              <section className="grid grid-cols-3 gap-3 text-xs border-y border-slate-200 py-2.5">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Passageiros</div>
                  <div className="mt-0.5 font-semibold text-slate-800">
                    {cotacao.adultos} {cotacao.adultos === 1 ? "Adulto" : "Adultos"}
                    {cotacao.criancas > 0 && `, ${cotacao.criancas} ${cotacao.criancas === 1 ? "Criança" : "Crianças"}`}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Identificador</div>
                  <div className="mt-0.5 font-semibold text-slate-800">{cotacao.tag || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Pagamento</div>
                  <div className="mt-0.5 font-semibold text-slate-800">{cotacao.pagamento || "A combinar"}</div>
                </div>
              </section>

              {/* Voos */}
              {vooIda && <VooBlock direction="ida" voo={vooIda} />}
              {vooVolta && <VooBlock direction="volta" voo={vooVolta} />}

              {/* Valor e Forma de Pagamento */}
              <section className="border-t border-slate-200 pt-3">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-[oklch(0.22_0.08_255)] mb-2">
                  <FileText className="size-3.5" /> Valor e Forma de Pagamento
                </h3>

                <div className="space-y-0.5 text-xs">
                  {cotacao.servicos.map((s) => (
                    <div key={s.id} className="flex items-baseline justify-between">
                      <span className="text-slate-700">{s.description || labelMap[s.type] || "Serviço"}</span>
                      <span className="font-medium text-slate-900">R$ {formatBRL(s.value)}</span>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between pt-1.5 mt-1 border-t border-slate-200">
                    <span className="font-bold text-slate-900 text-sm">Total</span>
                    <span className="font-bold text-slate-900 text-sm">R$ {formatBRL(cotacao.total)}</span>
                  </div>
                </div>

                {(() => {
                  const ids = cotacao.formasPagamentoIds ?? [];
                  const selected = formasPagamento.filter((f) => ids.includes(f.id));
                  if (selected.length === 0) return null;
                  return (
                    <div className="mt-3">
                      <div className="font-bold text-slate-900 text-xs">Forma(s) de Pagamento</div>
                      <p className="text-[10px] italic text-slate-500 mt-0.5 mb-2">
                        Os valores foram simulados automaticamente e podem ter pequenas variações de acordo com a plataforma de pagamento.
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        {selected.map((f) => {
                          const calc = computeFormaTotal(cotacao.total, f);
                          return (
                            <div key={f.id} className="text-left">
                              <div className="text-slate-700">{f.nome}</div>
                              <div className="font-bold text-slate-900">
                                R$ {formatBRL(calc.final)}
                                {f.parcelas > 1 && (
                                  <span className="font-normal text-slate-700"> ({f.parcelas}x de R$ {formatBRL(calc.valorParcela)})</span>
                                )}
                              </div>
                              {f.observacao && (
                                <div className="text-[10px] text-slate-500 italic">{f.observacao}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {cotacao.valorComparacao && cotacao.valorComparacao > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="text-slate-500 line-through mr-2">R$ {formatBRL(cotacao.valorComparacao)}</span>
                          <span className="text-emerald-600 font-semibold">
                            Você economiza R$ {formatBRL(cotacao.valorComparacao - cotacao.total)}
                          </span>
                        </div>
                      )}

                      {cotacao.instrucoesPagamento && (
                        <div className="mt-2">
                          <div className="font-bold text-slate-900 text-xs">Instruções para Pagamento</div>
                          <p className="text-xs text-slate-700 whitespace-pre-wrap mt-0.5">{cotacao.instrucoesPagamento}</p>
                        </div>
                      )}

                      {cotacao.linkPagamento && (
                        <div className="mt-1.5 text-xs">
                          <a href={cotacao.linkPagamento} target="_blank" rel="noreferrer" className="text-[oklch(0.22_0.08_255)] underline font-medium">
                            Link para Pagamento
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </section>

              {cotacao.termos && (
                <section className="border-t border-slate-200 pt-3">
                  <h3 className="text-xs font-bold text-slate-900 mb-1">Termos e Condições</h3>
                  <p className="text-[11px] text-slate-700 whitespace-pre-wrap leading-snug">{cotacao.termos}</p>
                </section>
              )}

              {cotacao.outrasInformacoes && (
                <section className="border-t border-slate-200 pt-3">
                  <h3 className="text-xs font-bold text-slate-900 mb-1">Outras Informações</h3>
                  <p className="text-[11px] text-slate-700 whitespace-pre-wrap leading-snug">{cotacao.outrasInformacoes}</p>
                </section>
              )}

              {/* Footer */}
              <section className="border-t border-slate-200 pt-2 text-center text-[10px] text-slate-500">
                <p className="font-semibold text-slate-700">Brisk Viagens</p>
                <p>Obrigado pela preferência! Entre em contato para confirmar sua reserva.</p>
              </section>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @media print {
          html, body { background: #ffffff !important; }
          body * { visibility: hidden !important; }
          #cotacao-doc, #cotacao-doc * { visibility: visible !important; }
          #cotacao-doc {
            position: absolute !important;
            top: 0; left: 0;
            width: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            font-size: 10.5px !important;
          }
          @page { margin: 0.5cm; size: A4; }
        }
      `}</style>
    </div>
  );
}

/* ---------- Voo Block ---------- */

function VooBlock({ direction, voo }: { direction: "ida" | "volta"; voo: any }) {
  const isIda = direction === "ida";
  const Icon = isIda ? PlaneTakeoff : PlaneLanding;
  const title = isIda ? "Voo de Ida" : "Voo de Volta";
  const origem = voo?.origem ? airportShort(voo.origem) : "—";
  const destino = voo?.destino ? airportShort(voo.destino) : "—";
  const escalas: any[] = Array.isArray(voo?.escalas) ? voo.escalas : [];
  const bag = voo?.bagagens ?? { pessoal: 0, maoCabine: 0, despachada23: 0, despachada32: 0 };
  const despachadas = (bag.despachada23 || 0) + (bag.despachada32 || 0);

  // Build segments: if no escalas, single segment origem→destino
  const segments = escalas.length > 0
    ? escalas.map((e, i) => ({
        from: airportShort(e.origem) || (i === 0 ? origem : airportShort(escalas[i - 1]?.destino)),
        to: airportShort(e.destino),
        dep: e.saida, arr: e.chegada,
        conexao: e.duracaoEscala,
      }))
    : [{ from: origem, to: destino, dep: voo?.horaSaida, arr: voo?.horaChegada, conexao: undefined }];

  return (
    <section>
      {/* Título com seta */}
      <div className="flex items-center gap-2 mb-3">
        <Icon className="size-4 text-[oklch(0.22_0.08_255)]" />
        <h3 className="text-base font-bold text-[oklch(0.22_0.08_255)]">{title}</h3>
      </div>

      {/* Linha companhia + bagagens (estilo da referência) */}
      <div className="flex items-center justify-between flex-wrap gap-4 px-1 pb-3">
        <div>
          <div className="text-sm font-bold text-slate-900">{voo?.companhia || "Companhia aérea"}</div>
          <div className="text-xs text-slate-500">{classeLabel(voo?.classe) || "—"}</div>
        </div>
        <div className="flex items-center gap-6">
          <BagIcon icon={ShoppingBag} active={bag.pessoal > 0}
            label={bag.pessoal > 0 ? `${bag.pessoal} bolsa${bag.pessoal > 1 ? "s" : ""} / mochila` : "Sem item pessoal"} />
          <BagIcon icon={Briefcase} active={bag.maoCabine > 0}
            label={bag.maoCabine > 0 ? `${bag.maoCabine} bagagem${bag.maoCabine > 1 ? "s" : ""} de mão` : "Sem bagagem de mão"} />
          <BagIcon icon={Luggage} active={despachadas > 0}
            label={despachadas > 0
              ? `${despachadas} despachada${despachadas > 1 ? "s" : ""}${bag.despachada23 ? ` · ${bag.despachada23}×23kg` : ""}${bag.despachada32 ? ` · ${bag.despachada32}×32kg` : ""}`
              : "Sem bagagem despachada"} />
        </div>
      </div>

      {/* Card principal */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-sm">
          <span className="text-slate-500">Voo de </span>
          <strong className="text-slate-900">{origem}</strong>
          <span className="text-slate-500"> para </span>
          <strong className="text-slate-900">{destino}</strong>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-4 py-3 text-sm">
          <InfoCol label="Partida" value={`${fmtShortDate(voo?.data)} ${voo?.horaSaida ? voo.horaSaida.replace(":", "h") : ""}`} />
          <InfoCol label="Chegada" value={`${fmtShortDate(voo?.data)} ${voo?.horaChegada ? voo.horaChegada.replace(":", "h") : ""}`} />
          <InfoCol label="Duração" value={voo?.duracao || "—"} />
          <InfoCol label="Paradas" value={escalas.length === 0 ? "Voo direto" : `${escalas.length} ${escalas.length === 1 ? "Parada" : "Paradas"}`} />
          <InfoCol label="Voo" value={voo?.numeroVoo || "—"} />
        </div>

        {/* Segmentos / escalas */}
        {escalas.length > 0 && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 space-y-2">
            {segments.map((seg, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 flex-wrap text-slate-700">
                    <strong className="text-slate-900">{seg.from}</strong>
                    <span className="text-slate-500">{fmtShortDate(voo?.data)}</span>
                    <span className="inline-flex items-center gap-1 text-slate-500"><Clock className="size-3" /> {seg.dep ? seg.dep.replace(":", "h") : "—"}</span>
                    <ArrowRight className="size-3 text-slate-400" />
                    <strong className="text-slate-900">{seg.to}</strong>
                    <span className="text-slate-500">{fmtShortDate(voo?.data)}</span>
                    <span className="inline-flex items-center gap-1 text-slate-500"><Clock className="size-3" /> {seg.arr ? seg.arr.replace(":", "h") : "—"}</span>
                  </div>
                  {seg.conexao && i < segments.length - 1 && (
                    <span className="text-xs text-slate-500">Conexão de <strong className="text-slate-700">{seg.conexao}</strong></span>
                  )}
                </div>
                {i < segments.length - 1 && <div className="my-2 border-t border-dashed border-slate-200" />}
              </div>
            ))}
          </div>
        )}

        {/* Extras */}
        {(voo?.refeicao || voo?.assento || voo?.alertaCheckin || voo?.localizador) && (
          <div className="border-t border-slate-200 px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
            {voo?.localizador && <span><strong className="text-slate-800">Localizador:</strong> {voo.localizador}</span>}
            {voo?.refeicao && <span className="inline-flex items-center gap-1.5"><UtensilsCrossed className="size-3.5 text-emerald-600" /> Refeição inclusa</span>}
            {voo?.assento && <span className="inline-flex items-center gap-1.5"><Armchair className="size-3.5 text-emerald-600" /> Assento marcado</span>}
            {voo?.alertaCheckin && <span className="inline-flex items-center gap-1.5"><BellRing className="size-3.5 text-emerald-600" /> Alerta de check-in</span>}
          </div>
        )}
      </div>
    </section>
  );
}

function InfoCol({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="text-sm font-bold text-slate-900 mt-0.5">{value || "—"}</div>
    </div>
  );
}

function BagIcon({ icon: Icon, label, active }: { icon: React.ComponentType<{ className?: string }>; label: string; active: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 text-center ${active ? "text-emerald-600" : "text-rose-500"}`}>
      <Icon className="size-5" />
      <span className="text-[10px] font-medium leading-tight max-w-[110px]">{label}</span>
    </div>
  );
}
