/**
 * Utilitários de duração de voo (calculada a partir de horaSaida/horaChegada).
 */

export function calcDuracaoMinutos(
  horaSaida?: string | null,
  horaChegada?: string | null,
): number | null {
  if (!horaSaida || !horaChegada) return null;
  const [hS, mS] = horaSaida.split(":").map(Number);
  const [hC, mC] = horaChegada.split(":").map(Number);
  if ([hS, mS, hC, mC].some((n) => Number.isNaN(n))) return null;
  const inicio = hS * 60 + mS;
  let fim = hC * 60 + mC;
  if (fim < inicio) fim += 24 * 60; // cruzou meia-noite
  return fim - inicio;
}

/** Normaliza uma data em DD-MM-AAAA, DD/MM/AAAA ou YYYY-MM-DD para YYYY-MM-DD. */
function toISODate(s?: string | null): string | null {
  if (!s) return null;
  const t = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

function parseDateParts(date?: string | null): { year: number; month: number; day: number } | null {
  const iso = toISODate(date);
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if ([year, month, day].some((n) => Number.isNaN(n))) return null;
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return { year, month, day };
}

function parseTimeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const m = String(time).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

function dateSerial(date: { year: number; month: number; day: number }): number {
  return Math.floor(Date.UTC(date.year, date.month - 1, date.day) / 86400000);
}

/**
 * Duração levando em conta data de início e data de fim.
 * Aceita DD-MM-AAAA, DD/MM/AAAA ou YYYY-MM-DD. Suporta voos que cruzam dias.
 */
export function calcDuracaoMinutosComData(
  dataInicio?: string | null,
  horaSaida?: string | null,
  dataFim?: string | null,
  horaChegada?: string | null,
): number | null {
  const saidaMin = parseTimeToMinutes(horaSaida);
  const chegadaMin = parseTimeToMinutes(horaChegada);
  if (saidaMin == null || chegadaMin == null) return null;

  const di = parseDateParts(dataInicio);
  const df = parseDateParts(dataFim) ?? di;
  if (di && df) {
    const diff = (dateSerial(df) - dateSerial(di)) * 24 * 60 + chegadaMin - saidaMin;
    return diff >= 0 ? diff : null;
  }

  const diffSemData = chegadaMin - saidaMin;
  return diffSemData >= 0 ? diffSemData : null;
}

export function formatDuracao(minutos: number | null): string {
  if (minutos == null || minutos < 0) return "—";
  const d = Math.floor(minutos / (60 * 24));
  const rest = minutos - d * 60 * 24;
  const h = Math.floor(rest / 60);
  const m = rest % 60;
  const partes: string[] = [];
  if (d > 0) partes.push(`${d}d`);
  if (h > 0) partes.push(`${h}h`);
  if (m > 0) partes.push(`${String(m).padStart(2, "0")}m`);
  if (partes.length === 0) return "0m";
  return partes.join(" ");
}

export function calcDuracaoVoo(
  horaSaida?: string | null,
  horaChegada?: string | null,
): string {
  return formatDuracao(calcDuracaoMinutos(horaSaida, horaChegada));
}

export function calcDuracaoVooComData(
  dataInicio?: string | null,
  horaSaida?: string | null,
  dataFim?: string | null,
  horaChegada?: string | null,
): string {
  return formatDuracao(calcDuracaoMinutosComData(dataInicio, horaSaida, dataFim, horaChegada));
}

/**
 * Duração da ESCALA (tempo de espera em solo entre dois trechos).
 * = saída do próximo trecho − chegada do trecho anterior.
 */
export function calcDuracaoEscala(
  chegadaTrechoAnterior?: string | null,
  saidaProximoTrecho?: string | null,
): string {
  return formatDuracao(calcDuracaoMinutos(chegadaTrechoAnterior, saidaProximoTrecho));
}

/** Duração porta-a-porta usando saída do primeiro trecho e chegada do último. */
export function calcDuracaoTotalVoo(voo: any): string {
  return calcDuracaoVooComData(voo?.data, voo?.horaSaida, voo?.dataChegada ?? voo?.data, voo?.horaChegada);
}

/**
 * Converte uma duração em texto livre ("1d 2h 30m", "21h", "1h 30m", "45m", "1h30") em minutos.
 */
export function parseDuracaoParaMinutos(texto?: string | null): number {
  if (!texto) return 0;
  const t = String(texto).trim().toLowerCase();
  if (!t) return 0;
  const diasMatch = t.match(/(\d+)\s*d/);
  const horasMatch = t.match(/(\d+)\s*h/);
  const minMatch = t.match(/(\d+)\s*m(?!ês)/);
  const dias = diasMatch ? Number(diasMatch[1]) : 0;
  const horas = horasMatch ? Number(horasMatch[1]) : 0;
  const minutos = minMatch ? Number(minMatch[1]) : 0;
  if (!diasMatch && !horasMatch && !minMatch) {
    const soNumero = Number(t.replace(",", "."));
    if (!Number.isNaN(soNumero)) return Math.round(soNumero * 60);
    return 0;
  }
  return dias * 24 * 60 + horas * 60 + minutos;
}

/**
 * Duração de um trecho de ESCALA (perna adicional de voo), calculada
 * exclusivamente pelos horários de saída/chegada (e datas, se houver).
 * Se os horários/datas não estiverem preenchidos ou a chegada vier antes
 * da saída na mesma data, permanece zerado.
 */
export function calcDuracaoEscalaTrechoMin(esc: any): number {
  const calc = calcDuracaoMinutosComData(
    esc?.dataInicio,
    esc?.saida,
    esc?.dataFim ?? esc?.dataInicio,
    esc?.chegada,
  );
  return calc != null && calc > 0 ? calc : 0;
}

export function calcDuracaoEscalaTrecho(esc: any): string {
  const m = calcDuracaoEscalaTrechoMin(esc);
  return m > 0 ? formatDuracao(m) : "";
}

/**
 * Duração do trecho principal (somente o voo principal, sem escalas).
 */
export function calcDuracaoTrecho(voo: any): string {
  const base = calcDuracaoMinutosComData(
    voo?.data,
    voo?.horaSaida,
    voo?.dataChegada ?? voo?.data,
    voo?.horaChegada,
  ) ?? 0;
  if (base <= 0) return "";
  return formatDuracao(base);
}

/**
 * Duração total = trecho principal + soma dos trechos de cada escala.
 */
export function calcTempoDeVooTotal(voo: any): string {
  const base = calcDuracaoMinutosComData(
    voo?.data,
    voo?.horaSaida,
    voo?.dataChegada ?? voo?.data,
    voo?.horaChegada,
  ) ?? 0;
  const escalas: any[] = Array.isArray(voo?.escalas) ? voo.escalas : [];
  let total = base;
  escalas.forEach((esc) => {
    total += calcDuracaoEscalaTrechoMin(esc);
  });
  if (total <= 0) return "";
  return formatDuracao(total);
}
