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
