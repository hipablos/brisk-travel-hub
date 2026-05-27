import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MIN_ISO,
  MAX_ISO,
  MIN_YEAR,
  MAX_YEAR,
  parseISO,
  parseBR,
  isoToBR,
  brToISO,
  maskBR,
} from "@/lib/dates";

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "min" | "max"
> & {
  /** Valor em ISO "YYYY-MM-DD" (formato canônico de armazenamento). */
  value?: string;
  /** Recebe ISO válido, ou string vazia quando o campo é limpo. */
  onChange?: (iso: string) => void;
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
 *  - nunca emite ISO inválido para o pai
 */
export const DateInput = React.forwardRef<HTMLInputElement, Props>(function DateInput(
  { value, onChange, className, minISO = MIN_ISO, maxISO = MAX_ISO, showError = true, onBlur, ...rest },
  ref,
) {
  const [text, setText] = React.useState<string>(isoToBR(value) === "—" ? "" : isoToBR(value));
  const [error, setError] = React.useState<string | null>(null);

  // Mantém sincronizado quando o valor externo muda.
  React.useEffect(() => {
    const next = value ? (isoToBR(value) === "—" ? "" : isoToBR(value)) : "";
    setText(next);
    setError(null);
  }, [value]);

  // Suporta calendário nativo: o navegador entrega "YYYY-MM-DD"
  function handleNative(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (!v) {
      setText("");
      setError(null);
      onChange?.("");
      return;
    }
    const r = parseISO(v);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    if (r.iso < minISO || r.iso > maxISO) {
      setError(`Ano fora do intervalo permitido (${MIN_YEAR}–${MAX_YEAR})`);
      return;
    }
    setError(null);
    setText(isoToBR(r.iso));
    onChange?.(r.iso);
  }

  // Detecta se o navegador renderiza calendário (type="date"). Fallback: texto com máscara.
  const [supportsDate, setSupportsDate] = React.useState(true);
  React.useEffect(() => {
    const i = document.createElement("input");
    i.setAttribute("type", "date");
    setSupportsDate(i.type === "date");
  }, []);

  if (supportsDate) {
    return (
      <div className="w-full">
        <Input
          ref={ref}
          type="date"
          value={value ?? ""}
          min={minISO}
          max={maxISO}
          onChange={handleNative}
          onBlur={onBlur}
          className={cn(className)}
          {...rest}
        />
        {showError && error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  // Fallback: máscara DD/MM/AAAA
  return (
    <div className="w-full">
      <Input
        ref={ref}
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        value={text}
        onChange={(e) => {
          const masked = maskBR(e.target.value);
          setText(masked);
          if (masked.length === 10) {
            const r = parseBR(masked);
            if (!r.ok) {
              setError(r.error);
              return;
            }
            if (r.iso < minISO || r.iso > maxISO) {
              setError(`Ano fora do intervalo permitido (${MIN_YEAR}–${MAX_YEAR})`);
              return;
            }
            setError(null);
            onChange?.(r.iso);
          } else {
            setError(null);
          }
        }}
        onBlur={(e) => {
          if (text && text.length < 10) setError("Data inválida");
          onBlur?.(e);
        }}
        className={cn(className)}
        {...rest}
      />
      {showError && error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
});
