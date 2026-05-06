import { TrendingUp, Users, Plane, DollarSign } from "lucide-react";

const stats = [
  { icon: DollarSign, label: "Faturamento do mês", value: "R$ 284.520", delta: "+12,4%", up: true },
  { icon: Plane, label: "Viagens vendidas", value: "127", delta: "+8 esta semana", up: true },
  { icon: Users, label: "Novos clientes", value: "34", delta: "+5,2%", up: true },
  { icon: TrendingUp, label: "Ticket médio", value: "R$ 2.241", delta: "-1,8%", up: false },
];

export function StatCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)] hover:border-secondary/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="size-9 rounded-lg bg-secondary/15 grid place-items-center">
              <s.icon className="size-4 text-secondary" />
            </div>
            <span className={`text-[11px] font-semibold ${s.up ? "text-emerald-400" : "text-destructive"}`}>
              {s.delta}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">{s.label}</div>
          <div className="text-xl font-bold text-foreground mt-1">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
