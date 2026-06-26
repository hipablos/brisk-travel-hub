import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Plane,
  Hotel,
  StickyNote,
  Cake,
  DollarSign,
  FileText,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCotacoes, useClientes, formatBRL } from "@/lib/cotacoes-store";
import { normalizeDateOnly, todayDateOnly } from "@/lib/dates";

type TipoItemDia =
  | "voo"
  | "hospedagem_checkin"
  | "hospedagem_checkout"
  | "observacao"
  | "experiencia"
  | "aniversario"
  | "cobranca"
  | "cotacao_nova"
  | "venda_aprovada";

type ItemDia = {
  tipo: TipoItemDia;
  hora: string;
  titulo: string;
  subtitulo: string;
  cotacaoId?: string;
  trecho?: "ida" | "volta";
};


const ICONS: Record<TipoItemDia, typeof Plane> = {
  voo: Plane,
  hospedagem_checkin: Hotel,
  hospedagem_checkout: Hotel,
  observacao: StickyNote,
  experiencia: MapPin,
  aniversario: Cake,
  cobranca: DollarSign,
  cotacao_nova: FileText,
  venda_aprovada: CheckCircle2,
};

const LABELS: Record<TipoItemDia, string> = {
  voo: "Voo",
  hospedagem_checkin: "Check-in",
  hospedagem_checkout: "Check-out",
  observacao: "Calendário",
  experiencia: "Experiência",
  aniversario: "Aniversário",
  cobranca: "Cobrança",
  cotacao_nova: "Cotação criada",
  venda_aprovada: "Venda aprovada",
};

const ICON_COLORS: Record<TipoItemDia, string> = {
  voo: "bg-blue-500/15 text-blue-400",
  hospedagem_checkin: "bg-emerald-500/15 text-emerald-400",
  hospedagem_checkout: "bg-orange-500/15 text-orange-400",
  observacao: "bg-purple-500/15 text-purple-400",
  experiencia: "bg-violet-500/15 text-violet-400",
  aniversario: "bg-pink-500/15 text-pink-400",
  cobranca: "bg-yellow-500/15 text-yellow-400",
  cotacao_nova: "bg-sky-500/15 text-sky-400",
  venda_aprovada: "bg-green-500/15 text-green-400",
};

const LABEL_COLORS: Record<TipoItemDia, string> = {
  voo: "text-blue-400",
  hospedagem_checkin: "text-emerald-400",
  hospedagem_checkout: "text-orange-400",
  observacao: "text-purple-400",
  experiencia: "text-violet-400",
  aniversario: "text-pink-400",
  cobranca: "text-yellow-400",
  cotacao_nova: "text-sky-400",
  venda_aprovada: "text-green-400",
};

function dataDoDia(s?: string | null): string {
  if (!s) return "";
  const raw = s.trim();
  const normalized = normalizeDateOnly(raw);
  if (normalized) return normalized;

  const isoPrefix = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix) return normalizeDateOnly(isoPrefix[1]);

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const parts = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(parsed);
    const day = parts.find((p) => p.type === "day")?.value ?? "";
    const month = parts.find((p) => p.type === "month")?.value ?? "";
    const year = parts.find((p) => p.type === "year")?.value ?? "";
    return day && month && year ? `${day}-${month}-${year}` : "";
  }

  return "";
}
function horaDeISO(s?: string | null): string {
  if (!s) return "";
  const p = s.split("T")[1];
  if (!p) return "";
  return p.slice(0, 5);
}
function mmdd(s?: string | null): string {
  if (!s) return "";
  const d = dataDoDia(s);
  return d ? `${d.slice(3, 5)}-${d.slice(0, 2)}` : "";
}

