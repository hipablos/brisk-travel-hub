import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Plane, Briefcase, Luggage } from "lucide-react";
import { BriskLogo } from "@/components/BriskLogo";
import { getCotacao, type Cotacao } from "@/lib/cotacoes-store";
import { getAirlineBrand } from "@/lib/airlines";
import { AirlineLogo } from "@/components/AirlineLogo";

export const Route = createFileRoute("/reserva_/$id")({
  component: ReservaPage,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Reserva de Voo" },
      { name: "description", content: "Reserva de voo para envio ao cliente." },
    ],
  }),
});

function fmtLongDate(s?: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  return `${dias[d.getDay()]}, ${d.toLocaleDateString("pt-BR")}`;
}
function fmtShortDate(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("pt-BR");
}
function splitAirport(s?: string) {
  if (!s) return { city: "—", iata: "", name: "" };
  // "São Paulo (GRU) — Guarulhos Intl, Brasil"
  const m = s.match(/^(.*?)\(([A-Z]{3})\)\s*[—\-·]?\s*(.*)$/);
  if (m) return { city: m[1].trim(), iata: m[2].trim(), name: m[3].split(",")[0].trim() };
  return { city: s, iata: "", name: "" };
}

function AirlineLogo({ companhia }: { companhia?: string }) {
  const brand = getAirlineBrand(companhia);
  if (!brand) {
    return <div className="text-2xl font-extrabold text-slate-700">{companhia || "Companhia Aérea"}</div>;
  }
  if (brand.key === "gol") {
    return (
      <div className="text-5xl font-extrabold tracking-tight leading-none">
        <span style={{ color: brand.color }}>G</span>
        <span style={{ color: brand.color }}>O</span>
        <span style={{ color: brand.accent }}>L</span>
      </div>
    );
  }
  if (brand.key === "latam") {
    return (
      <div className="text-4xl font-extrabold tracking-tight leading-none" style={{ color: brand.color }}>
        LATAM
      </div>
    );
  }
  return (
    <div className="text-4xl font-extrabold italic tracking-tight leading-none" style={{ color: brand.color }}>
      AZUL
    </div>
  );
}

function ReservaPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [cotacao, setCotacao] = useState<Cotacao | undefined>();

  useEffect(() => {
    getCotacao(id).then((c) => {
      if (!c) { navigate({ to: "/voos" }); return; }
      setCotacao(c);
    });
  }, [id, navigate]);

  if (!cotacao) return null;

  const vooIda = cotacao.vooIda as any;
  const vooVolta = cotacao.vooVolta as any;
  // Use main airline brand for header (prefer ida)
  const headerBrand = getAirlineBrand(vooIda?.companhia) ?? getAirlineBrand(vooVolta?.companhia);
  const headerLocalizador = vooIda?.localizador || vooVolta?.localizador || `BRK-${cotacao.code.toUpperCase()}`;

  const totalPax = (cotacao.adultos ?? 0) + (cotacao.criancas ?? 0);

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
                <Link to="/voos"><ArrowLeft className="size-4" /></Link>
              </Button>
              <div>
                <div className="text-sm text-muted-foreground">Reserva #{cotacao.code}</div>
                <h1 className="text-2xl font-bold text-foreground">Reserva de Voo</h1>
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
          <div id="reserva-doc" className="bg-white text-slate-800 rounded-xl shadow-lg overflow-hidden print:shadow-none print:rounded-none border border-slate-200">
            {/* Header — airline logo + localizador + link reserva */}
            <div className="px-8 pt-6 pb-5 flex items-center justify-between gap-6 border-b border-slate-200">
              <AirlineLogo companhia={vooIda?.companhia ?? vooVolta?.companhia} />
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xs font-semibold text-slate-700">Localizador</div>
                  <div className="mt-1 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded text-[oklch(0.22_0.08_255)] font-bold tracking-wider">
                    {headerLocalizador}
                  </div>
                </div>
                {headerBrand && (
                  <a
                    href={headerBrand.bookingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded bg-[oklch(0.18_0.08_255)] hover:bg-[oklch(0.22_0.08_255)] text-white text-sm font-semibold transition-colors"
                  >
                    Visualizar reserva
                  </a>
                )}
              </div>
            </div>

            <div className="px-8 py-6 space-y-6">
              <h2 className="text-base font-bold text-slate-900">Informações do voo</h2>

              {vooIda && <ItinerarioBlock direction="ida" voo={vooIda} />}
              {vooVolta && <ItinerarioBlock direction="volta" voo={vooVolta} />}

              {/* Passageiros */}
              <section className="pt-2">
                <h3 className="text-base font-bold text-slate-900 mb-3">Passageiros: {totalPax}</h3>
                <PaxBlock nome={cotacao.cliente?.nome || "—"} idaVoo={vooIda} voltaVoo={vooVolta} />
                {Array.from({ length: Math.max(0, totalPax - 1) }).map((_, i) => (
                  <PaxBlock key={i} nome={`Passageiro ${i + 2}`} idaVoo={vooIda} voltaVoo={vooVolta} />
                ))}
                <p className="text-xs text-slate-500 mt-3">
                  *Além da bagagem especificada acima, cada passageiro pode levar consigo uma bolsa, mochila ou sacola (considerado item pessoal).
                </p>
              </section>
            </div>

            {/* Footer — Brisk azul à esquerda + dados de contato à direita */}
            <div className="px-8 py-5 border-t border-slate-200 flex items-end justify-between gap-6">
              <BriskLogo variant="blue" className="h-7 w-auto opacity-90" />
              <div className="text-right text-[11px] text-slate-700 leading-relaxed">
                <div>64.827.486/0001-19</div>
                <div>(85) 99647-7568</div>
                <div>briskviagens@gmail.com</div>
                <div>briskviagens</div>
              </div>
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

function ItinerarioBlock({ direction, voo }: { direction: "ida" | "volta"; voo: any }) {
  const isIda = direction === "ida";
  const origem = splitAirport(voo?.origem);
  const destino = splitAirport(voo?.destino);

  return (
    <section>
      {/* Header bar */}
      <div className="bg-[oklch(0.18_0.08_255)] text-white rounded-t flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Plane className="size-4" />
          Itinerário de {isIda ? "IDA" : "VOLTA"}
        </div>
        <div className="text-sm font-semibold">{fmtLongDate(voo?.data)}</div>
        <div className="text-sm font-semibold">1 Trecho</div>
      </div>

      {/* Segment row */}
      <div className="bg-slate-50 border border-t-0 border-slate-200 rounded-b px-4 py-4 grid grid-cols-12 items-center gap-3">
        <div className="col-span-2">
          <div className="text-2xl font-bold text-slate-900 leading-none">{voo?.horaSaida || "—"}</div>
          <div className="text-xs text-slate-500 mt-1">{fmtShortDate(voo?.data)}</div>
        </div>
        <div className="col-span-3 text-sm text-slate-700">
          <div>{origem.name ? `Aer. ${origem.name}` : "Aeroporto"}</div>
          <div className="text-slate-500">{origem.city}</div>
        </div>
        <div className="col-span-2 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
            <span>{origem.iata}</span>
            <Plane className="size-5 text-slate-700" />
            <span>{destino.iata}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{voo?.numeroVoo || ""}</div>
        </div>
        <div className="col-span-3 text-sm text-slate-700 text-right">
          <div>{destino.name ? `Aer. ${destino.name}` : "Aeroporto"}</div>
          <div className="text-slate-500">{destino.city}</div>
        </div>
        <div className="col-span-2 text-right">
          <div className="text-2xl font-bold text-slate-900 leading-none">{voo?.horaChegada || "—"}</div>
          <div className="text-xs text-slate-500 mt-1">{fmtShortDate(voo?.data)}</div>
        </div>
      </div>
    </section>
  );
}

function PaxBlock({ nome, idaVoo, voltaVoo }: { nome: string; idaVoo: any; voltaVoo: any }) {
  return (
    <div className="mb-4 border border-slate-200 rounded overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 flex items-center justify-between">
        <div className="font-bold text-slate-900 uppercase text-sm">{nome}</div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-slate-200">
        {[
          { label: "Ida", voo: idaVoo },
          { label: "Volta", voo: voltaVoo },
        ].map((t, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-3">
            <div className="w-10 shrink-0 text-center text-xs text-slate-500">
              <Plane className="size-4 mx-auto text-[oklch(0.22_0.08_255)]" />
              <div className="mt-1">{t.label}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500">Assentos</div>
              <div className="text-xs text-slate-700 border border-dashed border-slate-300 rounded px-2 py-1 mt-0.5 truncate">
                {t.voo?.assento || "Nenhum assento definido."}
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-slate-500 mb-1">Bagagens*</div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <Briefcase className="size-4 text-slate-700" />
                  <span className="font-semibold text-slate-900 mt-0.5">{t.voo?.bagagens?.maoCabine ?? 0}</span>
                  <span className="text-[10px] text-slate-500">10kg</span>
                </div>
                <div className="flex flex-col items-center">
                  <Luggage className="size-4 text-slate-700" />
                  <span className="font-semibold text-slate-900 mt-0.5">{(t.voo?.bagagens?.despachada23 ?? 0) + (t.voo?.bagagens?.despachada32 ?? 0)}</span>
                  <span className="text-[10px] text-slate-500">23kg</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
