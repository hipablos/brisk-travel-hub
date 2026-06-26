import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { PlaceAutocomplete } from "@/components/places/PlaceAutocomplete";

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
    <div className="rounded-xl overflow-visible bg-[#111827] border border-[#1f2a3c]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a2236]">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
          <Car className="size-4" /> Carro / Transfer #{index + 1}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-600 hover:text-red-500 transition-colors p-1 rounded-md"
          aria-label="Remover"
        >
          <Trash2 className="size-[18px]" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold text-slate-200">Tipo</Label>
            <Select value={f.tipo || "Transfer privativo"} onValueChange={(v) => onChange({ tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PlaceAutocomplete
            label="Origem"
            value={f.origem || ""}
            onChange={(v) => onChange({ origem: v })}
            onPlaceSelected={(p) => onChange({ origem: p.nome || p.endereco || f.origem || "" })}
          />
          <PlaceAutocomplete
            label="Destino"
            value={f.destino || ""}
            onChange={(v) => onChange({ destino: v })}
            onPlaceSelected={(p) => onChange({ destino: p.nome || p.endereco || f.destino || "" })}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold text-slate-200">Data de ida</Label>
            <DateInput value={f.data_ida || ""} onChange={(v) => onChange({ data_ida: v })} placeholder="" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold text-slate-200">Hora de ida</Label>
            <Input type="time" value={f.hora_ida || ""} onChange={(e) => onChange({ hora_ida: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold text-slate-200">Data de volta</Label>
            <DateInput value={f.data_volta || ""} onChange={(v) => onChange({ data_volta: v })} placeholder="" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold text-slate-200">Hora de volta</Label>
            <Input type="time" value={f.hora_volta || ""} onChange={(e) => onChange({ hora_volta: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold text-slate-200">Duração total</Label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#0d1620] border border-[#1a2a40] text-sm text-[#60a5fa] min-h-[42px]">
              <Clock className="size-4" />
              <span>{duracao || "—"}</span>
            </div>
            <p className="text-[11px] text-[#4a6080]">Calculada a partir das datas e horários.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold text-slate-200">Passageiros</Label>
            <Input type="number" min={1} value={f.passageiros ?? ""}
              onChange={(e) => onChange({ passageiros: e.target.value ? Number(e.target.value) : null })} />
          </div>
        </div>
      </div>
    </div>
  );
}

