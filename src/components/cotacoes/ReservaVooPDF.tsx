import { FileText } from "lucide-react";
import type { Cotacao } from "@/lib/cotacoes-store";
import type { Voo } from "@/components/cotacoes/FlightCard";

const LOGO_BLUE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAxQAAAGGCAMAAADVbDfCAAAAIGNIUk0AAIcPAACMDwAA/VIAAIFAAAB9eQAA6YsAADzlAAAZzHM8hXcAAAMAUExURQ8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXA8qXPrkbgAAAAD/dFJOUwAXbbBG2XX8CKUu01cD+HsknkzAdOOc/QnDKgHuTSh8Ya6a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";

// ─── helpers ────────────────────────────────────────────────────────────────

function diaSemanaFull(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split(/[-/]/);
  let d: number, m: number, a: number;
  if (parts[0].length === 4) { [a, m, d] = parts.map(Number); }
  else { [d, m, a] = parts.map(Number); }
  const dt = new Date(a, m - 1, d);
  const semana = dt.toLocaleDateString("pt-BR", { weekday: "long" });
  const data = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${semana.charAt(0).toUpperCase() + semana.slice(1)}, ${data}`;
}

function fmtHora(h?: string) { return h ? h.substring(0, 5) : "—"; }

function fmtData(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split(/[-/]/);
  let d: number, m: number, a: number;
  if (parts[0].length === 4) { [a, m, d] = parts.map(Number); }
  else { [d, m, a] = parts.map(Number); }
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${a}`;
}

interface Trecho {
  origem: string;
  destino: string;
  numeroVoo: string;
  horaSaida: string;
  horaChegada: string;
  data: string;
  dataChegada: string;
}

function getTrechos(voo?: Voo): Trecho[] {
  if (!voo) return [];
  if (voo.tipo === "com_escala" && voo.escalas?.length) {
    return voo.escalas.map((e) => ({
      origem: e.origem ?? "—",
      destino: e.destino ?? "—",
      numeroVoo: e.numeroVoo ? `Voo ${e.numeroVoo}` : "—",
      horaSaida: fmtHora(e.saida),
      horaChegada: fmtHora(e.chegada),
      data: fmtData(e.dataInicio),
      dataChegada: fmtData(e.dataFim),
    }));
  }
  return [{
    origem: voo.origem ?? "—",
    destino: voo.destino ?? "—",
    numeroVoo: voo.numeroVoo ? `Voo ${voo.numeroVoo}` : "—",
    horaSaida: fmtHora(voo.horaSaida),
    horaChegada: fmtHora(voo.horaChegada),
    data: fmtData(voo.data),
    dataChegada: fmtData(voo.dataChegada ?? voo.data),
  }];
}

function getBag(voo?: Voo) {
  if (!voo?.bagagens) return { mao: 0, desp: 0 };
  const b = voo.bagagens;
  return { mao: (b.pessoal ?? 0) + (b.maoCabine ?? 0), desp: (b.despachada23 ?? 0) + (b.despachada32 ?? 0) };
}

// ─── Render HTML ────────────────────────────────────────────────────────────

