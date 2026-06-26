import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Car, Trash2, Clock } from "lucide-react";
import { calcDuracaoVooComData } from "@/lib/voos";

export type TransferDraft = {
  id?: string;
  tipo: string;
  fornecedor: string | null;
  origem: string | null;
  destino: string | null;
  data: string | null;
  data_ida: string | null;
  data_volta: string | null;
  hora: string | null;
  hora_ida: string | null;
  hora_volta: string | null;
  passageiros: number | null;
  bagagens: number | null;
  veiculo: string | null;
  motorista: string | null;
  telefone_motorista: string | null;
  numero_reserva: string | null;
  observacoes: string | null;
};

export const novoTransfer = (): TransferDraft => ({
  tipo: "Transfer privativo",
  fornecedor: "",
  origem: "",
  destino: "",
  data: "",
  data_ida: "",
  data_volta: "",
  hora: "",
  hora_ida: "",
  hora_volta: "",
  passageiros: 1,
  bagagens: 1,
  veiculo: "",
  motorista: "",
  telefone_motorista: "",
  numero_reserva: "",
  observacoes: "",
});

const TIPOS = [
  "Transfer privativo",
  "Transfer compartilhado",
  "Aluguel de carro",
  "Táxi / App",
  "Ônibus / Van",
  "Outro",
];

type Props = {
  value: TransferDraft;
  index: number;
  onChange: (patch: Partial<TransferDraft>) => void;
  onRemove: () => void;
};

export function TransferInlineForm({ value: f, index, onChange, onRemove }: Props) {
  const duracao = useMemo(
    () => calcDuracaoVooComData(f.data_ida, f.hora_ida, f.data_volta ?? f.data_ida, f.hora_volta),
    [f.data_ida, f.data_volta, f.hora_ida, f.hora_volta],
  );

  return (
    <div className="border border-border/60 rounded-xl p-6 space-y-6 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Car className="size-4 text-primary" /> Carro / Transfer #{index + 1}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}
          className="text-muted-foreground hover:text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={f.tipo || "Transfer privativo"} onValueChange={(v) => onChange({ tipo: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Origem</Label>
          <Input value={f.origem || ""} placeholder="Aeroporto, hotel, endereço..."
            onChange={(e) => onChange({ origem: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Destino</Label>
          <Input value={f.destino || ""} placeholder="Hotel, aeroporto, endereço..."
            onChange={(e) => onChange({ destino: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label>Data de ida</Label>
          <DateInput
            value={f.data_ida || ""}
            onChange={(v) => onChange({ data_ida: v })}
            placeholder="dd/mm/aaaa"
          />
        </div>
        <div className="space-y-2">
          <Label>Hora de ida</Label>
          <Input type="time" value={f.hora_ida || ""} onChange={(e) => onChange({ hora_ida: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Data de volta</Label>
          <DateInput
            value={f.data_volta || ""}
            onChange={(v) => onChange({ data_volta: v })}
            placeholder="dd/mm/aaaa"
          />
        </div>
        <div className="space-y-2">
          <Label>Hora de volta</Label>
          <Input type="time" value={f.hora_volta || ""} onChange={(e) => onChange({ hora_volta: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label>Duração total</Label>
          <div className="relative">
            <Input
              value={duracao}
              readOnly
              tabIndex={-1}
              placeholder="—"
              className="pl-9 bg-muted text-muted-foreground cursor-not-allowed"
            />
            <Clock className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
          </div>
          <p className="text-[11px] text-muted-foreground">Calculada a partir das datas e horários.</p>
        </div>
        <div className="space-y-2">
          <Label>Passageiros</Label>
          <Input type="number" min={1} value={f.passageiros ?? ""}
            onChange={(e) => onChange({ passageiros: e.target.value ? Number(e.target.value) : null })} />
        </div>
      </div>

    </div>
  );
}
