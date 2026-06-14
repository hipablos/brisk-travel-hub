export type TelegramCotacaoRow = {
  id: string;
  code?: string | null;
  data: unknown;
};

export type TelegramAlertPayload = {
  tipo: "Check-in";
  referencia: string;
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

export function buildCheckinAlertFromCotacao(cotacao: TelegramCotacaoRow): TelegramAlertPayload | null {
  const data = (cotacao.data ?? {}) as Record<string, any>;
  const idas = Array.isArray(data.vooIdas) ? data.vooIdas : data.vooIda ? [data.vooIda] : [];
  const primeiro = idas[0] as Voo | undefined;
  if (!primeiro) return null;

  const eventoEm = parseTelegramDeparture(primeiro.data, primeiro.horaSaida);
  if (!eventoEm) return null;

  const enviarEm = new Date(eventoEm.getTime() - 48 * 60 * 60 * 1000);
  const cliente = data.cliente?.nome ?? "—";
  const companhia = primeiro.companhia ?? "—";
  const numeroVoo = primeiro.numeroVoo ?? null;
  const origem = airportLabel(primeiro, "origem");
  const destino = airportLabel(primeiro, "destino");
  const embarque = formatDateTimeBR(eventoEm);

  const mensagem =
    `✈️ CHECK-IN DISPONÍVEL\n\n` +
    `Cliente: ${cliente}\n` +
    `Companhia aérea: ${companhia}\n` +
    `Número do voo: ${numeroVoo ?? "—"}\n` +
    `Origem: ${origem ?? "—"}\n` +
    `Destino: ${destino ?? "—"}\n` +
    `Embarque: ${embarque}\n\n` +
    `Ação recomendada:\nEntre em contato com o cliente para orientá-lo sobre o check-in.`;

  return {
    tipo: "Check-in",
    referencia: `${cotacao.id}:0`,
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
    },
  };
}