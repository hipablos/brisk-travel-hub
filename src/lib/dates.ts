// Sistema centralizado de validação de datas date-only.
// Regras:
// - Datas de negócio são armazenadas como string pura "DD-MM-AAAA"
// - Nunca usar `new Date(string)` com datas de negócio
// - Sem timezone, sem UTC, sem horário automático na persistência/exibição
// - Mês 1..12, dia válido para o mês (considera ano bissexto)

export const MIN_YEAR = 2020;
export const MAX_YEAR = 2100;
export const MIN_DATE_ONLY = `01-01-${MIN_YEAR}`;
export const MAX_DATE_ONLY = `31-12-${MAX_YEAR}`;
export const MIN_ISO = `${MIN_YEAR}-01-01`; // usado apenas pelo input nativo do navegador
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
  | { ok: true; value: string; iso: string; year: number; month: number; day: number }
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
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  const yyyy = String(year).padStart(4, "0");
  return { ok: true, value: `${dd}-${mm}-${yyyy}`, iso: `${yyyy}-${mm}-${dd}`, year, month, day };
}

/** Parse seguro da string canônica "DD-MM-AAAA". */
export function parseDateOnly(value?: string | null): DateValidation {
  if (!value) return { ok: false, error: "Data inválida" };
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (!m) return { ok: false, error: "Formato deve ser DD-MM-AAAA" };
  return validateYMD(Number(m[3]), Number(m[2]), Number(m[1]));
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

/** Aceita DD-MM-AAAA, DD/MM/AAAA ou legado YYYY-MM-DD e normaliza para DD-MM-AAAA. */
export function normalizeDateOnly(value?: string | null): string {
  if (!value) return "";
  const raw = value.trim();
  const parsers = [parseDateOnly, parseBR, parseISO];
  for (const parse of parsers) {
    const r = parse(raw);
    if (r.ok) return r.value;
  }
  return "";
}

/** Converte qualquer data aceita → DD/MM/AAAA (sem timezone). Retorna "—" se inválida. */
export function dateOnlyToBR(value?: string | null): string {
  const normalized = normalizeDateOnly(value);
  const r = parseDateOnly(normalized);
  if (!r.ok) return "—";
  return `${String(r.day).padStart(2, "0")}/${String(r.month).padStart(2, "0")}/${r.year}`;
}

/** Converte DD/MM/AAAA → DD-MM-AAAA ou null. */
export function brToDateOnly(s?: string | null): string | null {
  const r = parseBR(s);
  return r.ok ? r.value : null;
}

export function isValidDateOnly(value?: string | null): boolean {
  return !!normalizeDateOnly(value);
}

export function dateOnlyToNativeISO(value?: string | null): string {
  const r = parseDateOnly(normalizeDateOnly(value));
  return r.ok ? r.iso : "";
}

export function nativeISOToDateOnly(iso?: string | null): string {
  const r = parseISO(iso);
  return r.ok ? r.value : "";
}

export function compareDateOnly(a?: string | null, b?: string | null): number {
  const da = dateOnlyToNativeISO(a);
  const db = dateOnlyToNativeISO(b);
  if (!da && !db) return 0;
  if (!da) return -1;
  if (!db) return 1;
  return da.localeCompare(db);
}

/** Hoje em DD-MM-AAAA no fuso do Brasil. */
export function todayDateOnly(): string {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date());
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const year = parts.find((p) => p.type === "year")?.value ?? String(MIN_YEAR);
  return `${day}-${month}-${year}`;
}

export function addDaysDateOnly(value: string, days: number): string {
  const r = parseDateOnly(normalizeDateOnly(value));
  if (!r.ok) return "";
  const d = new Date(r.year, r.month - 1, r.day + days, 12, 0, 0, 0);
  return validateYMD(d.getFullYear(), d.getMonth() + 1, d.getDate()).ok
    ? `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`
    : "";
}

export function isInCurrentBrazilMonth(value?: string | null): boolean {
  const r = parseDateOnly(normalizeDateOnly(value));
  const today = parseDateOnly(todayDateOnly());
  return r.ok && today.ok && r.year === today.year && r.month === today.month;
}

export function weekdayName(value?: string | null): string {
  const r = parseDateOnly(normalizeDateOnly(value));
  if (!r.ok) return "";
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  let y = r.year;
  if (r.month < 3) y -= 1;
  const idx = (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[r.month - 1] + r.day) % 7;
  return ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"][idx];
}

// Compatibilidade com nomes antigos: agora retornam/aceitam date-only DD-MM-AAAA.
export const isoToBR = dateOnlyToBR;
export const brToISO = brToDateOnly;
export const isValidISO = isValidDateOnly;
export const todayISO = todayDateOnly;

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
