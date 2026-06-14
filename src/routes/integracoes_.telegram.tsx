import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Send, Save, Loader2, ChevronRight, MessageCircle, CheckCircle2, XCircle, History, Bell, Plane, Activity } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { buildCheckinAlertFromCotacao } from "@/lib/telegram-alertas";
import { toast } from "sonner";

export const Route = createFileRoute("/integracoes_/telegram")({
  component: TelegramPage,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Integração Telegram" },
      { name: "description", content: "Configure o bot do Telegram para receber notificações automáticas do CRM." },
    ],
  }),
});

type TelegramConfig = {
  id?: string;
  token_bot: string;
  chat_id: string;
  ativo: boolean;
  notificar_checkin: boolean;
  notificar_embarque: boolean;
  notificar_followup: boolean;
  notificar_pagamentos: boolean;
  notificar_tarefas: boolean;
  notificar_vendas: boolean;
};

const DEFAULT: TelegramConfig = {
  token_bot: "",
  chat_id: "",
  ativo: false,
  notificar_checkin: true,
  notificar_embarque: true,
  notificar_followup: true,
  notificar_pagamentos: true,
  notificar_tarefas: true,
  notificar_vendas: true,
};

const NOTIFS: { key: keyof TelegramConfig; label: string; preview: string }[] = [
  {
    key: "notificar_checkin",
    label: "Check-in disponível (48 horas antes do voo)",
    preview: "✈️ BRISK CRM\nCheck-in disponível.\nCliente: João Silva\nDestino: Fortaleza → Lisboa\nEmbarque: 15/08/2026 às 22:30\nEntre em contato com o cliente.",
  },
  {
    key: "notificar_embarque",
    label: "Embarque nas próximas 24 horas",
    preview: "🛫 BRISK CRM\nEmbarque em 24 horas.\nCliente: Maria Souza\nVoo: LATAM 8084 — GRU → LIS\nHorário: 16/08/2026 às 21:10",
  },
  {
    key: "notificar_followup",
    label: "Follow-ups pendentes",
    preview: "📞 BRISK CRM\nFollow-up pendente.\nCotação #2026-104 — Pedro Lima\nAguardando retorno há 3 dias.",
  },
  {
    key: "notificar_pagamentos",
    label: "Pagamentos próximos do vencimento",
    preview: "💳 BRISK CRM\nPagamento próximo do vencimento.\nCliente: Ana Beatriz\nValor: R$ 2.480,00 — Vence em 2 dias.",
  },
  {
    key: "notificar_tarefas",
    label: "Tarefas atrasadas",
    preview: "⏰ BRISK CRM\nTarefa atrasada.\n“Enviar voucher de hospedagem” — Cliente: Lucas Pereira\nAtrasada há 1 dia.",
  },
  {
    key: "notificar_vendas",
    label: "Novas vendas aprovadas",
    preview: "🎉 BRISK CRM\nNova venda aprovada!\nCliente: Camila Rocha\nPacote: Cancún 7 noites — R$ 9.350,00",
  },
];

type EnvioRow = {
  id: string;
  tipo: string;
  mensagem: string;
  status: string;
  erro: string | null;
  created_at: string;
  referencia?: string | null;
};

type Alerta = {
  key: string;
  tipo: string;
  cliente: string;
  numeroVoo?: string;
  origem?: string;
  destino?: string;
  eventoEm: Date;
  enviarEm: Date;
  status: "Pendente";
};

type RotinaStatus = {
  ultima_verificacao: string | null;
  alertas_processados: number;
  status: string;
  erro: string | null;
};

