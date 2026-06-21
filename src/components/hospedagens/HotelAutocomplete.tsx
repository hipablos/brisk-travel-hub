import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

export type PlaceResult = {
  nome?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  google_place_id?: string;
  google_maps_url?: string;
  lat?: number;
  lng?: number;
  fotos?: string[];
};

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as
  | string
  | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as
  | string
  | undefined;

let mapsLoaderPromise: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (!BROWSER_KEY) return Promise.reject(new Error("no-key"));
  // @ts-ignore
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  if (mapsLoaderPromise) return mapsLoaderPromise;
  mapsLoaderPromise = new Promise((resolve, reject) => {
    // @ts-ignore
    (window as any).__briskMapsInit = () => resolve();
    const s = document.createElement("script");
    const channel = TRACKING_ID ? `&channel=${TRACKING_ID}` : "";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&libraries=places&callback=__briskMapsInit${channel}`;
    s.async = true;
    s.onerror = () => reject(new Error("maps-load-error"));
    document.head.appendChild(s);
  });
  return mapsLoaderPromise;
}

function extractAddressComponents(components: any[] = []) {
  const out: { cidade?: string; estado?: string; pais?: string } = {};
  for (const c of components) {
    const types: string[] = c.types || [];
    if (types.includes("locality") || types.includes("postal_town")) out.cidade = c.long_name;
    else if (!out.cidade && types.includes("administrative_area_level_2")) out.cidade = c.long_name;
    if (types.includes("administrative_area_level_1")) out.estado = c.short_name;
    if (types.includes("country")) out.pais = c.long_name;
  }
  return out;
}

export function HotelAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  label = "Nome do hotel",
  placeholder = "Digite o nome do hotel...",
}: {
  value: string;
  onChange: (v: string) => void;
  onPlaceSelected: (p: PlaceResult) => void;
  label?: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [available, setAvailable] = useState<boolean>(!!BROWSER_KEY);

  useEffect(() => {
    if (!BROWSER_KEY || !inputRef.current) return;
    let mounted = true;
    let listener: any;
    loadMaps()
      .then(async () => {
        if (!mounted || !inputRef.current) return;
        // @ts-ignore
        const places = (await window.google.maps.importLibrary("places")) as any;
        // Use legacy Autocomplete via JS lib (works with key, simpler than Element)
        // eslint-disable-next-line
        const ac = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
          fields: [
            "name",
            "formatted_address",
            "address_components",
            "place_id",
            "url",
            "geometry",
            "photos",
          ],
          types: ["lodging"],
        });
        listener = ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (!place) return;
          const comps = extractAddressComponents(place.address_components);
          const lat = place.geometry?.location?.lat?.();
          const lng = place.geometry?.location?.lng?.();
          const placeId = place.place_id;
          // Extrai até 6 fotos do Google Places (galeria do estabelecimento)
          const fotos: string[] = Array.isArray(place.photos)
            ? place.photos
                .slice(0, 6)
                .map((ph: any) => {
                  try {
                    return ph.getUrl({ maxWidth: 1024, maxHeight: 768 }) as string;
                  } catch {
                    return undefined;
                  }
                })
                .filter((u: string | undefined): u is string => !!u)
            : [];
          const result: PlaceResult = {
            nome: place.name,
            endereco: place.formatted_address,
            cidade: comps.cidade,
            estado: comps.estado,
            pais: comps.pais,
            google_place_id: placeId,
            google_maps_url:
              place.url ||
              (placeId
                ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
                : undefined),
            lat,
            lng,
            fotos,
          };
          if (result.nome) onChange(result.nome);
          onPlaceSelected(result);
        });
        // suppress places lib unused warn
        void places;
      })
      .catch(() => {
        if (mounted) setAvailable(false);
      });
    return () => {
      mounted = false;
      if (listener?.remove) listener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {!available && (
        <p className="text-xs text-muted-foreground">
          Autocomplete do Google Maps indisponível — preencha manualmente.
        </p>
      )}
    </div>
  );
}
