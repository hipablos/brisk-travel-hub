import { useState } from "react";

const clients = [
  { name: "Fabiano Franco", value: 48200, trips: 6 },
  { name: "Ana Beatriz Souza", value: 39800, trips: 4 },
  { name: "Carlos Mendes", value: 31500, trips: 5 },
  { name: "Elizes Carvalho", value: 27300, trips: 3 },
  { name: "Mariana Lopes", value: 22150, trips: 4 },
  { name: "Roberto Dias", value: 19420, trips: 2 },
];

export function TopClients() {
  const [tab, setTab] = useState<"fat" | "lucro">("fat");
  const max = Math.max(...clients.map((c) => c.value));
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
      <ul className="space-y-3">
        {clients.map((c, i) => {
          const v = tab === "fat" ? c.value : Math.round(c.value * 0.22);
          return (
            <li key={c.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <span className="size-5 rounded grid place-items-center text-[10px] font-bold bg-secondary text-secondary-foreground">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90">{c.name}</span>
                </div>
                <span className="font-semibold text-foreground tabular-nums">
                  R$ {v.toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="h-1.5 bg-primary/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-secondary to-secondary/70 rounded-full"
                  style={{ width: `${(c.value / max) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
