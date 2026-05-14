import { useState } from "react";
import { Users } from "lucide-react";

export function TopClients() {
  const [tab, setTab] = useState<"fat" | "lucro">("fat");
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Top 10 Clientes</h3>
        <div className="flex gap-1 p-1 bg-primary/30 rounded-lg text-xs">
          <button
            onClick={() => setTab("fat")}
            className={`px-3 py-1 rounded ${tab === "fat" ? "bg-secondary text-secondary-foreground font-semibold" : "text-foreground/70"}`}
          >
            Faturamento
          </button>
          <button
            onClick={() => setTab("lucro")}
            className={`px-3 py-1 rounded ${tab === "lucro" ? "bg-secondary text-secondary-foreground font-semibold" : "text-foreground/70"}`}
          >
            Lucro
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Users className="size-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum cliente com vendas registradas.</p>
      </div>
    </div>
  );
}
