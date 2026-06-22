import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Plane, Hotel, StickyNote, Cake, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCotacoes, useClientes, formatBRL } from "@/lib/cotacoes-store";

type TipoItemDia =
  | "voo"
  | "hospedagem_checkin"
  | "hospedagem_checkout"
  | "observacao"
  | "aniversario"
  | "cobranca";

type ItemDia = {
  tipo: TipoItemDia;
  hora: string;
  titulo: string;
  subtitulo: string;
  cotacaoId?: string;
};

const ICONS: Record<TipoItemDia, typeof Plane> = {
  voo: Plane,
  hospedagem_checkin: Hotel,
  hospedagem_checkout: Hotel,
  observacao: StickyNote,
  aniversario: Cake,
  cobranca: DollarSign,
};

const LABELS: Record<TipoItemDia, string> = {
  voo: "Voo",
  hospedagem_checkin: "Check-in",
  hospedagem_checkout: "Check-out",
  observacao: "Observação",
  aniversario: "Aniversário",
  cobranca: "Cobrança",
};

function soDataISO(s?: string | null): string {
  if (!s) return "";
  return s.slice(0, 10);
}
function horaDeISO(s?: string | null): string {
  if (!s) return "";
  const p = s.split("T")[1];
  if (!p) return "";
  return p.slice(0, 5);
}
function mmdd(s?: string | null): string {
  if (!s) return "";
  return s.slice(5, 10);
}

export function TasksCard() {
  const hoje = new Date().toISOString().slice(0, 10);
  const hojeMMDD = hoje.slice(5, 10);
  const diaLabel = new Date().toLocaleDateString("pt-BR", { day: "2-digit" });
  const cotacoes = useCotacoes();
  const clientes = useClientes();
  const [hospedagens, setHospedagens] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: h }, { data: e }] = await Promise.all([
        (supabase.from as any)("hospedagens").select("id, cotacao_id, nome_hotel, checkin, checkout"),
        (supabase.from as any)("calendario_eventos").select("id, data, hora, titulo, descricao, cotacao_id"),
      ]);
      if (!active) return;
      setHospedagens(h ?? []);
      setEventos(e ?? []);
    })();
    return () => { active = false; };
  }, [cotacoes.length]);

  const itens = useMemo<ItemDia[]>(() => {
    const aprovadas = cotacoes.filter((c) => c.status === "aprovado");
    const idsAprov = new Set(aprovadas.map((c) => c.id));
    const nomePorId = new Map(aprovadas.map((c) => [c.id, c.cliente?.nome ?? "Cliente"]));
    const out: ItemDia[] = [];

    for (const c of aprovadas) {
      const idas = c.vooIdas?.length ? c.vooIdas : c.vooIda ? [c.vooIda] : [];
      const voltas = c.vooVoltas?.length ? c.vooVoltas : c.vooVolta ? [c.vooVolta] : [];
      [...idas, ...voltas].forEach((v: any) => {
        if (!v || soDataISO(v.data) !== hoje) return;
        out.push({
          tipo: "voo",
          hora: v.horaSaida || "",
          titulo: c.cliente?.nome ?? "Cliente",
          subtitulo: `${v.origem || "—"} → ${v.destino || "—"}`,
          cotacaoId: c.id,
        });
      });

      // Cobranças (vendaVendas) com vencimento hoje
      for (const v of c.vendaVendas ?? []) {
        if (soDataISO(v.vencimento) !== hoje) continue;
        out.push({
          tipo: "cobranca",
          hora: "",
          titulo: c.cliente?.nome ?? "Cliente",
          subtitulo: `${v.descricao || v.categoria || "Pagamento"} — R$ ${formatBRL(v.valor || 0)}${v.pago ? " (recebido)" : ""}`,
          cotacaoId: c.id,
        });
      }
    }

    for (const h of hospedagens) {
      if (!idsAprov.has(h.cotacao_id)) continue;
      const nome = nomePorId.get(h.cotacao_id) || "Cliente";
      if (soDataISO(h.checkin) === hoje) {
        out.push({ tipo: "hospedagem_checkin", hora: horaDeISO(h.checkin), titulo: nome, subtitulo: `Check-in — ${h.nome_hotel}`, cotacaoId: h.cotacao_id });
      }
      if (soDataISO(h.checkout) === hoje) {
        out.push({ tipo: "hospedagem_checkout", hora: horaDeISO(h.checkout), titulo: nome, subtitulo: `Check-out — ${h.nome_hotel}`, cotacaoId: h.cotacao_id });
      }
    }

    for (const ev of eventos) {
      if (ev.data !== hoje) continue;
      if (ev.cotacao_id && !idsAprov.has(ev.cotacao_id)) continue;
      out.push({
        tipo: "observacao",
        hora: ev.hora || "",
        titulo: ev.cotacao_id ? (nomePorId.get(ev.cotacao_id) || ev.titulo) : ev.titulo,
        subtitulo: ev.descricao || ev.titulo,
        cotacaoId: ev.cotacao_id ?? undefined,
      });
    }

    // Aniversários de clientes (mesmo dia/mês)
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
  }, [cotacoes, hospedagens, eventos, clientes, hoje, hojeMMDD]);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-base font-semibold text-foreground mb-4">Tarefas para hoje, dia {diaLabel}</h3>
      {itens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ClipboardList className="size-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Você não possui nenhuma tarefa para o dia de hoje.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {itens.map((item, i) => {
            const Icon = ICONS[item.tipo];
            return (
              <li key={i} className="flex items-center gap-3">
                <div className="size-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{LABELS[item.tipo]}</div>
                  <div className="text-sm font-medium text-foreground truncate">{item.titulo}</div>
                  <div className="text-xs text-muted-foreground truncate">{item.subtitulo}</div>
                </div>
                {item.hora && <span className="text-xs text-muted-foreground shrink-0">{item.hora}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

