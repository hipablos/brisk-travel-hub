CREATE OR REPLACE FUNCTION public.milhas_alocar_fifo(
  p_user_id uuid, p_operacao_saida_id uuid, p_programa text, p_quantidade integer
) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_restante integer := p_quantidade;
  v_lote record;
  v_quantidade integer;
  v_custo numeric;
  v_custo_total numeric := 0;
  v_disponivel integer := 0;
BEGIN
  IF p_quantidade <= 0 THEN RAISE EXCEPTION 'A quantidade deve ser maior que zero'; END IF;

  FOR v_lote IN
    SELECT * FROM public.milhas_lotes
    WHERE user_id=p_user_id AND programa=p_programa AND quantidade_disponivel > 0
    ORDER BY data_entrada, created_at, id FOR UPDATE
  LOOP
    v_disponivel := v_disponivel + v_lote.quantidade_disponivel;
  END LOOP;

  IF v_disponivel < p_quantidade THEN
    RAISE EXCEPTION 'Saldo insuficiente em %', p_programa USING ERRCODE = 'P0001';
  END IF;

  FOR v_lote IN
    SELECT * FROM public.milhas_lotes
    WHERE user_id=p_user_id AND programa=p_programa AND quantidade_disponivel > 0
    ORDER BY data_entrada, created_at, id FOR UPDATE
  LOOP
    EXIT WHEN v_restante = 0;
    v_quantidade := LEAST(v_restante, v_lote.quantidade_disponivel);
    v_custo := (v_quantidade::numeric / 1000) * v_lote.custo_milheiro;
    INSERT INTO public.milhas_alocacoes (user_id, operacao_saida_id, lote_id, quantidade, custo_milheiro, custo_total)
      VALUES (p_user_id, p_operacao_saida_id, v_lote.id, v_quantidade, v_lote.custo_milheiro, v_custo);
    UPDATE public.milhas_lotes SET
      quantidade_utilizada = quantidade_utilizada + v_quantidade,
      quantidade_disponivel = quantidade_disponivel - v_quantidade
    WHERE id = v_lote.id;
    v_custo_total := v_custo_total + v_custo;
    v_restante := v_restante - v_quantidade;
  END LOOP;
  RETURN v_custo_total;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_alocar_fifo(uuid,uuid,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.milhas_alocar_fifo(uuid,uuid,text,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.milhas_sincronizar_cotacao_interno(
  p_user_id uuid, p_cotacao_id uuid, p_ativa boolean, p_programa text, p_quantidade integer
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_atual public.milhas_operacoes%ROWTYPE; v_mov_id uuid; v_op_id uuid; v_custo numeric;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_cotacao_id::text, 0));
  SELECT * INTO v_atual FROM public.milhas_operacoes
    WHERE user_id=p_user_id AND cotacao_id=p_cotacao_id AND tipo='utilizacao_cotacao' AND status='ativa'
    ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF FOUND AND p_ativa AND v_atual.programa=p_programa AND v_atual.quantidade=p_quantidade THEN RETURN; END IF;
  IF FOUND THEN PERFORM public.milhas_reverter_operacao(v_atual.id, true); END IF;
  IF NOT p_ativa THEN RETURN; END IF;
  IF p_programa IS NULL OR trim(p_programa)='' OR COALESCE(p_quantidade,0)<=0 THEN
    RAISE EXCEPTION 'Informe o programa e a quantidade de milhas';
  END IF;
  INSERT INTO public.milhas_movimentos (user_id,data,programa,tipo,quantidade,valor_total,observacoes,cotacao_id)
    VALUES (p_user_id,CURRENT_DATE,p_programa,'utilizacao',p_quantidade,0,'Utilização automática de milhas próprias na cotação',p_cotacao_id)
    RETURNING id INTO v_mov_id;
  INSERT INTO public.milhas_operacoes (user_id,movimento_id,tipo,data,programa,quantidade,cotacao_id,chave_idempotencia,descricao)
    VALUES (p_user_id,v_mov_id,'utilizacao_cotacao',CURRENT_DATE,p_programa,p_quantidade,p_cotacao_id,
      'cotacao:'||p_cotacao_id::text||':'||gen_random_uuid()::text,'Utilização automática em cotação') RETURNING id INTO v_op_id;
  v_custo := public.milhas_alocar_fifo(p_user_id,v_op_id,p_programa,p_quantidade);
  UPDATE public.milhas_operacoes SET custo_total=v_custo WHERE id=v_op_id;
  UPDATE public.milhas_movimentos SET valor_total=v_custo WHERE id=v_mov_id;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_sincronizar_cotacao_interno(uuid,uuid,boolean,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.milhas_sincronizar_cotacao_interno(uuid,uuid,boolean,text,integer) TO service_role;