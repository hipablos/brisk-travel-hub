import { useMemo } from "react";
import { FileText } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCotacoes, formatBRL, STATUS_LABELS, type CotacaoStatus } from "@/lib/cotacoes-store";

const STATUS_STYLES: Record<CotacaoStatus, string> = {
  aprovado: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  aguardando: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  aguardando_cliente: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  reprovado: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

function relativo(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString("pt-BR");
}

export function RecentCotacoes() {
  const cotacoes = useCotacoes();
  const recentes = useMemo(() => cotacoes.slice(0, 8), [cotacoes]);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Cotações recentes</h3>
        <Link to="/cotacoes" className="text-xs text-secondary font-semibold hover:underline">Ver todas</Link>
      </div>
      {recentes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <FileText className="size-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma cotação cadastrada.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {recentes.map((c) => (
            <li key={c.id}>
              <Link to="/cotacoes/nova" search={{ id: c.id }} className="flex items-center gap-3 py-2.5 hover:bg-muted/40 rounded-md px-2 -mx-2 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{c.cliente?.nome ?? "—"}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">#{c.code}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {(c.origem ?? "—")} → {(c.destino ?? "—")} · {relativo(c.createdAt)}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[c.status]}`}>
                  {STATUS_LABELS[c.status]}
                </span>
                <div className="text-sm font-semibold text-foreground whitespace-nowrap w-[110px] text-right">
                  R$ {formatBRL(c.total)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
