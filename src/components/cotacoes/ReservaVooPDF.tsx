import { FileText } from "lucide-react";
import type { Cotacao } from "@/lib/cotacoes-store";

interface Props {
  cotacao: Cotacao;
  className?: string;
}

export function ReservaVooButton({ cotacao, className }: Props) {
  const handleOpen = () => {
    const id = (cotacao as any).id ?? cotacao.code;
    window.open(`/reserva_/${id}`, "_blank");
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
