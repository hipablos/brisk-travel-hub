ALTER TABLE public.telegram_alertas
ADD CONSTRAINT telegram_alertas_checkin_referencia_trecho
CHECK (
  tipo <> 'Check-in'
  OR referencia ~ ':(ida|volta):[0-9]+$'
) NOT VALID;