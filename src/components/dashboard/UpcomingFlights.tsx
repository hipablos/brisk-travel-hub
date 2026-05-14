import { Plane } from "lucide-react";

export function UpcomingFlights() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-base font-semibold text-foreground mb-4">Próximos voos</h3>
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Plane className="size-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum voo cadastrado.</p>
      </div>
    </div>
  );
}
