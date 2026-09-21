ALTER TABLE public.milhas_operacoes
  ADD COLUMN IF NOT EXISTS valor_venda_milheiro numeric NOT NULL DEFAULT 0 CHECK (valor_venda_milheiro >= 0),
  ADD COLUMN IF NOT EXISTS valor_venda_total numeric NOT NULL DEFAULT 0 CHECK (valor_venda_total >= 0);

CREATE OR REPLACE FUNCTION public.milhas_alocar_lote(
  p_user_id uuid, p_operacao_saida_id uuid, p_lote_id uuid, p_programa text, p_quantidade integer
) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lote public.milhas_lotes%ROWTYPE; v_custo numeric;
BEGIN
  IF p_quantidade <= 0 THEN RAISE EXCEPTION 'A quantidade deve ser maior que zero'; END IF;
  SELECT * INTO v_lote FROM public.milhas_lotes
    WHERE id=p_lote_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lote não encontrado'; END IF;
  IF v_lote.programa<>p_programa THEN RAISE EXCEPTION 'O lote escolhido não pertence ao programa informado'; END IF;
  IF v_lote.quantidade_disponivel<p_quantidade THEN
    RAISE EXCEPTION 'Saldo insuficiente no lote escolhido. Disponível: %', v_lote.quantidade_disponivel;
  END IF;
  v_custo := (p_quantidade::numeric/1000)*v_lote.custo_milheiro;
  INSERT INTO public.milhas_alocacoes(user_id,operacao_saida_id,lote_id,quantidade,custo_milheiro,custo_total)
    VALUES(p_user_id,p_operacao_saida_id,p_lote_id,p_quantidade,v_lote.custo_milheiro,v_custo);
  UPDATE public.milhas_lotes SET quantidade_utilizada=quantidade_utilizada+p_quantidade,
    quantidade_disponivel=quantidade_disponivel-p_quantidade WHERE id=p_lote_id;
  RETURN v_custo;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_alocar_lote(uuid,uuid,uuid,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.milhas_alocar_lote(uuid,uuid,uuid,text,integer) TO service_role;

DROP FUNCTION IF EXISTS public.milhas_sincronizar_cotacao_interno(uuid,uuid,boolean,text,integer);
CREATE OR REPLACE FUNCTION public.milhas_sincronizar_cotacao_interno(
  p_user_id uuid, p_cotacao_id uuid, p_ativa boolean, p_programa text, p_quantidade integer,
  p_lote_id uuid DEFAULT NULL, p_valor_venda_milheiro numeric DEFAULT 0
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_atual public.milhas_operacoes%ROWTYPE; v_mov_id uuid; v_op_id uuid; v_custo numeric; v_lote_atual uuid; v_venda numeric;
BEGIN
  SELECT * INTO v_atual FROM public.milhas_operacoes
    WHERE user_id=p_user_id AND cotacao_id=p_cotacao_id AND tipo='utilizacao_cotacao' AND status='ativa' FOR UPDATE;
  IF FOUND THEN
    SELECT lote_id INTO v_lote_atual FROM public.milhas_alocacoes
      WHERE operacao_saida_id=v_atual.id AND ativa ORDER BY created_at LIMIT 1;
    IF p_ativa AND v_atual.programa=p_programa AND v_atual.quantidade=p_quantidade
       AND (p_lote_id IS NULL OR v_lote_atual=p_lote_id)
       AND v_atual.valor_venda_milheiro=COALESCE(p_valor_venda_milheiro,0) THEN RETURN; END IF;
    PERFORM public.milhas_reverter_operacao(v_atual.id,true);
  END IF;
  IF NOT p_ativa THEN RETURN; END IF;
  IF p_programa IS NULL OR trim(p_programa)='' OR COALESCE(p_quantidade,0)<=0 THEN
    RAISE EXCEPTION 'Informe o programa e a quantidade de milhas';
  END IF;
  IF p_lote_id IS NULL THEN RAISE EXCEPTION 'Escolha o lote de milhas que será utilizado'; END IF;
  IF COALESCE(p_valor_venda_milheiro,0)<0 THEN RAISE EXCEPTION 'O valor de venda do milheiro não pode ser negativo'; END IF;
  v_venda := (p_quantidade::numeric/1000)*COALESCE(p_valor_venda_milheiro,0);
  INSERT INTO public.milhas_movimentos(user_id,data,programa,tipo,quantidade,valor_total,observacoes,cotacao_id)
    VALUES(p_user_id,CURRENT_DATE,p_programa,'utilizacao',p_quantidade,0,'Utilização automática de milhas próprias na cotação',p_cotacao_id)
    RETURNING id INTO v_mov_id;
  INSERT INTO public.milhas_operacoes(user_id,movimento_id,tipo,data,programa,quantidade,cotacao_id,chave_idempotencia,descricao,valor_venda_milheiro,valor_venda_total)
    VALUES(p_user_id,v_mov_id,'utilizacao_cotacao',CURRENT_DATE,p_programa,p_quantidade,p_cotacao_id,
      'cotacao:'||p_cotacao_id::text||':'||gen_random_uuid()::text,'Utilização automática em cotação',COALESCE(p_valor_venda_milheiro,0),v_venda)
    RETURNING id INTO v_op_id;
  v_custo := public.milhas_alocar_lote(p_user_id,v_op_id,p_lote_id,p_programa,p_quantidade);
  UPDATE public.milhas_operacoes SET custo_total=v_custo WHERE id=v_op_id;
  UPDATE public.milhas_movimentos SET valor_total=v_custo WHERE id=v_mov_id;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_sincronizar_cotacao_interno(uuid,uuid,boolean,text,integer,uuid,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.milhas_sincronizar_cotacao_interno(uuid,uuid,boolean,text,integer,uuid,numeric) TO service_role;

CREATE OR REPLACE FUNCTION public.milhas_cotacoes_sync_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_data jsonb; v_status text; v_uid uuid; v_id uuid; v_ativa boolean; v_programa text; v_quantidade integer; v_lote uuid; v_venda numeric;
BEGIN
  IF TG_OP='DELETE' THEN v_data:=OLD.data; v_status:=OLD.status; v_uid:=OLD.user_id; v_id:=OLD.id;
  ELSE v_data:=NEW.data; v_status:=NEW.status; v_uid:=NEW.user_id; v_id:=NEW.id; END IF;
  v_ativa := TG_OP<>'DELETE' AND v_status='aprovado' AND COALESCE((v_data->>'milhasProprias')::boolean,false);
  v_programa := v_data->>'milhasPrograma';
  v_quantidade := COALESCE((v_data->>'milhasQuantidade')::numeric,0)::integer;
  v_lote := NULLIF(v_data->>'milhasLoteId','')::uuid;
  v_venda := COALESCE((v_data->>'milhasValorVendaMilheiro')::numeric,0);
  PERFORM public.milhas_sincronizar_cotacao_interno(v_uid,v_id,v_ativa,v_programa,v_quantidade,v_lote,v_venda);
  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_cotacoes_sync_trigger() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.milhas_excluir_utilizacao_interno(p_user_id uuid,p_operacao_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_op public.milhas_operacoes%ROWTYPE; v_mov uuid;
BEGIN
 SELECT * INTO v_op FROM public.milhas_operacoes WHERE id=p_operacao_id AND user_id=p_user_id AND tipo='utilizacao_cotacao' AND status='ativa' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Utilização ativa não encontrada'; END IF;
 v_mov:=v_op.movimento_id;
 PERFORM public.milhas_reverter_operacao(v_op.id,false);
 DELETE FROM public.milhas_operacoes WHERE id=v_op.id;
 DELETE FROM public.milhas_movimentos WHERE id=v_mov AND user_id=p_user_id;
 UPDATE public.cotacoes SET data=jsonb_set(data,'{milhasProprias}','false'::jsonb,true) WHERE id=v_op.cotacao_id AND user_id=p_user_id;
END; $$;
REVOKE ALL ON FUNCTION public.milhas_excluir_utilizacao_interno(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.milhas_excluir_utilizacao_interno(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.milhas_excluir_transferencia_interno(p_user_id uuid,p_transferencia_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_t public.milhas_transferencias%ROWTYPE; v_lote public.milhas_lotes%ROWTYPE; v_mov_saida uuid; v_mov_entrada uuid;
BEGIN
 SELECT * INTO v_t FROM public.milhas_transferencias WHERE id=p_transferencia_id AND user_id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Transferência não encontrada'; END IF;
 SELECT * INTO v_lote FROM public.milhas_lotes WHERE id=v_t.lote_destino_id FOR UPDATE;
 IF v_lote.quantidade_utilizada>0 THEN RAISE EXCEPTION 'O lote recebido já foi utilizado. Desfaça primeiro as utilizações dependentes'; END IF;
 SELECT movimento_id INTO v_mov_saida FROM public.milhas_operacoes WHERE id=v_t.operacao_saida_id;
 SELECT movimento_id INTO v_mov_entrada FROM public.milhas_operacoes WHERE id=v_t.operacao_entrada_id;
 PERFORM public.milhas_reverter_operacao(v_t.operacao_saida_id,false);
 DELETE FROM public.milhas_transferencias WHERE id=v_t.id;
 DELETE FROM public.milhas_movimentos WHERE id IN(v_mov_saida,v_mov_entrada) AND user_id=p_user_id;
END; $$;
REVOKE ALL ON FUNCTION public.milhas_excluir_transferencia_interno(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.milhas_excluir_transferencia_interno(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.milhas_atualizar_transferencia_interno(
 p_user_id uuid,p_transferencia_id uuid,p_data date,p_programa_origem text,p_programa_destino text,p_quantidade integer,
 p_percentual_bonus numeric,p_taxas numeric,p_observacoes text,p_chave_idempotencia text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM public.milhas_excluir_transferencia_interno(p_user_id,p_transferencia_id);
 RETURN public.milhas_registrar_transferencia_interno(p_user_id,p_data,p_programa_origem,p_programa_destino,p_quantidade,p_percentual_bonus,p_taxas,p_observacoes,p_chave_idempotencia);
END; $$;
REVOKE ALL ON FUNCTION public.milhas_atualizar_transferencia_interno(uuid,uuid,date,text,text,integer,numeric,numeric,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.milhas_atualizar_transferencia_interno(uuid,uuid,date,text,text,integer,numeric,numeric,text,text) TO service_role;