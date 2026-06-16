export type TelegramCotacaoRow = {
  id: string;
  code?: string | null;
  data: unknown;
};

export type TrechoTipo = "ida" | "volta";

export const TELEGRAM_ALERT_REFERENCIA_ATUAL_DB_PATTERN = ":(ida|volta):[0-9]+$";
export const TELEGRAM_ALERT_REFERENCIA_ATUAL_REGEX = /:(ida|volta):\d+$/;

export function isTelegramAlertReferenciaAtual(referencia?: string | null): boolean {
  return TELEGRAM_ALERT_REFERENCIA_ATUAL_REGEX.test(referencia ?? "");
}

export type TelegramAlertPayload = {
  tipo: "Check-in";
  referencia: string;
  trechoTipo: TrechoTipo;
  trechoIndex: number;
  trechoLabel: string;
  cliente: string;
  numeroVoo: string | null;
  origem: string | null;
  destino: string | null;
  eventoEm: Date;
  enviarEm: Date;
  mensagem: string;
  metadata: Record<string, unknown>;
};

type Voo = {
  origem?: string;
  destino?: string;
  data?: string;
  horaSaida?: string;
  companhia?: string;
  numeroVoo?: string;
  origemInfo?: { iata?: string; label?: string; nome?: string };
  destinoInfo?: { iata?: string; label?: string; nome?: string };
};

export function parseTelegramDeparture(data?: string, hora?: string): Date | null {
  if (!data || !hora) return null;
  const md = /^(\d{2})-(\d{2})-(\d{4})$/.exec(data.trim());
  const mt = /^(\d{2}):(\d{2})$/.exec(hora.trim());
  if (!md || !mt) return null;
  return new Date(Date.UTC(+md[3], +md[2] - 1, +md[1], +mt[1] + 3, +mt[2], 0));
}

function formatDateTimeBR(date: Date): string {
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function airportLabel(voo: Voo, key: "origem" | "destino"): string | null {
  const info = key === "origem" ? voo.origemInfo : voo.destinoInfo;
  return info?.label ?? info?.nome ?? info?.iata ?? voo[key] ?? null;
}

function collectVoos(data: Record<string, any>, tipo: TrechoTipo): Voo[] {
  if (tipo === "ida") {
    if (Array.isArray(data.vooIdas)) return data.vooIdas as Voo[];
    if (data.vooIda) return [data.vooIda as Voo];
    return [];
  }
  if (Array.isArray(data.vooVoltas)) return data.vooVoltas as Voo[];
  if (data.vooVolta) return [data.vooVolta as Voo];
  return [];
}

function labelFor(tipo: TrechoTipo, index: number, total: number): string {
  const base = tipo === "ida" ? "Ida" : "Volta";
  return total > 1 ? `${base} – Trecho ${index + 1}` : base;
}

export type DiagnosticoTrecho = {
  referencia: string;
  trechoTipo: TrechoTipo;
  trechoIndex: number;
  trechoLabel: string;
  embarqueEm: Date | null;
  enviarEm: Date | null;
  origem: string | null;
  destino: string | null;
  numeroVoo: string | null;
  motivo: string | null;
  alert: TelegramAlertPayload | null;
};

export function diagnoseCotacaoTrechos(cotacao: TelegramCotacaoRow): DiagnosticoTrecho[] {
  const data = (cotacao.data ?? {}) as Record<string, any>;
  const cliente = data.cliente?.nome ?? "—";
  const out: DiagnosticoTrecho[] = [];

  for (const tipo of ["ida", "volta"] as TrechoTipo[]) {
    const voos = collectVoos(data, tipo);
    voos.forEach((voo, idx) => {
      const label = labelFor(tipo, idx, voos.length);
      const referencia = `${cotacao.id}:${tipo}:${idx}`;
      const origem = airportLabel(voo, "origem");
      const destino = airportLabel(voo, "destino");
      const numeroVoo = voo.numeroVoo ?? null;
      const eventoEm = parseTelegramDeparture(voo.data, voo.horaSaida);

      if (!eventoEm) {
        out.push({
          referencia,
          trechoTipo: tipo,
          trechoIndex: idx,
          trechoLabel: label,
          embarqueEm: null,
          enviarEm: null,
          origem,
          destino,
          numeroVoo,
          motivo: "Data ou horário de embarque não cadastrado neste trecho.",
          alert: null,
        });
        return;
      }

      const enviarEm = new Date(eventoEm.getTime() - 48 * 60 * 60 * 1000);
      const companhia = voo.companhia ?? "—";
      const embarque = formatDateTimeBR(eventoEm);

      const mensagem =
        `✈️ CHECK-IN DISPONÍVEL (${label})\n\n` +
        `Cliente: ${cliente}\n` +
        `Companhia aérea: ${companhia}\n` +
        `Número do voo: ${numeroVoo ?? "—"}\n` +
        `Origem: ${origem ?? "—"}\n` +
        `Destino: ${destino ?? "—"}\n` +
        `Embarque: ${embarque}\n\n` +
        `Ação recomendada:\nEntre em contato com o cliente para orientá-lo sobre o check-in.` +
        (cotacao.code ? `\n\nCotação: ${cotacao.code}` : "");

      const alert: TelegramAlertPayload = {
        tipo: "Check-in",
        referencia,
        trechoTipo: tipo,
        trechoIndex: idx,
        trechoLabel: label,
        cliente,
        numeroVoo,
        origem,
        destino,
        eventoEm,
        enviarEm,
        mensagem,
        metadata: {
          cotacao_id: cotacao.id,
          cotacao_code: cotacao.code ?? null,
          companhia,
          trecho_tipo: tipo,
          trecho_index: idx,
          trecho_label: label,
        },
      };

      out.push({
        referencia,
        trechoTipo: tipo,
        trechoIndex: idx,
        trechoLabel: label,
        embarqueEm: eventoEm,
        enviarEm,
        origem,
        destino,
        numeroVoo,
        motivo: eventoEm.getTime() < Date.now() ? "Embarque já ocorreu." : null,
        alert,
      });
    });
  }

  return out;
}

/** Returns one alert per flight segment (ida and volta, including multi-segment). */
export function buildCheckinAlertsFromCotacao(cotacao: TelegramCotacaoRow): TelegramAlertPayload[] {
  return diagnoseCotacaoTrechos(cotacao)
    .filter((d) => d.alert && d.embarqueEm && d.embarqueEm.getTime() >= Date.now())
    .map((d) => d.alert!) as TelegramAlertPayload[];
}

/** @deprecated use buildCheckinAlertsFromCotacao */
export function buildCheckinAlertFromCotacao(cotacao: TelegramCotacaoRow): TelegramAlertPayload | null {
  return buildCheckinAlertsFromCotacao(cotacao)[0] ?? null;
}
