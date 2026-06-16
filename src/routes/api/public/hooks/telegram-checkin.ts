import { createFileRoute } from "@tanstack/react-router";

// Cron-driven endpoint: looks for approved sales whose first flight departs in ~48h
// and sends a Telegram check-in alert. Deduped via telegram_envios.referencia.

type Voo = {
  origem?: string;
  destino?: string;
  data?: string; // DD-MM-AAAA
  horaSaida?: string; // HH:MM
  companhia?: string;
  numeroVoo?: string;
};

function parseDepartureMs(voo: Voo | undefined): number | null {
  if (!voo?.data || !voo?.horaSaida) return null;
  const md = /^(\d{2})-(\d{2})-(\d{4})$/.exec(voo.data.trim());
  const mt = /^(\d{2}):(\d{2})$/.exec(voo.horaSaida.trim());
  if (!md || !mt) return null;
  const [, dd, mm, yyyy] = md;
  const [, hh, mi] = mt;
  // Brazil local time -> UTC (BRT is UTC-3, no DST)
  return Date.UTC(+yyyy, +mm - 1, +dd, +hh + 3, +mi, 0);
}

function fmtDateTimeBR(voo: Voo): string {
  const d = voo.data ?? "";
  const t = voo.horaSaida ?? "";
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(d);
  return m ? `${m[1]}/${m[2]}/${m[3]} ${t}` : `${d} ${t}`.trim();
}

export const Route = createFileRoute("/api/public/hooks/telegram-checkin")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: configs, error: cfgErr } = await supabaseAdmin
            .from("telegram_config")
            .select("user_id, token_bot, chat_id, ativo, notificar_checkin")
            .eq("ativo", true)
            .eq("notificar_checkin", true);

          if (cfgErr) {
            return Response.json({ ok: false, error: cfgErr.message }, { status: 500 });
          }

          const now = Date.now();
          // Window: 47h30 - 48h30 (cron runs every 30 min)
          const lo = now + (48 * 60 - 30) * 60 * 1000;
          const hi = now + (48 * 60 + 30) * 60 * 1000;

          let enviados = 0;
          let pulados = 0;
          let falhas = 0;

          for (const cfg of configs ?? []) {
            if (!cfg.token_bot || !cfg.chat_id) continue;

            const { data: cots } = await supabaseAdmin
              .from("cotacoes")
              .select("id, code, data")
              .eq("user_id", cfg.user_id)
              .eq("status", "aprovado");

            for (const cot of cots ?? []) {
              const d = (cot.data ?? {}) as Record<string, unknown>;
              const idas = (Array.isArray(d.vooIdas) ? d.vooIdas : d.vooIda ? [d.vooIda] : []) as Voo[];
              const voltas = (Array.isArray(d.vooVoltas) ? d.vooVoltas : d.vooVolta ? [d.vooVolta] : []) as Voo[];
              const trechos: { voo: Voo; tipo: "ida" | "volta"; idx: number; total: number }[] = [
                ...idas.map((v, i) => ({ voo: v, tipo: "ida" as const, idx: i, total: idas.length })),
                ...voltas.map((v, i) => ({ voo: v, tipo: "volta" as const, idx: i, total: voltas.length })),
              ];

              for (const t of trechos) {
                const depMs = parseDepartureMs(t.voo);
                if (!depMs || depMs < lo || depMs > hi) continue;

                const baseLabel = t.tipo === "ida" ? "Ida" : "Volta";
                const trechoLabel = t.total > 1 ? `${baseLabel} – Trecho ${t.idx + 1}` : baseLabel;
                const referencia = `${cot.id}:${t.tipo}:${t.idx}`;

                // Skip if already sent
                const { data: existing } = await supabaseAdmin
                  .from("telegram_envios")
                  .select("id")
                  .eq("user_id", cfg.user_id)
                  .eq("tipo", "checkin_48h")
                  .eq("referencia", referencia)
                  .eq("status", "enviado")
                  .limit(1);
                if (existing && existing.length > 0) {
                  pulados++;
                  continue;
                }

                const cliente = (d as any).cliente?.nome ?? "—";
                const companhia = t.voo.companhia ?? "—";
                const numeroVoo = t.voo.numeroVoo ?? "—";
                const origem = t.voo.origem ?? "—";
                const destino = t.voo.destino ?? "—";
                const embarque = fmtDateTimeBR(t.voo);

                const mensagem =
                  `✈️ CHECK-IN DISPONÍVEL (${trechoLabel})\n\n` +
                  `Cliente: ${cliente}\n` +
                  `Companhia aérea: ${companhia}\n` +
                  `Número do voo: ${numeroVoo}\n` +
                  `Origem: ${origem}\n` +
                  `Destino: ${destino}\n` +
                  `Embarque: ${embarque}\n\n` +
                  `Ação recomendada:\nEntre em contato com o cliente para orientá-lo sobre o check-in.\n\n` +
                  `Cotação: ${cot.code}`;

                let status: "enviado" | "falhou" = "enviado";
                let erro: string | null = null;
                try {
                  const resp = await fetch(
                    `https://api.telegram.org/bot${cfg.token_bot}/sendMessage`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ chat_id: cfg.chat_id, text: mensagem }),
                    },
                  );
                  if (!resp.ok) {
                    status = "falhou";
                    erro = `HTTP ${resp.status}: ${(await resp.text()).slice(0, 500)}`;
                    falhas++;
                  } else {
                    enviados++;
                  }
                } catch (e: any) {
                  status = "falhou";
                  erro = String(e?.message ?? e).slice(0, 500);
                  falhas++;
                }

                await supabaseAdmin.from("telegram_envios").insert({
                  user_id: cfg.user_id,
                  tipo: "checkin_48h",
                  mensagem,
                  status,
                  erro,
                  referencia,
                });
              }
            }
          }

          return Response.json({ ok: true, enviados, pulados, falhas });
        } catch (e: any) {
          return Response.json(
            { ok: false, error: String(e?.message ?? e) },
            { status: 500 },
          );
        }
      },
      GET: async () =>
        new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } }),
    },
  },
});
