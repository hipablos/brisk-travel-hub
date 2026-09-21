ALTER TABLE public.milhas_movimentos DROP CONSTRAINT milhas_movimentos_tipo_check;
ALTER TABLE public.milhas_movimentos ADD CONSTRAINT milhas_movimentos_tipo_check
  CHECK (tipo IN ('compra','utilizacao','estorno','ajuste','transferencia_saida','transferencia_entrada'));
DROP INDEX IF EXISTS public.milhas_utilizacao_unica_por_cotacao;

CREATE TABLE public.milhas_operacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  movimento_id uuid UNIQUE REFERENCES public.milhas_movimentos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('compra','utilizacao_cotacao','estorno_cotacao','transferencia_saida','transferencia_entrada','ajuste')),
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa','estornada')),
  data date NOT NULL DEFAULT CURRENT_DATE,
  programa text NOT NULL,
  quantidade integer NOT NULL CHECK (quantidade > 0),
  custo_total numeric NOT NULL DEFAULT 0 CHECK (custo_total >= 0),
  cotacao_id uuid REFERENCES public.cotacoes(id) ON DELETE SET NULL,
  operacao_estornada_id uuid REFERENCES public.milhas_operacoes(id) ON DELETE RESTRICT,
  chave_idempotencia text,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, chave_idempotencia)
);
GRANT SELECT ON public.milhas_operacoes TO authenticated;
GRANT ALL ON public.milhas_operacoes TO service_role;
ALTER TABLE public.milhas_operacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milhas_operacoes_select_own" ON public.milhas_operacoes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX milhas_operacao_cotacao_ativa_unq
  ON public.milhas_operacoes (user_id, cotacao_id)
  WHERE tipo = 'utilizacao_cotacao' AND status = 'ativa' AND cotacao_id IS NOT NULL;
CREATE INDEX milhas_operacoes_user_data_idx ON public.milhas_operacoes (user_id, data DESC, created_at DESC);
CREATE TRIGGER milhas_operacoes_set_updated_at BEFORE UPDATE ON public.milhas_operacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.milhas_lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operacao_origem_id uuid NOT NULL UNIQUE REFERENCES public.milhas_operacoes(id) ON DELETE CASCADE,
  movimento_origem_id uuid UNIQUE REFERENCES public.milhas_movimentos(id) ON DELETE SET NULL,
  programa text NOT NULL,
  origem text NOT NULL CHECK (origem IN ('compra','transferencia','ajuste','estorno_legado','saldo_legado')),
  data_entrada date NOT NULL,
  quantidade_original integer NOT NULL CHECK (quantidade_original > 0),
  quantidade_utilizada integer NOT NULL DEFAULT 0 CHECK (quantidade_utilizada >= 0),
  quantidade_disponivel integer NOT NULL CHECK (quantidade_disponivel >= 0),
  custo_total numeric NOT NULL DEFAULT 0 CHECK (custo_total >= 0),
  custo_milheiro numeric NOT NULL DEFAULT 0 CHECK (custo_milheiro >= 0),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (quantidade_utilizada + quantidade_disponivel = quantidade_original)
);
GRANT SELECT ON public.milhas_lotes TO authenticated;
GRANT ALL ON public.milhas_lotes TO service_role;
ALTER TABLE public.milhas_lotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milhas_lotes_select_own" ON public.milhas_lotes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX milhas_lotes_fifo_idx ON public.milhas_lotes (user_id, programa, data_entrada, created_at, id)
  WHERE quantidade_disponivel > 0;
CREATE TRIGGER milhas_lotes_set_updated_at BEFORE UPDATE ON public.milhas_lotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.milhas_alocacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operacao_saida_id uuid NOT NULL REFERENCES public.milhas_operacoes(id) ON DELETE CASCADE,
  lote_id uuid NOT NULL REFERENCES public.milhas_lotes(id) ON DELETE RESTRICT,
  quantidade integer NOT NULL CHECK (quantidade > 0),
  custo_milheiro numeric NOT NULL CHECK (custo_milheiro >= 0),
  custo_total numeric NOT NULL CHECK (custo_total >= 0),
  ativa boolean NOT NULL DEFAULT true,
  estornada_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.milhas_alocacoes TO authenticated;
