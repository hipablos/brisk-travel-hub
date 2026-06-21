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

export function formatDuracao(minutos: number | null): string {
  if (minutos == null || minutos < 0) return "—";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function calcDuracaoVoo(
  horaSaida?: string | null,
  horaChegada?: string | null,
): string {
  return formatDuracao(calcDuracaoMinutos(horaSaida, horaChegada));
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
  return calcDuracaoVoo(voo?.horaSaida, voo?.horaChegada);
}

/**
 * Converte uma duração em texto livre ("21h", "1h 30m", "45m", "1h30") em minutos.
 */
export function parseDuracaoParaMinutos(texto?: string | null): number {
  if (!texto) return 0;
  const t = String(texto).trim().toLowerCase();
  if (!t) return 0;
  const horasMatch = t.match(/(\d+)\s*h/);
  const minMatch = t.match(/(\d+)\s*m(?!ês)/);
  const horas = horasMatch ? Number(horasMatch[1]) : 0;
  const minutos = minMatch ? Number(minMatch[1]) : 0;
  if (!horasMatch && !minMatch) {
    const soNumero = Number(t.replace(",", "."));
    if (!Number.isNaN(soNumero)) return Math.round(soNumero * 60);
    return 0;
  }
  return horas * 60 + minutos;
}

/**
 * "Tempo de voo" total para exibir no PDF: soma de todas as durações de trecho
 * (editadas manualmente) + todas as durações de escala (calculadas chegada→saída).
 */
export function calcTempoDeVooTotal(voo: any): string {
  const escalas: any[] = Array.isArray(voo?.escalas) ? voo.escalas : [];
  if (escalas.length === 0) {
    const mins = parseDuracaoParaMinutos(voo?.duracaoTrecho);
    if (mins > 0) return formatDuracao(mins);
    // fallback: porta-a-porta calculado
    return calcDuracaoVoo(voo?.horaSaida, voo?.horaChegada);
  }
  let total = parseDuracaoParaMinutos(voo?.duracaoTrecho);
  escalas.forEach((esc: any) => {
    total += calcDuracaoMinutos(esc?.chegada, esc?.saida) ?? 0;
    total += parseDuracaoParaMinutos(esc?.duracaoTrecho);
  });
  return formatDuracao(total);
}
