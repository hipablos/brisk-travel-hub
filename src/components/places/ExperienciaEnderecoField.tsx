import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";

export interface EnderecoSelecionado {
  endereco: string;
  nomeLocal: string;
  categoria: string;
  cidade: string;
  estado: string;
  pais: string;
  lat: number;
  lon: number;
  imagemUrl: string | null;
  imagemCredito: string | null;
}

interface NominatimResult {
  display_name: string;
  name?: string;
  type: string;
  class: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
    tourism?: string;
    leisure?: string;
    natural?: string;
  };
  lat: string;
  lon: string;
}

interface UnsplashPhoto {
  urls: { regular: string; small: string };
  user: { name: string };
  alt_description: string | null;
}

const UNSPLASH_ACCESS_KEY =
  (import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined) || "";

const TIPOS_TURISTICOS = new Set([
  "attraction", "theme_park", "zoo", "aquarium", "viewpoint",
  "museum", "gallery", "artwork", "monument", "ruins",
  "resort", "camp_site", "picnic_site",
  "park", "nature_reserve", "garden", "marina", "beach_resort",
  "water_park", "miniature_golf", "stadium",
  "beach", "bay", "cape", "cliff", "valley",
  "peak", "volcano", "cave_entrance", "waterfall", "spring",
  "glacier", "island",
  "city", "town", "village", "island", "region",
]);

function iconePorCategoria(categoria: string, tipo?: string): string {
  if (tipo === "beach" || tipo === "bay" || categoria === "Praia") return "🏖️";
  if (tipo === "park" || tipo === "nature_reserve" || tipo === "garden" || categoria === "Parque") return "🌳";
  if (tipo === "museum" || tipo === "gallery" || categoria === "Museu") return "🏛️";
  if (tipo === "theme_park" || tipo === "water_park" || categoria === "Parque Temático") return "🎡";
  if (tipo === "zoo" || tipo === "aquarium" || categoria === "Zoológico") return "🦁";
  if (tipo === "viewpoint" || categoria === "Mirante") return "🔭";
  if (tipo === "monument" || tipo === "ruins" || categoria === "Monumento") return "🗿";
  if (tipo === "waterfall" || categoria === "Cachoeira") return "💧";
  if (tipo === "peak" || tipo === "volcano" || categoria === "Pico") return "🏔️";
  if (tipo === "cave_entrance" || categoria === "Caverna") return "🕳️";
  if (tipo === "island" || categoria === "Ilha") return "🏝️";
  return "🗺️";
}

function labelCategoria(item: NominatimResult): string {
  const map: Record<string, string> = {
    park: "Parque", nature_reserve: "Reserva Natural", garden: "Jardim Botânico",
    beach: "Praia", theme_park: "Parque Temático", water_park: "Parque Aquático",
    zoo: "Zoológico", aquarium: "Aquário", museum: "Museu", gallery: "Galeria",
    viewpoint: "Mirante", monument: "Monumento", ruins: "Ruínas",
    attraction: "Atração Turística", resort: "Resort",
    peak: "Pico", volcano: "Vulcão", waterfall: "Cachoeira",
    cave_entrance: "Caverna", island: "Ilha", bay: "Baía", valley: "Vale",
    city: "Cidade", town: "Cidade", village: "Vila",
  };
  return map[item.type] || (item.class === "tourism" ? "Turismo" : item.class === "natural" ? "Natureza" : "");
}

async function buscarNominatim(params: Record<string, string>): Promise<NominatimResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  const defaults: Record<string, string> = {
    format: "json",
    addressdetails: "1",
    namedetails: "1",
    limit: "10",
    "accept-language": "pt-BR",
  };
  Object.entries({ ...defaults, ...params }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { "User-Agent": "AgenciaTurismoApp/1.0" } });
  if (!res.ok) throw new Error("Erro ao buscar");
  return res.json();
}

async function buscarSugestoesEndereco(query: string): Promise<NominatimResult[]> {
  if (query.length < 3) return [];
  const [turisticos, gerais] = await Promise.allSettled([
    buscarNominatim({ q: query, featuretype: "poi" }),
    buscarNominatim({ q: query }),
  ]);
  const listaTuristicos = turisticos.status === "fulfilled" ? turisticos.value : [];
  const listaGerais = gerais.status === "fulfilled" ? gerais.value : [];
  const todos = [...listaTuristicos, ...listaGerais];
  const vistos = new Set<string>();
  const unicos = todos.filter((r) => {
    if (vistos.has(r.display_name)) return false;
    vistos.add(r.display_name);
    return true;
  });
  const filtrados = unicos.filter(
    (r) => TIPOS_TURISTICOS.has(r.type) || TIPOS_TURISTICOS.has(r.class)
  );
  filtrados.sort((a, b) => {
    const prioA = a.class === "place" ? 1 : 0;
    const prioB = b.class === "place" ? 1 : 0;
    return prioA - prioB;
  });
  return (filtrados.length > 0 ? filtrados : listaGerais).slice(0, 6);
}