GRANT ALL ON public.milhas_alocacoes TO service_role;
ALTER TABLE public.milhas_alocacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milhas_alocacoes_select_own" ON public.milhas_alocacoes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX milhas_alocacoes_saida_idx ON public.milhas_alocacoes (operacao_saida_id, ativa);
CREATE INDEX milhas_alocacoes_lote_idx ON public.milhas_alocacoes (lote_id, ativa);

CREATE TABLE public.milhas_transferencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  programa_origem text NOT NULL,
  programa_destino text NOT NULL,
  quantidade_transferida integer NOT NULL CHECK (quantidade_transferida > 0),
  percentual_bonus numeric NOT NULL DEFAULT 0 CHECK (percentual_bonus >= 0),
  quantidade_bonus integer NOT NULL DEFAULT 0 CHECK (quantidade_bonus >= 0),
  quantidade_recebida integer NOT NULL CHECK (quantidade_recebida > 0),
  custo_transferido numeric NOT NULL CHECK (custo_transferido >= 0),
  taxas numeric NOT NULL DEFAULT 0 CHECK (taxas >= 0),
  custo_total_destino numeric NOT NULL CHECK (custo_total_destino >= 0),
  custo_milheiro_destino numeric NOT NULL CHECK (custo_milheiro_destino >= 0),
  operacao_saida_id uuid NOT NULL UNIQUE REFERENCES public.milhas_operacoes(id) ON DELETE RESTRICT,
  operacao_entrada_id uuid NOT NULL UNIQUE REFERENCES public.milhas_operacoes(id) ON DELETE RESTRICT,
  lote_destino_id uuid NOT NULL UNIQUE REFERENCES public.milhas_lotes(id) ON DELETE RESTRICT,
  chave_idempotencia text NOT NULL,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (programa_origem <> programa_destino),
  UNIQUE (user_id, chave_idempotencia)
);
GRANT SELECT ON public.milhas_transferencias TO authenticated;
GRANT ALL ON public.milhas_transferencias TO service_role;
ALTER TABLE public.milhas_transferencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milhas_transferencias_select_own" ON public.milhas_transferencias
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX milhas_transferencias_user_data_idx ON public.milhas_transferencias (user_id, data DESC, created_at DESC);

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
BEGIN
  IF p_quantidade <= 0 THEN RAISE EXCEPTION 'A quantidade deve ser maior que zero'; END IF;
  IF COALESCE((SELECT SUM(quantidade_disponivel) FROM public.milhas_lotes WHERE user_id=p_user_id AND programa=p_programa),0) < p_quantidade THEN
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

