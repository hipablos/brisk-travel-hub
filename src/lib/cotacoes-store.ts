import { useEffect, useState } from "react";

export type CotacaoStatus = "aguardando" | "aguardando_cliente" | "aprovado" | "reprovado";

export type CotacaoServico = {
  id: string;
  type: string;
  description: string;
  value: number;
};

export type ValorCusto = {
  id: string;
  conta?: string;
  fornecedor?: string;
  pagamento?: string;
  parcelas?: string;
  vencimento?: string;
  categoria?: string;
  descricao?: string;
  valor: number;
};

export type ValorVenda = {
  id: string;
  descricao?: string;
  valor: number;
};

export type VendaLinha = {
  id: string;
  parte?: string; // fornecedor (custo) ou cliente (venda)
  conta?: string;
  categoria?: string;
  descricao?: string;
  forma?: string;
  parcela?: string;
  vencimento?: string;
  pagamento?: string;
  valor: number;
  pago: boolean;
};

export type TipoCliente = "passageiro" | "cliente" | "fornecedor" | "representante";

export type Cliente = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
  dataNascimento?: string;
  sexo?: "masculino" | "feminino" | "outro";
  tipo?: TipoCliente;
  tipos?: TipoCliente[];
  rg?: string;
  cpf?: string;
  passaporte?: string;
  passaporteExpedicao?: string;
  passaporteVencimento?: string;
  vistoEmissao?: string;
};

export type Cotacao = {
  id: string;
  code: string;
  createdAt: string; // ISO
  status: CotacaoStatus;
  cliente: Cliente;
  tag?: string;
  labels?: string[];
  origem?: string;
  destino?: string;
  ida?: string;
  volta?: string;
  adultos: number;
  criancas: number;
  servicos: CotacaoServico[];
  observacoes?: string;
  validade?: string;
  pagamento?: string;
  total: number;
};

const COTACOES_KEY = "brisk:cotacoes";
const CLIENTES_KEY = "brisk:clientes";

function emit(key: string) {
  window.dispatchEvent(new CustomEvent(`brisk:${key}`));
}

export function loadCotacoes(): Cotacao[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(COTACOES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCotacao(c: Cotacao) {
  const all = loadCotacoes();
  const idx = all.findIndex((x) => x.id === c.id);
  if (idx >= 0) all[idx] = c;
  else all.unshift(c);
  localStorage.setItem(COTACOES_KEY, JSON.stringify(all));
  emit("cotacoes");
}

export function getCotacao(id: string): Cotacao | undefined {
  return loadCotacoes().find((c) => c.id === id);
}

export function setCotacaoStatus(id: string, status: CotacaoStatus) {
  const c = getCotacao(id);
  if (!c) return;
  saveCotacao({ ...c, status });
}

export function loadClientes(): Cliente[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CLIENTES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCliente(c: Cliente) {
  const all = loadClientes();
  const idx = all.findIndex((x) => x.id === c.id);
  if (idx >= 0) all[idx] = c;
  else all.unshift(c);
  localStorage.setItem(CLIENTES_KEY, JSON.stringify(all));
  emit("clientes");
}

export function deleteCliente(id: string) {
  const all = loadClientes().filter((x) => x.id !== id);
  localStorage.setItem(CLIENTES_KEY, JSON.stringify(all));
  emit("clientes");
}

export function getCliente(id: string): Cliente | undefined {
  return loadClientes().find((c) => c.id === id);
}

export function useCotacoes() {
  const [list, setList] = useState<Cotacao[]>(() => loadCotacoes());
  useEffect(() => {
    const handler = () => setList(loadCotacoes());
    window.addEventListener("brisk:cotacoes", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("brisk:cotacoes", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return list;
}

export function useClientes() {
  const [list, setList] = useState<Cliente[]>(() => loadClientes());
  useEffect(() => {
    const handler = () => setList(loadClientes());
    window.addEventListener("brisk:clientes", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("brisk:clientes", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return list;
}

export function genCode() {
  return Math.random().toString(36).slice(2, 7);
}

export function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const STATUS_LABELS: Record<CotacaoStatus, string> = {
  aguardando: "Aguardando",
  aguardando_cliente: "Aguardando Cliente",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

// ---- Labels (etiquetas visuais) ----
export type LabelDef = { name: string; color: string };

export const PRESET_LABELS: LabelDef[] = [
  { name: "Urgente", color: "#ef4444" },
  { name: "VIP", color: "#a855f7" },
  { name: "Emitido", color: "#10b981" },
  { name: "Aguardando pagamento", color: "#f59e0b" },
  { name: "Prioridade alta", color: "#f97316" },
];

const LABELS_KEY = "brisk:labels";

export function loadCustomLabels(): LabelDef[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LABELS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCustomLabel(l: LabelDef) {
  const all = loadCustomLabels();
  if (all.some((x) => x.name.toLowerCase() === l.name.toLowerCase())) return;
  all.push(l);
  localStorage.setItem(LABELS_KEY, JSON.stringify(all));
  emit("labels");
}

export function useAllLabels() {
  const [custom, setCustom] = useState<LabelDef[]>(() => loadCustomLabels());
  useEffect(() => {
    const h = () => setCustom(loadCustomLabels());
    window.addEventListener("brisk:labels", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("brisk:labels", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return [...PRESET_LABELS, ...custom];
}

export function updateCotacaoLabels(id: string, labels: string[]) {
  const c = getCotacao(id);
  if (!c) return;
  saveCotacao({ ...c, labels });
}
