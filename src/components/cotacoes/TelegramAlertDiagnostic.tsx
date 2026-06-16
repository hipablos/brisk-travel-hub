import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BellRing, Loader2, CheckCircle2, Clock, AlertTriangle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { diagnoseCotacaoTrechos, type DiagnosticoTrecho } from "@/lib/telegram-alertas";

type Props = {
  cotacaoId?: string;
  code?: string;
  status?: string;
  cliente?: { nome?: string } | null;
  vooIdas: any[];
  vooVoltas: any[];
};

type AlertaDB = {
  id: string;
  status: string;
  enviar_em: string;
  evento_em: string;
  processed_at: string | null;
  erro: string | null;
};

type Row = DiagnosticoTrecho & {
  state: "sent" | "scheduled" | "not_scheduled";
  reason: string | null;
  enviadoEm?: Date | null;
  enviarEmEfetivo?: Date | null;
};

function fmt(d?: Date | null) {
  if (!d) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function TelegramAlertDiagnostic({ cotacaoId, code, status, cliente, vooIdas, vooVoltas }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [cfgAtivo, setCfgAtivo] = useState<boolean | null>(null);

  const load = async () => {
    if (!user || !cotacaoId) return;
    setLoading(true);
    try {
      const { data: cfg } = await supabase
        .from("telegram_config")
        .select("ativo, notificar_checkin, token_bot, chat_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const integracaoOk = !!(cfg?.ativo && cfg?.notificar_checkin && cfg?.token_bot && cfg?.chat_id);
      setCfgAtivo(integracaoOk);

      const cotacaoLike = {
        id: cotacaoId,
        code: code ?? null,
        data: { cliente: cliente ?? undefined, vooIdas, vooVoltas },
      };
      const diags = diagnoseCotacaoTrechos(cotacaoLike);

      const { data: alertas } = await supabase
        .from("telegram_alertas")
        .select("id, status, enviar_em, evento_em, processed_at, erro, referencia")
        .eq("user_id", user.id)
        .in(
          "referencia",
          diags.map((d) => d.referencia),
        );
      const byRef = new Map<string, AlertaDB>();
      for (const a of (alertas ?? []) as any[]) byRef.set(a.referencia, a);

      const next: Row[] = diags.map((d) => {
        const dbRow = byRef.get(d.referencia);
        if (dbRow?.status === "Enviado") {
          return {
            ...d,
            state: "sent",
            reason: null,
            enviadoEm: dbRow.processed_at ? new Date(dbRow.processed_at) : null,
            enviarEmEfetivo: dbRow.enviar_em ? new Date(dbRow.enviar_em) : d.enviarEm,
          };
        }
        if (dbRow?.status === "Pendente" || dbRow?.status === "Processando") {
          return {
            ...d,
            state: "scheduled",
            reason: null,
            enviarEmEfetivo: dbRow.enviar_em ? new Date(dbRow.enviar_em) : d.enviarEm,
          };
        }
        // not in DB yet
        let reason: string | null = d.motivo;
        if (!reason) {
          if (status && status !== "aprovado") {
            reason = `Cotação precisa estar com status "Aprovado" para o alerta ser programado (atual: ${status}).`;
          } else if (!integracaoOk) {
            reason = "Integração do Telegram inativa ou incompleta. Ative o bot em Integrações → Telegram.";
          } else if (!d.alert) {
            reason = "Trecho sem data/horário de embarque cadastrado.";
          } else if (d.embarqueEm && d.embarqueEm.getTime() < Date.now()) {
            reason = "Embarque já ocorreu.";
          } else {
            reason = "Alerta ainda não foi processado pela rotina automática (executa a cada hora).";
          }
        }
        return { ...d, state: "not_scheduled", reason, enviarEmEfetivo: d.enviarEm };
      });

      setRows(next);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
        disabled={!cotacaoId}
      >
        <BellRing className="size-4" />
        Verificar alerta Telegram
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="size-5 text-[#229ED9]" /> Diagnóstico — Alertas do Telegram
            </DialogTitle>
            <DialogDescription>
              Um alerta é gerado para cada trecho cadastrado na cotação, 48 horas antes do embarque.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="size-4 animate-spin" /> Verificando...
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nenhum trecho de voo cadastrado nesta cotação.
            </p>
          ) : (
            <div className="space-y-3 mt-2">
              {cfgAtivo === false && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs px-3 py-2 flex items-start gap-2">
                  <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                  Integração do Telegram inativa. Os alertas só são enviados quando o bot está ativo e a notificação de Check-in está habilitada.
                </div>
              )}
              {rows.map((r) => (
                <div key={r.referencia} className="rounded-lg border bg-background p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-sm font-semibold">{r.trechoLabel}</div>
                    <StateBadge state={r.state} />
                  </div>
                  {(r.origem || r.destino || r.numeroVoo) && (
                    <div className="text-xs text-muted-foreground">
                      {r.origem ?? "—"} → {r.destino ?? "—"}
                      {r.numeroVoo && <> · Voo {r.numeroVoo}</>}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Embarque</div>
                      <div className="font-medium">{fmt(r.embarqueEm)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {r.state === "sent" ? "Enviado em" : "Envio previsto"}
                      </div>
                      <div className="font-medium">
                        {fmt(r.state === "sent" ? r.enviadoEm ?? r.enviarEmEfetivo : r.enviarEmEfetivo)}
                      </div>
                    </div>
                  </div>
                  {r.reason && r.state === "not_scheduled" && (
                    <div className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5 pt-1">
                      <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                      <span>{r.reason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function StateBadge({ state }: { state: Row["state"] }) {
  if (state === "sent") {
    return (
      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 gap-1 text-[10px]">
        <CheckCircle2 className="size-3" /> Alerta já enviado
      </Badge>
    );
  }
  if (state === "scheduled") {
    return (
      <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400 gap-1 text-[10px]">
        <Clock className="size-3" /> Alerta programado
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 gap-1 text-[10px]">
      <AlertTriangle className="size-3" /> Alerta não programado
    </Badge>
  );
}
