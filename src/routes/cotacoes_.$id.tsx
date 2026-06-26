import { BriskLogo } from "@/components/BriskLogo";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Download, Printer, Plane, Hotel, Car, Ship, Shield, MapPin,
  Phone, Mail, Instagram, FileText, Clock, ArrowRight,
  ShoppingBag, Briefcase, Luggage, PlaneTakeoff, PlaneLanding,
} from "lucide-react";
import { getCotacao, formatBRL, STATUS_LABELS, useFormasPagamento, computeFormaTotal, type Cotacao } from "@/lib/cotacoes-store";
import { dateOnlyToBR, normalizeDateOnly, parseDateOnly } from "@/lib/dates";
import { calcDuracaoEscala, calcTempoDeVooTotal } from "@/lib/voos";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

type HospedagemRow = {
  id: string; nome_hotel: string; estrelas: number | null;
  endereco: string | null; cidade: string | null; estado: string | null; pais: string | null;
  checkin: string | null; checkout: string | null; noites: number | null;
  hospedes: number | null; quartos: number | null; tipo_acomodacao: string | null;
  regime_alimentar: string | null; numero_reserva: string | null; codigo_confirmacao: string | null;
  observacoes_cliente: string | null; google_maps_url: string | null;
  fotos: string[] | null;
};
type ExperienciaRow = {
  id: string; nome: string; categoria: string | null;
  endereco: string | null; cidade: string | null; estado: string | null; pais: string | null;
  data: string | null; hora_inicio: string | null; hora_termino: string | null;
  duracao_min: number | null; participantes: number | null; idioma: string | null;
  idade_minima: number | null; descricao: string | null;
  fotos: string[] | null;
};

const REGIME_LABEL: Record<string, string> = {
  sem_alimentacao: "Sem alimentação",
  cafe_da_manha: "Café da manhã",
  meia_pensao: "Meia pensão",
  pensao_completa: "Pensão completa",
  all_inclusive: "All Inclusive",
};

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

function fmtDate(s?: string) {
  const br = dateOnlyToBR(s);
  if (br !== "—") return br;
  if (!s) return "—";
  const created = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return created ? `${created[3]}/${created[2]}/${created[1]}` : s;
}

function fmtShortDate(s?: string) {
  const br = dateOnlyToBR(normalizeDateOnly(s));
  return br === "—" ? (s ?? "") : br.slice(0, 5);
}

