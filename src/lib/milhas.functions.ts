import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function fail(error: { message?: string } | null) {
  if (error) throw new Error(error.message || "Não foi possível concluir a operação de milhas.");
}

export type CompraMilhasInput = {
  loteId?: string;
  data: string;
  programa: string;
  quantidade: number;
  valorTotal: number;
  banco?: string;
  formaPagamento?: string;
  cartao?: string;
  parcelas?: number;
  observacoes?: string;
  chaveIdempotencia?: string;
};

export const salvarCompraMilhasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CompraMilhasInput) => data)
  .handler(async ({ data, context }) => {
    if (data.loteId) {
      const { error } = await supabaseAdmin.rpc("milhas_atualizar_compra_interno", {
        p_user_id: context.userId,
        p_lote_id: data.loteId,
        p_data: data.data,
        p_programa: data.programa,
        p_quantidade: Math.round(data.quantidade),
        p_valor_total: data.valorTotal,
        p_banco: data.banco || undefined,
        p_forma_pagamento: data.formaPagamento || undefined,
        p_cartao: data.cartao || undefined,
        p_parcelas: data.parcelas,
        p_observacoes: data.observacoes || undefined,
      });
      fail(error);
      return { id: data.loteId };
    }
    const { data: id, error } = await supabaseAdmin.rpc("milhas_registrar_compra_interno", {
      p_user_id: context.userId,
      p_data: data.data,
      p_programa: data.programa,
      p_quantidade: Math.round(data.quantidade),
      p_valor_total: data.valorTotal,
      p_banco: data.banco || undefined,
      p_forma_pagamento: data.formaPagamento || undefined,
      p_cartao: data.cartao || undefined,
      p_parcelas: data.parcelas,
      p_observacoes: data.observacoes || undefined,
      p_chave_idempotencia: data.chaveIdempotencia || crypto.randomUUID(),
    });
    fail(error);
    return { id: id! };
  });

export const excluirCompraMilhasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { loteId: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.rpc("milhas_excluir_compra_interno", {
      p_user_id: context.userId,
      p_lote_id: data.loteId,
    });
    fail(error);
    return { ok: true };
  });

export type TransferenciaMilhasInput = {
  data: string;
  programaOrigem: string;
  programaDestino: string;
  quantidade: number;
  percentualBonus: number;
  taxas: number;
  observacoes?: string;
  chaveIdempotencia?: string;
};

export const registrarTransferenciaMilhasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: TransferenciaMilhasInput) => data)
  .handler(async ({ data, context }) => {
    const { data: id, error } = await supabaseAdmin.rpc("milhas_registrar_transferencia_interno", {
      p_user_id: context.userId,
      p_data: data.data,
      p_programa_origem: data.programaOrigem,
      p_programa_destino: data.programaDestino,
      p_quantidade: Math.round(data.quantidade),
      p_percentual_bonus: data.percentualBonus,
      p_taxas: data.taxas,
      p_observacoes: data.observacoes || undefined,
      p_chave_idempotencia: data.chaveIdempotencia || crypto.randomUUID(),
    });
    fail(error);
    return { id: id! };
  });

export const sincronizarCotacaoMilhasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { cotacaoId: string; ativa: boolean; programa?: string; quantidade?: number }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.rpc("milhas_sincronizar_cotacao_interno", {
      p_user_id: context.userId,
      p_cotacao_id: data.cotacaoId,
      p_ativa: data.ativa,
      p_programa: data.programa || "",
      p_quantidade: Math.round(data.quantidade || 0),
    });
    fail(error);
    return { changed: true };
  });
