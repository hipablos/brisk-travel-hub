import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Car, Trash2 } from "lucide-react";

export type TransferDraft = {
  id?: string;
  tipo: string;
  fornecedor: string | null;
  origem: string | null;
  destino: string | null;
  data: string | null;
  hora: string | null;
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
  hora: "",
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
  return (
    <div className="border border-border/60 rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Car className="size-4 text-primary" /> Carro / Transfer #{index + 1}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}
          className="text-muted-foreground hover:text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={f.tipo || "Transfer privativo"} onValueChange={(v) => onChange({ tipo: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Fornecedor / Empresa</Label>
          <Input value={f.fornecedor || ""} placeholder="Ex: Localiza, Uber, hotel..."
            onChange={(e) => onChange({ fornecedor: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Origem</Label>
          <Input value={f.origem || ""} placeholder="Aeroporto, hotel, endereço..."
            onChange={(e) => onChange({ origem: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Destino</Label>
          <Input value={f.destino || ""} placeholder="Hotel, aeroporto, endereço..."
            onChange={(e) => onChange({ destino: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label>Data</Label>
          <Input type="date" value={f.data || ""} onChange={(e) => onChange({ data: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Hora</Label>
          <Input type="time" value={f.hora || ""} onChange={(e) => onChange({ hora: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Passageiros</Label>
          <Input type="number" min={1} value={f.passageiros ?? ""}
            onChange={(e) => onChange({ passageiros: e.target.value ? Number(e.target.value) : null })} />
        </div>
        <div className="space-y-1.5">
          <Label>Bagagens</Label>
          <Input type="number" min={0} value={f.bagagens ?? ""}
            onChange={(e) => onChange({ bagagens: e.target.value ? Number(e.target.value) : null })} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Veículo</Label>
          <Input value={f.veiculo || ""} placeholder="Sedan, Van, SUV..."
            onChange={(e) => onChange({ veiculo: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Motorista</Label>
          <Input value={f.motorista || ""} onChange={(e) => onChange({ motorista: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Telefone do motorista</Label>
          <Input value={f.telefone_motorista || ""}
            onChange={(e) => onChange({ telefone_motorista: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Nº da reserva</Label>
          <Input value={f.numero_reserva || ""} onChange={(e) => onChange({ numero_reserva: e.target.value })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Observações</Label>
        <Textarea rows={2} value={f.observacoes || ""}
          onChange={(e) => onChange({ observacoes: e.target.value })} />
      </div>
    </div>
  );
}
