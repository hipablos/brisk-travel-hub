import { useMemo } from "react";

const data = [
  { label: "Aprovados", value: 42, color: "oklch(0.6 0.18 145)" },
  { label: "Aguardando", value: 28, color: "oklch(0.88 0.17 92)" },
  { label: "Recusados", value: 18, color: "oklch(0.62 0.22 27)" },
  { label: "Em análise", value: 12, color: "oklch(0.55 0.18 255)" },
];

export function BudgetsChart() {
  const total = data.reduce((s, d) => s + d.value, 0);
  const segments = useMemo(() => {
    let cum = 0;
    const r = 70;
    const c = 2 * Math.PI * r;
    return data.map((d) => {
      const len = (d.value / total) * c;
      const seg = { ...d, dasharray: `${len} ${c - len}`, offset: -cum };
      cum += len;
      return seg;
    });
  }, [total]);

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
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
            <circle cx="90" cy="90" r="70" fill="none" stroke="oklch(0.22 0.05 260)" strokeWidth="22" />
            {segments.map((s, i) => (
              <circle
                key={i}
                cx="90" cy="90" r="70"
                fill="none"
                stroke={s.color}
                strokeWidth="22"
                strokeDasharray={s.dasharray}
                strokeDashoffset={s.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{total}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((d) => (
            <div key={d.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-foreground/80">{d.label}</span>
              </div>
              <span className="font-semibold text-foreground">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
