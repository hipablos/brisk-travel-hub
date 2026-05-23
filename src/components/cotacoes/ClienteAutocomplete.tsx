import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { User, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cliente } from "@/lib/cotacoes-store";

interface Props {
  clientes: Cliente[];
  value?: string;
  onSelect: (cliente: Cliente) => void;
  placeholder?: string;
}

export function ClienteAutocomplete({ clientes, value, onSelect, placeholder }: Props) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value ?? ""), [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const q = query.trim().toLowerCase();
  const results = q
    ? clientes.filter((c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.cpf ?? "").includes(q) ||
        (c.telefone ?? "").includes(q),
      ).slice(0, 8)
    : clientes.slice(0, 8);

  const pick = (c: Cliente) => {
    setQuery(c.nome);
    onSelect(c);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlight(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
          else if (e.key === "Enter" && results[highlight]) { e.preventDefault(); pick(results[highlight]); }
          else if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder ?? "Digite o nome do cliente..."}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
          {results.map((c, i) => (
            <button
              type="button"
              key={c.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(c)}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-2 text-left text-sm transition-colors",
                i === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              )}
            >
              <div className="size-8 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                <User className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate text-foreground">{c.nome}</div>
                <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                  {c.email && <span className="inline-flex items-center gap-1"><Mail className="size-3" />{c.email}</span>}
                  {c.telefone && <span>· {c.telefone}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg px-3 py-2 text-sm text-muted-foreground">
          Nenhum cliente encontrado.
        </div>
      )}
    </div>
  );
}
