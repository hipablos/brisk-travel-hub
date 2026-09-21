CREATE OR REPLACE FUNCTION public.milhas_registrar_compra_interno(
  p_user_id uuid, p_data date, p_programa text, p_quantidade integer, p_valor_total numeric,
  p_banco text DEFAULT NULL, p_forma_pagamento text DEFAULT NULL, p_cartao text DEFAULT NULL,
  p_parcelas integer DEFAULT NULL, p_observacoes text DEFAULT NULL, p_chave_idempotencia text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_mov_id uuid; v_op_id uuid; v_lote_id uuid; v_chave text:=COALESCE(p_chave_idempotencia,gen_random_uuid()::text);
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'Usuário inválido'; END IF;
  IF p_quantidade<=0 OR p_valor_total<0 OR trim(COALESCE(p_programa,''))='' THEN RAISE EXCEPTION 'Dados da compra inválidos'; END IF;
  SELECT l.id INTO v_lote_id FROM public.milhas_lotes l JOIN public.milhas_operacoes o ON o.id=l.operacao_origem_id WHERE l.user_id=p_user_id AND o.chave_idempotencia=v_chave;
  IF FOUND THEN RETURN v_lote_id; END IF;
  INSERT INTO public.milhas_movimentos (user_id,data,programa,tipo,quantidade,valor_total,banco,forma_pagamento,cartao,parcelas,observacoes)
    VALUES (p_user_id,p_data,p_programa,'compra',p_quantidade,p_valor_total,NULLIF(p_banco,''),NULLIF(p_forma_pagamento,''),NULLIF(p_cartao,''),p_parcelas,NULLIF(p_observacoes,'')) RETURNING id INTO v_mov_id;
  INSERT INTO public.milhas_operacoes (user_id,movimento_id,tipo,data,programa,quantidade,custo_total,chave_idempotencia,descricao)
    VALUES (p_user_id,v_mov_id,'compra',p_data,p_programa,p_quantidade,p_valor_total,v_chave,'Compra de pontos ou milhas') RETURNING id INTO v_op_id;
  INSERT INTO public.milhas_lotes (user_id,operacao_origem_id,movimento_origem_id,programa,origem,data_entrada,quantidade_original,quantidade_disponivel,custo_total,custo_milheiro,observacoes)
    VALUES (p_user_id,v_op_id,v_mov_id,p_programa,'compra',p_data,p_quantidade,p_quantidade,p_valor_total,(p_valor_total/p_quantidade)*1000,NULLIF(p_observacoes,'')) RETURNING id INTO v_lote_id;
  RETURN v_lote_id;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_registrar_compra_interno(uuid,date,text,integer,numeric,text,text,text,integer,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.milhas_registrar_compra_interno(uuid,date,text,integer,numeric,text,text,text,integer,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.milhas_atualizar_compra_interno(
  p_user_id uuid, p_lote_id uuid, p_data date, p_programa text, p_quantidade integer, p_valor_total numeric,
  p_banco text DEFAULT NULL, p_forma_pagamento text DEFAULT NULL, p_cartao text DEFAULT NULL,
  p_parcelas integer DEFAULT NULL, p_observacoes text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lote public.milhas_lotes%ROWTYPE;
BEGIN
  SELECT * INTO v_lote FROM public.milhas_lotes WHERE id=p_lote_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lote não encontrado'; END IF;
  IF v_lote.origem<>'compra' OR v_lote.quantidade_utilizada>0 THEN RAISE EXCEPTION 'Uma compra já utilizada não pode ser alterada'; END IF;
  IF p_quantidade<=0 OR p_valor_total<0 OR trim(COALESCE(p_programa,''))='' THEN RAISE EXCEPTION 'Dados da compra inválidos'; END IF;
  UPDATE public.milhas_lotes SET programa=p_programa,data_entrada=p_data,quantidade_original=p_quantidade,quantidade_disponivel=p_quantidade,custo_total=p_valor_total,custo_milheiro=(p_valor_total/p_quantidade)*1000,observacoes=NULLIF(p_observacoes,'') WHERE id=p_lote_id;
  UPDATE public.milhas_operacoes SET data=p_data,programa=p_programa,quantidade=p_quantidade,custo_total=p_valor_total WHERE id=v_lote.operacao_origem_id;
  UPDATE public.milhas_movimentos SET data=p_data,programa=p_programa,quantidade=p_quantidade,valor_total=p_valor_total,banco=NULLIF(p_banco,''),forma_pagamento=NULLIF(p_forma_pagamento,''),cartao=NULLIF(p_cartao,''),parcelas=p_parcelas,observacoes=NULLIF(p_observacoes,'') WHERE id=v_lote.movimento_origem_id;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_atualizar_compra_interno(uuid,uuid,date,text,integer,numeric,text,text,text,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.milhas_atualizar_compra_interno(uuid,uuid,date,text,integer,numeric,text,text,text,integer,text) TO service_role;

CREATE OR REPLACE FUNCTION public.milhas_excluir_compra_interno(p_user_id uuid, p_lote_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lote public.milhas_lotes%ROWTYPE;
BEGIN
  SELECT * INTO v_lote FROM public.milhas_lotes WHERE id=p_lote_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lote não encontrado'; END IF;
  IF v_lote.origem<>'compra' OR v_lote.quantidade_utilizada>0 THEN RAISE EXCEPTION 'Uma compra já utilizada não pode ser excluída'; END IF;
  DELETE FROM public.milhas_movimentos WHERE id=v_lote.movimento_origem_id AND user_id=p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_excluir_compra_interno(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.milhas_excluir_compra_interno(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.milhas_registrar_transferencia_interno(
  p_user_id uuid, p_data date, p_programa_origem text, p_programa_destino text, p_quantidade integer,
  p_percentual_bonus numeric DEFAULT 0, p_taxas numeric DEFAULT 0, p_observacoes text DEFAULT NULL,
  p_chave_idempotencia text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_saida_mov uuid; v_saida_op uuid; v_entrada_mov uuid; v_entrada_op uuid; v_lote uuid; v_bonus integer; v_recebida integer; v_custo numeric; v_total numeric; v_chave text:=COALESCE(p_chave_idempotencia,gen_random_uuid()::text);
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'Usuário inválido'; END IF;
  SELECT id INTO v_id FROM public.milhas_transferencias WHERE user_id=p_user_id AND chave_idempotencia=v_chave;
  IF FOUND THEN RETURN v_id; END IF;
  IF p_programa_origem=p_programa_destino OR p_quantidade<=0 OR p_percentual_bonus<0 OR p_taxas<0 THEN RAISE EXCEPTION 'Dados da transferência inválidos'; END IF;
  v_bonus:=round(p_quantidade*p_percentual_bonus/100.0); v_recebida:=p_quantidade+v_bonus;
  INSERT INTO public.milhas_movimentos (user_id,data,programa,tipo,quantidade,valor_total,observacoes)
    VALUES (p_user_id,p_data,p_programa_origem,'transferencia_saida',p_quantidade,0,'Transferência para '||p_programa_destino) RETURNING id INTO v_saida_mov;
  INSERT INTO public.milhas_operacoes (user_id,movimento_id,tipo,data,programa,quantidade,chave_idempotencia,descricao)
    VALUES (p_user_id,v_saida_mov,'transferencia_saida',p_data,p_programa_origem,p_quantidade,'transferencia-saida:'||v_chave,'Transferência para '||p_programa_destino) RETURNING id INTO v_saida_op;
  v_custo:=public.milhas_alocar_fifo(p_user_id,v_saida_op,p_programa_origem,p_quantidade); v_total:=v_custo+p_taxas;
  UPDATE public.milhas_operacoes SET custo_total=v_custo WHERE id=v_saida_op;
  UPDATE public.milhas_movimentos SET valor_total=v_custo WHERE id=v_saida_mov;
  INSERT INTO public.milhas_movimentos (user_id,data,programa,tipo,quantidade,valor_total,observacoes)
    VALUES (p_user_id,p_data,p_programa_destino,'transferencia_entrada',v_recebida,v_total,'Transferência recebida de '||p_programa_origem) RETURNING id INTO v_entrada_mov;
  INSERT INTO public.milhas_operacoes (user_id,movimento_id,tipo,data,programa,quantidade,custo_total,chave_idempotencia,descricao)
    VALUES (p_user_id,v_entrada_mov,'transferencia_entrada',p_data,p_programa_destino,v_recebida,v_total,'transferencia-entrada:'||v_chave,'Transferência recebida de '||p_programa_origem) RETURNING id INTO v_entrada_op;
  INSERT INTO public.milhas_lotes (user_id,operacao_origem_id,movimento_origem_id,programa,origem,data_entrada,quantidade_original,quantidade_disponivel,custo_total,custo_milheiro,observacoes)
    VALUES (p_user_id,v_entrada_op,v_entrada_mov,p_programa_destino,'transferencia',p_data,v_recebida,v_recebida,v_total,(v_total/v_recebida)*1000,NULLIF(p_observacoes,'')) RETURNING id INTO v_lote;
  INSERT INTO public.milhas_transferencias (user_id,data,programa_origem,programa_destino,quantidade_transferida,percentual_bonus,quantidade_bonus,quantidade_recebida,custo_transferido,taxas,custo_total_destino,custo_milheiro_destino,operacao_saida_id,operacao_entrada_id,lote_destino_id,chave_idempotencia,observacoes)
    VALUES (p_user_id,p_data,p_programa_origem,p_programa_destino,p_quantidade,p_percentual_bonus,v_bonus,v_recebida,v_custo,p_taxas,v_total,(v_total/v_recebida)*1000,v_saida_op,v_entrada_op,v_lote,v_chave,NULLIF(p_observacoes,'')) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_registrar_transferencia_interno(uuid,date,text,text,integer,numeric,numeric,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.milhas_registrar_transferencia_interno(uuid,date,text,text,integer,numeric,numeric,text,text) TO service_role;