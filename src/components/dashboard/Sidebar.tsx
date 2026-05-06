import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, Calendar, CheckSquare, Plane, Hotel, Car,
  MapPin, Ship, Shield, ShoppingCart, Wallet, ArrowDownCircle, ArrowUpCircle,
  ArrowLeftRight, GitMerge, BarChart3, TrendingUp, Coins, FolderClosed,
  FileBarChart, Users, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { icon: React.ComponentType<{ className?: string }>; label: string; badge?: string; active?: boolean; href?: string };
type Group = { title: string; items: Item[] };

const groups: Group[] = [
  {
    title: "Principal",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/" },
      { icon: FileText, label: "Cotações", badge: "3", href: "/cotacoes" },
      { icon: Calendar, label: "Calendário" },
      { icon: CheckSquare, label: "Tarefas" },
    ],
  },
  {
    title: "Acompanhamento",
    items: [
      { icon: Plane, label: "Voos" },
      { icon: Hotel, label: "Hospedagens" },
      { icon: Car, label: "Transportes" },
      { icon: MapPin, label: "Experiências Turísticas" },
      { icon: Ship, label: "Cruzeiros" },
      { icon: Shield, label: "Seguros" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { icon: ShoppingCart, label: "Vendas" },
      { icon: Wallet, label: "Fluxo de Caixa" },
      { icon: ArrowDownCircle, label: "Receitas" },
      { icon: ArrowUpCircle, label: "Despesas" },
      { icon: ArrowLeftRight, label: "Transferência" },
      { icon: GitMerge, label: "Conciliação" },
      { icon: BarChart3, label: "Resumo Mensal" },
      { icon: TrendingUp, label: "Receita/Despesa" },
      { icon: Coins, label: "Milhas" },
    ],
  },
  { title: "Documentos", items: [{ icon: FolderClosed, label: "Arquivos" }] },
  { title: "Relatórios", items: [{ icon: FileBarChart, label: "Geral" }] },
  { title: "Cadastros", items: [{ icon: Users, label: "Clientes" }] },
];

function SidebarGroup({ group }: { group: Group }) {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  return (
    <div>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 mb-1 cursor-pointer hover:bg-sidebar-accent/50 rounded-md transition-colors group/trigger"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover/trigger:text-sidebar-foreground transition-colors">
          {group.title}
        </span>
        <ChevronDown 
          className={cn(
            "size-3 text-muted-foreground transition-transform duration-300 ease-in-out group-hover/trigger:text-sidebar-foreground", 
            isOpen ? "rotate-0" : "-rotate-90"
          )} 
        />
      </button>
      <div 
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out", 
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 mb-0"
        )}
      >
        <ul className="space-y-0.5">
          {group.items.map((it) => {
            const isActive = it.href ? location.pathname === it.href : Boolean(it.active);

            return (
              <li key={it.label}>
                <a
                  href={it.href || "#"}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                    isActive
                      ? "bg-secondary/15 text-secondary font-medium border-l-2 border-secondary"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <it.icon className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                      {it.badge}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0 overflow-y-auto">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-lg bg-gradient-to-br from-secondary to-secondary/70 grid place-items-center">
            <Plane className="size-5 text-primary" />
          </div>
          <div>
            <div className="font-bold text-sidebar-foreground tracking-tight">Brisk</div>
            <div className="text-[10px] text-muted-foreground -mt-0.5 tracking-widest">VIAGENS</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5">
        {groups.map((g) => (
          <SidebarGroup key={g.title} group={g} />
        ))}
      </nav>
    </aside>
  );
}
