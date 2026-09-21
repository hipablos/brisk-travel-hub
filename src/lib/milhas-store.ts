import { supabase } from "@/integrations/supabase/client";
import { invalidateSharedTable, useSharedTable } from "@/lib/cotacoes-store";
import {
  excluirCompraMilhasFn, registrarTransferenciaMilhasFn, salvarCompraMilhasFn,
  sincronizarCotacaoMilhasFn, type CompraMilhasInput, type TransferenciaMilhasInput,
} from "@/lib/milhas.functions";

export const PROGRAMAS_MILHAS = ["Livelo", "LATAM Pass", "Smiles", "Azul Fidelidade", "Iberia Plus"] as const;
export type ProgramaMilhas = (typeof PROGRAMAS_MILHAS)[number] | string;
export type MilhasTipo = "compra" | "utilizacao" | "estorno" | "ajuste" | "transferencia_saida" | "transferencia_entrada";
export const MILHAS_TIPO_LABELS: Record<MilhasTipo, string> = {
  compra: "Compra", utilizacao: "Utilização", estorno: "Estorno", ajuste: "Ajuste",
  transferencia_saida: "Transferência enviada", transferencia_entrada: "Transferência recebida",
};

export type MilhaMovimento = { id:string; data:string; programa:ProgramaMilhas; tipo:MilhasTipo; quantidade:number; valorTotal:number; banco?:string; formaPagamento?:string; cartao?:string; parcelas?:number; observacoes?:string; cotacaoId?:string; createdAt:string };
export type MilhaLote = { id:string; programa:ProgramaMilhas; origem:string; dataEntrada:string; quantidadeOriginal:number; quantidadeUtilizada:number; quantidadeDisponivel:number; custoTotal:number; custoMilheiro:number; observacoes?:string; movimentoOrigemId?:string; operacaoOrigemId:string; createdAt:string };
export type MilhaTransferencia = { id:string; data:string; programaOrigem:string; programaDestino:string; quantidadeTransferida:number; percentualBonus:number; quantidadeBonus:number; quantidadeRecebida:number; custoTransferido:number; taxas:number; custoTotalDestino:number; custoMilheiroDestino:number; loteDestinoId:string; observacoes?:string; createdAt:string };

const rowToMovimento = (r:any):MilhaMovimento => ({ id:r.id,data:r.data,programa:r.programa,tipo:r.tipo,quantidade:Number(r.quantidade||0),valorTotal:Number(r.valor_total||0),banco:r.banco??undefined,formaPagamento:r.forma_pagamento??undefined,cartao:r.cartao??undefined,parcelas:r.parcelas??undefined,observacoes:r.observacoes??undefined,cotacaoId:r.cotacao_id??undefined,createdAt:r.created_at });
const rowToLote = (r:any):MilhaLote => ({ id:r.id,programa:r.programa,origem:r.origem,dataEntrada:r.data_entrada,quantidadeOriginal:Number(r.quantidade_original||0),quantidadeUtilizada:Number(r.quantidade_utilizada||0),quantidadeDisponivel:Number(r.quantidade_disponivel||0),custoTotal:Number(r.custo_total||0),custoMilheiro:Number(r.custo_milheiro||0),observacoes:r.observacoes??undefined,movimentoOrigemId:r.movimento_origem_id??undefined,operacaoOrigemId:r.operacao_origem_id,createdAt:r.created_at });
const rowToTransferencia = (r:any):MilhaTransferencia => ({ id:r.id,data:r.data,programaOrigem:r.programa_origem,programaDestino:r.programa_destino,quantidadeTransferida:Number(r.quantidade_transferida||0),percentualBonus:Number(r.percentual_bonus||0),quantidadeBonus:Number(r.quantidade_bonus||0),quantidadeRecebida:Number(r.quantidade_recebida||0),custoTransferido:Number(r.custo_transferido||0),taxas:Number(r.taxas||0),custoTotalDestino:Number(r.custo_total_destino||0),custoMilheiroDestino:Number(r.custo_milheiro_destino||0),loteDestinoId:r.lote_destino_id,observacoes:r.observacoes??undefined,createdAt:r.created_at });

