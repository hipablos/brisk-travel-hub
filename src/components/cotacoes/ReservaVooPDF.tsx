import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Printer, Download } from "lucide-react";
import type { Cotacao } from "@/lib/cotacoes-store";
import type { Voo } from "@/components/cotacoes/FlightCard";
import { dateOnlyToBR } from "@/lib/dates";

// ─── helpers ────────────────────────────────────────────────────────────────

function diaSemana(dateStr?: string): string {
  if (!dateStr) return "";
  const [d, m, a] = dateStr.split("-").map(Number);
  const dt = new Date(a, m - 1, d);
  return dt.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtHora(h?: string) {
  return h ? h.substring(0, 5) : "—";
}

function trechos(voo?: Voo): Array<{ origem: string; destino: string; numeroVoo: string; horaSaida: string; horaChegada: string; data: string; dataChegada: string }> {
  if (!voo) return [];
  if (voo.tipo === "com_escala" && voo.escalas?.length) {
    return voo.escalas.map((e) => ({
      origem: e.origem ?? "—",
      destino: e.destino ?? "—",
      numeroVoo: e.numeroVoo ? `Voo ${e.numeroVoo}` : "—",
      horaSaida: fmtHora(e.saida),
      horaChegada: fmtHora(e.chegada),
      data: dateOnlyToBR(e.dataInicio) ?? "",
      dataChegada: dateOnlyToBR(e.dataFim) ?? "",
    }));
  }
  return [{
    origem: voo.origem ?? "—",
    destino: voo.destino ?? "—",
    numeroVoo: voo.numeroVoo ? `Voo ${voo.numeroVoo}` : "—",
    horaSaida: fmtHora(voo.horaSaida),
    horaChegada: fmtHora(voo.horaChegada),
    data: dateOnlyToBR(voo.data) ?? "",
    dataChegada: dateOnlyToBR(voo.dataChegada) ?? "",
  }];
}

function bagLabel(voo?: Voo) {
  if (!voo?.bagagens) return null;
  const b = voo.bagagens;
  return { mao: b.maoCabine + b.pessoal, desp: b.despachada23 + b.despachada32 };
}

// ─── HTML do PDF ────────────────────────────────────────────────────────────

function buildHTML(cotacao: Cotacao): string {
  const localizador = cotacao.localizador ?? "";
  const nomeCliente = cotacao.cliente?.nome ?? "—";
  const passageiros: string[] = cotacao.passageirosNomes?.length
    ? cotacao.passageirosNomes
    : [nomeCliente];

  const voosIda: Voo[] = cotacao.vooIdas?.length ? cotacao.vooIdas : cotacao.vooIda ? [cotacao.vooIda] : [];
  const voosVolta: Voo[] = cotacao.vooVoltas?.length ? cotacao.vooVoltas : cotacao.vooVolta ? [cotacao.vooVolta] : [];

  const totalPassageiros = cotacao.adultos + (cotacao.criancas ?? 0);

  function renderItinerario(voos: Voo[], label: string) {
    if (!voos.length) return "";
    return voos.map((voo) => {
      const ts = trechos(voo);
      const dataHeader = voo.data ? diaSemana(voo.data) : "";
      const qtdTrechos = ts.length;
      const bag = bagLabel(voo);
      return `
        <div style="margin-bottom:18px;">
          <div style="background:#0a1628;color:#fff;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;border-radius:6px 6px 0 0;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:15px;">✈</span>
              <strong style="font-size:13px;">Itinerário de ${label}</strong>
            </div>
            <span style="font-size:12px;font-weight:600;">${dataHeader ? dataHeader.charAt(0).toUpperCase() + dataHeader.slice(1) : ""}</span>
            <span style="font-size:12px;">${qtdTrechos} ${qtdTrechos === 1 ? "Trecho" : "Trechos"}</span>
          </div>
          ${ts.map((t) => `
            <div style="border:1px solid #e2e8f0;border-top:none;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;background:#fff;">
              <div style="min-width:80px;">
                <div style="font-size:22px;font-weight:700;color:#0a1628;">${t.horaSaida}</div>
                <div style="font-size:11px;color:#64748b;">${t.data}</div>
                <div style="font-size:11px;color:#0a1628;margin-top:4px;">Aeroporto</div>
                <div style="font-size:11px;color:#3b82f6;">${t.origem}</div>
              </div>
              <div style="text-align:center;flex:1;padding:0 12px;">
                <span style="font-size:16px;">✈</span>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">${t.numeroVoo}</div>
              </div>
              <div style="min-width:80px;text-align:right;">
                <div style="font-size:22px;font-weight:700;color:#0a1628;">${t.horaChegada}</div>
                <div style="font-size:11px;color:#64748b;">${t.dataChegada || t.data}</div>
                <div style="font-size:11px;color:#0a1628;margin-top:4px;">Aeroporto</div>
                <div style="font-size:11px;color:#3b82f6;">${t.destino}</div>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }).join("");
  }

  function renderPassageiros() {
    return passageiros.map((nome) => {
      const bagIda = voosIda[0] ? bagLabel(voosIda[0]) : null;
      const bagVolta = voosVolta[0] ? bagLabel(voosVolta[0]) : null;
      return `
        <div style="border:1px solid #e2e8f0;border-radius:6px;padding:14px 16px;margin-bottom:12px;background:#fff;">
          <div style="font-weight:700;font-size:13px;color:#0a1628;margin-bottom:12px;text-transform:uppercase;">${nome}</div>
          <div style="display:flex;gap:32px;">
            ${voosIda.length ? `
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                <span style="font-size:13px;color:#3b82f6;">✈</span>
                <span style="font-size:12px;font-weight:600;color:#64748b;">Ida</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                  <div style="font-size:11px;color:#64748b;">Assentos</div>
                  <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Nenhum assento definido.</div>
                </div>
                ${bagIda ? `
                <div style="text-align:right;">
                  <div style="font-size:10px;color:#64748b;margin-bottom:4px;">Bagagens</div>
                  <div style="display:flex;gap:12px;">
                    <div style="text-align:center;">
                      <div style="font-size:16px;">🧳</div>
                      <div style="font-size:13px;font-weight:700;">${bagIda.mao}</div>
                      <div style="font-size:10px;color:#64748b;">10kg</div>
                    </div>
                    <div style="text-align:center;">
                      <div style="font-size:16px;">🧳</div>
                      <div style="font-size:13px;font-weight:700;">${bagIda.desp}</div>
                      <div style="font-size:10px;color:#64748b;">23kg</div>
                    </div>
                  </div>
                </div>` : ""}
              </div>
            </div>` : ""}
            ${voosVolta.length ? `
            <div style="flex:1;border-left:1px solid #e2e8f0;padding-left:24px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                <span style="font-size:13px;color:#3b82f6;">✈</span>
                <span style="font-size:12px;font-weight:600;color:#64748b;">Volta</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                  <div style="font-size:11px;color:#64748b;">Assentos</div>
                  <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Nenhum assento definido.</div>
                </div>
                ${bagVolta ? `
                <div style="text-align:right;">
                  <div style="font-size:10px;color:#64748b;margin-bottom:4px;">Bagagens</div>
                  <div style="display:flex;gap:12px;">
                    <div style="text-align:center;">
                      <div style="font-size:16px;">🧳</div>
                      <div style="font-size:13px;font-weight:700;">${bagVolta.mao}</div>
                      <div style="font-size:10px;color:#64748b;">10kg</div>
                    </div>
                    <div style="text-align:center;">
                      <div style="font-size:16px;">🧳</div>
                      <div style="font-size:13px;font-weight:700;">${bagVolta.desp}</div>
                      <div style="font-size:10px;color:#64748b;">23kg</div>
                    </div>
                  </div>
                </div>` : ""}
              </div>
            </div>` : ""}
          </div>
        </div>
      `;
    }).join("");
  }

  // Tenta pegar nome da companhia do primeiro voo de ida
  const companhia = voosIda[0]?.companhia ?? voosVolta[0]?.companhia ?? "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Reserva de Voo - ${cotacao.code}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; }
  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
    .card { box-shadow: none !important; }
  }
</style>
</head>
<body>
  <!-- Topbar -->
  <div style="background:#0a1628;padding:16px 32px;display:flex;align-items:center;justify-content:space-between;" class="no-print">
    <div>
      <div style="font-size:11px;color:#94a3b8;">Reserva #${cotacao.code}</div>
      <div style="font-size:20px;font-weight:700;color:#fff;">Reserva de Voo</div>
    </div>
    <div style="display:flex;gap:12px;">
      <button onclick="window.print()" style="background:transparent;border:1px solid #fff;color:#fff;padding:8px 18px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:13px;">
        🖨️ Imprimir
      </button>
      <button onclick="window.print()" style="background:#3b82f6;border:none;color:#fff;padding:8px 18px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;">
        ⬇ Baixar PDF
      </button>
    </div>
  </div>

  <!-- Conteúdo -->
  <div style="max-width:860px;margin:32px auto;padding:0 16px;">
    <div class="card" style="background:#fff;border-radius:12px;padding:28px 32px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

      <!-- Header logo + info -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e2e8f0;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="font-size:22px;font-weight:900;color:#3b82f6;letter-spacing:-1px;">brisk<br/><span style="font-size:11px;font-weight:400;color:#64748b;letter-spacing:1px;">viagens</span></div>
        </div>
        <div style="text-align:right;font-size:11px;color:#64748b;line-height:1.7;">
          <div>CNPJ 64.827.486/0001-19</div>
          <div>(85) 99647-7568 · briskviagens@gmail.com · @briskviagens</div>
        </div>
      </div>

      <!-- Companhia + localizador -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
        <div style="font-size:28px;font-weight:900;color:#0a1628;text-transform:uppercase;">${companhia || "VOO"}</div>
        ${localizador ? `
        <div style="border:1px solid #e2e8f0;border-radius:6px;padding:8px 16px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">LOCALIZADOR</span>
          <span style="font-size:15px;font-weight:700;color:#0a1628;">${localizador}</span>
        </div>` : ""}
      </div>

      <!-- Informações do voo -->
      <div style="margin-bottom:24px;">
        <div style="font-size:13px;font-weight:700;color:#0a1628;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">INFORMAÇÕES DO VOO</div>
        ${renderItinerario(voosIda, "IDA")}
        ${renderItinerario(voosVolta, "VOLTA")}
      </div>

      <!-- Passageiros -->
      <div>
        <div style="font-size:13px;font-weight:700;color:#0a1628;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">PASSAGEIROS: ${totalPassageiros}</div>
        ${renderPassageiros()}
      </div>

    </div>
  </div>
</body>
</html>`;
}

// ─── Botão que abre a reserva ────────────────────────────────────────────────

interface Props {
  cotacao: Cotacao;
  className?: string;
}

export function ReservaVooButton({ cotacao, className }: Props) {
  const handleOpen = () => {
    const html = buildHTML(cotacao);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={className ?? "p-1 hover:text-foreground"}
      title="Gerar Reserva de Voo"
    >
      <FileText className="size-3.5" />
    </button>
  );
}
