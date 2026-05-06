import { ChevronRight } from "lucide-react";

export function PromoBanner() {
  return (
    <div className="rounded-xl p-5 bg-[var(--gradient-brand)] border border-secondary/30 shadow-[var(--shadow-glow)] flex items-center gap-4">
      <div className="flex-1">
        <h2 className="text-base font-bold text-foreground">Aproveite melhor a plataforma</h2>
        <p className="text-sm text-foreground/80 mt-1">
          Mude para um plano que acompanhe suas necessidades, podendo cadastrar usuários para sua equipe!{" "}
          <span className="text-secondary font-semibold cursor-pointer hover:underline">Saiba mais clicando aqui.</span>
        </p>
      </div>
      <button className="size-9 rounded-full bg-secondary text-secondary-foreground grid place-items-center hover:scale-105 transition-transform">
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
