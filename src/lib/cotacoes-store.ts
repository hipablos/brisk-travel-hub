import { useEffect, useState } from "react";

export type CotacaoStatus = "aguardando" | "aguardando_cliente" | "aprovado" | "reprovado";

export type CotacaoServico = {
  id: string;
  type: string;
  description: string;
  value: number;
};

export type Cliente = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
};

export type Cotacao = {
  id: string;
  code: string;
  createdAt: string; // ISO
  status: CotacaoStatus;
  cliente: Cliente;
  tag?: string;
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
