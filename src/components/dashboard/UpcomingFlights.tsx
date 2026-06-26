import { useMemo } from "react";
import { Plane } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCotacoes } from "@/lib/cotacoes-store";
import { compareDateOnly, dateOnlyToBR, normalizeDateOnly, todayDateOnly } from "@/lib/dates";

function fmtData(value?: string | null) {
  const br = dateOnlyToBR(value ?? undefined);
  return br === "—" ? "—" : br;
}

type Leg = {
  id: string;
  cotacaoId: string;
  dateKey: string;
  hora: string;
  horaIda: string;
  horaVolta: string;
  cliente: string;
  origem: string;
  destino: string;
};

export function UpcomingFlights() {
  const cotacoes = useCotacoes();

  const proximos = useMemo<Leg[]>(() => {
    const hoje = todayDateOnly();
    const legs: Leg[] = [];
    for (const c of cotacoes) {
      const vIda: any = (c as any).vooIda ?? null;
      const vVolta: any = (c as any).vooVolta ?? null;
      const cliente = c.cliente?.nome ?? "—";
      const horaIda = vIda?.horaSaida || "";
      const horaVolta = vVolta?.horaSaida || "";

      const ida = normalizeDateOnly(vIda?.data ?? c.ida);
      if (ida) {
        legs.push({
          id: `${c.id}-ida`,
          cotacaoId: c.id,
          dateKey: ida,
          hora: horaIda,
          horaIda,
          horaVolta,
          cliente,
          origem: vIda?.origem ?? c.origem ?? "—",
          destino: vIda?.destino ?? c.destino ?? "—",
        });
      }
      const volta = normalizeDateOnly(vVolta?.data ?? c.volta);
      if (volta) {
        legs.push({
          id: `${c.id}-volta`,
          cotacaoId: c.id,
          dateKey: volta,
          hora: horaVolta,
          horaIda,
          horaVolta,
          cliente,
          origem: vVolta?.origem ?? c.destino ?? "—",
          destino: vVolta?.destino ?? c.origem ?? "—",
        });
      }
    }
    return legs
      .filter((l) => compareDateOnly(l.dateKey, hoje) >= 0)
      .sort((a, b) => {
        const d = compareDateOnly(a.dateKey, b.dateKey);
        if (d !== 0) return d;
        if (!a.hora && !b.hora) return 0;
        if (!a.hora) return 1;
        if (!b.hora) return -1;
        return a.hora.localeCompare(b.hora);
      })
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
          {proximos.map((l) => (
            <li key={l.id}>
              <Link to="/cotacoes/nova" search={{ id: l.cotacaoId }} className="flex items-center gap-3 py-2.5 hover:bg-muted/40 rounded-md px-2 -mx-2 transition-colors">
                <div className="size-9 rounded-lg bg-secondary/15 grid place-items-center">
                  <Plane className="size-4 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {l.cliente}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {l.origem} → {l.destino}
                  </div>
                </div>
                <div className="text-right whitespace-nowrap leading-tight">
                  <div className="text-xs text-foreground/80 font-medium">{fmtData(l.dateKey)}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Ida: <span className="text-foreground/80">{l.horaIda || "—"}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Volta: <span className="text-foreground/80">{l.horaVolta || "—"}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
