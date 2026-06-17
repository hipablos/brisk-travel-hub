-- Enable extensions for cron + http
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing job with the same name if present (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'calendario-notificar-5min') THEN
    PERFORM cron.unschedule('calendario-notificar-5min');
  END IF;
END $$;

-- Schedule every 5 minutes — hits the public hook that scans calendario_eventos and dispatches Telegram alerts
SELECT cron.schedule(
  'calendario-notificar-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--32710a1f-f789-4390-b345-dec227d42652-dev.lovable.app/api/public/hooks/calendario-notificar',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3dvdGpib3B1cmtjaW1jbWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTI0NzEsImV4cCI6MjA5Mzk2ODQ3MX0.5PV7AVg_028EGUrMBYyLhvXgE6V4461zRtxhfwIMj6U"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);