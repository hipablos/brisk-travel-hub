import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, Menu, ChevronDown, User as UserIcon, LogOut } from "lucide-react";
import { MobileSidebar } from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

export function Topbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const initial = "B";
  const displayName = "BRISK VIAGENS";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    navigate({ to: "/login", replace: true });
  };

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
            Painel
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 pl-3 border-l border-border outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                aria-label="Menu do usuário"
              >
                <div className="size-9 rounded-full bg-gradient-to-br from-secondary to-secondary/60 grid place-items-center font-bold text-primary">
                  {initial}
                </div>
                <div className="hidden sm:flex items-center gap-1">
                  <span className="text-sm font-semibold text-foreground uppercase truncate max-w-[140px]">
                    {displayName}
                  </span>
                  <ChevronDown className="size-3 text-foreground/60" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/perfil" })}>
                <UserIcon className="size-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="size-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <MobileSidebar open={open} onOpenChange={setOpen} />
    </>
  );
}