CREATE OR REPLACE FUNCTION public.milhas_reverter_operacao(p_operacao_id uuid, p_criar_estorno boolean DEFAULT true)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_op public.milhas_operacoes%ROWTYPE;
BEGIN
  SELECT * INTO v_op FROM public.milhas_operacoes WHERE id=p_operacao_id AND status='ativa' FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  UPDATE public.milhas_lotes l SET
    quantidade_utilizada = quantidade_utilizada - a.quantidade,
    quantidade_disponivel = quantidade_disponivel + a.quantidade
  FROM public.milhas_alocacoes a
  WHERE a.operacao_saida_id=v_op.id AND a.lote_id=l.id AND a.ativa;
  UPDATE public.milhas_alocacoes SET ativa=false, estornada_em=now()
    WHERE operacao_saida_id=v_op.id AND ativa;
  UPDATE public.milhas_operacoes SET status='estornada' WHERE id=v_op.id;
  IF p_criar_estorno THEN
    WITH mov AS (
      INSERT INTO public.milhas_movimentos (user_id,data,programa,tipo,quantidade,valor_total,observacoes,cotacao_id)
      VALUES (v_op.user_id,CURRENT_DATE,v_op.programa,'estorno',v_op.quantidade,v_op.custo_total,'Estorno automático da utilização',v_op.cotacao_id)
      RETURNING id
    )
    INSERT INTO public.milhas_operacoes (user_id,movimento_id,tipo,status,data,programa,quantidade,custo_total,cotacao_id,operacao_estornada_id,descricao)
      SELECT v_op.user_id,id,'estorno_cotacao','ativa',CURRENT_DATE,v_op.programa,v_op.quantidade,v_op.custo_total,v_op.cotacao_id,v_op.id,'Estorno automático da utilização' FROM mov;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_reverter_operacao(uuid,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.milhas_reverter_operacao(uuid,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.milhas_sincronizar_cotacao_interno(
  p_user_id uuid, p_cotacao_id uuid, p_ativa boolean, p_programa text, p_quantidade integer
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_atual public.milhas_operacoes%ROWTYPE; v_mov_id uuid; v_op_id uuid; v_custo numeric;
BEGIN
  SELECT * INTO v_atual FROM public.milhas_operacoes
    WHERE user_id=p_user_id AND cotacao_id=p_cotacao_id AND tipo='utilizacao_cotacao' AND status='ativa'
    FOR UPDATE;
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

CREATE OR REPLACE FUNCTION public.milhas_cotacoes_sync_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_data jsonb; v_status text; v_uid uuid; v_id uuid; v_ativa boolean; v_programa text; v_quantidade integer;
BEGIN
  IF TG_OP='DELETE' THEN v_data:=OLD.data; v_status:=OLD.status; v_uid:=OLD.user_id; v_id:=OLD.id;
  ELSE v_data:=NEW.data; v_status:=NEW.status; v_uid:=NEW.user_id; v_id:=NEW.id; END IF;
  v_ativa := TG_OP<>'DELETE' AND v_status='aprovado' AND COALESCE((v_data->>'milhasProprias')::boolean,false);
  v_programa := v_data->>'milhasPrograma';
  v_quantidade := COALESCE((v_data->>'milhasQuantidade')::numeric,0)::integer;
  PERFORM public.milhas_sincronizar_cotacao_interno(v_uid,v_id,v_ativa,v_programa,v_quantidade);
  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_cotacoes_sync_trigger() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER cotacoes_milhas_fifo_sync
AFTER INSERT OR UPDATE OF status, data OR DELETE ON public.cotacoes
FOR EACH ROW EXECUTE FUNCTION public.milhas_cotacoes_sync_trigger();

CREATE OR REPLACE FUNCTION public.milhas_registrar_compra(
  p_data date, p_programa text, p_quantidade integer, p_valor_total numeric,
  p_banco text DEFAULT NULL, p_forma_pagamento text DEFAULT NULL, p_cartao text DEFAULT NULL,
  p_parcelas integer DEFAULT NULL, p_observacoes text DEFAULT NULL, p_chave_idempotencia text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid:=auth.uid(); v_mov_id uuid; v_op_id uuid; v_lote_id uuid; v_chave text:=COALESCE(p_chave_idempotencia,gen_random_uuid()::text);
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_quantidade<=0 OR p_valor_total<0 OR trim(COALESCE(p_programa,''))='' THEN RAISE EXCEPTION 'Dados da compra inválidos'; END IF;
  SELECT id INTO v_lote_id FROM public.milhas_lotes WHERE user_id=v_uid AND operacao_origem_id=(SELECT id FROM public.milhas_operacoes WHERE user_id=v_uid AND chave_idempotencia=v_chave);
  IF FOUND THEN RETURN v_lote_id; END IF;
  INSERT INTO public.milhas_movimentos (user_id,data,programa,tipo,quantidade,valor_total,banco,forma_pagamento,cartao,parcelas,observacoes)
    VALUES (v_uid,p_data,p_programa,'compra',p_quantidade,p_valor_total,NULLIF(p_banco,''),NULLIF(p_forma_pagamento,''),NULLIF(p_cartao,''),p_parcelas,NULLIF(p_observacoes,'')) RETURNING id INTO v_mov_id;
  INSERT INTO public.milhas_operacoes (user_id,movimento_id,tipo,data,programa,quantidade,custo_total,chave_idempotencia,descricao)
    VALUES (v_uid,v_mov_id,'compra',p_data,p_programa,p_quantidade,p_valor_total,v_chave,'Compra de pontos ou milhas') RETURNING id INTO v_op_id;
  INSERT INTO public.milhas_lotes (user_id,operacao_origem_id,movimento_origem_id,programa,origem,data_entrada,quantidade_original,quantidade_disponivel,custo_total,custo_milheiro,observacoes)
    VALUES (v_uid,v_op_id,v_mov_id,p_programa,'compra',p_data,p_quantidade,p_quantidade,p_valor_total,(p_valor_total/p_quantidade)*1000,NULLIF(p_observacoes,'')) RETURNING id INTO v_lote_id;
  RETURN v_lote_id;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_registrar_compra(date,text,integer,numeric,text,text,text,integer,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.milhas_registrar_compra(date,text,integer,numeric,text,text,text,integer,text,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.milhas_atualizar_compra(
  p_lote_id uuid, p_data date, p_programa text, p_quantidade integer, p_valor_total numeric,
  p_banco text DEFAULT NULL, p_forma_pagamento text DEFAULT NULL, p_cartao text DEFAULT NULL,
  p_parcelas integer DEFAULT NULL, p_observacoes text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid:=auth.uid(); v_lote public.milhas_lotes%ROWTYPE; v_mov uuid;
BEGIN
  SELECT * INTO v_lote FROM public.milhas_lotes WHERE id=p_lote_id AND user_id=v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lote não encontrado'; END IF;
  IF v_lote.origem<>'compra' OR v_lote.quantidade_utilizada>0 THEN RAISE EXCEPTION 'Uma compra já utilizada não pode ser alterada'; END IF;
  IF p_quantidade<=0 OR p_valor_total<0 THEN RAISE EXCEPTION 'Dados da compra inválidos'; END IF;
  v_mov:=v_lote.movimento_origem_id;
  UPDATE public.milhas_lotes SET programa=p_programa,data_entrada=p_data,quantidade_original=p_quantidade,quantidade_disponivel=p_quantidade,custo_total=p_valor_total,custo_milheiro=(p_valor_total/p_quantidade)*1000,observacoes=NULLIF(p_observacoes,'') WHERE id=p_lote_id;
  UPDATE public.milhas_operacoes SET data=p_data,programa=p_programa,quantidade=p_quantidade,custo_total=p_valor_total WHERE id=v_lote.operacao_origem_id;
  UPDATE public.milhas_movimentos SET data=p_data,programa=p_programa,quantidade=p_quantidade,valor_total=p_valor_total,banco=NULLIF(p_banco,''),forma_pagamento=NULLIF(p_forma_pagamento,''),cartao=NULLIF(p_cartao,''),parcelas=p_parcelas,observacoes=NULLIF(p_observacoes,'') WHERE id=v_mov;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_atualizar_compra(uuid,date,text,integer,numeric,text,text,text,integer,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.milhas_atualizar_compra(uuid,date,text,integer,numeric,text,text,text,integer,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.milhas_excluir_compra(p_lote_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid:=auth.uid(); v_lote public.milhas_lotes%ROWTYPE;
BEGIN
  SELECT * INTO v_lote FROM public.milhas_lotes WHERE id=p_lote_id AND user_id=v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lote não encontrado'; END IF;
  IF v_lote.origem<>'compra' OR v_lote.quantidade_utilizada>0 THEN RAISE EXCEPTION 'Uma compra já utilizada não pode ser excluída'; END IF;
  DELETE FROM public.milhas_movimentos WHERE id=v_lote.movimento_origem_id AND user_id=v_uid;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_excluir_compra(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.milhas_excluir_compra(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.milhas_registrar_transferencia(
  p_data date, p_programa_origem text, p_programa_destino text, p_quantidade integer,
  p_percentual_bonus numeric DEFAULT 0, p_taxas numeric DEFAULT 0, p_observacoes text DEFAULT NULL,
  p_chave_idempotencia text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid:=auth.uid(); v_id uuid; v_saida_mov uuid; v_saida_op uuid; v_entrada_mov uuid; v_entrada_op uuid; v_lote uuid; v_bonus integer; v_recebida integer; v_custo numeric; v_total numeric; v_chave text:=COALESCE(p_chave_idempotencia,gen_random_uuid()::text);
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT id INTO v_id FROM public.milhas_transferencias WHERE user_id=v_uid AND chave_idempotencia=v_chave;
  IF FOUND THEN RETURN v_id; END IF;
  IF p_programa_origem=p_programa_destino OR p_quantidade<=0 OR p_percentual_bonus<0 OR p_taxas<0 THEN RAISE EXCEPTION 'Dados da transferência inválidos'; END IF;
  v_bonus:=round(p_quantidade*p_percentual_bonus/100.0); v_recebida:=p_quantidade+v_bonus;
  INSERT INTO public.milhas_movimentos (user_id,data,programa,tipo,quantidade,valor_total,observacoes)
    VALUES (v_uid,p_data,p_programa_origem,'transferencia_saida',p_quantidade,0,'Transferência para '||p_programa_destino) RETURNING id INTO v_saida_mov;
  INSERT INTO public.milhas_operacoes (user_id,movimento_id,tipo,data,programa,quantidade,chave_idempotencia,descricao)
    VALUES (v_uid,v_saida_mov,'transferencia_saida',p_data,p_programa_origem,p_quantidade,'transferencia-saida:'||v_chave,'Transferência para '||p_programa_destino) RETURNING id INTO v_saida_op;
  v_custo:=public.milhas_alocar_fifo(v_uid,v_saida_op,p_programa_origem,p_quantidade); v_total:=v_custo+p_taxas;
  UPDATE public.milhas_operacoes SET custo_total=v_custo WHERE id=v_saida_op;
  UPDATE public.milhas_movimentos SET valor_total=v_custo WHERE id=v_saida_mov;
  INSERT INTO public.milhas_movimentos (user_id,data,programa,tipo,quantidade,valor_total,observacoes)
    VALUES (v_uid,p_data,p_programa_destino,'transferencia_entrada',v_recebida,v_total,'Transferência recebida de '||p_programa_origem) RETURNING id INTO v_entrada_mov;
  INSERT INTO public.milhas_operacoes (user_id,movimento_id,tipo,data,programa,quantidade,custo_total,chave_idempotencia,descricao)
    VALUES (v_uid,v_entrada_mov,'transferencia_entrada',p_data,p_programa_destino,v_recebida,v_total,'transferencia-entrada:'||v_chave,'Transferência recebida de '||p_programa_origem) RETURNING id INTO v_entrada_op;
  INSERT INTO public.milhas_lotes (user_id,operacao_origem_id,movimento_origem_id,programa,origem,data_entrada,quantidade_original,quantidade_disponivel,custo_total,custo_milheiro,observacoes)
    VALUES (v_uid,v_entrada_op,v_entrada_mov,p_programa_destino,'transferencia',p_data,v_recebida,v_recebida,v_total,(v_total/v_recebida)*1000,NULLIF(p_observacoes,'')) RETURNING id INTO v_lote;
  INSERT INTO public.milhas_transferencias (user_id,data,programa_origem,programa_destino,quantidade_transferida,percentual_bonus,quantidade_bonus,quantidade_recebida,custo_transferido,taxas,custo_total_destino,custo_milheiro_destino,operacao_saida_id,operacao_entrada_id,lote_destino_id,chave_idempotencia,observacoes)
    VALUES (v_uid,p_data,p_programa_origem,p_programa_destino,p_quantidade,p_percentual_bonus,v_bonus,v_recebida,v_custo,p_taxas,v_total,(v_total/v_recebida)*1000,v_saida_op,v_entrada_op,v_lote,v_chave,NULLIF(p_observacoes,'')) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.milhas_registrar_transferencia(date,text,text,integer,numeric,numeric,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.milhas_registrar_transferencia(date,text,text,integer,numeric,numeric,text,text) TO authenticated, service_role;

INSERT INTO public.milhas_operacoes (user_id,movimento_id,tipo,status,data,programa,quantidade,custo_total,cotacao_id,chave_idempotencia,descricao,created_at)
SELECT m.user_id,m.id,
  CASE m.tipo WHEN 'compra' THEN 'compra' WHEN 'utilizacao' THEN 'utilizacao_cotacao' WHEN 'estorno' THEN 'estorno_cotacao' ELSE 'ajuste' END,
  'ativa',m.data,m.programa,m.quantidade,COALESCE(m.valor_total,0),m.cotacao_id,'legado:'||m.id::text,m.observacoes,m.created_at
FROM public.milhas_movimentos m
WHERE m.tipo IN ('compra','utilizacao','estorno','ajuste') AND m.quantidade>0
ON CONFLICT (movimento_id) DO NOTHING;

INSERT INTO public.milhas_lotes (user_id,operacao_origem_id,movimento_origem_id,programa,origem,data_entrada,quantidade_original,quantidade_disponivel,custo_total,custo_milheiro,observacoes,created_at)
SELECT o.user_id,o.id,o.movimento_id,o.programa,
  CASE WHEN o.tipo='compra' THEN 'compra' ELSE 'estorno_legado' END,
  o.data,o.quantidade,o.quantidade,o.custo_total,
  CASE WHEN o.quantidade>0 THEN (o.custo_total/o.quantidade)*1000 ELSE 0 END,o.descricao,o.created_at
FROM public.milhas_operacoes o
WHERE o.tipo IN ('compra','estorno_cotacao')
ON CONFLICT (operacao_origem_id) DO NOTHING;

DO $$
DECLARE v_op record; v_disp integer; v_deficit integer; v_legacy_op uuid; v_legacy_mov uuid; v_lote uuid; v_custo numeric;
BEGIN
  FOR v_op IN SELECT * FROM public.milhas_operacoes WHERE tipo='utilizacao_cotacao' ORDER BY data,created_at,id LOOP
    SELECT COALESCE(SUM(quantidade_disponivel),0) INTO v_disp FROM public.milhas_lotes WHERE user_id=v_op.user_id AND programa=v_op.programa;
    IF v_disp < v_op.quantidade THEN
      v_deficit:=v_op.quantidade-v_disp;
      INSERT INTO public.milhas_movimentos(user_id,data,programa,tipo,quantidade,valor_total,observacoes)
        VALUES(v_op.user_id,v_op.data,v_op.programa,'ajuste',v_deficit,0,'Saldo legado necessário para preservar histórico') RETURNING id INTO v_legacy_mov;
      INSERT INTO public.milhas_operacoes(user_id,movimento_id,tipo,data,programa,quantidade,custo_total,chave_idempotencia,descricao,created_at)
        VALUES(v_op.user_id,v_legacy_mov,'ajuste',v_op.data,v_op.programa,v_deficit,0,'saldo-legado:'||v_op.id::text,'Saldo legado necessário para preservar histórico',v_op.created_at) RETURNING id INTO v_legacy_op;
      INSERT INTO public.milhas_lotes(user_id,operacao_origem_id,movimento_origem_id,programa,origem,data_entrada,quantidade_original,quantidade_disponivel,custo_total,custo_milheiro,observacoes,created_at)
        VALUES(v_op.user_id,v_legacy_op,v_legacy_mov,v_op.programa,'saldo_legado',v_op.data,v_deficit,v_deficit,0,0,'Saldo legado necessário para preservar histórico',v_op.created_at) RETURNING id INTO v_lote;
    END IF;
    v_custo:=public.milhas_alocar_fifo(v_op.user_id,v_op.id,v_op.programa,v_op.quantidade);
    UPDATE public.milhas_operacoes SET custo_total=v_custo WHERE id=v_op.id;
    UPDATE public.milhas_movimentos SET valor_total=v_custo WHERE id=v_op.movimento_id;
  END LOOP;
END $$;