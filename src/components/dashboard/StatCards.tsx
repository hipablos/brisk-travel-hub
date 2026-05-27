import { TrendingUp, Users, Plane, DollarSign } from "lucide-react";
import { useMemo } from "react";
import { useCotacoes, formatBRL } from "@/lib/cotacoes-store";

function sumLinhas(arr?: { valor?: number }[]) {
  return (arr ?? []).reduce((s, v) => s + (Number(v.valor) || 0), 0);
}

function isInCurrentMonth(iso?: string) {
  if (!iso) return false;
  const s = iso.length >= 10 ? iso.slice(0, 10) : iso;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const now = new Date();
  return Number(m[1]) === now.getFullYear() && Number(m[2]) === now.getMonth() + 1;
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
              {new Date().toLocaleDateString("pt-BR", { month: "long", timeZone: "America/Sao_Paulo" })}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">{s.label}</div>
          <div className="text-xl font-bold text-foreground mt-1">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
