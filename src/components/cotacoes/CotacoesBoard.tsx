import { cn } from "@/lib/utils";
import { Hash, Tag, Eye, CheckSquare, MoreVertical, MessageSquare } from "lucide-react";

type QuoteCard = {
  id: string;
  code: string;
  date: string;
  amount: string;
  name: string;
  tag?: string;
  avatarUrl?: string;
  isWhatsApp?: boolean;
};

type ColumnProps = {
  title: string;
  count: number;
  totalAmount: string;
  colorClass: string;
  cards: QuoteCard[];
};

function KanbanCard({ card }: { card: QuoteCard }) {
  return (
    <div className="bg-card border border-border/50 rounded-lg p-3 hover:border-primary/50 transition-colors flex flex-col gap-3">
      {/* Top row: id, date, amount */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono bg-secondary/20 px-1.5 py-0.5 rounded">
            {card.code}
          </span>
          <span className="text-muted-foreground">{card.date}</span>
          <div className="size-5 rounded-full bg-secondary shrink-0 overflow-hidden">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${card.code}`} alt="avatar" className="w-full h-full object-cover" />
          </div>
        </div>
        <span className="font-bold text-foreground">{card.amount}</span>
      </div>

      {/* Middle row: Name and tags */}
      <div>
        <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground uppercase tracking-wider">
          {card.name}
          {card.isWhatsApp && (
            <span className="size-2 rounded-full bg-green-500" title="WhatsApp" />
          )}
        </div>
        {card.tag && (
          <div className="mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-secondary text-secondary-foreground uppercase">
            {card.tag}
          </div>
        )}
      </div>

      {/* Bottom row: Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-muted-foreground">
        <button className="hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary/20">
          <Hash className="size-3.5" />
        </button>
        <div className="flex items-center gap-1">
          <button className="hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary/20">
            <Tag className="size-3.5" />
          </button>
          <button className="hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary/20">
            <Eye className="size-3.5" />
          </button>
          <button className="hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary/20">
            <CheckSquare className="size-3.5" />
          </button>
          <button className="hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary/20">
            <MoreVertical className="size-3.5" />
          </button>
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
  const columns: ColumnProps[] = [
    {
      title: "Aguardando",
      count: 1,
      totalAmount: "1.444,20",
      colorClass: "bg-muted text-muted-foreground",
      cards: [
        { id: "1", code: "fusxk", date: "05/05", amount: "1.444,20", name: "Karla", tag: "Ficar Olhando" },
      ],
    },
    {
      title: "Aguardando Cliente",
      count: 2,
      totalAmount: "15.501,00",
      colorClass: "bg-primary text-primary-foreground",
      cards: [
        { id: "2", code: "9h42d", date: "23/04", amount: "11.382,00", name: "Junior Almeida" },
        { id: "3", code: "1uipw", date: "17/04", amount: "4.119,00", name: "Wilson" },
      ],
    },
    {
      title: "Aprovado",
      count: 13,
      totalAmount: "36.437,55",
      colorClass: "bg-emerald-600 text-white",
      cards: [
        { id: "4", code: "i802b", date: "25/04", amount: "2.143,86", name: "Elizes" },
        { id: "5", code: "62gt8", date: "15/04", amount: "1.354,57", name: "Leticia Pacheco" },
        { id: "6", code: "rjai0", date: "13/04", amount: "1.773,00", name: "Rafael Echeverria Santos", tag: "Ficar Olhando", isWhatsApp: true },
        { id: "7", code: "vurn1", date: "13/04", amount: "1.256,05", name: "Ana" },
        { id: "8", code: "tn2f7", date: "10/04", amount: "2.598,00", name: "Wilson" },
      ],
    },
    {
      title: "Reprovado",
      count: 20,
      totalAmount: "80.461,16",
      colorClass: "bg-destructive text-destructive-foreground",
      cards: [
        { id: "9", code: "gh976", date: "27/04", amount: "14.103,60", name: "Venicios" },
        { id: "10", code: "9yom7", date: "26/04", amount: "2.994,10", name: "Priscila Malveira" },
        { id: "11", code: "1dwo6", date: "24/04", amount: "7.057,80", name: "Sabrina Almeida", tag: "18 a 30 Julho" },
        { id: "12", code: "d3vpt", date: "24/04", amount: "5.904,00", name: "Sabrina Almeida", tag: "20 a 30 de Julho" },
        { id: "13", code: "qfhip", date: "24/04", amount: "2.673,90", name: "Laylla" },
      ],
    },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)] items-start mt-6">
      {columns.map((col) => (
        <KanbanColumn key={col.title} {...col} />
      ))}
      {/* Add a floating chat button as seen in the bottom right of the image */}
      <button className="fixed bottom-6 right-6 size-12 bg-primary text-primary-foreground rounded-full grid place-items-center shadow-lg hover:scale-105 transition-transform">
        <MessageSquare className="size-5" />
      </button>
    </div>
  );
}
