import { cn } from "@/lib/utils";
import { Hash, Eye, Pencil, MoreVertical, MessageSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCotacoes, useAllLabels, formatBRL, type CotacaoStatus } from "@/lib/cotacoes-store";
import { LabelsPopover } from "./LabelsPopover";

type QuoteCard = {
  id: string;
  code: string;
  date: string;
  amount: string;
  name: string;
  tag?: string;
  labels: string[];
  isWhatsApp?: boolean;
  saved?: boolean;
};

type ColumnProps = {
  title: string;
  status: CotacaoStatus;
  count: number;
  totalAmount: string;
  colorClass: string;
  cards: QuoteCard[];
};

function KanbanCard({ card }: { card: QuoteCard }) {
  const allLabels = useAllLabels();
  const colorOf = (name: string) => allLabels.find((l) => l.name === name)?.color ?? "#64748b";

  return (
    <div className="bg-card border border-border/50 rounded-lg p-3 hover:border-primary/50 transition-colors flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono bg-secondary/20 px-1.5 py-0.5 rounded">{card.code}</span>
          <span className="text-muted-foreground">{card.date}</span>
          <div className="size-5 rounded-full bg-secondary shrink-0 overflow-hidden">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${card.code}`} alt="avatar" className="w-full h-full object-cover" />
          </div>
        </div>
        <span className="font-bold text-foreground">{card.amount}</span>
      </div>

      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.labels.map((l) => (
            <span
              key={l}
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white"
              style={{ background: colorOf(l) }}
            >
              {l}
            </span>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground uppercase tracking-wider">
          {card.name}
          {card.isWhatsApp && <span className="size-2 rounded-full bg-green-500" title="WhatsApp" />}
        </div>
        {card.tag && (
          <div className="mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-secondary text-secondary-foreground uppercase">
            {card.tag}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-muted-foreground">
        <span className="p-1"><Hash className="size-3.5" /></span>
        <div className="flex items-center gap-1">
          {card.saved ? (
            <>
              <LabelsPopover cotacaoId={card.id} selected={card.labels} />
              <Link to="/cotacoes/$id" params={{ id: card.id }} className="p-1 hover:text-foreground" title="Visualizar PDF">
                <Eye className="size-3.5" />
              </Link>
              <Link
                to="/cotacoes/nova"
                search={{ id: card.id }}
                className="p-1 hover:text-foreground"
                title="Editar cotação"
              >
                <Pencil className="size-3.5" />
              </Link>
            </>
          ) : (
            <>
              <span className="p-1 opacity-40" title="Disponível ao salvar"><Eye className="size-3.5" /></span>
              <span className="p-1 opacity-40" title="Disponível ao salvar"><Pencil className="size-3.5" /></span>
            </>
          )}
          <span className="p-1"><MoreVertical className="size-3.5" /></span>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ title, count, totalAmount, colorClass, cards }: ColumnProps) {
  return (
    <div className="flex flex-col min-w-[300px] max-w-[350px] w-full shrink-0">
      <div className={cn("flex items-center justify-between px-3 py-2 rounded-t-lg font-bold text-xs uppercase tracking-wider", colorClass)}>
        <span>{title} ({count})</span>
        <span>{totalAmount}</span>
      </div>
      <div className="flex-1 bg-card/30 border border-border/50 border-t-0 p-2 flex flex-col gap-2 overflow-y-auto">
        {cards.map((c) => (
          <KanbanCard key={c.id} card={c} />
        ))}
      </div>
    </div>
  );
}

export function CotacoesBoard() {
  const saved = useCotacoes();
  const all = saved;

  const statuses: { status: CotacaoStatus; title: string; colorClass: string }[] = [
    { status: "aguardando", title: "Aguardando", colorClass: "bg-muted text-muted-foreground" },
    { status: "aguardando_cliente", title: "Aguardando Cliente", colorClass: "bg-primary text-primary-foreground" },
    { status: "aprovado", title: "Aprovado", colorClass: "bg-emerald-600 text-white" },
    { status: "reprovado", title: "Reprovado", colorClass: "bg-destructive text-destructive-foreground" },
  ];

  const columns: ColumnProps[] = statuses.map(({ status, title, colorClass }) => {
    const items = all.filter((c) => c.status === status);
    const total = items.reduce((s, c) => s + c.total, 0);
    return {
      title, status, colorClass,
      count: items.length,
      totalAmount: formatBRL(total),
      cards: items.map((c) => ({
        id: c.id,
        code: c.code,
        date: new Date(c.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        amount: formatBRL(c.total),
        name: c.cliente.nome,
        tag: c.tag,
        labels: c.labels ?? [],
        saved: saved.some((s) => s.id === c.id),
      })),
    };
  });

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)] items-start mt-6">
      {columns.map((col) => (
        <KanbanColumn key={col.title} {...col} />
      ))}
      <button className="fixed bottom-6 right-6 size-12 bg-primary text-primary-foreground rounded-full grid place-items-center shadow-lg hover:scale-105 transition-transform">
        <MessageSquare className="size-5" />
      </button>
    </div>
  );
}
