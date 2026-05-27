import { useMemo, useState } from "react";
import { PieChart } from "lucide-react";
import { useCotacoes, formatBRL, STATUS_LABELS, type CotacaoStatus } from "@/lib/cotacoes-store";

type Periodo = "Dia" | "Semana" | "Mês" | "Ano" | "Total";

function startOf(periodo: Periodo): Date | null {
  const now = new Date();
  if (periodo === "Total") return null;
  if (periodo === "Dia") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (periodo === "Semana") {
    const d = new Date(now); d.setDate(d.getDate() - 7); return d;
  }
  if (periodo === "Mês") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (periodo === "Ano") return new Date(now.getFullYear(), 0, 1);
  return null;
}

const STATUS_COLORS: Record<CotacaoStatus, string> = {
  aprovado: "bg-emerald-500",
  aguardando: "bg-amber-500",
  aguardando_cliente: "bg-sky-500",
  reprovado: "bg-rose-500",
};

export function BudgetsChart() {
  const cotacoes = useCotacoes();
  const [periodo, setPeriodo] = useState<Periodo>("Mês");

  const { total, porStatus, count } = useMemo(() => {
    const start = startOf(periodo);
    const filtradas = cotacoes.filter((c) => !start || new Date(c.createdAt) >= start);
    const total = filtradas.reduce((s, c) => s + (Number(c.total) || 0), 0);
    const porStatus = new Map<CotacaoStatus, { count: number; total: number }>();
    for (const c of filtradas) {
      const cur = porStatus.get(c.status) ?? { count: 0, total: 0 };
      cur.count += 1; cur.total += Number(c.total) || 0;
      porStatus.set(c.status, cur);
    }
    return { total, porStatus, count: filtradas.length };
  }, [cotacoes, periodo]);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Orçamentos</h3>
        <div className="flex gap-1 p-1 bg-primary/30 rounded-lg text-xs">
          {(["Dia", "Semana", "Mês", "Ano", "Total"] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-2.5 py-1 rounded transition-colors ${periodo === p ? "bg-secondary text-secondary-foreground font-semibold" : "text-foreground/70 hover:text-foreground"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {count === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <PieChart className="size-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Sem orçamentos no período.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="text-xs text-muted-foreground">Total orçado</div>
            <div className="text-2xl font-bold text-foreground">R$ {formatBRL(total)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{count} cotaç{count === 1 ? "ão" : "ões"}</div>
          </div>
          <div className="space-y-2">
            {(Object.keys(STATUS_LABELS) as CotacaoStatus[]).map((st) => {
              const v = porStatus.get(st) ?? { count: 0, total: 0 };
              const pct = total > 0 ? (v.total / total) * 100 : 0;
              return (
                <div key={st} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${STATUS_COLORS[st]}`} />
                      <span className="text-foreground/80">{STATUS_LABELS[st]}</span>
                      <span className="text-muted-foreground">({v.count})</span>
                    </div>
                    <span className="font-semibold text-foreground">R$ {formatBRL(v.total)}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${STATUS_COLORS[st]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
