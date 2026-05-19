import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Plane, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchAirports, formatAirport, type Airport } from "@/lib/airports";

interface Props {
  value?: string;
  onSelect: (airport: Airport, formatted: string) => void;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AirportAutocomplete({ value, onSelect, onChange, placeholder }: Props) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Airport[]>([]);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value ?? ""), [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (v: string) => {
    setQuery(v);
    onChange(v);
    const r = searchAirports(v);
    setResults(r);
    setOpen(r.length > 0);
    setHighlight(0);
  };

  const pick = (a: Airport) => {
    const formatted = formatAirport(a);
    setQuery(formatted);
    onSelect(a, formatted);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
          else if (e.key === "Enter" && results[highlight]) { e.preventDefault(); pick(results[highlight]); }
          else if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder ?? "Digite IATA, cidade ou aeroporto..."}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
          {results.map((a, i) => (
            <button
              type="button"
              key={a.iata}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(a)}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-2 text-left text-sm transition-colors",
                i === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              )}
            >
              <div className="size-8 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                <Plane className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold tracking-wide">{a.iata}</span>
                  <span className="text-foreground truncate">{a.city}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <MapPin className="size-3" />
                  {a.name} · {a.country}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