function TelegramPage() {
  const { user } = useAuth();
  const [cfg, setCfg] = useState<TelegramConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [envios, setEnvios] = useState<EnvioRow[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [rotina, setRotina] = useState<RotinaStatus | null>(null);

  const loadEnvios = async (uid: string) => {
    const { data } = await supabase
      .from("telegram_envios")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    setEnvios((data as EnvioRow[]) ?? []);
    return (data as EnvioRow[]) ?? [];
  };

  const loadRotina = async (uid: string) => {
    const { data } = await supabase
      .from("telegram_rotina_status")
      .select("ultima_verificacao, alertas_processados, status, erro")
      .eq("user_id", uid)
      .maybeSingle();
    setRotina((data as RotinaStatus | null) ?? null);
  };

  const loadAlertas = async (uid: string) => {
    const { data: cots } = await supabase
      .from("cotacoes")
      .select("id, code, data")
      .eq("user_id", uid)
      .eq("status", "aprovado");

    const now = new Date();
    for (const cot of cots ?? []) {
      const alert = buildCheckinAlertFromCotacao(cot);
      if (!alert || alert.eventoEm.getTime() < now.getTime()) continue;
      const { data: existing } = await supabase
        .from("telegram_alertas")
        .select("id, status")
        .eq("user_id", uid)
        .eq("tipo", alert.tipo)
        .eq("referencia", alert.referencia)
        .maybeSingle();
      if (!existing) {
        await supabase.from("telegram_alertas").insert({
          user_id: uid,
          tipo: alert.tipo,
          referencia: alert.referencia,
          cliente: alert.cliente,
          numero_voo: alert.numeroVoo,
          origem: alert.origem,
          destino: alert.destino,
          evento_em: alert.eventoEm.toISOString(),
          enviar_em: alert.enviarEm.toISOString(),
          mensagem: alert.mensagem,
          metadata: alert.metadata as any,
        });
      } else if (existing.status === "Pendente") {
        await supabase
          .from("telegram_alertas")
          .update({
            cliente: alert.cliente,
            numero_voo: alert.numeroVoo,
            origem: alert.origem,
            destino: alert.destino,
            evento_em: alert.eventoEm.toISOString(),
            enviar_em: alert.enviarEm.toISOString(),
            mensagem: alert.mensagem,
            metadata: alert.metadata as any,
            erro: null,
          })
          .eq("id", existing.id);
      }
    }

    const { data: pending } = await supabase
      .from("telegram_alertas")
      .select("id, tipo, cliente, numero_voo, origem, destino, evento_em, enviar_em, status")
      .eq("user_id", uid)
      .eq("status", "Pendente")
      .order("enviar_em", { ascending: true });

    setAlertas(
      ((pending ?? []) as any[]).map((a) => ({
        key: a.id,
        tipo: a.tipo,
        cliente: a.cliente,
        numeroVoo: a.numero_voo ?? undefined,
        origem: a.origem ?? undefined,
        destino: a.destino ?? undefined,
        eventoEm: new Date(a.evento_em),
        enviarEm: new Date(a.enviar_em),
        status: "Pendente",
      })),
    );
  };

  useEffect(() => {
    if (!user) return;
    let active = true;
    const refresh = async () => {
      await loadEnvios(user.id);
      await loadAlertas(user.id);
      await loadRotina(user.id);
    };
    (async () => {
      const { data } = await supabase
        .from("telegram_config")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setCfg({ ...DEFAULT, ...data, token_bot: data.token_bot ?? "", chat_id: data.chat_id ?? "" });
      await refresh();
      if (active) setLoading(false);
    })();
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user]);

  const setField = <K extends keyof TelegramConfig>(k: K, v: TelegramConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  const conectado = cfg.ativo && cfg.token_bot.trim() && cfg.chat_id.trim();

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = { ...cfg, user_id: user.id };
    delete (payload as { id?: string }).id;
    const { error } = await supabase
      .from("telegram_config")
      .upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) return toast.error("Erro ao salvar configurações.");
    toast.success("Configurações salvas.");
  };

  const handleTest = async () => {
    if (!user) return;
    if (!cfg.token_bot.trim() || !cfg.chat_id.trim()) {
      toast.error("Informe o Token do Bot e o Chat ID antes de testar.");
      return;
    }
    setTesting(true);
    const now = new Date();
    const dataHora = now.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
    const mensagem = `🚀 Teste de integração realizado com sucesso!\nBrisk CRM conectado ao Telegram.\nData e hora do teste: ${dataHora}`;

    let status: "enviado" | "falhou" = "falhou";
    let erro: string | null = null;

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${cfg.token_bot.trim()}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: cfg.chat_id.trim(), text: mensagem }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.description || `HTTP ${res.status}`);
      status = "enviado";
      toast.success("Mensagem enviada com sucesso.");
    } catch (e) {
      erro = e instanceof Error ? e.message : "Falha desconhecida";
      toast.error(`Falha no envio: ${erro}`);
    } finally {
      await supabase.from("telegram_envios").insert({
        user_id: user.id,
        tipo: "Teste de integração",
        mensagem,
        status,
        erro,
      });
      await loadEnvios(user.id);
      await loadRotina(user.id);
      setTesting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Cadastros</span>
            <ChevronRight className="size-3" />
            <Link to="/integracoes" className="hover:text-foreground">Integrações</Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-medium">Telegram</span>
          </nav>

          {/* Header + status */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-[#229ED9]/10 grid place-items-center">
                <MessageCircle className="size-6 text-[#229ED9]" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Telegram</h1>
                <p className="text-sm text-muted-foreground">
                  Canal oficial de alertas operacionais da Brisk Viagens.
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                conectado
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 py-1 px-2.5"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 gap-1.5 py-1 px-2.5"
              }
            >
              <span className={`size-2 rounded-full ${conectado ? "bg-emerald-500" : "bg-rose-500"}`} />
              {conectado ? "Telegram conectado" : "Telegram desconectado"}
            </Badge>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando configuração...
            </div>
          ) : (
            <>
              {/* Configuração */}
              <section className="rounded-xl border bg-card p-5 md:p-6 space-y-5">
                <h2 className="text-base font-semibold">Configuração do bot</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nome da integração</Label>
                    <Input value="Telegram" disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Chat ID</Label>
                    <Input
                      value={cfg.chat_id}
                      onChange={(e) => setField("chat_id", e.target.value)}
                      placeholder="-1001234567890"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Token do Bot</Label>
                    <Input
                      type="password"
                      value={cfg.token_bot}
                      onChange={(e) => setField("token_bot", e.target.value)}
                      placeholder="123456789:AAH..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">Status da integração</div>
                    <div className="text-xs text-muted-foreground">
                      Quando inativa, nenhuma notificação será enviada.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {cfg.ativo ? "Ativo" : "Inativo"}
                    </span>
                    <Switch checked={cfg.ativo} onCheckedChange={(v) => setField("ativo", v)} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                    Salvar configurações
                  </Button>
                  <Button variant="outline" onClick={handleTest} disabled={testing}>
                    {testing ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
                    Enviar mensagem de teste
                  </Button>
                </div>
              </section>

              {/* Tipos de notificações */}
              <section className="rounded-xl border bg-card p-5 md:p-6 space-y-4">
                <div>
                  <h2 className="text-base font-semibold">Tipos de notificações</h2>
                  <p className="text-xs text-muted-foreground">
                    Ative ou desative individualmente os alertas que devem ser enviados ao Telegram.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {NOTIFS.map((n) => (
                    <label
                      key={n.key}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-background px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                    >
                      <span className="text-sm">{n.label}</span>
                      <Switch
                        checked={Boolean(cfg[n.key])}
                        onCheckedChange={(v) => setField(n.key, v as never)}
                      />
                    </label>
                  ))}
                </div>
              </section>

              {/* Prévia */}
              <section className="rounded-xl border bg-card p-5 md:p-6 space-y-4">
                <div>
                  <h2 className="text-base font-semibold">Prévia das notificações</h2>
                  <p className="text-xs text-muted-foreground">
                    Exemplos das mensagens que serão enviadas para o Telegram configurado.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {NOTIFS.filter((n) => cfg[n.key]).map((n) => (
                    <div
                      key={n.key}
                      className="rounded-lg border bg-[#E7F6FE] dark:bg-[#0f2a3a] border-[#229ED9]/20 p-4"
                    >
                      <div className="text-[10px] uppercase tracking-wider text-[#229ED9] font-semibold mb-1.5">
                        {n.label}
                      </div>
                      <pre className="text-xs whitespace-pre-wrap font-sans text-foreground/90 leading-relaxed">
                        {n.preview}
                      </pre>
                    </div>
                  ))}
                  {NOTIFS.every((n) => !cfg[n.key]) && (
                    <div className="text-sm text-muted-foreground">
                      Nenhuma notificação ativa.
                    </div>
                  )}
                </div>
              </section>

              {/* Rotina automática */}
              <RotinaAutomatica rotina={rotina} conectado={Boolean(conectado)} />

              {/* Próximos Alertas */}
              <ProximosAlertas alertas={alertas} />

              {/* Histórico de Envios */}
              <section className="rounded-xl border bg-card p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <h2 className="text-base font-semibold">Histórico de Envios</h2>
                </div>
                {envios.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum envio registrado ainda. Use o botão "Enviar mensagem de teste" para gerar o primeiro registro.
                  </p>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data e hora</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Detalhes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {envios.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {new Date(e.created_at).toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell className="text-xs">{e.tipo}</TableCell>
                            <TableCell>
                              {e.status === "enviado" ? (
                                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1">
                                  <CheckCircle2 className="size-3" /> Enviado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 gap-1">
                                  <XCircle className="size-3" /> Falhou
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                              {e.erro ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function ProximosAlertas({ alertas }: { alertas: Alerta[] }) {
  const [open, setOpen] = useState(false);
  const fmt = (d: Date) => d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const top = alertas.slice(0, 3);

  const renderCard = (a: Alerta) => (
    <div key={a.key} className="rounded-lg border bg-background p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{a.cliente}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Bell className="size-3" /> {a.tipo}
            {a.numeroVoo && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <Plane className="size-3" /> {a.numeroVoo}
              </>
            )}
          </div>
        </div>
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]">
          {a.status}
        </Badge>
      </div>
      {(a.origem || a.destino) && (
        <div className="text-xs text-muted-foreground">
          {a.origem ?? "—"} → {a.destino ?? "—"}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Evento</div>
          <div className="font-medium">{fmt(a.eventoEm)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Envio previsto</div>
          <div className="font-medium">{fmt(a.enviarEm)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="rounded-xl border bg-card p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Próximos Alertas</h2>
        </div>
        {alertas.length > 3 && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Ver todos ({alertas.length})
          </Button>
        )}
      </div>
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum alerta programado.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-3">{top.map(renderCard)}</div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Todos os Próximos Alertas</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            {alertas.map(renderCard)}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
