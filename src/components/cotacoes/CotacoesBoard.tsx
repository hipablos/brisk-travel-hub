import { cn } from "@/lib/utils";
import { Eye, Pencil, MessageSquare, GripVertical, Trash2, Copy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState, useMemo, memo } from "react";
import { useCotacoes, useAllLabels, formatBRL, setCotacaoStatus, deleteCotacao, duplicateCotacao, type CotacaoStatus } from "@/lib/cotacoes-store";

import { LabelsPopover } from "./LabelsPopover";
import { ReservaVooButton } from "./ReservaVooPDF";
import { toast } from "sonner";

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
  cotacao?: any;
};

type ColumnProps = {
  title: string;
  status: CotacaoStatus;
  count: number;
  totalAmount: string;
  colorClass: string;
  cards: QuoteCard[];
  onDropCard: (id: string, status: CotacaoStatus) => void;
  onDragCard: (id: string) => void;
  draggingId: string | null;
};

const KanbanCard = memo(function KanbanCard({
  card,
  status,
  onDragCard,
  colorOf,
}: {
  card: QuoteCard;
  status: CotacaoStatus;
  onDragCard: (id: string) => void;
  colorOf: (name: string) => string;
}) {


  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", card.id);
        e.dataTransfer.effectAllowed = "move";
        onDragCard(card.id);
      }}
      className="group bg-card border border-border/50 rounded-lg p-3 hover:border-primary/50 transition-colors flex flex-col gap-3 cursor-grab active:cursor-grabbing"
      data-status={status}
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <GripVertical className="size-3.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-muted-foreground">{card.date}</span>
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
      </div>

      <div className="flex items-center justify-end pt-2 border-t border-border/40 text-muted-foreground">
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
              {card.cotacao && <ReservaVooButton cotacao={card.cotacao} />}
              <button
                type="button"
                onClick={async () => {
                  const res = await duplicateCotacao(card.id);
                  if (res) toast.success(`Cotação duplicada (${res.code})`);
                  else toast.error("Não foi possível duplicar a cotação");
                }}
                className="p-1 hover:text-foreground"
                title="Duplicar cotação"
              >
                <Copy className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`Excluir a cotação ${card.code}? Esta ação não pode ser desfeita.`)) return;
                  await deleteCotacao(card.id);
                  toast.success("Cotação excluída");
                }}
                className="p-1 hover:text-destructive"
                title="Excluir cotação"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          ) : (
            <>
              <span className="p-1 opacity-40" title="Disponível ao salvar"><Eye className="size-3.5" /></span>
              <span className="p-1 opacity-40" title="Disponível ao salvar"><Pencil className="size-3.5" /></span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

function KanbanColumn({ title, status, count, totalAmount, colorClass, cards, onDropCard, onDragCard, draggingId, colorOf }: ColumnProps & { colorOf: (name: string) => string }) {
  const [over, setOver] = useState(false);
  return (
    <div className="flex flex-col w-full min-w-0 max-w-full">
      <div className={cn("flex items-center justify-between gap-2 px-2.5 py-2 rounded-t-lg font-bold text-[11px] uppercase tracking-wider", colorClass)}>
        <span className="truncate">{title} ({count})</span>
        <span className="shrink-0">{totalAmount}</span>
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (!over) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const id = e.dataTransfer.getData("text/plain");
          if (id) onDropCard(id, status);
        }}
        className={cn(
          "bg-card/30 border border-border/50 border-t-0 p-2 flex flex-col gap-2 transition-colors min-h-24",
          over && "bg-primary/5 border-primary/40 ring-2 ring-primary/30 ring-inset",
          draggingId && !over && "border-dashed"
        )}
      >
        {cards.map((c) => (
          <KanbanCard key={c.id} card={c} status={status} onDragCard={onDragCard} colorOf={colorOf} />
        ))}

        {cards.length === 0 && (
          <div className="text-[11px] text-muted-foreground/70 text-center py-6 select-none">
            Arraste uma cotação para cá
          </div>
        )}
      </div>
    </div>
  );
}

type BoardFiltros = {
  clienteId: string | null;
  clienteNomeBusca: string;
  dataInicio: Date | undefined;
  dataFim: Date | undefined;
};

export function CotacoesBoard({ filtros }: { filtros?: BoardFiltros }) {
  const saved = useCotacoes();
  const allLabels = useAllLabels();
  const colorOf = useMemo(() => {
    const map = new Map(allLabels.map((l) => [l.name, l.color]));
    return (name: string) => map.get(name) ?? "#64748b";
  }, [allLabels]);

  const all = useMemo(() => saved.filter((c) => {
    if (!filtros) return true;
    if (filtros.clienteId && c.cliente?.id !== filtros.clienteId) return false;
    if (!filtros.clienteId && filtros.clienteNomeBusca.trim()) {
      const q = filtros.clienteNomeBusca.trim().toLowerCase();
      if (!c.cliente?.nome?.toLowerCase().includes(q)) return false;
    }
    if (filtros.dataInicio || filtros.dataFim) {
      const d = new Date(c.createdAt);
      if (filtros.dataInicio && d < filtros.dataInicio) return false;
      if (filtros.dataFim) {
        const end = new Date(filtros.dataFim);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
    }
    return true;
  }), [saved, filtros]);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const statuses: { status: CotacaoStatus; title: string; colorClass: string }[] = [
    { status: "aguardando", title: "Aguardando", colorClass: "bg-muted text-muted-foreground" },
    { status: "aguardando_cliente", title: "Aguardando Cliente", colorClass: "bg-primary text-primary-foreground" },
    { status: "aprovado", title: "Aprovado", colorClass: "bg-emerald-600 text-white" },
    { status: "reprovado", title: "Reprovado", colorClass: "bg-destructive text-destructive-foreground" },
  ];

  const handleDrop = (id: string, status: CotacaoStatus) => {
    const cot = all.find((c) => c.id === id);
    setDraggingId(null);
    if (!cot || cot.status === status) return;
    setCotacaoStatus(id, status);
    const label = statuses.find((s) => s.status === status)?.title ?? status;
    toast.success(`Cotação movida para ${label}`);
  };

  const columns = statuses.map(({ status, title, colorClass }) => {
    const items = all.filter((c) => c.status === status);
    const total = items.reduce((s, c) => s + c.total, 0);
    return {
      title, status, colorClass,
      count: items.length,
      totalAmount: formatBRL(total),
      onDropCard: handleDrop,
      onDragCard: setDraggingId,
      draggingId,
      cards: items.map((c) => ({
        id: c.id,
        code: c.code,
        date: new Date(c.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
        amount: formatBRL(c.total),
        name: c.cliente.nome,
        tag: c.tag,
        labels: c.labels ?? [],
        saved: saved.some((s) => s.id === c.id),
        cotacao: c,
      })),
    };
  });

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 pb-6 mt-6 w-full min-w-0 items-start"
      onDragEnd={() => setDraggingId(null)}
    >
      {columns.map((col) => (
        <KanbanColumn key={col.title} {...col} colorOf={colorOf} />
      ))}

      <button className="fixed bottom-6 right-6 size-12 bg-primary text-primary-foreground rounded-full grid place-items-center shadow-lg hover:scale-105 transition-transform">
        <MessageSquare className="size-5" />
      </button>
    </div>
  );
}
