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
  if (!horaSaida || !horaChegada) return null;
  const di = toISODate(dataInicio);
  const df = toISODate(dataFim) ?? di;
  if (di && df) {
    const ini = new Date(`${di}T${horaSaida}:00`);
    const fim = new Date(`${df}T${horaChegada}:00`);
    const diff = fim.getTime() - ini.getTime();
    if (Number.isNaN(diff) || diff < 0) return null;
    return Math.round(diff / 60000);
  }
  return calcDuracaoMinutos(horaSaida, horaChegada);
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
 * Duração de um trecho de ESCALA (perna adicional de voo), calculada pelas
 * datas+horários da própria escala. Cai em manual (esc.duracaoTrecho) se
 * não houver horários preenchidos.
 */
export function calcDuracaoEscalaTrechoMin(esc: any): number {
  const calc = calcDuracaoMinutosComData(
    esc?.dataInicio,
    esc?.saida,
    esc?.dataFim ?? esc?.dataInicio,
    esc?.chegada,
  );
  if (calc != null) return calc;
  return parseDuracaoParaMinutos(esc?.duracaoTrecho);
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
  if (total <= 0) return "—";
  return formatDuracao(total);
}
