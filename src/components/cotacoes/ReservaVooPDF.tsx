import { Link } from "@tanstack/react-router";
import { Plane } from "lucide-react";
import type { Cotacao } from "@/lib/cotacoes-store";

export function ReservaVooButton({ cotacao }: { cotacao: Cotacao }) {
  const hasVoo = Array.isArray((cotacao as any)?.voos) && (cotacao as any).voos.length > 0;
  if (!hasVoo) return null;
  return (
    <Link
      to="/reserva/$id"
      params={{ id: cotacao.id }}
      className="p-1 hover:text-foreground"
      title="Reserva de voo (PDF)"
    >
      <Plane className="size-3.5" />
    </Link>
  );
}
