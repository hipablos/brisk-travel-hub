import { TrendingUp, Users, Plane, DollarSign } from "lucide-react";
import { useMemo } from "react";
import { useCotacoes, formatBRL } from "@/lib/cotacoes-store";
import { isInCurrentBrazilMonth, todayDateOnly } from "@/lib/dates";

function sumLinhas(arr?: { valor?: number }[]) {
  return (arr ?? []).reduce((s, v) => s + (Number(v.valor) || 0), 0);
}

function isInCurrentMonth(value?: string) {
  if (!value) return false;
  const createdAt = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (createdAt) return isInCurrentBrazilMonth(`${createdAt[3]}-${createdAt[2]}-${createdAt[1]}`);
  return isInCurrentBrazilMonth(value);
}

function currentMonthLabel() {
  const [, month, year] = todayDateOnly().split("-");
  const name = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"][Number(month) - 1];
  return `${name} ${year}`;
}

export function StatCards() {
  const cotacoes = useCotacoes();

  const stats = useMemo(() => {
    const doMes = cotacoes.filter((c) => {
      const dataRef = c.dataVenda || c.createdAt;
      return isInCurrentMonth(dataRef);
    });

    const aprovadasMes = doMes.filter(
      (c) => c.status === "aprovado" || (c.vendaVendas ?? []).length > 0
    );

    const faturamento = aprovadasMes.reduce((s, c) => s + sumLinhas(c.vendaVendas), 0);
    const vendas = aprovadasMes.length;
    const ticket = vendas > 0 ? faturamento / vendas : 0;

    const clientesMes = new Set(
      cotacoes
        .filter((c) => isInCurrentMonth(c.createdAt) && c.cliente?.id)
        .map((c) => c.cliente.id)
    ).size;

    return [
      { icon: DollarSign, label: "Faturamento do mês", value: `R$ ${formatBRL(faturamento)}` },
      { icon: Plane, label: "Vendas realizadas", value: String(vendas) },
      { icon: Users, label: "Novos clientes", value: String(clientesMes) },
      { icon: TrendingUp, label: "Ticket médio", value: `R$ ${formatBRL(ticket)}` },
    ];
  }, [cotacoes]);

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
            <span className="text-[11px] font-semibold text-muted-foreground">
              {currentMonthLabel()}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">{s.label}</div>
          <div className="text-xl font-bold text-foreground mt-1">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
