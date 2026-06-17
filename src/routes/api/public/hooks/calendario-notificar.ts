import { createFileRoute } from "@tanstack/react-router";

// Cron endpoint: scans calendario_eventos and sends Telegram notifications
// for the configured windows: 1 day before, 2 hours before, or at event time.
// Dedupes via the notif_*_enviado_em timestamps on the row itself.

function eventDateTime(data: string, hora: string | null): Date | null {
  if (!data) return null;
  const [y, m, d] = data.split("-").map(Number);
  if (!y || !m || !d) return null;
  const [hh, mi] = (hora ?? "00:00").split(":").map(Number);
  // Brazil local (BRT, UTC-3) -> UTC
  return new Date(Date.UTC(y, m - 1, d, (hh ?? 0) + 3, mi ?? 0, 0));
}

function fmtBR(date: Date): string {
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

type Slot = {
  key: "notif_um_dia_antes" | "notif_duas_horas_antes" | "notif_no_horario";
  sentKey: "notif_um_dia_enviado_em" | "notif_duas_horas_enviado_em" | "notif_no_horario_enviado_em";
  offsetMs: number;
  label: string;
};

const SLOTS: Slot[] = [
  { key: "notif_um_dia_antes", sentKey: "notif_um_dia_enviado_em", offsetMs: 24 * 60 * 60 * 1000, label: "Em 1 dia" },
  { key: "notif_duas_horas_antes", sentKey: "notif_duas_horas_enviado_em", offsetMs: 2 * 60 * 60 * 1000, label: "Em 2 horas" },
  { key: "notif_no_horario", sentKey: "notif_no_horario_enviado_em", offsetMs: 0, label: "Agora" },
];

export const Route = createFileRoute("/api/public/hooks/calendario-notificar")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const now = Date.now();
          // Run every 5 minutes; allow ±5 min window
          const windowMs = 5 * 60 * 1000;

          const { data: configs, error: cfgErr } = await supabaseAdmin
            .from("telegram_config")
            .select("user_id, token_bot, chat_id, ativo")
            .eq("ativo", true);
          if (cfgErr) return Response.json({ ok: false, error: cfgErr.message }, { status: 500 });

          const { data: eventos, error: evErr } = await (supabaseAdmin.from as any)("calendario_eventos")
            .select("*")
            .or("notif_um_dia_antes.eq.true,notif_duas_horas_antes.eq.true,notif_no_horario.eq.true");
          if (evErr) return Response.json({ ok: false, error: evErr.message }, { status: 500 });

          let enviados = 0, pulados = 0, falhas = 0;

          for (const ev of eventos ?? []) {
            const eventoEm = eventDateTime(ev.data, ev.hora);
            if (!eventoEm) continue;

            for (const slot of SLOTS) {
              if (!ev[slot.key]) continue;
              if (ev[slot.sentKey]) { pulados++; continue; }
              const sendAt = eventoEm.getTime() - slot.offsetMs;
              if (sendAt < now - windowMs || sendAt > now + windowMs) continue;

              const mensagem =
                `🔔 LEMBRETE (${slot.label})\n\n` +
                `${ev.titulo}\n` +
                `Quando: ${fmtBR(eventoEm)}\n` +
                (ev.categoria ? `Categoria: ${ev.categoria}\n` : "") +
                (ev.prioridade ? `Prioridade: ${ev.prioridade}\n` : "") +
                (ev.descricao ? `\n${ev.descricao}` : "");

              const cfg = configs?.find((c: any) => c.user_id === ev.created_by) ?? configs?.[0];
              if (!cfg?.token_bot || !cfg?.chat_id) continue;

              try {
                const resp = await fetch(
                  `https://api.telegram.org/bot${cfg.token_bot}/sendMessage`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: cfg.chat_id, text: mensagem }),
                  }
                );
                if (!resp.ok) {
                  falhas++;
                  continue;
                }
                enviados++;
                await (supabaseAdmin.from as any)("calendario_eventos")
                  .update({ [slot.sentKey]: new Date().toISOString() })
                  .eq("id", ev.id);
                await supabaseAdmin.from("telegram_envios").insert({
                  user_id: cfg.user_id,
                  tipo: "calendario_lembrete",
                  mensagem,
                  status: "enviado",
                  referencia: `${ev.id}:${slot.key}`,
                });
              } catch (e: any) {
                falhas++;
              }
            }
          }

          return Response.json({ ok: true, enviados, pulados, falhas });
        } catch (e: any) {
          return Response.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
        }
      },
      GET: async () => new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } }),
    },
  },
});
