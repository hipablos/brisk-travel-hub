DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.unschedule('brisk-telegram-processar-alertas-5min') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'brisk-telegram-processar-alertas-5min'
);

SELECT cron.unschedule('telegram-checkin-48h') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'telegram-checkin-48h'
);

SELECT cron.schedule(
  'brisk-telegram-processar-alertas-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://brisk-travel-crm.lovable.app/api/public/hooks/telegram-processar-alertas',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYXNlIiwicmVmIjoiaGpnd290amJvcHVya2NpbWNtaWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc3ODM5MjQ3MSwiZXhwIjoyMDkzOTY4NDcxfQ.5PV7AVg_028EGUrMBYyLhvXgE6V4461zRtxhfwIMj6U"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);