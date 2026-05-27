import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Moon, Sun, Menu } from "lucide-react";
import { MobileSidebar } from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

export function Topbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const initial = (user?.user_metadata?.full_name || user?.email || "U").charAt(0).toUpperCase();
  const displayName = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "USUÁRIO";

  return (
    <>
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20 flex items-center px-4 sm:px-6 gap-4 sm:gap-6">
        <button
          className="lg:hidden size-9 grid place-items-center rounded-md hover:bg-accent/10 text-foreground/70"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>
        <nav className="hidden md:flex items-center gap-1 flex-1">
          <Link
            to="/"
            className="px-3 py-2 text-sm rounded-md text-foreground/70 hover:text-foreground hover:bg-accent/10"
            activeOptions={{ exact: true }}
            activeProps={{ className: "px-3 py-2 text-sm rounded-md text-secondary font-semibold" }}
          >
            Home
          </Link>
        </nav>
        <div className="flex-1 md:flex-none" />
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggle}
            className="size-9 grid place-items-center rounded-full hover:bg-accent/10 text-foreground/70"
            aria-label="Alternar tema"
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            className="relative size-9 grid place-items-center rounded-full hover:bg-accent/10 text-foreground/70"
            aria-label="Notificações"
          >
            <Bell className="size-4" />
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <div className="size-9 rounded-full bg-gradient-to-br from-secondary to-secondary/60 grid place-items-center font-bold text-primary">
              {initial}
            </div>
            <div className="hidden sm:block text-sm font-semibold text-foreground uppercase truncate max-w-[140px]">{displayName}</div>
          </div>
        </div>
      </header>
      <MobileSidebar open={open} onOpenChange={setOpen} />
    </>
  );
}
