import { Plane, ArrowRight } from "lucide-react";

const flights = [
  { date: "06/05/2026", time: "14h40", name: "Elizes", from: "Curitiba (CWB)", to: "Fortaleza (FOR)", code: "i802b" },
  { date: "06/05/2026", time: "18h20", name: "FABIANO DO NASCIMENTO FRANCO", from: "Fortaleza (FOR)", to: "São Paulo (GRU)", code: "gt7ck" },
  { date: "07/05/2026", time: "08h55", name: "Ana", from: "Rio De Janeiro (SDU)", to: "Uberlandia (UDI)", code: "vurnl" },
  { date: "08/05/2026", time: "11h20", name: "Carlos Mendes", from: "Brasília (BSB)", to: "Recife (REC)", code: "kp9xz" },
];

export function UpcomingFlights() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-base font-semibold text-foreground mb-4">Próximos voos</h3>
      <div className="space-y-3">
        {flights.map((f) => (
          <div key={f.code} className="flex items-start gap-4 py-2 border-b border-border last:border-0">
            <div className="text-xs text-muted-foreground shrink-0 w-20">
              <div>{f.date}</div>
              <div className="font-semibold text-foreground">{f.time}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground/90 truncate">{f.name}</div>
              <div className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                {f.from} <ArrowRight className="size-3 text-secondary" /> {f.to}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Plane className="size-4 text-secondary" />
              <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-primary/40 text-foreground">
                {f.code}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <span className="text-xs px-3 py-1.5 rounded-md bg-destructive/90 text-destructive-foreground font-semibold">
          3 em período de check-in
        </span>
        <span className="text-xs px-3 py-1.5 rounded-md bg-emerald-600/90 text-white font-semibold">
          15 voo(s) pendente(s)
        </span>
      </div>
    </div>
  );
}
