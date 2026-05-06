import { Bell, Moon, ExternalLink } from "lucide-react";

const links = ["Home", "Sistema", "Funcionalidades", "Planos", "Suporte", "Contato"];

export function Topbar() {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20 flex items-center px-6 gap-6">
      <nav className="hidden md:flex items-center gap-1 flex-1">
        {links.map((l, i) => (
          <a
            key={l}
            href="#"
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              i === 0 ? "text-secondary font-semibold" : "text-foreground/70 hover:text-foreground hover:bg-accent/10"
            }`}
          >
            {l}
          </a>
        ))}
        <a
          href="#"
          className="ml-2 px-3 py-2 text-sm rounded-md text-foreground/70 hover:text-foreground hover:bg-accent/10 inline-flex items-center gap-1"
        >
          Brisk Milhas <ExternalLink className="size-3" />
        </a>
      </nav>

      <div className="flex items-center gap-3">
        <button className="size-9 grid place-items-center rounded-full hover:bg-accent/10 text-foreground/70">
          <Moon className="size-4" />
        </button>
        <button className="relative size-9 grid place-items-center rounded-full hover:bg-accent/10 text-foreground/70">
          <Bell className="size-4" />
          <span className="absolute top-1 right-1 size-4 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground grid place-items-center">
            4
          </span>
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="size-9 rounded-full bg-gradient-to-br from-secondary to-secondary/60 grid place-items-center font-bold text-primary">
            P
          </div>
          <div className="hidden sm:block text-sm font-semibold text-foreground">PABLO</div>
        </div>
      </div>
    </header>
  );
}
