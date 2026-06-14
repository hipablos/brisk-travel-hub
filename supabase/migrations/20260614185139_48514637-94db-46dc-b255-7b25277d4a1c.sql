SELECT cron.unschedule('brisk-telegram-processar-alertas-5min') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'brisk-telegram-processar-alertas-5min'
);

SELECT cron.schedule(
  'brisk-telegram-processar-alertas-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://brisk-travel-crm.lovable.app/api/public/hooks/telegram-processar-alertas',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3dvdGpib3B1cmtjaW1jbWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTI0NzEsImV4cCI6MjA5Mzk2ODQ3MX0.5PV7AVg_028EGUrMBYyLhvXgE6V4461zRtxhfwIMj6U"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);