// Usado apenas pelo novo bloco "Itinerário" (voos com escala): nome do dia da semana por extenso.
function weekdayLabel(s?: string): string {
  const v = parseDateOnly(normalizeDateOnly(s));
  if (!v.ok) return "";
  const d = new Date(`${v.iso}T00:00:00`);
  const wd = d.toLocaleDateString("pt-BR", { weekday: "long" });
  return wd.charAt(0).toUpperCase() + wd.slice(1);
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
  const [hospedagens, setHospedagens] = useState<HospedagemRow[]>([]);
  const [experiencias, setExperiencias] = useState<ExperienciaRow[]>([]);
  const formasPagamento = useFormasPagamento();

  useEffect(() => {
    getCotacao(id).then((c) => {
      if (!c) { navigate({ to: "/cotacoes" }); return; }
      setCotacao(c);
    });
    (supabase.from as any)("hospedagens")
      .select("*").eq("cotacao_id", id).order("checkin", { ascending: true })
      .then(({ data }: any) => setHospedagens(data || []));
    (supabase.from as any)("experiencias")
      .select("*").eq("cotacao_id", id).order("data", { ascending: true })
      .then(({ data }: any) => setExperiencias(data || []));
  }, [id, navigate]);

  if (!cotacao) return null;

  // Lê os arrays com todos os voos (vooIdas/vooVoltas). Mantém fallback para
  // cotações antigas que só tinham o campo singular vooIda/vooVolta.
  const vooIdas: any[] = (cotacao as any).vooIdas?.length
    ? (cotacao as any).vooIdas
    : cotacao.vooIda ? [cotacao.vooIda] : [];
  const vooVoltas: any[] = (cotacao as any).vooVoltas?.length
    ? (cotacao as any).vooVoltas
    : cotacao.vooVolta ? [cotacao.vooVolta] : [];

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
              {(vooIdas.length > 0 || vooVoltas.length > 0) && (
                <SectionDivider title="Voos" icon={Plane} />
              )}
              {vooIdas.map((v, idx) => (
                <VooBlock key={v?.id ?? `ida-${idx}`} direction="ida" voo={v} index={idx} total={vooIdas.length} />
              ))}
              {vooVoltas.map((v, idx) => (
                <VooBlock key={v?.id ?? `volta-${idx}`} direction="volta" voo={v} index={idx} total={vooVoltas.length} />
              ))}

              {/* Hospedagens */}
              {hospedagens.length > 0 && <SectionDivider title="Hospedagens" icon={Hotel} />}
              {hospedagens.map((h) => <HospedagemBlock key={h.id} h={h} />)}

              {/* Experiências */}
              {experiencias.length > 0 && <SectionDivider title="Experiências" icon={MapPin} />}
              {experiencias.map((e) => <ExperienciaBlock key={e.id} e={e} />)}

              {/* Carros / Transfers */}
              {((cotacao as any).transfers?.length ?? 0) > 0 && (
                <SectionDivider title="Carros / Transfers" icon={Car} />
              )}
              {((cotacao as any).transfers ?? []).map((t: any, idx: number) => (
                <TransferBlock key={t.id ?? `transfer-${idx}`} t={t} />
              ))}




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
          html, body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * { visibility: hidden !important; }
          #cotacao-doc, #cotacao-doc * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #cotacao-doc {
            position: absolute !important;
            top: 0; left: 0;
            width: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            font-size: 8.5px !important;
            line-height: 1.25 !important;
          }
          /* Proportional typography scale for print */
          #cotacao-doc h2 { font-size: 12px !important; }
          #cotacao-doc h3 { font-size: 10px !important; }
          #cotacao-doc .text-base { font-size: 11px !important; }
          #cotacao-doc .text-sm { font-size: 9px !important; }
          #cotacao-doc .text-xs { font-size: 8px !important; }
          #cotacao-doc .text-\\[11px\\] { font-size: 8px !important; }
          #cotacao-doc .text-\\[10px\\] { font-size: 7.5px !important; }
          #cotacao-doc .text-\\[9px\\] { font-size: 7px !important; }
          /* Tighter spacing */
          #cotacao-doc .py-4 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
          #cotacao-doc .py-3 { padding-top: 0.375rem !important; padding-bottom: 0.375rem !important; }
          #cotacao-doc .pt-4 { padding-top: 0.5rem !important; }
          #cotacao-doc .pt-3 { padding-top: 0.375rem !important; }
          #cotacao-doc .pb-3 { padding-bottom: 0.375rem !important; }
          #cotacao-doc .space-y-4 > * + * { margin-top: 0.5rem !important; }
          #cotacao-doc .mb-3 { margin-bottom: 0.375rem !important; }
          #cotacao-doc .mb-2 { margin-bottom: 0.25rem !important; }
          #cotacao-doc .gap-4 { gap: 0.5rem !important; }
          #cotacao-doc .gap-3 { gap: 0.375rem !important; }
          /* Slightly smaller icons */
          #cotacao-doc svg { transform: scale(0.9); transform-origin: center; }
          @page { margin: 0.5cm; size: A4; }
        }
      `}</style>
    </div>
  );
}

/* ---------- Voo Block ---------- */

function VooBlock({ direction, voo, index, total }: { direction: "ida" | "volta"; voo: any; index?: number; total?: number }) {
  const isIda = direction === "ida";
  const Icon = isIda ? PlaneTakeoff : PlaneLanding;
  const baseTitle = isIda ? "Voo de Ida" : "Voo de Volta";
  const title = typeof index === "number" && typeof total === "number" && total > 1
    ? `${baseTitle} ${index + 1}`
    : baseTitle;
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

  // Trechos completos (cada perna do voo, ponta a ponta) — usado só no bloco "Itinerário" de voos com escala.
  type Leg = { from: string; to: string; dep?: string; arr?: string; duracaoTrecho: string; duracaoEscalaAteProximo?: string };
  const legs: Leg[] = escalas.length === 0
    ? [{
        from: voo?.origem || "—",
        to: voo?.destino || "—",
        dep: voo?.horaSaida,
        arr: voo?.horaChegada,
        duracaoTrecho: voo?.duracaoTrecho || "—",
      }]
    : (() => {
        const out: Leg[] = [];
        out.push({
          from: voo?.origem || "—",
          to: escalas[0]?.destino || voo?.destino || "—",
          dep: voo?.horaSaida,
          arr: escalas[0]?.chegada,
          duracaoTrecho: voo?.duracaoTrecho || "—",
        });
        for (let i = 1; i < escalas.length; i++) {
          out.push({
            from: escalas[i - 1]?.origem || escalas[i - 1]?.destino || "—",
            to: escalas[i]?.destino || "—",
            dep: escalas[i - 1]?.saida,
            arr: escalas[i]?.chegada,
            duracaoTrecho: escalas[i - 1]?.duracaoTrecho || "—",
          });
        }
        const last = escalas[escalas.length - 1];
        out.push({
          from: last?.origem || last?.destino || "—",
          to: voo?.destino || "—",
          dep: last?.saida,
          arr: voo?.horaChegada,
          duracaoTrecho: last?.duracaoTrecho || "—",
        });
        for (let i = 0; i < out.length - 1; i++) {
          const espera = escalas[i]?.tempoEspera;
          out[i].duracaoEscalaAteProximo = (espera && String(espera).trim())
            ? String(espera).trim()
            : calcDuracaoEscala(out[i].arr, out[i + 1].dep);
        }
        return out;
      })();
  const isComEscala = voo?.tipo === "com_escala" && escalas.length > 0;
  const duracaoTotal = calcTempoDeVooTotal(voo);

  return (
    <section className="space-y-1.5">
      {/* Cabeçalho compacto: título + companhia + bagagens, tudo em uma linha */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-2 min-w-0">
          <Icon className="size-3.5 text-[oklch(0.22_0.08_255)] shrink-0 self-center" />
          <h3 className="text-[13px] font-bold text-[oklch(0.22_0.08_255)] leading-none">{title}</h3>
          <span className="text-slate-300">·</span>
          <span className="text-[12px] font-semibold text-slate-900 truncate">{voo?.companhia || "Companhia aérea"}</span>
          {classeLabel(voo?.classe) && (
            <span className="text-[10px] text-slate-500">({classeLabel(voo?.classe)})</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <BagIcon icon={ShoppingBag} active={bag.pessoal > 0}
            label={bag.pessoal > 0 ? `${bag.pessoal} pessoal` : "—"} />
          <BagIcon icon={Briefcase} active={bag.maoCabine > 0}
            label={bag.maoCabine > 0 ? `${bag.maoCabine} mão` : "—"} />
          <BagIcon icon={Luggage} active={despachadas > 0}
            label={despachadas > 0
              ? `${despachadas} desp.${bag.despachada23 ? ` ${bag.despachada23}×23` : ""}${bag.despachada32 ? ` ${bag.despachada32}×32` : ""}`
              : "—"} />
        </div>
      </div>

      {/* Card principal compacto */}
      <div className="border border-slate-200 rounded-md overflow-hidden">
        {isComEscala ? (
          <>
            {/* Itinerário detalhado — só para voos com escala (cada trecho completo, ponta a ponta) */}
            <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 text-[11px] flex items-center justify-between gap-2 flex-wrap">
              <span className="font-semibold text-slate-900">
                <PlaneTakeoff className="inline size-3 mr-1" /> Itinerário de {isIda ? "Ida" : "Volta"}
              </span>
              <span className="text-slate-600">
                {[weekdayLabel(voo?.data), fmtDate(voo?.data)].filter(Boolean).join(", ")}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-600"><Clock className="size-3" /> Tempo de voo: <strong className="text-slate-800">{duracaoTotal}</strong></span>
              <span className="text-slate-500">{legs.length} {legs.length === 1 ? "Trecho" : "Trechos"}</span>
            </div>
            <div className="px-3 py-2 space-y-2">
              {legs.map((leg, i) => (
                <div key={i}>
                  <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 text-[11px]">
                    <div className="text-center">
                      <div className="font-bold text-slate-900">{leg.dep || "—"}</div>
                      <div className="text-[9px] text-slate-500">{fmtDate(voo?.data)}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase tracking-wider text-slate-500">Aeroporto</div>
                      <div className="font-semibold text-slate-900 truncate">{leg.from}</div>
                    </div>
                    <div className="flex flex-col items-center shrink-0">
                      <ArrowRight className="size-3 text-slate-400" />
                      <span className="text-[9px] text-slate-500 whitespace-nowrap">{leg.duracaoTrecho}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase tracking-wider text-slate-500">Aeroporto</div>
                      <div className="font-semibold text-slate-900 truncate">{leg.to}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-slate-900">{leg.arr || "—"}</div>
                      <div className="text-[9px] text-slate-500">{fmtDate(voo?.data)}</div>
                    </div>
                  </div>
                  {leg.duracaoEscalaAteProximo && (
                    <div className="mt-1 bg-slate-50 px-2 py-1 text-[10px] text-slate-600 flex items-center gap-1.5 border border-dashed border-slate-200 rounded">
                      <Clock className="size-2.5 text-slate-400" />
                      Conexão em <strong className="text-slate-800">{leg.to}</strong> — espera de{" "}
                      <strong className="text-slate-800">{leg.duracaoEscalaAteProximo}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 text-[11px] flex items-center gap-1.5">
              <strong className="text-slate-900">{origem}</strong>
              <ArrowRight className="size-3 text-slate-400" />
              <strong className="text-slate-900">{destino}</strong>
            </div>
            <div className="grid grid-cols-5 gap-2 px-3 py-2 items-center">
              <InfoCol label="Partida" value={`${fmtShortDate(voo?.data)} ${voo?.horaSaida ? voo.horaSaida.replace(":", "h") : ""}`.trim()} />
              <InfoCol label="Chegada" value={`${fmtShortDate(voo?.data)} ${voo?.horaChegada ? voo.horaChegada.replace(":", "h") : ""}`.trim()} />
              <InfoCol label="Duração" value={duracaoTotal} />
              <InfoCol label="Paradas" value={escalas.length === 0 ? "Direto" : `${escalas.length} ${escalas.length === 1 ? "parada" : "paradas"}`} />
              <InfoCol label="Voo" value={voo?.numeroVoo || "—"} />
            </div>

            {/* Segmentos / escalas */}
            {escalas.length > 0 && (
              <div className="border-t border-slate-200 bg-white px-3 py-1.5 space-y-1">
                {segments.map((seg, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <div className="flex items-center gap-1.5 flex-wrap text-slate-700">
                        <strong className="text-slate-900">{seg.from}</strong>
                        <span className="inline-flex items-center gap-0.5 text-slate-500"><Clock className="size-2.5" /> {seg.dep ? seg.dep.replace(":", "h") : "—"}</span>
                        <ArrowRight className="size-2.5 text-slate-400" />
                        <strong className="text-slate-900">{seg.to}</strong>
                        <span className="inline-flex items-center gap-0.5 text-slate-500"><Clock className="size-2.5" /> {seg.arr ? seg.arr.replace(":", "h") : "—"}</span>
                      </div>
                      {seg.conexao && i < segments.length - 1 && (
                        <span className="text-slate-500">Conexão <strong className="text-slate-700">{seg.conexao}</strong></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Extras */}
        {voo?.localizador && (
          <div className="border-t border-slate-200 px-3 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-600">
            {voo?.localizador && <span><strong className="text-slate-800">Localizador:</strong> {voo.localizador}</span>}
          </div>
        )}
      </div>
    </section>
  );
}

function InfoCol({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold leading-tight">{label}</div>
      <div className="text-[11px] font-bold text-slate-900 leading-tight truncate">{value || "—"}</div>
    </div>
  );
}

function BagIcon({ icon: Icon, label, active }: { icon: React.ComponentType<{ className?: string }>; label: string; active: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1 ${active ? "text-emerald-600" : "text-slate-300"}`}>
      <Icon className="size-3.5" />
      <span className="text-[10px] font-medium leading-none whitespace-nowrap">{label}</span>
    </div>
  );
}

