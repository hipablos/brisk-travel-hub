import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Hotel, Trash2, ExternalLink } from "lucide-react";
import { HotelAutocomplete, type PlaceResult } from "@/components/hospedagens/HotelAutocomplete";
import { DateInput } from "@/components/ui/date-input";
import { dateOnlyToNativeISO } from "@/lib/dates";

// checkin/checkout são armazenados como ISO "YYYY-MM-DDTHH:mm".
// O DateInput trabalha com DD-MM-AAAA, então convertemos nas pontas.
function splitDateTime(iso: string | null | undefined): { dateBR: string; time: string } {
  if (!iso) return { dateBR: "", time: "" };
  const [d, t] = iso.split("T");
  if (!d) return { dateBR: "", time: "" };
  const [y, m, day] = d.split("-");
  const dateBR = y && m && day ? `${day}-${m}-${y}` : "";
  return { dateBR, time: (t || "").slice(0, 5) };
}
function joinDateTime(dateBR: string, time: string): string {
  const iso = dateOnlyToNativeISO(dateBR);
  if (!iso) return "";
  return `${iso}T${time || "00:00"}`;
}

export type HospedagemDraft = {
  id?: string;
  nome_hotel: string;
  estrelas: number | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  lat: number | null;
  lng: number | null;
  fotos: string[] | null;
  checkin: string | null;
  checkout: string | null;
  noites: number | null;
  hospedes: number | null;
  quartos: number | null;
  tipo_acomodacao: string | null;
  regime_alimentar: string | null;
  numero_reserva: string | null;
  codigo_confirmacao: string | null;
  observacoes_cliente: string | null;
};

export const novaHospedagem = (): HospedagemDraft => ({
  nome_hotel: "",
  estrelas: null,
  endereco: "",
  cidade: "",
  estado: "",
  pais: "",
  google_place_id: null,
  google_maps_url: null,
  lat: null,
  lng: null,
  fotos: [],
  checkin: "",
  checkout: "",
  noites: null,
  hospedes: 1,
  quartos: 1,
  tipo_acomodacao: "",
  regime_alimentar: "sem_alimentacao",
  numero_reserva: "",
  codigo_confirmacao: "",
  observacoes_cliente: "",
});

const REGIMES = [
  { value: "sem_alimentacao", label: "Sem alimentação" },
  { value: "cafe_da_manha", label: "Café da manhã" },
  { value: "meia_pensao", label: "Meia pensão" },
  { value: "pensao_completa", label: "Pensão completa" },
  { value: "all_inclusive", label: "All Inclusive" },
];

type Props = {
  value: HospedagemDraft;
  index: number;
  onChange: (patch: Partial<HospedagemDraft>) => void;
  onRemove: () => void;
};

export function HospedagemInlineForm({ value: f, index, onChange, onRemove }: Props) {
  const computedNoites = useMemo(() => {
    if (f.checkin && f.checkout) {
      const a = new Date(f.checkin);
      const b = new Date(f.checkout);
      const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
      return diff > 0 ? diff : null;
    }
    return f.noites ?? null;
  }, [f.checkin, f.checkout, f.noites]);

  const handlePlace = (p: PlaceResult) => {
    onChange({
      nome_hotel: p.nome ?? f.nome_hotel,
      endereco: p.endereco ?? f.endereco,
      cidade: p.cidade ?? f.cidade,
      estado: p.estado ?? f.estado,
      pais: p.pais ?? f.pais,
      google_place_id: p.google_place_id ?? null,
      google_maps_url: p.google_maps_url ?? null,
      lat: p.lat ?? null,
      lng: p.lng ?? null,
      fotos: p.fotos && p.fotos.length > 0 ? p.fotos : f.fotos,
    });
  };

  return (
    <div className="border border-border/60 rounded-xl p-6 space-y-6 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Hotel className="size-4 text-primary" /> Hospedagem #{index + 1}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}
          className="text-muted-foreground hover:text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </div>

      <HotelAutocomplete
        value={f.nome_hotel || ""}
        onChange={(v) => onChange({ nome_hotel: v })}
        onPlaceSelected={handlePlace}
      />

      {f.fotos && f.fotos.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Fotos do Google ({f.fotos.length}) — usadas no orçamento em PDF
          </Label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {f.fotos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${f.nome_hotel || "Hotel"} foto ${i + 1}`}
                className="h-16 w-24 object-cover rounded-md border border-border/60 shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Classificação (estrelas)</Label>
          <Select
            value={f.estrelas?.toString() ?? ""}
            onValueChange={(v) => onChange({ estrelas: v ? Number(v) : null })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={n.toString()}>{"★".repeat(n)} ({n})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Regime alimentar</Label>
          <Select
            value={f.regime_alimentar || "sem_alimentacao"}
            onValueChange={(v) => onChange({ regime_alimentar: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {REGIMES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>


      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Check-in</Label>
          <Input type="datetime-local" value={f.checkin || ""} onChange={(e) => onChange({ checkin: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Check-out</Label>
          <Input type="datetime-local" value={f.checkout || ""} onChange={(e) => onChange({ checkout: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label>Noites</Label>
          <Input type="number" min={0}
            value={computedNoites ?? ""}
            readOnly={!!(f.checkin && f.checkout)}
            onChange={(e) => onChange({ noites: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
        <div className="space-y-2">
          <Label>Hóspedes</Label>
          <Input type="number" min={1} value={f.hospedes ?? ""}
            onChange={(e) => onChange({ hospedes: e.target.value ? Number(e.target.value) : null })} />
        </div>
        <div className="space-y-2">
          <Label>Quartos</Label>
          <Input type="number" min={1} value={f.quartos ?? ""}
            onChange={(e) => onChange({ quartos: e.target.value ? Number(e.target.value) : null })} />
        </div>
        <div className="space-y-2">
          <Label>Tipo acomodação</Label>
          <Input value={f.tipo_acomodacao || ""}
            onChange={(e) => onChange({ tipo_acomodacao: e.target.value })} />
        </div>
      </div>


      {f.google_maps_url && (
        <a href={f.google_maps_url} target="_blank" rel="noreferrer"
          className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
          <ExternalLink className="size-3" /> Ver no Google Maps
        </a>
      )}
    </div>
  );
}
