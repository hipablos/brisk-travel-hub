import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  parte?: string;
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
  createdAt: string;
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
  valoresCusto?: ValorCusto[];
  valoresVenda?: ValorVenda[];
  vendaCustos?: VendaLinha[];
  vendaVendas?: VendaLinha[];
  vendaObservacoes?: string;
  dataVenda?: string;
  localizador?: string;
  vooIda?: any;
  vooVolta?: any;
  formasPagamentoIds?: string[];
  valorComparacao?: number;
  instrucoesPagamento?: string;
  linkPagamento?: string;
  termos?: string;
  outrasInformacoes?: string;
  passageirosNomes?: string[];
};

export const DEFAULT_TERMOS = `• Esta proposta é válida apenas para a data e horário indicados, sujeita à confirmação de disponibilidade e preço no momento da emissão.
• Após a emissão, alterações e cancelamentos seguem as regras tarifárias da companhia aérea e podem gerar custos adicionais.
• Documentos pessoais (RG/passaporte/visto) são de responsabilidade exclusiva do passageiro.
• A Brisk Viagens atua como intermediária entre o cliente e os fornecedores dos serviços contratados.`;

export const DEFAULT_OUTRAS_INFORMACOES = `• Pagamento via PIX, cartão de crédito ou link de pagamento.
• Bagagens conforme regras da companhia aérea contratada.
• Check-in online disponível a partir de 48h antes do voo.
• Em caso de dúvidas, fale conosco pelo WhatsApp (85) 99647-7568.`;

export type FormaPagamento = {
  id: string;
  nome: string;
  parcelas: number;
  intervaloDias: number;
  desconto: number;
  acrescimo: number;
  observacao?: string;
  ativo: boolean;
  createdAt: string;
};

// ---------- Helpers ----------
async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function rowToCotacao(row: any): Cotacao {
  const d = (row.data ?? {}) as Partial<Cotacao>;
  return {
    ...d,
    id: row.id,
    code: row.code,
    status: row.status,
    createdAt: row.created_at,
  } as Cotacao;
}

function rowToCliente(row: any): Cliente {
  const d = (row.data ?? {}) as Partial<Cliente>;
  return { ...d, id: row.id, nome: row.nome } as Cliente;
}

// ---------- Cotacoes ----------
export async function fetchCotacoes(): Promise<Cotacao[]> {
  const { data, error } = await supabase
    .from("cotacoes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[cotacoes] fetch error:", error);
    return [];
  }
  return (data ?? []).map(rowToCotacao);
}

export async function getCotacao(id: string): Promise<Cotacao | undefined> {
  const { data, error } = await supabase.from("cotacoes").select("*").eq("id", id).maybeSingle();
  if (error || !data) return undefined;
  return rowToCotacao(data);
}

export async function saveCotacao(c: Cotacao): Promise<Cotacao | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const { id, code, status, createdAt, ...rest } = c;
  const payload = {
    user_id: uid,
    code,
    status,
    data: rest as any,
  };
  // Check if exists (id is uuid from DB after first save; in-memory drafts may use random ids)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) {
    const { data: existing } = await supabase.from("cotacoes").select("id").eq("id", id).maybeSingle();
    if (existing) {
      const { data, error } = await supabase
        .from("cotacoes")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) { console.error("[cotacoes] update error:", error); return null; }
      return rowToCotacao(data);
    }
  }
  const { data, error } = await supabase.from("cotacoes").insert(payload).select().single();
  if (error) { console.error("[cotacoes] insert error:", error); return null; }
  return rowToCotacao(data);
}

export async function setCotacaoStatus(id: string, status: CotacaoStatus) {
  const { error } = await supabase.from("cotacoes").update({ status }).eq("id", id);
  if (error) console.error("[cotacoes] setStatus error:", error);
}

export async function deleteCotacao(id: string) {
  const { error } = await supabase.from("cotacoes").delete().eq("id", id);
  if (error) console.error("[cotacoes] delete error:", error);
}

export async function updateCotacaoLabels(id: string, labels: string[]) {
  const c = await getCotacao(id);
  if (!c) return;
  const { ...rest } = c;
  const { id: _i, code: _c, status: _s, createdAt: _ca, ...payload } = rest;
  await supabase.from("cotacoes").update({ data: { ...payload, labels } as any }).eq("id", id);
}

// ---------- Clientes ----------
export async function fetchClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("[clientes] fetch error:", error); return []; }
  return (data ?? []).map(rowToCliente);
}

export async function getCliente(id: string): Promise<Cliente | undefined> {
  const { data, error } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  if (error || !data) return undefined;
  return rowToCliente(data);
}

export async function saveCliente(c: Cliente): Promise<Cliente | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const { id, nome, ...rest } = c;
  const payload = { user_id: uid, nome, data: rest as any };
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) {
    const { data: existing } = await supabase.from("clientes").select("id").eq("id", id).maybeSingle();
    if (existing) {
      const { data, error } = await supabase.from("clientes").update(payload).eq("id", id).select().single();
      if (error) { console.error("[clientes] update error:", error); return null; }
      return rowToCliente(data);
    }
  }
  const { data, error } = await supabase.from("clientes").insert(payload).select().single();
  if (error) { console.error("[clientes] insert error:", error); return null; }
  return rowToCliente(data);
}

