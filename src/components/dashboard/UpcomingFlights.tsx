import { useMemo } from "react";
import { Plane } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCotacoes } from "@/lib/cotacoes-store";
import { isoToBR, toLocalDate, todayISO } from "@/lib/dates";

function fmtData(iso?: string) {
  const br = isoToBR(iso);
  return br === "—" ? "—" : br;
}

export function UpcomingFlights() {
  const cotacoes = useCotacoes();

  const proximos = useMemo(() => {
    const hojeISO = todayISO();
    return cotacoes
      .filter((c) => c.ida && toLocalDate(c.ida) && c.ida! >= hojeISO)
      .sort((a, b) => (a.ida! < b.ida! ? -1 : 1))
      .slice(0, 6);
  }, [cotacoes]);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-base font-semibold text-foreground mb-4">Próximos voos</h3>
      {proximos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Plane className="size-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum voo cadastrado.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {proximos.map((c) => (
            <li key={c.id}>
              <Link to="/cotacoes/nova" search={{ id: c.id }} className="flex items-center gap-3 py-2.5 hover:bg-muted/40 rounded-md px-2 -mx-2 transition-colors">
                <div className="size-9 rounded-lg bg-secondary/15 grid place-items-center">
                  <Plane className="size-4 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {c.cliente?.nome ?? "—"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {(c.origem ?? "—")} → {(c.destino ?? "—")}
                  </div>
                </div>
                <div className="text-xs text-foreground/80 font-medium whitespace-nowrap">{fmtData(c.ida)}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
