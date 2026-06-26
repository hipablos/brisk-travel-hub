import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";

export interface EnderecoSelecionado {
  endereco: string;
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
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
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

async function buscarSugestoesEndereco(query: string): Promise<NominatimResult[]> {
  if (query.length < 3) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("accept-language", "pt-BR");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Erro ao buscar endereço");
  return res.json();
}

async function buscarImagemUnsplash(
  query: string,
): Promise<{ url: string; credito: string } | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    return {
      url: `https://source.unsplash.com/800x400/?${encodeURIComponent(query)},travel,tourism`,
      credito: "Unsplash",
    };
  }
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", `${query} turismo viagem`);
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
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    setQuery(value || "");
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
      .catch(() => setErro("Não foi possível buscar endereços."))
      .finally(() => setBuscando(false));
  }, [debouncedQuery, selecionado?.endereco]);

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
      const cidade =
        addr.city || addr.town || addr.village || addr.municipality || "";
      const estado = addr.state || "";
      const pais = addr.country || "";
      const enderecoFormatado = item.display_name;
      setQuery(enderecoFormatado);
      setBuscandoImagem(true);
      setImagemPreview(null);

      const termoBusca = cidade || enderecoFormatado;
      const imagem = await buscarImagemUnsplash(termoBusca).catch(() => null);
      setBuscandoImagem(false);

      const enderecoCompleto: EnderecoSelecionado = {
        endereco: enderecoFormatado,
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
    [onChange],
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
                       shadow-xl overflow-hidden"
          >
            {sugestoes.map((item, i) => {
              const addr = item.address;
              const cidade =
                addr.city || addr.town || addr.village || addr.municipality || "";
              const pais = addr.country || "";
              return (
                <li key={i}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 flex items-start gap-3
                               hover:bg-slate-700 transition-colors border-b border-slate-700/60 last:border-0"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelecionar(item)}
                  >
                    <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-100 truncate">{item.display_name}</p>
                      {(cidade || pais) && (
                        <p className="text-xs text-slate-400 mt-0.5">
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
            alt={selecionado.cidade || selecionado.endereco}
            className="w-full h-40 object-cover"
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
            <p className="text-xs text-slate-300 truncate">
              📍 {selecionado.cidade}
              {selecionado.estado ? `, ${selecionado.estado}` : ""} · {selecionado.pais}
            </p>
            {selecionado.imagemCredito && (
              <p className="text-xs text-slate-400">
                Foto: {selecionado.imagemCredito} · Unsplash
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