export function TasksCard() {
  const hoje = todayDateOnly();
  const hojeMMDD = `${hoje.slice(3, 5)}-${hoje.slice(0, 2)}`;
  const diaLabel = hoje.slice(0, 2);
  const cotacoes = useCotacoes();
  const clientes = useClientes();
  const [hospedagens, setHospedagens] = useState<any[]>([]);
  const [experiencias, setExperiencias] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: h }, { data: ex }, { data: e }] = await Promise.all([
        (supabase.from as any)("hospedagens").select(
          "id, cotacao_id, nome_hotel, checkin, checkout"
        ),
        (supabase.from as any)("experiencias").select(
          "id, cotacao_id, nome, categoria, cidade, data, hora_inicio"
        ),
        (supabase.from as any)("calendario_eventos").select(
          "id, data, hora, titulo, descricao, cotacao_id"
        ),
      ]);
      if (!active) return;
      setHospedagens(h ?? []);
      setExperiencias(ex ?? []);
      setEventos(e ?? []);
    })();
    return () => {
      active = false;
    };
  }, []);

  const itens = useMemo<ItemDia[]>(() => {
    const nomePorId = new Map(
      cotacoes.map((c) => [c.id, c.cliente?.nome ?? "Cliente"])
    );
    const out: ItemDia[] = [];

    for (const c of cotacoes) {
      const nome = c.cliente?.nome ?? "Cliente";

      // Cotações criadas hoje (qualquer status)
      if (dataDoDia(c.createdAt) === hoje) {
        out.push({
          tipo: "cotacao_nova",
          hora: horaDeISO(c.createdAt),
          titulo: nome,
          subtitulo: `Cotação ${c.code || ""} criada${
            c.destino ? ` — ${c.destino}` : ""
          }`.trim(),
          cotacaoId: c.id,
        });
      }

      // Vendas aprovadas hoje
      if (c.status === "aprovado" && dataDoDia(c.dataVenda) === hoje) {
        out.push({
          tipo: "venda_aprovada",
          hora: "",
          titulo: nome,
          subtitulo: `Venda aprovada — R$ ${formatBRL(c.total || 0)}`,
          cotacaoId: c.id,
        });
      }

      // Voos de qualquer cotação
      {
        const idas = c.vooIdas?.length ? c.vooIdas : c.vooIda ? [c.vooIda] : [];
        const voltas = c.vooVoltas?.length
          ? c.vooVoltas
          : c.vooVolta
          ? [c.vooVolta]
          : [];

        const pushLeg = (v: any, trecho: "ida" | "volta") => {
          if (!v) return;
          if (dataDoDia(v.data) === hoje) {
            const escalasInfo =
              v.escalas?.length > 0
                ? ` · ${v.escalas.length} escala${v.escalas.length > 1 ? "s" : ""}`
                : "";
            out.push({
              tipo: "voo",
              hora: v.horaSaida || "",
              titulo: nome,
              subtitulo: `${v.origem || "—"} → ${v.destino || "—"}${escalasInfo}`,
              cotacaoId: c.id,
              trecho,
            });
          }
          if (v.tipo === "com_escala" && Array.isArray(v.escalas)) {
            v.escalas.forEach((e: any) => {
              const dataEscala = dataDoDia(e.dataPartida ?? e.dataSaida ?? null);
              if (dataEscala && dataEscala === hoje) {
                out.push({
                  tipo: "voo",
                  hora: e.saida || "",
                  titulo: nome,
                  subtitulo: `Conexão: ${e.origem || "—"} → ${e.destino || "—"}`,
                  cotacaoId: c.id,
                  trecho,
                });
              }
            });
          }
        };

        idas.forEach((v: any) => pushLeg(v, "ida"));
        voltas.forEach((v: any) => pushLeg(v, "volta"));
      }



      // Cobranças com vencimento hoje (qualquer status)
      for (const v of c.vendaVendas ?? []) {
        if (dataDoDia(v.vencimento) !== hoje) continue;
        out.push({
          tipo: "cobranca",
          hora: "",
          titulo: nome,
          subtitulo: `${
            v.descricao || v.categoria || "Pagamento"
          } — R$ ${formatBRL(v.valor || 0)}${v.pago ? " ✓ recebido" : ""}`,
          cotacaoId: c.id,
        });
      }

    }

    for (const h of hospedagens) {
      const nome = nomePorId.get(h.cotacao_id) || "Cliente";


      if (dataDoDia(h.checkin) === hoje) {
        out.push({
          tipo: "hospedagem_checkin",
          hora: horaDeISO(h.checkin),
          titulo: nome,
          subtitulo: `Check-in — ${h.nome_hotel}`,
          cotacaoId: h.cotacao_id,
        });
      }
      if (dataDoDia(h.checkout) === hoje) {
        out.push({
          tipo: "hospedagem_checkout",
          hora: horaDeISO(h.checkout),
          titulo: nome,
          subtitulo: `Check-out — ${h.nome_hotel}`,
          cotacaoId: h.cotacao_id,
        });
      }
    }

    for (const ex of experiencias) {
      if (dataDoDia(ex.data) !== hoje) continue;
      const nome = nomePorId.get(ex.cotacao_id) || "Cliente";
      out.push({
        tipo: "experiencia",
        hora: ex.hora_inicio || "",
        titulo: nome,
        subtitulo: `${ex.nome || "Experiência"}${ex.cidade ? ` — ${ex.cidade}` : ""}`,
        cotacaoId: ex.cotacao_id ?? undefined,
      });
    }

    for (const ev of eventos) {
      if (dataDoDia(ev.data) !== hoje) continue;
      out.push({
        tipo: "observacao",
        hora: ev.hora || "",
        titulo: ev.cotacao_id
          ? nomePorId.get(ev.cotacao_id) || ev.titulo
          : ev.titulo,
        subtitulo: ev.descricao || ev.titulo,
        cotacaoId: ev.cotacao_id ?? undefined,
      });
    }

    for (const cli of clientes) {
      if (!cli.dataNascimento) continue;
      if (mmdd(cli.dataNascimento) !== hojeMMDD) continue;
      out.push({
        tipo: "aniversario",
        hora: "",
        titulo: cli.nome,
        subtitulo: "Aniversário do cliente 🎉",
      });
    }

    return out.sort((a, b) => {
      if (!a.hora && !b.hora) return 0;
      if (!a.hora) return 1;
      if (!b.hora) return -1;
      return a.hora.localeCompare(b.hora);
    });
  }, [cotacoes, hospedagens, experiencias, eventos, clientes, hoje, hojeMMDD]);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">
          Tarefas para hoje, dia {diaLabel}
        </h3>
        {itens.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {itens.length} {itens.length === 1 ? "item" : "itens"}
          </span>
        )}
      </div>

      {itens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ClipboardList className="size-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            Você não possui nenhuma tarefa para o dia de hoje.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {itens.map((item, i) => {
            const Icon = ICONS[item.tipo];
            return (
              <li key={i} className="flex items-center gap-3">
                <div
                  className={`size-9 rounded-md flex items-center justify-center shrink-0 ${ICON_COLORS[item.tipo]}`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[10px] uppercase tracking-wide font-semibold ${LABEL_COLORS[item.tipo]}`}
                  >
                    {LABELS[item.tipo]}
                  </div>
                  <div className="text-sm font-medium text-foreground truncate">
                    {item.titulo}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.subtitulo}
                  </div>
                </div>
                {item.tipo === "voo" ? (
                  <div className="text-right shrink-0 leading-tight">
                    <div className="text-[11px] text-muted-foreground">
                      {item.trecho === "volta" ? "Volta" : "Ida"}:{" "}
                      <span className="text-foreground/80 font-medium">{item.hora || "—"}</span>
                    </div>
                  </div>
                ) : item.hora ? (

                  <span className="text-xs text-muted-foreground shrink-0">
                    {item.hora}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
