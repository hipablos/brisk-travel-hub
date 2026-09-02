import { supabase } from "@/integrations/supabase/client";
import { useSharedTable } from "@/lib/cotacoes-store";

export const PROGRAMAS_MILHAS = [
  "Livelo",
  "LATAM Pass",
  "Smiles",
  "Azul Fidelidade",
  "Iberia Plus",
] as const;

export type ProgramaMilhas = (typeof PROGRAMAS_MILHAS)[number] | string;

export type MilhasTipo = "compra" | "utilizacao" | "estorno" | "ajuste";

export const MILHAS_TIPO_LABELS: Record<MilhasTipo, string> = {
  compra: "Compra",
  utilizacao: "Utilização",
  estorno: "Estorno",
  ajuste: "Ajuste",
};

export type MilhaMovimento = {
  id: string;
  data: string; // ISO "YYYY-MM-DD"
  programa: ProgramaMilhas;
  tipo: MilhasTipo;
  quantidade: number;
  valorTotal: number;
  banco?: string;
  formaPagamento?: string;
  cartao?: string;
  parcelas?: number;
  observacoes?: string;
  cotacaoId?: string;
  createdAt: string;
};

function rowToMovimento(row: any): MilhaMovimento {
  return {
    id: row.id,
    data: row.data,
    programa: row.programa,
    tipo: row.tipo,
    quantidade: Number(row.quantidade ?? 0),
    valorTotal: Number(row.valor_total ?? 0),
    banco: row.banco ?? undefined,
    formaPagamento: row.forma_pagamento ?? undefined,
    cartao: row.cartao ?? undefined,
    parcelas: row.parcelas ?? undefined,
    observacoes: row.observacoes ?? undefined,
    cotacaoId: row.cotacao_id ?? undefined,
    createdAt: row.created_at,
  };
}

export async function fetchMilhasMovimentos(): Promise<MilhaMovimento[]> {
  const { data, error } = await supabase
    .from("milhas_movimentos")
    .select("*")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[milhas] fetch error:", error);
    return [];
  }
  return (data ?? []).map(rowToMovimento);
}

export function useMilhasMovimentos() {
  return useSharedTable<MilhaMovimento>("milhas_movimentos", "milhas_movimentos", fetchMilhasMovimentos);
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export type MilhaMovimentoInput = Omit<MilhaMovimento, "createdAt"> & { createdAt?: string };

export async function saveMilhaMovimento(m: MilhaMovimentoInput): Promise<MilhaMovimento | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const payload = {
    user_id: uid,
    data: m.data,
    programa: m.programa,
    tipo: m.tipo,
    quantidade: Math.round(m.quantidade || 0),
    valor_total: m.valorTotal || 0,
    banco: m.banco || null,
    forma_pagamento: m.formaPagamento || null,
    cartao: m.cartao || null,
    parcelas: m.parcelas ?? null,
    observacoes: m.observacoes || null,
    cotacao_id: m.cotacaoId || null,
  };
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.id ?? "");
  if (isUuid) {
    const { data: existing } = await supabase
      .from("milhas_movimentos").select("id").eq("id", m.id).maybeSingle();
    if (existing) {
      const { data, error } = await supabase
        .from("milhas_movimentos").update(payload).eq("id", m.id).select().single();
      if (error) { console.error("[milhas] update error:", error); return null; }
      return rowToMovimento(data);
    }
  }
  const { data, error } = await supabase.from("milhas_movimentos").insert(payload).select().single();
  if (error) { console.error("[milhas] insert error:", error); return null; }
  return rowToMovimento(data);
}

export async function deleteMilhaMovimento(id: string) {
  const { error } = await supabase.from("milhas_movimentos").delete().eq("id", id);
  if (error) console.error("[milhas] delete error:", error);
}

// ---------- Cálculos ----------

/** Custo do milheiro: valor pago ÷ quantidade × 1.000 */
export function custoMilheiro(valorTotal: number, quantidade: number): number {
  if (!quantidade) return 0;
  return (valorTotal / quantidade) * 1000;
}

export type ResumoPrograma = {
  programa: ProgramaMilhas;
  saldo: number;
  pontosComprados: number;
  investido: number;
  custoMedioMilheiro: number;
  compras: number;
  utilizados: number;
};

export function resumoPorPrograma(movs: MilhaMovimento[], programa: ProgramaMilhas): ResumoPrograma {
  const doPrograma = movs.filter((m) => m.programa === programa);
  const compras = doPrograma.filter((m) => m.tipo === "compra");
  const pontosComprados = compras.reduce((s, m) => s + m.quantidade, 0);
  const investido = compras.reduce((s, m) => s + m.valorTotal, 0);
  const utilizados = doPrograma.filter((m) => m.tipo === "utilizacao").reduce((s, m) => s + m.quantidade, 0);
  const estornados = doPrograma.filter((m) => m.tipo === "estorno").reduce((s, m) => s + m.quantidade, 0);
  const ajustes = doPrograma.filter((m) => m.tipo === "ajuste").reduce((s, m) => s + m.quantidade, 0);
  return {
    programa,
    saldo: pontosComprados + ajustes + estornados - utilizados,
    pontosComprados,
    investido,
    custoMedioMilheiro: custoMilheiro(investido, pontosComprados),
    compras: compras.length,
    utilizados: utilizados - estornados,
  };
}

