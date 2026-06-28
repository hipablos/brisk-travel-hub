import { FileText } from "lucide-react";
import type { Cotacao } from "@/lib/cotacoes-store";

interface Props {
  cotacao: Cotacao;
  className?: string;
}

/**
 * Abre a reserva de voo na rota /reserva_/$id (padrão visual único).
 * O PDF é gerado via window.print() dentro dessa rota.
 */
export function ReservaVooButton({ cotacao, className }: Props) {
  const handleOpen = () => {
    const id = (cotacao as any).id ?? cotacao.code;
    window.open(`/reserva/${id}`, "_blank");
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={className ?? "p-1 hover:text-foreground"}
      title="Gerar Reserva de Voo"
    >
      <FileText className="size-3.5" />
    </button>
  );
}
