import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  MIN_ISO,
  MAX_ISO,
  MIN_YEAR,
  MAX_YEAR,
  parseISO,
  parseBR,
  dateOnlyToBR,
  dateOnlyToNativeISO,
  maskBR,
} from "@/lib/dates";
import { CalendarIcon } from "lucide-react";

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "min" | "max"
> & {
  /** Valor em DD-MM-AAAA (string pura, sem timezone). */
  value?: string;
  /** Recebe DD-MM-AAAA válido, ou string vazia quando o campo é limpo. */
  onChange?: (value: string) => void;
  minISO?: string;
  maxISO?: string;
  /** Mostra mensagem de erro embaixo do campo. */
  showError?: boolean;
};

/**
 * Input de data com:
 *  - calendário nativo (type="date")
 *  - máscara DD/MM/AAAA ao digitar fora do calendário (mobile/teclado)
 *  - validação real (mês 1-12, dia válido p/ mês, ano MIN..MAX)
 *  - nunca emite data inválida para o pai
 */
export const DateInput = React.forwardRef<HTMLInputElement, Props>(function DateInput(
  { value, onChange, className, minISO = MIN_ISO, maxISO = MAX_ISO, showError = true, onBlur, ...rest },
  ref,
) {
  const [text, setText] = React.useState<string>(dateOnlyToBR(value) === "—" ? "" : dateOnlyToBR(value));
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const minDate = React.useMemo(() => isoToLocalDate(minISO), [minISO]);
  const maxDate = React.useMemo(() => isoToLocalDate(maxISO), [maxISO]);
  const selectedDate = React.useMemo(() => isoToLocalDate(dateOnlyToNativeISO(value)), [value]);

  // Mantém sincronizado quando o valor externo muda.
  React.useEffect(() => {
    const next = value ? (dateOnlyToBR(value) === "—" ? "" : dateOnlyToBR(value)) : "";
    setText(next);
    setError(null);
  }, [value]);

  return (
    <div className="w-full">
      <div className="relative">
        <Input
          ref={ref}
          inputMode="numeric"
          placeholder="DD/MM/AAAA"
          value={text}
          onChange={(e) => {
            const masked = maskBR(e.target.value);
            setText(masked);
            if (!masked) {
              setError(null);
              onChange?.("");
              return;
            }
            if (masked.length === 10) commitText(masked, { showRangeError: true });
            else setError(null);
          }}
          onBlur={(e) => {
            if (text && text.length < 10) setError("Data inválida");
            if (text.length === 10) commitText(text, { showRangeError: true });
            onBlur?.(e);
          }}
          className={cn("pr-10", className)}
          {...rest}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Abrir calendário"
            >
              <CalendarIcon className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate ?? new Date()}
              fromDate={minDate ?? undefined}
              toDate={maxDate ?? undefined}
              onSelect={(date) => {
                if (!date) return;
                const next = localDateToDateOnly(date);
                setText(dateOnlyToBR(next));
                setError(null);
                onChange?.(next);
                setOpen(false);
              }}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      {showError && error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );

  function commitText(masked: string, opts?: { showRangeError?: boolean }) {
    const r = parseBR(masked);
    if (!r.ok) {
      setError(r.error);
      return false;
    }
    if (r.iso < minISO || r.iso > maxISO) {
      setError(opts?.showRangeError ? rangeError(minISO, maxISO) : null);
      return false;
    }
    setError(null);
    onChange?.(r.value);
    return true;
  }
});

function isoToLocalDate(iso?: string | null): Date | undefined {
  const r = parseISO(iso);
  if (!r.ok) return undefined;
  return new Date(r.year, r.month - 1, r.day);
}

function localDateToDateOnly(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).padStart(4, "0");
  return `${day}-${month}-${year}`;
}

function rangeError(minISO: string, maxISO: string): string {
  const min = parseISO(minISO);
  const max = parseISO(maxISO);
  const minYear = min.ok ? min.year : MIN_YEAR;
  const maxYear = max.ok ? max.year : MAX_YEAR;
  return `Ano fora do intervalo permitido (${minYear}–${maxYear})`;
}
