import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
    if (!id) throw new Error("A compra foi processada sem retornar o lote.");
    return { id };
  });

export const excluirCompraMilhasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { loteId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
    if (!id) throw new Error("A transferência foi processada sem retornar a operação.");
    return { id };
  });

export const sincronizarCotacaoMilhasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { cotacaoId: string; ativa: boolean; programa?: string; quantidade?: number; loteId?: string; valorVendaMilheiro?: number }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("milhas_sincronizar_cotacao_interno", {
      p_user_id: context.userId,
      p_cotacao_id: data.cotacaoId,
      p_ativa: data.ativa,
      p_programa: data.programa || "",
      p_quantidade: Math.round(data.quantidade || 0),
      p_lote_id: data.loteId,
      p_valor_venda_milheiro: data.valorVendaMilheiro || 0,
    });
    fail(error);
    return { changed: true };
  });

export const excluirUtilizacaoMilhasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { operacaoId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("milhas_excluir_utilizacao_interno", {
      p_user_id: context.userId,
      p_operacao_id: data.operacaoId,
    });
    fail(error);
    return { ok: true };
  });

export const excluirTransferenciaMilhasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { transferenciaId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("milhas_excluir_transferencia_interno", {
      p_user_id: context.userId,
      p_transferencia_id: data.transferenciaId,
    });
    fail(error);
    return { ok: true };
  });

export const atualizarTransferenciaMilhasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: TransferenciaMilhasInput & { transferenciaId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: id, error } = await supabaseAdmin.rpc("milhas_atualizar_transferencia_interno", {
      p_user_id: context.userId,
      p_transferencia_id: data.transferenciaId,
      p_data: data.data,
      p_programa_origem: data.programaOrigem,
      p_programa_destino: data.programaDestino,
      p_quantidade: Math.round(data.quantidade),
      p_percentual_bonus: data.percentualBonus,
      p_taxas: data.taxas,
      p_observacoes: data.observacoes || "",
      p_chave_idempotencia: data.chaveIdempotencia || crypto.randomUUID(),
    });
    fail(error);
    if (!id) throw new Error("A transferência foi atualizada sem retornar a operação.");
    return { id };
  });
