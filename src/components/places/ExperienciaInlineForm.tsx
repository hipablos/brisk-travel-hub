import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin, Trash2 } from "lucide-react";
import { PlaceAutocomplete, type PlaceResult } from "@/components/places/PlaceAutocomplete";
import { DateInput } from "@/components/ui/date-input";
import { dateOnlyToBR, dateOnlyToNativeISO } from "@/lib/dates";

export type ExperienciaDraft = {
  id?: string;
  nome: string;
  categoria: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  lat: number | null;
  lng: number | null;
  data: string | null;
  hora_inicio: string | null;
  hora_termino: string | null;
  duracao_min: number | null;
  participantes: number | null;
  idioma: string | null;
  idade_minima: number | null;
  descricao: string | null;
};

export const novaExperiencia = (): ExperienciaDraft => ({
  nome: "",
  categoria: "Passeio",
  endereco: "",
  cidade: "",
  estado: "",
  pais: "",
  google_place_id: null,
  google_maps_url: null,
  lat: null,
  lng: null,
  data: "",
  hora_inicio: "",
  hora_termino: "",
  duracao_min: null,
  participantes: 1,
  idioma: "Português",
  idade_minima: null,
  descricao: "",
});

const CATEGORIAS = [
  "Passeio", "City Tour", "Ingresso", "Aventura", "Gastronômico",
  "Cultural", "Show / Evento", "Transfer", "Outro",
];

function minutesBetween(a: string, b: string): number | null {
  if (!a || !b) return null;
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  if ([ah, am, bh, bm].some((n) => Number.isNaN(n))) return null;
  const diff = bh * 60 + bm - (ah * 60 + am);
  return diff > 0 ? diff : null;
}

type Props = {
  value: ExperienciaDraft;
  index: number;
  onChange: (patch: Partial<ExperienciaDraft>) => void;
  onRemove: () => void;
};

export function ExperienciaInlineForm({ value: f, index, onChange, onRemove }: Props) {
  const handlePlace = (p: PlaceResult) => {
    onChange({
      endereco: p.endereco ?? f.endereco,
      cidade: p.cidade ?? f.cidade,
      estado: p.estado ?? f.estado,
      pais: p.pais ?? f.pais,
      google_place_id: p.google_place_id ?? null,
      google_maps_url: p.google_maps_url ?? null,
      lat: p.lat ?? null,
      lng: p.lng ?? null,
    });
  };

  return (
    <div className="border border-border/60 rounded-xl p-6 space-y-6 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="size-4 text-primary" /> Experiência #{index + 1}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}
          className="text-muted-foreground hover:text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Nome do passeio / experiência</Label>
          <Input value={f.nome || ""}
            onChange={(e) => onChange({ nome: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={f.categoria || "Passeio"} onValueChange={(v) => onChange({ categoria: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <PlaceAutocomplete
        label="Endereço / local"
        placeholder=""
        value={f.endereco || ""}
        onChange={(v) => onChange({ endereco: v })}
        onPlaceSelected={handlePlace}
        types={["establishment"]}
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input value={f.cidade || ""} onChange={(e) => onChange({ cidade: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <Input value={f.estado || ""} onChange={(e) => onChange({ estado: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>País</Label>
          <Input value={f.pais || ""} onChange={(e) => onChange({ pais: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label>Data</Label>
          <DateInput
            value={f.data ? (f.data.includes("-") && f.data.length === 10 && f.data[4] === "-"
              ? (() => { const [y,m,d]=f.data!.split("-"); return `${d}-${m}-${y}`; })()
              : f.data)
              : ""}
            onChange={(br) => onChange({ data: dateOnlyToNativeISO(br) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Início</Label>
          <Input type="time" value={f.hora_inicio || ""} onChange={(e) => onChange({ hora_inicio: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Término</Label>
          <Input type="time" value={f.hora_termino || ""} onChange={(e) => onChange({ hora_termino: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Duração (min)</Label>
          <Input type="number" min={0}
            value={f.duracao_min ?? minutesBetween(f.hora_inicio || "", f.hora_termino || "") ?? ""}
            onChange={(e) => onChange({ duracao_min: e.target.value ? Number(e.target.value) : null })} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-[200px]">
        <div className="space-y-2">
          <Label>Participantes</Label>
          <Input type="number" min={1} value={f.participantes ?? ""}
            onChange={(e) => onChange({ participantes: e.target.value ? Number(e.target.value) : null })} />
        </div>
      </div>
    </div>
  );
}
