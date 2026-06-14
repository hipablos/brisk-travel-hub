import { createFileRoute } from "@tanstack/react-router";
import { buildCheckinAlertFromCotacao } from "@/lib/telegram-alertas";

type TelegramConfig = {
  user_id: string;
  token_bot: string | null;
  chat_id: string | null;
  ativo: boolean;
  notificar_checkin: boolean;
};

type PendingAlert = {
  id: string;
  user_id: string;
  tipo: string;
  referencia: string;
  mensagem: string;
};

function historyType(tipo: string) {
  return tipo === "Check-in" ? "checkin_48h" : tipo.toLowerCase().replace(/\s+/g, "_");
}

async function sendTelegram(token: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.slice(0, 500)}`);
  try {
    const json = JSON.parse(body) as { ok?: boolean; description?: string };
    if (!json.ok) throw new Error(json.description || "Resposta inválida do Telegram");
  } catch (error) {
    if (error instanceof SyntaxError) return;
    throw error;
  }
}

export const Route = createFileRoute("/api/public/hooks/telegram-processar-alertas")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedApiKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        const apiKey = request.headers.get("apikey");
        if (expectedApiKey && apiKey !== expectedApiKey) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const checkedAt = new Date().toISOString();

        const { data: configs, error: configError } = await supabaseAdmin
          .from("telegram_config")
          .select("user_id, token_bot, chat_id, ativo, notificar_checkin");

        if (configError) {
          return Response.json({ ok: false, error: configError.message }, { status: 500 });
        }

        const configByUser = new Map<string, TelegramConfig>();
        for (const cfg of (configs ?? []) as TelegramConfig[]) {
          configByUser.set(cfg.user_id, cfg);
          await supabaseAdmin.from("telegram_rotina_status").upsert(
            {
              user_id: cfg.user_id,
              ultima_verificacao: checkedAt,
              status: cfg.ativo && cfg.token_bot && cfg.chat_id ? "Ativa" : "Inativa",
              erro: null,
            },
            { onConflict: "user_id" },
          );
        }

        for (const cfg of (configs ?? []) as TelegramConfig[]) {
          if (!cfg.ativo || !cfg.notificar_checkin) continue;

          const { data: cotacoes } = await supabaseAdmin
            .from("cotacoes")
            .select("id, code, data")
            .eq("user_id", cfg.user_id)
            .eq("status", "aprovado");

          for (const cotacao of cotacoes ?? []) {
            const alert = buildCheckinAlertFromCotacao(cotacao);
            if (!alert || alert.eventoEm.getTime() < Date.now()) continue;

            const { data: existing } = await supabaseAdmin
              .from("telegram_alertas")
              .select("id, status")
              .eq("user_id", cfg.user_id)
              .eq("tipo", alert.tipo)
              .eq("referencia", alert.referencia)
              .maybeSingle();

            if (!existing) {
              await supabaseAdmin.from("telegram_alertas").insert({
                user_id: cfg.user_id,
                tipo: alert.tipo,
                referencia: alert.referencia,
                cliente: alert.cliente,
                numero_voo: alert.numeroVoo,
                origem: alert.origem,
                destino: alert.destino,
                evento_em: alert.eventoEm.toISOString(),
                enviar_em: alert.enviarEm.toISOString(),
                mensagem: alert.mensagem,
                metadata: alert.metadata,
              });
            } else if (existing.status === "Pendente") {
              await supabaseAdmin
                .from("telegram_alertas")
                .update({
                  cliente: alert.cliente,
                  numero_voo: alert.numeroVoo,
                  origem: alert.origem,
                  destino: alert.destino,
                  evento_em: alert.eventoEm.toISOString(),
                  enviar_em: alert.enviarEm.toISOString(),
                  mensagem: alert.mensagem,
                  metadata: alert.metadata,
                  erro: null,
                })
                .eq("id", existing.id);
            }
          }
        }

        const { data: pending, error: pendingError } = await supabaseAdmin
          .from("telegram_alertas")
          .select("id, user_id, tipo, referencia, mensagem")
          .eq("status", "Pendente")
          .lte("enviar_em", checkedAt)
          .order("enviar_em", { ascending: true })
          .limit(100);

        if (pendingError) {
          return Response.json({ ok: false, error: pendingError.message }, { status: 500 });
        }

        let processados = 0;
        let enviados = 0;
        let falhas = 0;
        let ignorados = 0;

        for (const alert of (pending ?? []) as PendingAlert[]) {
          const cfg = configByUser.get(alert.user_id);
          if (!cfg?.ativo || !cfg.token_bot || !cfg.chat_id) {
            ignorados++;
            await supabaseAdmin.from("telegram_rotina_status").upsert(
              {
                user_id: alert.user_id,
                ultima_verificacao: checkedAt,
                status: "Inativa",
                erro: "Integração do Telegram inativa ou incompleta.",
              },
              { onConflict: "user_id" },
            );
            continue;
          }

          const { data: locked } = await supabaseAdmin
            .from("telegram_alertas")
            .update({ status: "Processando", erro: null })
            .eq("id", alert.id)
            .eq("status", "Pendente")
            .select("id")
            .maybeSingle();

          if (!locked) {
            ignorados++;
            continue;
          }

          let status: "enviado" | "falhou" = "enviado";
          let erro: string | null = null;

          try {
            await sendTelegram(cfg.token_bot, cfg.chat_id, alert.mensagem);
            enviados++;
          } catch (error) {
            status = "falhou";
            erro = error instanceof Error ? error.message.slice(0, 500) : "Falha desconhecida";
            falhas++;
          }

          await supabaseAdmin.from("telegram_envios").insert({
            user_id: alert.user_id,
            tipo: historyType(alert.tipo),
            mensagem: alert.mensagem,
            status,
            erro,
            referencia: alert.referencia,
          });

          await supabaseAdmin
            .from("telegram_alertas")
            .update({
              status: status === "enviado" ? "Enviado" : "Falhou",
              erro,
              processed_at: new Date().toISOString(),
            })
            .eq("id", alert.id);

          processados++;
          const { data: currentStatus } = await supabaseAdmin
            .from("telegram_rotina_status")
            .select("alertas_processados")
            .eq("user_id", alert.user_id)
            .maybeSingle();

          await supabaseAdmin.from("telegram_rotina_status").upsert(
            {
              user_id: alert.user_id,
              ultima_verificacao: checkedAt,
              alertas_processados: (currentStatus?.alertas_processados ?? 0) + 1,
              status: "Ativa",
              erro,
            },
            { onConflict: "user_id" },
          );
        }

        return Response.json({ ok: true, processados, enviados, falhas, ignorados });
      },
      GET: async () =>
        new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } }),
    },
  },
});