export async function deleteCliente(id: string) {
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) console.error("[clientes] delete error:", error);
}

// ---------- Hooks com Realtime ----------
function useAuthUserId() {
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUid(data.session?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setUid(session?.user?.id ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);
  return uid;
}

export function useCotacoes() {
  const uid = useAuthUserId();
  const [list, setList] = useState<Cotacao[]>([]);
  useEffect(() => {
    if (!uid) return; // espera a sessão restaurar antes de consultar (RLS exige auth.uid())
    let mounted = true;
    const reload = () => fetchCotacoes().then((d) => mounted && setList(d));
    reload();
    const channel = supabase
      .channel(`cotacoes-changes-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cotacoes" }, reload)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [uid]);
  return list;
}

export function useClientes() {
  const uid = useAuthUserId();
  const [list, setList] = useState<Cliente[]>([]);
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    const reload = () => fetchClientes().then((d) => mounted && setList(d));
    reload();
    const channel = supabase
      .channel(`clientes-changes-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "clientes" }, reload)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [uid]);
  return list;
}


// ---------- Utils ----------
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

// ---------- Labels ----------
export type LabelDef = { name: string; color: string };

export const PRESET_LABELS: LabelDef[] = [
  { name: "Urgente", color: "#ef4444" },
  { name: "VIP", color: "#a855f7" },
  { name: "Emitido", color: "#10b981" },
  { name: "Aguardando pagamento", color: "#f59e0b" },
  { name: "Prioridade alta", color: "#f97316" },
];

export async function fetchCustomLabels(): Promise<LabelDef[]> {
  const { data, error } = await supabase.from("labels_custom").select("name,color");
  if (error) return [];
  return (data ?? []) as LabelDef[];
}

export async function saveCustomLabel(l: LabelDef) {
  const uid = await currentUserId();
  if (!uid) return;
  await supabase.from("labels_custom").insert({ user_id: uid, name: l.name, color: l.color });
}

export function useAllLabels() {
  const uid = useAuthUserId();
  const [custom, setCustom] = useState<LabelDef[]>([]);
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    const reload = () => fetchCustomLabels().then((d) => mounted && setCustom(d));
    reload();
    const channel = supabase
      .channel(`labels-changes-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "labels_custom" }, reload)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [uid]);
  return [...PRESET_LABELS, ...custom];
}

// ---------- Formas de Pagamento ----------
function rowToForma(row: any): FormaPagamento {
  return {
    id: row.id,
    nome: row.nome,
    parcelas: row.parcelas ?? 1,
    intervaloDias: row.intervalo_dias ?? 30,
    desconto: Number(row.desconto ?? 0),
    acrescimo: Number(row.acrescimo ?? 0),
    observacao: row.observacao ?? undefined,
    ativo: !!row.ativo,
    createdAt: row.created_at,
  };
}

export async function fetchFormasPagamento(): Promise<FormaPagamento[]> {
  const { data, error } = await supabase
    .from("formas_pagamento")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("[formas] fetch error:", error); return []; }
  return (data ?? []).map(rowToForma);
}

export async function saveFormaPagamento(f: Omit<FormaPagamento, "createdAt"> & { createdAt?: string }): Promise<FormaPagamento | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const payload = {
    user_id: uid,
    nome: f.nome,
    parcelas: f.parcelas,
    intervalo_dias: f.intervaloDias,
    desconto: f.desconto,
    acrescimo: f.acrescimo,
    observacao: f.observacao ?? null,
    ativo: f.ativo,
  };
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(f.id);
  if (isUuid) {
    const { data: existing } = await supabase.from("formas_pagamento").select("id").eq("id", f.id).maybeSingle();
    if (existing) {
      const { data, error } = await supabase.from("formas_pagamento").update(payload).eq("id", f.id).select().single();
      if (error) { console.error("[formas] update error:", error); return null; }
      return rowToForma(data);
    }
  }
  const { data, error } = await supabase.from("formas_pagamento").insert(payload).select().single();
  if (error) { console.error("[formas] insert error:", error); return null; }
  return rowToForma(data);
}

export async function deleteFormaPagamento(id: string) {
  const { error } = await supabase.from("formas_pagamento").delete().eq("id", id);
  if (error) console.error("[formas] delete error:", error);
}

export async function toggleFormaPagamentoAtivo(id: string, ativo: boolean) {
  const { error } = await supabase.from("formas_pagamento").update({ ativo }).eq("id", id);
  if (error) console.error("[formas] toggle error:", error);
}

export function useFormasPagamento() {
  const uid = useAuthUserId();
  const [list, setList] = useState<FormaPagamento[]>([]);
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    const reload = () => fetchFormasPagamento().then((d) => mounted && setList(d));
    reload();
    const channel = supabase
      .channel(`formas-changes-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "formas_pagamento" }, reload)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [uid]);
  return list;
}

export function computeFormaTotal(baseTotal: number, f: FormaPagamento) {
  const desc = baseTotal * (f.desconto / 100);
  const acr = baseTotal * (f.acrescimo / 100);
  const final = baseTotal - desc + acr;
  const parcelas = Math.max(1, f.parcelas);
  const valorParcela = final / parcelas;
  return { final, desconto: desc, acrescimo: acr, parcelas, valorParcela };
}
