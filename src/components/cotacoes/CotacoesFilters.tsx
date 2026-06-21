import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ClienteAutocomplete } from "./ClienteAutocomplete";
import { useClientes } from "@/lib/cotacoes-store";
import { cn } from "@/lib/utils";

export type CotacoesFiltrosState = {
  clienteId: string | null;
  clienteNomeBusca: string;
  dataInicio: Date | undefined;
  dataFim: Date | undefined;
};

export const filtrosVazios: CotacoesFiltrosState = {
  clienteId: null,
  clienteNomeBusca: "",
  dataInicio: undefined,
  dataFim: undefined,
};

function DateField({
  label, value, onChange,
}: { label: string; value: Date | undefined; onChange: (d: Date | undefined) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5 min-w-0">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="size-4 mr-2" />
            {value ? value.toLocaleDateString("pt-BR") : "Selecionar data"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => { onChange(d); setOpen(false); }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface Props {
  value: CotacoesFiltrosState;
  onChange: (v: CotacoesFiltrosState) => void;
  onPesquisar?: () => void;
}

export function CotacoesFilters({ value, onChange, onPesquisar }: Props) {
  const clientes = useClientes();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 min-w-0">
        <h1 className="text-2xl font-bold text-foreground">Cotações</h1>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/cotacoes/nova">
              <Plus className="size-4" />
              Nova Cotação
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end bg-card p-4 rounded-xl border border-border/50 min-w-0">
        <div className="space-y-1.5 min-w-0">
          <label className="text-sm font-medium text-foreground">Cliente</label>
          <ClienteAutocomplete
            clientes={clientes}
            value={value.clienteNomeBusca}
            onSelect={(c) => onChange({ ...value, clienteId: c.id, clienteNomeBusca: c.nome })}
            placeholder="Buscar cliente por nome..."
          />
        </div>

        <DateField
          label="Data inicial"
          value={value.dataInicio}
          onChange={(d) => onChange({ ...value, dataInicio: d })}
        />
        <DateField
          label="Data final"
          value={value.dataFim}
          onChange={(d) => onChange({ ...value, dataFim: d })}
        />

        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onChange(filtrosVazios)}
          >
            Limpar
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onPesquisar?.()}
          >
            Pesquisar
          </Button>
        </div>
      </div>
    </div>
  );
}
