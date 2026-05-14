import { PieChart } from "lucide-react";

export function BudgetsChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Orçamentos</h3>
        <div className="flex gap-1 p-1 bg-primary/30 rounded-lg text-xs">
          {["Dia", "Semana", "Mês", "Ano", "Total"].map((p) => (
            <button
              key={p}
              className={`px-2.5 py-1 rounded ${p === "Mês" ? "bg-secondary text-secondary-foreground font-semibold" : "text-foreground/70"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <PieChart className="size-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Sem orçamentos no período.</p>
      </div>
    </div>
  );
}
