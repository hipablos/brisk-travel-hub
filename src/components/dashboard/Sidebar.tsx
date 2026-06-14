import { useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, Calendar, Plane, Hotel,
  MapPin, ShoppingCart, ChevronDown, LogOut,
  Users, CreditCard, FileSignature, Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { BriskLogo } from "@/components/BriskLogo";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type Item = { icon: React.ComponentType<{ className?: string }>; label: string; badge?: string; href?: string };
type Group = { title: string; items: Item[] };

const groups: Group[] = [
  {
    title: "Principal",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/" },
      { icon: FileText, label: "Cotações", href: "/cotacoes" },
      { icon: Calendar, label: "Calendário" },
    ],
  },
  {
    title: "Acompanhamento",
    items: [
      { icon: Plane, label: "Voos", href: "/voos" },
      { icon: Hotel, label: "Hospedagens" },
      { icon: MapPin, label: "Experiências Turísticas" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { icon: ShoppingCart, label: "Vendas", href: "/financeiro/vendas" },
    ],
  },
  { title: "Cadastros", items: [
    { icon: Users, label: "Clientes", href: "/clientes" },
    { icon: CreditCard, label: "Formas de Pagamento", href: "/formas-pagamento" },
    { icon: FileSignature, label: "Termos e Condições", href: "/termos-condicoes" },
  ] },

];


function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { signOut } = useAuth();

  // Find which group contains the active route to start with that one open.
  const activeGroupTitle = groups.find((g) =>
    g.items.some((it) => it.href && location.pathname === it.href)
  )?.title ?? "Principal";

  // Multi-open accordion: each group toggles independently.
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set([activeGroupTitle]));
  const toggleGroup = (title: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });

  return (
    <>
      <div className="px-6 py-6 border-b border-sidebar-border flex items-center justify-between">
        <BriskLogo variant="white" className="h-10 w-auto" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {groups.map((group) => {
          const isOpen = openGroups.has(group.title);
          return (
            <div key={group.title}>
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-3 py-1.5 mb-1 hover:bg-sidebar-accent/50 rounded-md transition-colors"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </span>
                <ChevronDown className={cn("size-3 text-muted-foreground transition-transform duration-300", isOpen ? "rotate-0" : "-rotate-90")} />
              </button>
              <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0")}>
                <ul className="space-y-0.5">
                  {group.items.map((it) => {
                    const isActive = it.href ? location.pathname === it.href : false;
                    const cls = cn(
                      "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                      isActive
                        ? "bg-secondary/15 text-secondary font-medium border-l-2 border-secondary"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    );
                    const inner = (
                      <>
                        <it.icon className="size-4 shrink-0" />
                        <span className="flex-1 truncate">{it.label}</span>
                        {it.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                            {it.badge}
                          </span>
                        )}
                      </>
                    );
                    return (
                      <li key={it.label}>
                        {it.href ? (
                          <Link to={it.href} onClick={onNavigate} className={cls}>{inner}</Link>
                        ) : (
                          <a href="#" onClick={(e) => e.preventDefault()} className={cls}>{inner}</a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="size-4" />
          <span>Sair</span>
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      <SidebarBody />
    </aside>
  );
}

export function MobileSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border flex flex-col">
        <SidebarBody onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