function renderItinerario(voos: Voo[], label: string): string {
  if (!voos.length) return "";
  return voos.map((voo) => {
    const ts = getTrechos(voo);
    const dataHeader = diaSemanaFull(voo.data);
    const qtd = ts.length;
    return `
      <div style="margin-bottom:16px;">
        <div style="background:#0f1f3d;color:#fff;padding:11px 20px;display:flex;align-items:center;justify-content:space-between;border-radius:6px 6px 0 0;">
          <div style="display:flex;align-items:center;gap:10px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            <strong style="font-size:13px;font-weight:600;">Itinerário de ${label}</strong>
          </div>
          <span style="font-size:12px;">${dataHeader}</span>
          <span style="font-size:12px;">${qtd} ${qtd === 1 ? "Trecho" : "Trechos"}</span>
        </div>
        ${ts.map((t) => `
          <div style="border:1px solid #e2e8f0;border-top:none;padding:16px 20px;display:grid;grid-template-columns:1fr 100px 1fr;align-items:center;background:#fff;">
            <div>
              <div style="font-size:28px;font-weight:800;color:#0f1f3d;line-height:1;">${t.horaSaida}</div>
              <div style="font-size:12px;color:#64748b;margin-top:2px;">${t.data}</div>
              <div style="font-size:12px;color:#334155;margin-top:6px;font-weight:500;">Aeroporto</div>
              <div style="font-size:12px;color:#3b82f6;">${t.origem}</div>
            </div>
            <div style="text-align:center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              <div style="font-size:11px;color:#94a3b8;margin-top:4px;">${t.numeroVoo}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:28px;font-weight:800;color:#0f1f3d;line-height:1;">${t.horaChegada}</div>
              <div style="font-size:12px;color:#64748b;margin-top:2px;">${t.dataChegada || t.data}</div>
              <div style="font-size:12px;color:#334155;margin-top:6px;font-weight:500;">Aeroporto</div>
              <div style="font-size:12px;color:#3b82f6;">${t.destino}</div>
            </div>
          </div>
        `).join("")}
      </div>`;
  }).join("");
}