/* ---------- Hospedagem Block ---------- */
function HospedagemBlock({ h }: { h: HospedagemRow }) {
  const local = [h.cidade, h.estado, h.pais].filter(Boolean).join(", ");
  const formatDT = (s: string | null) => {
    if (!s) return "—";
    const d = new Date(s);
    return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };
  return (
    <section className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center justify-center size-6 rounded-md bg-gradient-to-br from-[oklch(0.55_0.18_255)] to-[oklch(0.65_0.20_290)] shadow-sm">
          <Hotel className="size-3.5 text-white" />
        </div>
        <span className="text-[14px] font-bold text-slate-900 tracking-tight">{h.nome_hotel}</span>
        {h.estrelas ? (
          <span className="inline-flex items-center text-amber-500">
            {Array.from({ length: h.estrelas }).map((_, i) => <Star key={i} className="size-3.5 fill-current" />)}
          </span>
        ) : null}
      </div>

      {h.fotos && h.fotos.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {h.fotos.slice(0, 4).map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`${h.nome_hotel} — foto ${i + 1}`}
              className="w-full h-20 object-cover rounded-md border border-slate-200"
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-700">
        <div><span className="text-slate-500">Check-in:</span> <span className="font-medium text-slate-900">{formatDT(h.checkin)}</span></div>
        <div><span className="text-slate-500">Check-out:</span> <span className="font-medium text-slate-900">{formatDT(h.checkout)}</span></div>
        {h.noites != null && <div><span className="text-slate-500">Noites:</span> <span className="font-medium text-slate-900">{h.noites}</span></div>}
        {(h.hospedes != null || h.quartos != null) && (
          <div>
            <span className="text-slate-500">Hóspedes:</span> <span className="font-medium text-slate-900">{h.hospedes ?? "—"}</span>
            {h.quartos != null && <> · <span className="text-slate-500">Quartos:</span> <span className="font-medium text-slate-900">{h.quartos}</span></>}
          </div>
        )}
        {h.tipo_acomodacao && <div><span className="text-slate-500">Acomodação:</span> <span className="font-medium text-slate-900">{h.tipo_acomodacao}</span></div>}
        {h.regime_alimentar && <div><span className="text-slate-500">Regime:</span> <span className="font-medium text-slate-900">{REGIME_LABEL[h.regime_alimentar] || h.regime_alimentar}</span></div>}
        {h.numero_reserva && <div><span className="text-slate-500">Nº reserva:</span> <span className="font-medium text-slate-900">{h.numero_reserva}</span></div>}
        {h.codigo_confirmacao && <div><span className="text-slate-500">Confirmação:</span> <span className="font-medium text-slate-900">{h.codigo_confirmacao}</span></div>}
      </div>
      {(h.endereco || local) && (
        <div className="text-[11px] text-slate-600">
          <MapPin className="inline size-3 mr-0.5" />
          {[h.endereco, local].filter(Boolean).join(" — ")}
        </div>
      )}
      {h.observacoes_cliente && (
        <div className="text-[11px] text-slate-700 italic">{h.observacoes_cliente}</div>
      )}
    </section>
  );
}

/* ---------- Experiência Block ---------- */
function ExperienciaBlock({ e }: { e: ExperienciaRow }) {
  const local = [e.cidade, e.estado, e.pais].filter(Boolean).join(", ");
  const data = e.data ? new Date(e.data + "T00:00:00").toLocaleDateString("pt-BR") : "—";
  const horario = e.hora_inicio
    ? `${e.hora_inicio.slice(0, 5)}${e.hora_termino ? " – " + e.hora_termino.slice(0, 5) : ""}`
    : "—";
  return (
    <section className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center justify-center size-6 rounded-md bg-gradient-to-br from-[oklch(0.65_0.18_30)] to-[oklch(0.70_0.20_60)] shadow-sm">
          <MapPin className="size-3.5 text-white" />
        </div>
        <span className="text-[14px] font-bold text-slate-900 tracking-tight">{e.nome}</span>
        {e.categoria && <span className="text-[11px] font-medium text-[oklch(0.55_0.15_30)] bg-[oklch(0.95_0.05_30)] px-1.5 py-0.5 rounded">{e.categoria}</span>}
      </div>
      {e.fotos && e.fotos.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {e.fotos.slice(0, 4).map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`${e.nome} — foto ${i + 1}`}
              className="w-full h-20 object-cover rounded-md border border-slate-200"
            />
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-700">
        <div><span className="text-slate-500">Data:</span> <span className="font-medium text-slate-900">{data}</span></div>
        <div><span className="text-slate-500">Horário:</span> <span className="font-medium text-slate-900">{horario}</span></div>
        {e.duracao_min != null && <div><span className="text-slate-500">Duração:</span> <span className="font-medium text-slate-900">{e.duracao_min} min</span></div>}
        {e.participantes != null && <div><span className="text-slate-500">Participantes:</span> <span className="font-medium text-slate-900">{e.participantes}</span></div>}
        {e.idioma && <div><span className="text-slate-500">Idioma:</span> <span className="font-medium text-slate-900">{e.idioma}</span></div>}
        {e.idade_minima != null && <div><span className="text-slate-500">Idade mínima:</span> <span className="font-medium text-slate-900">{e.idade_minima}+</span></div>}
      </div>
      {(e.endereco || local) && (
        <div className="text-[11px] text-slate-600">
          <MapPin className="inline size-3 mr-0.5" />
          {[e.endereco, local].filter(Boolean).join(" — ")}
        </div>
      )}
      {e.descricao && <div className="text-[11px] text-slate-700 italic">{e.descricao}</div>}
    </section>
  );
}

/* ---------- Section Divider ---------- */
function SectionDivider({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <section className="pt-3 mt-1 border-t-2 border-[oklch(0.22_0.08_255)]/20">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex items-center justify-center size-7 rounded-md bg-[oklch(0.22_0.08_255)]/10">
          <Icon className="size-4 text-[oklch(0.22_0.08_255)]" />
        </div>
        <h2 className="text-base font-bold text-[oklch(0.22_0.08_255)] tracking-tight">{title}</h2>
      </div>
    </section>
  );
}

/* ---------- Transfer Block ---------- */
function TransferBlock({ t }: { t: any }) {
  const fmtD = (s?: string | null) => {
    if (!s) return "—";
    const br = dateOnlyToBR(normalizeDateOnly(s));
    return br !== "—" ? br : s;
  };
  const fmtH = (s?: string | null) => (s ? s.slice(0, 5) : "—");
  return (
    <section className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center justify-center size-6 rounded-md bg-gradient-to-br from-[oklch(0.60_0.18_160)] to-[oklch(0.65_0.18_200)] shadow-sm">
          <Car className="size-3.5 text-white" />
        </div>
        {(t.origem || t.destino) ? (
          <span className="text-[14px] font-bold text-slate-900 tracking-tight">
            {t.origem || "—"} <ArrowRight className="inline size-3.5 mx-0.5 text-[oklch(0.60_0.18_180)]" /> {t.destino || "—"}
          </span>
        ) : (
          <span className="text-[14px] font-bold text-slate-900 tracking-tight">{t.tipo || "Transfer"}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-700">
        <div><span className="text-slate-500">Data de ida:</span> <span className="font-medium text-slate-900">{fmtD(t.data_ida)}</span></div>
        <div><span className="text-slate-500">Hora de ida:</span> <span className="font-medium text-slate-900">{fmtH(t.hora_ida)}</span></div>
        {(t.data_volta || t.hora_volta) && (
          <>
            <div><span className="text-slate-500">Data de volta:</span> <span className="font-medium text-slate-900">{fmtD(t.data_volta)}</span></div>
            <div><span className="text-slate-500">Hora de volta:</span> <span className="font-medium text-slate-900">{fmtH(t.hora_volta)}</span></div>
          </>
        )}
        {t.passageiros != null && (
          <div><span className="text-slate-500">Passageiros:</span> <span className="font-medium text-slate-900">{t.passageiros}</span></div>
        )}
      </div>
    </section>
  );
}

