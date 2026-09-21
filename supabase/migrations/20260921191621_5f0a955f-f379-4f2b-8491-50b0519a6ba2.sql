REVOKE EXECUTE ON FUNCTION public.milhas_registrar_compra(date,text,integer,numeric,text,text,text,integer,text,text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.milhas_atualizar_compra(uuid,date,text,integer,numeric,text,text,text,integer,text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.milhas_excluir_compra(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.milhas_registrar_transferencia(date,text,text,integer,numeric,numeric,text,text) FROM authenticated;