function renderPassageiros(passageiros: string[], voosIda: Voo[], voosVolta: Voo[]): string {
  const bagIda = getBag(voosIda[0]);
  const bagVolta = getBag(voosVolta[0]);
  const temIda = voosIda.length > 0;
  const temVolta = voosVolta.length > 0;

  const colPax = (label: string, bag: { mao: number; desp: number }) => `
    <div style="flex:1;padding:0 16px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        <span style="font-size:12px;font-weight:600;color:#64748b;">${label}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-top:1px dashed #e2e8f0;padding-top:10px;">
        <div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">Assentos</div>
          <div style="font-size:12px;color:#94a3b8;">Nenhum assento definido.</div>
        </div>
        <div>
          <div style="font-size:11px;color:#94a3b8;text-align:right;margin-bottom:4px;">Bagagens</div>
          <div style="display:flex;gap:14px;">
            <div style="text-align:center;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              <div style="font-size:14px;font-weight:700;color:#1e293b;">${bag.mao}</div>
              <div style="font-size:10px;color:#94a3b8;">10kg</div>
            </div>
            <div style="text-align:center;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              <div style="font-size:14px;font-weight:700;color:#1e293b;">${bag.desp}</div>
              <div style="font-size:10px;color:#94a3b8;">23kg</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  return passageiros.map((nome) => `
    <div style="border:1px solid #e2e8f0;border-radius:6px;margin-bottom:10px;overflow:hidden;">
      <div style="background:#f8fafc;padding:11px 20px;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:13px;font-weight:700;color:#0f1f3d;text-transform:uppercase;letter-spacing:0.3px;">${nome}</span>
      </div>
      <div style="display:flex;padding:14px 4px;background:#fff;">
        ${temIda ? colPax("Ida", bagIda) : ""}
        ${temIda && temVolta ? '<div style="width:1px;background:#e2e8f0;"></div>' : ""}
        ${temVolta ? colPax("Volta", bagVolta) : ""}
      </div>
    </div>`).join("");
}

function buildHTML(cotacao: Cotacao): string {
  const localizador = (cotacao.localizador ?? "").toUpperCase();
  const nomeCliente = cotacao.cliente?.nome ?? "—";
  const passageiros = cotacao.passageirosNomes?.length ? cotacao.passageirosNomes : [nomeCliente];
  const totalPax = (cotacao.adultos ?? 0) + (cotacao.criancas ?? 0) || passageiros.length;

  const voosIda: Voo[] = (cotacao as any).vooIdas?.length ? (cotacao as any).vooIdas : (cotacao as any).vooIda ? [(cotacao as any).vooIda] : [];
  const voosVolta: Voo[] = (cotacao as any).vooVoltas?.length ? (cotacao as any).vooVoltas : (cotacao as any).vooVolta ? [(cotacao as any).vooVolta] : [];

  const companhia = voosIda[0]?.companhia ?? voosVolta[0]?.companhia ?? "VOO";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Reserva de Voo — ${cotacao.code}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#e8edf5;font-size:13px;color:#1e293b;}
  @media print{body{background:#fff;}.no-print{display:none!important;}.page{box-shadow:none!important;border-radius:0!important;margin:0!important;}}
</style>
</head>
<body>

<!-- TOPBAR -->
<div class="no-print" style="background:#0f1f3d;padding:14px 36px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
  <div style="display:flex;align-items:center;gap:16px;">
    <button onclick="history.back()" style="background:rgba(255,255,255,0.1);border:none;color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">←</button>
    <div>
      <div style="font-size:11px;color:#94a3b8;letter-spacing:0.5px;">Reserva #${cotacao.code}</div>
      <div style="font-size:17px;font-weight:700;color:#fff;">Reserva de Voo</div>
    </div>
  </div>
  <div style="display:flex;gap:10px;">
    <button onclick="window.print()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:8px 18px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:500;display:flex;align-items:center;gap:7px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Imprimir
    </button>
    <button onclick="window.print()" style="background:#3b82f6;border:none;color:#fff;padding:8px 18px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;display:flex;align-items:center;gap:7px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Baixar PDF
    </button>
  </div>
</div>

<!-- CONTEÚDO -->
<div style="max-width:840px;margin:28px auto;padding:0 16px 40px;">
  <div class="page" style="background:#fff;border-radius:10px;padding:28px 32px;box-shadow:0 2px 16px rgba(0,0,0,0.09);">

    <!-- LOGO + INFO EMPRESA -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:20px;margin-bottom:20px;border-bottom:1px solid #e2e8f0;">
      <img src="${LOGO_BLUE}" alt="Brisk Viagens" style="height:42px;object-fit:contain;"/>
      <div style="text-align:right;font-size:12px;color:#64748b;line-height:1.8;">
        <div>CNPJ 64.827.486/0001-19</div>
        <div>(85) 99647-7568 · briskviagens@gmail.com · @briskviagens</div>
      </div>
    </div>

    <!-- COMPANHIA + LOCALIZADOR -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
      <div style="font-size:28px;font-weight:900;color:#0f1f3d;text-transform:uppercase;letter-spacing:-0.5px;">${companhia}</div>
      ${localizador ? `
      <div style="border:1px solid #cbd5e1;border-radius:6px;padding:8px 16px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">LOCALIZADOR</span>
        <span style="font-size:15px;font-weight:800;color:#0f1f3d;letter-spacing:0.5px;">${localizador}</span>
      </div>` : ""}
    </div>

    <!-- INFORMAÇÕES DO VOO -->
    <div style="margin-bottom:24px;">
      <div style="font-size:12px;font-weight:700;color:#0f1f3d;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">INFORMAÇÕES DO VOO</div>
      ${renderItinerario(voosIda, "IDA")}
      ${renderItinerario(voosVolta, "VOLTA")}
    </div>

    <!-- PASSAGEIROS -->
    <div>
      <div style="font-size:12px;font-weight:700;color:#0f1f3d;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">PASSAGEIROS: ${totalPax}</div>
      ${renderPassageiros(passageiros, voosIda, voosVolta)}
    </div>

  </div>
</div>
</body>
</html>`;
}

// ─── Botão ───────────────────────────────────────────────────────────────────

interface Props {
  cotacao: Cotacao;
  className?: string;
}

export function ReservaVooButton({ cotacao, className }: Props) {
  const handleOpen = () => {
    const html = buildHTML(cotacao);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
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