export function resumoGeral(movs: MilhaMovimento[]) {
  const programas = Array.from(new Set<string>([...PROGRAMAS_MILHAS, ...movs.map((m) => m.programa)]));
  const resumos = programas.map((p) => resumoPorPrograma(movs, p));
  const saldo = resumos.reduce((s, r) => s + r.saldo, 0);
  const pontosComprados = resumos.reduce((s, r) => s + r.pontosComprados, 0);
  const investido = resumos.reduce((s, r) => s + r.investido, 0);
  const compras = resumos.reduce((s, r) => s + r.compras, 0);
  return {
    resumos,
    saldo,
    investido,
    compras,
    custoMedioMilheiro: custoMilheiro(investido, pontosComprados),
  };
}

export function formatPontos(n: number) {
  return Math.round(n).toLocaleString("pt-BR");
}

// ---------- Integração com Cotações ----------

export type MilhasCotacaoInfo = {
  cotacaoId: string;
  usarMilhas: boolean;
  programa?: string;
  quantidade?: number;
  /** true quando a cotação está confirmada/emitida (status aprovado) */
  confirmada: boolean;
};

/**
 * Sincroniza o estoque de milhas com uma cotação.
 * - Cotação confirmada + milhas próprias → registra (ou ajusta) a utilização.
 * - Cotação cancelada/reprovada → registra um estorno, mantendo o histórico.
 * Nunca duplica: só existe UMA utilização por cotação/programa.
 */
export async function sincronizarMilhasCotacao(
  info: MilhasCotacaoInfo,
): Promise<{ changed: boolean; aviso?: string }> {
  const uid = await currentUserId();
  if (!uid) return { changed: false };

  const { data: rowsRaw } = await supabase
    .from("milhas_movimentos")
    .select("*")
    .eq("cotacao_id", info.cotacaoId);
  const rows = (rowsRaw ?? []).map(rowToMovimento);
  const utilizacao = rows.find((r) => r.tipo === "utilizacao");
  const estornos = rows.filter((r) => r.tipo === "estorno");

  const ativo = info.confirmada && info.usarMilhas && !!info.programa && (info.quantidade ?? 0) > 0;

  if (!ativo) {
    if (utilizacao && estornos.length === 0) {
      await saveMilhaMovimento({
        id: crypto.randomUUID(),
        data: new Date().toISOString().slice(0, 10),
        programa: utilizacao.programa,
        tipo: "estorno",
        quantidade: utilizacao.quantidade,
        valorTotal: utilizacao.valorTotal,
        observacoes: "Estorno automático (cotação cancelada ou milhas removidas)",
        cotacaoId: info.cotacaoId,
      });
      return { changed: true };
    }
    return { changed: false };
  }

  // Utilização ativa: remove estornos anteriores (reativação da cotação)
  for (const e of estornos) await deleteMilhaMovimento(e.id);

  const todos = await fetchMilhasMovimentos();
  const resumo = resumoPorPrograma(todos, info.programa!);
  const quantidade = Math.round(info.quantidade!);
  const custoInterno = (quantidade / 1000) * resumo.custoMedioMilheiro;

  // Saldo já considera a utilização anterior desta cotação (se existir)
  const anterior = utilizacao && utilizacao.programa === info.programa ? utilizacao.quantidade : 0;
  const saldoDisponivel = resumo.saldo + anterior;
  const aviso =
    quantidade > saldoDisponivel
      ? `Saldo insuficiente em ${info.programa}: disponível ${formatPontos(saldoDisponivel)}, necessário ${formatPontos(quantidade)}.`
      : undefined;

  if (utilizacao) {
    const igual =
      utilizacao.programa === info.programa && utilizacao.quantidade === quantidade;
    if (igual) return { changed: false, aviso };
    await saveMilhaMovimento({
      ...utilizacao,
      programa: info.programa!,
      quantidade,
      valorTotal: custoInterno,
      cotacaoId: info.cotacaoId,
    });
    return { changed: true, aviso };
  }

  await saveMilhaMovimento({
    id: crypto.randomUUID(),
    data: new Date().toISOString().slice(0, 10),
    programa: info.programa!,
    tipo: "utilizacao",
    quantidade,
    valorTotal: custoInterno,
    observacoes: "Utilização automática de milhas próprias na cotação",
    cotacaoId: info.cotacaoId,
  });
  return { changed: true, aviso };
}
