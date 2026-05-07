import { cn } from "@/lib/utils";
import { Hash, Tag, Eye, CheckSquare, MoreVertical, MessageSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCotacoes, formatBRL, type CotacaoStatus, type Cotacao } from "@/lib/cotacoes-store";

type QuoteCard = {
  id: string;
  code: string;
  date: string;
  amount: string;
  name: string;
  tag?: string;
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
  const inner = (
    <div className="bg-card border border-border/50 rounded-lg p-3 hover:border-primary/50 transition-colors flex flex-col gap-3 cursor-pointer">
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
          <span className="p-1"><Tag className="size-3.5" /></span>
          <span className="p-1"><Eye className="size-3.5" /></span>
          <span className="p-1"><CheckSquare className="size-3.5" /></span>
          <span className="p-1"><MoreVertical className="size-3.5" /></span>
        </div>
      </div>
    </div>
  );
  return card.saved ? <Link to="/cotacoes/$id" params={{ id: card.id }}>{inner}</Link> : inner;
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

  const mock: Cotacao[] = [
    { id: "m1", code: "fusxk", createdAt: "2026-05-05", status: "aguardando", cliente: { id: "c1", nome: "Karla" }, tag: "Ficar Olhando", adultos: 2, criancas: 0, servicos: [], total: 1444.20 },
    { id: "m2", code: "9h42d", createdAt: "2026-04-23", status: "aguardando_cliente", cliente: { id: "c2", nome: "Junior Almeida" }, adultos: 2, criancas: 0, servicos: [], total: 11382 },
    { id: "m3", code: "1uipw", createdAt: "2026-04-17", status: "aguardando_cliente", cliente: { id: "c3", nome: "Wilson" }, adultos: 2, criancas: 0, servicos: [], total: 4119 },
    { id: "m4", code: "i802b", createdAt: "2026-04-25", status: "aprovado", cliente: { id: "c4", nome: "Elizes" }, adultos: 2, criancas: 0, servicos: [], total: 2143.86 },
    { id: "m5", code: "62gt8", createdAt: "2026-04-15", status: "aprovado", cliente: { id: "c5", nome: "Leticia Pacheco" }, adultos: 2, criancas: 0, servicos: [], total: 1354.57 },
    { id: "m6", code: "gh976", createdAt: "2026-04-27", status: "reprovado", cliente: { id: "c6", nome: "Venicios" }, adultos: 2, criancas: 0, servicos: [], total: 14103.60 },
    { id: "m7", code: "9yom7", createdAt: "2026-04-26", status: "reprovado", cliente: { id: "c7", nome: "Priscila Malveira" }, adultos: 2, criancas: 0, servicos: [], total: 2994.10 },
  ];

  const all = [...saved, ...mock];

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
