import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { useCotacoes, formatBRL } from "@/lib/cotacoes-store";

function sumLinhas(arr?: { valor?: number }[]) {
  return (arr ?? []).reduce((s, v) => s + (Number(v.valor) || 0), 0);
}

export function TopClients() {
  const cotacoes = useCotacoes();
  const [tab, setTab] = useState<"fat" | "lucro">("fat");

  const ranking = useMemo(() => {
    const map = new Map<string, { nome: string; faturamento: number; lucro: number; vendas: number }>();
    for (const c of cotacoes) {
      if (!c.cliente?.id) continue;
      if (!(c.status === "aprovado" || (c.vendaVendas ?? []).length > 0)) continue;
      const venda = sumLinhas(c.vendaVendas);
      const custo = sumLinhas(c.vendaCustos);
      const cur = map.get(c.cliente.id) ?? { nome: c.cliente.nome, faturamento: 0, lucro: 0, vendas: 0 };
      cur.faturamento += venda;
      cur.lucro += venda - custo;
      cur.vendas += 1;
      map.set(c.cliente.id, cur);
    }
    return [...map.values()]
      .sort((a, b) => (tab === "fat" ? b.faturamento - a.faturamento : b.lucro - a.lucro))
      .slice(0, 10);
  }, [cotacoes, tab]);

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

      {ranking.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Users className="size-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum cliente com vendas registradas.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {ranking.map((c, i) => {
            const val = tab === "fat" ? c.faturamento : c.lucro;
            return (
              <li key={c.nome + i} className="flex items-center gap-3 py-2.5">
                <span className="size-6 rounded-full bg-secondary/15 text-secondary text-xs font-bold grid place-items-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{c.nome}</div>
                  <div className="text-[11px] text-muted-foreground">{c.vendas} venda{c.vendas !== 1 ? "s" : ""}</div>
                </div>
                <div className={`text-sm font-semibold ${tab === "lucro" && val < 0 ? "text-rose-600" : "text-foreground"}`}>
                  R$ {formatBRL(val)}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