async function buscarImagemUnsplash(query: string): Promise<{ url: string; credito: string } | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    return {
      url: `https://source.unsplash.com/800x400/?${encodeURIComponent(query)},travel,tourism,nature`,
      credito: "Unsplash",
    };
  }
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", `${query} turismo paisagem`);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("orientation", "landscape");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const foto: UnsplashPhoto = data.results?.[0];
  if (!foto) return null;
  return { url: foto.urls.regular, credito: foto.user.name };
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface Props {
  value: string;
  onChange: (endereco: EnderecoSelecionado) => void;
  onClear?: () => void;
}

export function ExperienciaEnderecoField({ value, onChange, onClear }: Props) {
  const [query, setQuery] = useState(value || "");
  const [sugestoes, setSugestoes] = useState<NominatimResult[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscandoImagem, setBuscandoImagem] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [selecionado, setSelecionado] = useState<EnderecoSelecionado | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debouncedQuery = useDebounce(query, 450);

  useEffect(() => {
    setQuery(value || "");
    if (!value) setSelecionado(null);
  }, [value]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery === selecionado?.endereco) {
      setSugestoes([]);
      return;
    }
    setBuscando(true);
    setErro(null);
    buscarSugestoesEndereco(debouncedQuery)
      .then((resultados) => {
        setSugestoes(resultados);
        setAberto(resultados.length > 0);
      })
      .catch(() => setErro("Não foi possível buscar locais."))
      .finally(() => setBuscando(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (
        listRef.current &&
        !listRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const handleSelecionar = useCallback(
    async (item: NominatimResult) => {
      setAberto(false);
      setSugestoes([]);
      const addr = item.address;
      const cidade = addr.city || addr.town || addr.village || addr.municipality || "";
      const estado = addr.state || "";
      const pais = addr.country || "";
      const nomeLocal = item.name || item.display_name.split(",")[0].trim();
      const categoria = labelCategoria(item);
      const termoBusca = [nomeLocal, cidade].filter(Boolean).join(" ");
      setQuery(nomeLocal);
      setBuscandoImagem(true);
      setImagemPreview(null);
      const imagem = await buscarImagemUnsplash(termoBusca).catch(() => null);
      setBuscandoImagem(false);
      const enderecoCompleto: EnderecoSelecionado = {
        endereco: item.display_name,
        nomeLocal,
        categoria,
        cidade,
        estado,
        pais,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        imagemUrl: imagem?.url || null,
        imagemCredito: imagem?.credito || null,
      };
      setSelecionado(enderecoCompleto);
      setImagemPreview(imagem?.url || null);
      onChange(enderecoCompleto);
    },
    [onChange]
  );

  const handleLimpar = () => {
    setQuery("");
    setSelecionado(null);
    setImagemPreview(null);
    setSugestoes([]);
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="relative">
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Endereço / local
        </label>
        <div className="relative flex items-center">
          <Search className="absolute left-3 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelecionado(null);
              setImagemPreview(null);
            }}
            onFocus={() => sugestoes.length > 0 && setAberto(true)}
            className="w-full bg-slate-800/60 border border-slate-600 rounded-lg pl-10 pr-10 py-2.5
                       text-slate-100 placeholder-slate-500 text-sm
                       focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40
                       transition-colors"
          />
          <div className="absolute right-3 flex items-center gap-1">
            {buscando && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
            {query && !buscando && (
              <button
                type="button"
                onClick={handleLimpar}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {erro && <p className="text-xs text-red-400 mt-1">{erro}</p>}
        {aberto && sugestoes.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg
                       shadow-xl overflow-hidden max-h-72 overflow-y-auto"
          >
            {sugestoes.map((item, i) => {
              const addr = item.address;
              const cidade = addr.city || addr.town || addr.village || addr.municipality || "";
              const pais = addr.country || "";
              const nome = item.name || item.display_name.split(",")[0].trim();
              const cat = labelCategoria(item);
              const icone = iconePorCategoria(cat, item.type);
              return (
                <li key={i}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 flex items-start gap-3
                               hover:bg-slate-700/80 transition-colors border-b border-slate-700/50 last:border-0"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelecionar(item)}
                  >
                    <span className="text-lg mt-0.5 shrink-0">{icone}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-100 font-medium truncate">{nome}</p>
                        {cat && (
                          <span className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded shrink-0">
                            {cat}
                          </span>
                        )}
                      </div>
                      {(cidade || pais) && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {[cidade, pais].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {buscandoImagem && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          Buscando imagem do local...
        </div>
      )}

      {imagemPreview && selecionado && !buscandoImagem && (
        <div className="relative rounded-lg overflow-hidden border border-slate-600">
          <img
            src={imagemPreview}
            alt={selecionado.nomeLocal}
            className="w-full h-44 object-cover"
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm">{iconePorCategoria(selecionado.categoria)}</span>
              <div>
                <p className="text-sm font-medium text-white">{selecionado.nomeLocal}</p>
                <p className="text-xs text-slate-300">
                  {[selecionado.cidade, selecionado.estado, selecionado.pais].filter(Boolean).join(", ")}
                </p>
              </div>
              {selecionado.categoria && (
                <span className="ml-auto text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {selecionado.categoria}
                </span>
              )}
            </div>
            {selecionado.imagemCredito && selecionado.imagemCredito !== "Unsplash" && (
              <p className="text-xs text-slate-400 mt-1">📷 {selecionado.imagemCredito} · Unsplash</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
