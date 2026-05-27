// Sistema centralizado de validação de datas.
// Regras:
// - Datas são armazenadas como ISO local "YYYY-MM-DD" (sem timezone)
// - Nunca usar `new Date(string)` com strings de usuário; sempre parse manual
// - Ano permitido: MIN_YEAR..MAX_YEAR
// - Mês 1..12, dia válido para o mês (considera ano bissexto)

export const MIN_YEAR = 2020;
export const MAX_YEAR = 2100;
export const MIN_ISO = `${MIN_YEAR}-01-01`;
export const MAX_ISO = `${MAX_YEAR}-12-31`;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2 && isLeap(year)) return 29;
  return DAYS_IN_MONTH[month - 1];
}

export type DateValidation =
  | { ok: true; iso: string; year: number; month: number; day: number }
  | { ok: false; error: string };

/** Valida um trio (ano, mês, dia). Por padrão NÃO restringe ano (a faixa é aplicada pelo input). */
export function validateYMD(
  year: number,
  month: number,
  day: number,
  opts?: { minYear?: number; maxYear?: number },
): DateValidation {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return { ok: false, error: "Data inválida" };
  }
  const minY = opts?.minYear;
  const maxY = opts?.maxYear;
  if ((minY !== undefined && year < minY) || (maxY !== undefined && year > maxY)) {
    return { ok: false, error: `Ano fora do intervalo (${minY ?? "-"}–${maxY ?? "-"})` };
  }
  if (year < 1 || year > 9999) return { ok: false, error: "Ano inválido" };
  if (month < 1 || month > 12) return { ok: false, error: "Mês inexistente" };
  const dim = daysInMonth(year, month);
  if (day < 1 || day > dim) return { ok: false, error: "Dia inválido para o mês" };
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { ok: true, iso, year, month, day };
}

/** Parse seguro de "YYYY-MM-DD". */
export function parseISO(iso?: string | null): DateValidation {
  if (!iso) return { ok: false, error: "Data inválida" };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return { ok: false, error: "Data inválida" };
  return validateYMD(Number(m[1]), Number(m[2]), Number(m[3]));
}

/** Parse seguro de "DD/MM/AAAA". */
export function parseBR(s?: string | null): DateValidation {
  if (!s) return { ok: false, error: "Data inválida" };
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return { ok: false, error: "Formato deve ser DD/MM/AAAA" };
  return validateYMD(Number(m[3]), Number(m[2]), Number(m[1]));
}

/** Converte ISO → DD/MM/AAAA (sem timezone). Retorna "—" se inválido. */
export function isoToBR(iso?: string | null): string {
  const r = parseISO(iso);
  if (!r.ok) return "—";
  return `${String(r.day).padStart(2, "0")}/${String(r.month).padStart(2, "0")}/${r.year}`;
}

/** Converte DD/MM/AAAA → ISO YYYY-MM-DD ou null. */
export function brToISO(s?: string | null): string | null {
  const r = parseBR(s);
  return r.ok ? r.iso : null;
}

export function isValidISO(iso?: string | null): boolean {
  return parseISO(iso).ok;
}

/** Cria um Date local (meia-noite local) a partir de ISO, ou null. */
export function toLocalDate(iso?: string | null): Date | null {
  const r = parseISO(iso);
  if (!r.ok) return null;
  return new Date(r.year, r.month - 1, r.day, 0, 0, 0, 0);
}

/** Hoje em ISO local (fuso do navegador). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Máscara progressiva DD/MM/AAAA enquanto o usuário digita. */
export function maskBR(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 4);
  const p3 = digits.slice(4, 8);
  if (digits.length <= 2) return p1;
  if (digits.length <= 4) return `${p1}/${p2}`;
  return `${p1}/${p2}/${p3}`;
}