export async function fetchMilhasMovimentos(){ const {data,error}=await supabase.from("milhas_movimentos").select("*").order("data",{ascending:false}).order("created_at",{ascending:false}); if(error){console.error("[milhas]",error);return [];} return (data??[]).map(rowToMovimento); }
export async function fetchMilhasLotes(){ const {data,error}=await supabase.from("milhas_lotes").select("*").order("data_entrada",{ascending:true}).order("created_at",{ascending:true}); if(error){console.error("[milhas lotes]",error);return [];} return (data??[]).map(rowToLote); }
export async function fetchMilhasTransferencias(){ const {data,error}=await supabase.from("milhas_transferencias").select("*").order("data",{ascending:false}).order("created_at",{ascending:false}); if(error){console.error("[milhas transferências]",error);return [];} return (data??[]).map(rowToTransferencia); }
export const useMilhasMovimentos=()=>useSharedTable<MilhaMovimento>("milhas_movimentos","milhas_movimentos",fetchMilhasMovimentos);
export const useMilhasLotes=()=>useSharedTable<MilhaLote>("milhas_lotes","milhas_lotes",fetchMilhasLotes);
export const useMilhasTransferencias=()=>useSharedTable<MilhaTransferencia>("milhas_transferencias","milhas_transferencias",fetchMilhasTransferencias);
function refresh(){ ["milhas_movimentos","milhas_lotes","milhas_transferencias"].forEach(invalidateSharedTable); }
export async function salvarCompraMilhas(input:CompraMilhasInput){ const result=await salvarCompraMilhasFn({data:input}); refresh(); return result; }
export async function excluirCompraMilhas(loteId:string){ const result=await excluirCompraMilhasFn({data:{loteId}}); refresh(); return result; }
export async function registrarTransferenciaMilhas(input:TransferenciaMilhasInput){ const result=await registrarTransferenciaMilhasFn({data:input}); refresh(); return result; }

export function custoMilheiro(valorTotal:number, quantidade:number){ return quantidade ? valorTotal/quantidade*1000 : 0; }
export type ResumoPrograma={ programa:ProgramaMilhas; saldo:number; pontosComprados:number; investido:number; custoMedioMilheiro:number; compras:number; utilizados:number };
export function resumoPorProgramaLotes(lotes:MilhaLote[],programa:ProgramaMilhas):ResumoPrograma { const items=lotes.filter(l=>l.programa===programa); const saldo=items.reduce((s,l)=>s+l.quantidadeDisponivel,0); const investido=items.reduce((s,l)=>s+(l.quantidadeDisponivel/1000*l.custoMilheiro),0); return {programa,saldo,pontosComprados:items.reduce((s,l)=>s+l.quantidadeOriginal,0),investido,custoMedioMilheiro:custoMilheiro(investido,saldo),compras:items.filter(l=>l.origem==="compra").length,utilizados:items.reduce((s,l)=>s+l.quantidadeUtilizada,0)}; }
export function resumoGeralLotes(lotes:MilhaLote[]){ const programas=Array.from(new Set<string>([...PROGRAMAS_MILHAS,...lotes.map(l=>l.programa)])); const resumos=programas.map(p=>resumoPorProgramaLotes(lotes,p)); const saldo=resumos.reduce((s,r)=>s+r.saldo,0); const investido=resumos.reduce((s,r)=>s+r.investido,0); return {resumos,saldo,investido,compras:resumos.reduce((s,r)=>s+r.compras,0),custoMedioMilheiro:custoMilheiro(investido,saldo)}; }
// Compatibilidade com telas legadas.
export function resumoPorPrograma(movs:MilhaMovimento[],programa:ProgramaMilhas):ResumoPrograma { const p=movs.filter(m=>m.programa===programa); const entradas=p.filter(m=>m.tipo==="compra"||m.tipo==="estorno"||m.tipo==="transferencia_entrada"); const saidas=p.filter(m=>m.tipo==="utilizacao"||m.tipo==="transferencia_saida"); const pontosComprados=entradas.reduce((s,m)=>s+m.quantidade,0); const investido=entradas.reduce((s,m)=>s+m.valorTotal,0); return {programa,saldo:pontosComprados-saidas.reduce((s,m)=>s+m.quantidade,0),pontosComprados,investido,custoMedioMilheiro:custoMilheiro(investido,pontosComprados),compras:p.filter(m=>m.tipo==="compra").length,utilizados:saidas.reduce((s,m)=>s+m.quantidade,0)}; }
export function resumoGeral(movs:MilhaMovimento[]){ const resumos=Array.from(new Set<string>([...PROGRAMAS_MILHAS,...movs.map(m=>m.programa)])).map(p=>resumoPorPrograma(movs,p)); const saldo=resumos.reduce((s,r)=>s+r.saldo,0),investido=resumos.reduce((s,r)=>s+r.investido,0),pontos=resumos.reduce((s,r)=>s+r.pontosComprados,0); return {resumos,saldo,investido,compras:resumos.reduce((s,r)=>s+r.compras,0),custoMedioMilheiro:custoMilheiro(investido,pontos)}; }
export const formatPontos=(n:number)=>Math.round(n).toLocaleString("pt-BR");

export type MilhasCotacaoInfo={cotacaoId:string;usarMilhas:boolean;programa?:string;quantidade?:number;confirmada:boolean};
export async function sincronizarMilhasCotacao(info:MilhasCotacaoInfo):Promise<{changed:boolean;aviso?:string}>{ try { const result=await sincronizarCotacaoMilhasFn({data:{cotacaoId:info.cotacaoId,ativa:info.confirmada&&info.usarMilhas,programa:info.programa,quantidade:info.quantidade}}); refresh(); return result; } catch(error){ const message=error instanceof Error?error.message:String(error); if(/saldo insuficiente/i.test(message)) return {changed:false,aviso:message}; throw error; } }
