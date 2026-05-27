import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { compareDateOnly, dateOnlyToBR } from "@/lib/dates";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useCotacoes, useClientes, formatBRL, type Cotacao } from "@/lib/cotacoes-store";
import { ShoppingCart, Filter, X, ExternalLink } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/financeiro_/vendas")({
  component: VendasPage,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Vendas" },
      { name: "description", content: "Relatório financeiro de vendas realizadas." },
    ],
  }),
});

type Row = {
  cotacao: Cotacao;
  localizador: string;
  cliente: string;
  dataVenda: string;
  orcado: number;
  custo: number;
  venda: number;
  lucro: number;
  vencimento: string;
};

function sumLinhas(arr?: { valor?: number }[]) {
  return (arr ?? []).reduce((s, v) => s + (Number(v.valor) || 0), 0);
}

function earliestVencimento(arr?: { vencimento?: string }[]) {
  const dates = (arr ?? []).map((v) => v.vencimento).filter(Boolean) as string[];
  if (!dates.length) return "";
  return dates.sort(compareDateOnly)[0];
}

function fmtData(d?: string) {
  return dateOnlyToBR(d);
}

function VendasPage() {
  const cotacoes = useCotacoes();
  const clientes = useClientes();

  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [clienteId, setClienteId] = useState<string>("__all");

  const rows: Row[] = useMemo(() => {
    return cotacoes
      .filter((c) => {
        const hasVenda = (c.vendaVendas ?? []).length > 0;
        return hasVenda || c.status === "aprovado";
      })
      .map((c) => {
        const venda = sumLinhas(c.vendaVendas);
        const custo = sumLinhas(c.vendaCustos);
        return {
          cotacao: c,
          localizador: c.localizador ?? "",
          cliente: c.cliente?.nome ?? "—",
          dataVenda: c.dataVenda ?? "",
          orcado: Number(c.total) || 0,
          custo,
          venda,
          lucro: venda - custo,
          vencimento: earliestVencimento(c.vendaVendas),
        };
      });
  }, [cotacoes]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (clienteId !== "__all" && r.cotacao.cliente?.id !== clienteId) return false;
      if (de && (!r.dataVenda || compareDateOnly(r.dataVenda, de) < 0)) return false;
      if (ate && (!r.dataVenda || compareDateOnly(r.dataVenda, ate) > 0)) return false;
      return true;
    });
  }, [rows, de, ate, clienteId]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => ({
        orcado: acc.orcado + r.orcado,
        custo: acc.custo + r.custo,
        venda: acc.venda + r.venda,
        lucro: acc.lucro + r.lucro,
      }),
      { orcado: 0, custo: 0, venda: 0, lucro: 0 }
    );
  }, [filtered]);

  const limparFiltros = () => {
    setDe(""); setAte(""); setClienteId("__all");
  };

  const hasFiltros = de || ate || clienteId !== "__all";

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Financeiro</span>
                <span>/</span>
                <span className="text-foreground">Vendas</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 mt-1">
                <ShoppingCart className="size-6 text-primary" />
                Vendas
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Todas as vendas lançadas, sincronizadas automaticamente com as cotações.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Vendas" value={filtered.length.toString()} />
              <StatBox label="Total Venda" value={`R$ ${formatBRL(totals.venda)}`} accent />
              <StatBox label="Total Custo" value={`R$ ${formatBRL(totals.custo)}`} />
              <StatBox label="Lucro" value={`R$ ${formatBRL(totals.lucro)}`} positive={totals.lucro >= 0} />
            </div>
          </div>

          {/* Filtros */}
          <section className="bg-card border border-border/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Filtros</h2>
              {hasFiltros && (
                <Button type="button" size="sm" variant="ghost" className="ml-auto gap-1 text-xs" onClick={limparFiltros}>
                  <X className="size-3" /> Limpar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Período (de)</Label>
                <DateInput value={de} onChange={(iso) => setDe(iso)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Período (até)</Label>
                <DateInput value={ate} onChange={(iso) => setAte(iso)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Cliente</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos os clientes</SelectItem>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Tabela */}
          <section className="bg-card border border-border/50 rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Localizador</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-[110px]">Data</TableHead>
                  <TableHead className="text-right w-[120px]">Orçado</TableHead>
                  <TableHead className="text-right w-[120px]">Custo</TableHead>
                  <TableHead className="text-right w-[120px]">Venda</TableHead>
                  <TableHead className="text-right w-[120px]">Lucro</TableHead>
                  <TableHead className="w-[110px]">Vencimento</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-sm text-muted-foreground">
                      Nenhuma venda encontrada para os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.cotacao.id}>
                      <TableCell>
                        {r.localizador ? (
                          <span className="inline-block px-2 py-0.5 rounded font-mono text-[11px] font-semibold tracking-wider bg-yellow-200 text-yellow-900 dark:bg-yellow-500/30 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-600/50">
                            {r.localizador}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{r.cliente}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtData(r.dataVenda)}</TableCell>
                      <TableCell className="text-right text-sm">R$ {formatBRL(r.orcado)}</TableCell>
                      <TableCell className="text-right text-sm text-rose-600">R$ {formatBRL(r.custo)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-secondary">R$ {formatBRL(r.venda)}</TableCell>
                      <TableCell className={`text-right text-sm font-semibold ${r.lucro >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        R$ {formatBRL(r.lucro)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtData(r.vencimento)}</TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="icon" className="size-8">
                          <Link to="/cotacoes/nova" search={{ id: r.cotacao.id }}>
                            <ExternalLink className="size-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {filtered.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold text-sm">TOTAIS</TableCell>
                    <TableCell className="text-right font-semibold text-sm">R$ {formatBRL(totals.orcado)}</TableCell>
                    <TableCell className="text-right font-semibold text-sm text-rose-600">R$ {formatBRL(totals.custo)}</TableCell>
                    <TableCell className="text-right font-semibold text-sm text-secondary">R$ {formatBRL(totals.venda)}</TableCell>
                    <TableCell className={`text-right font-bold text-sm ${totals.lucro >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      R$ {formatBRL(totals.lucro)}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </section>
        </main>
      </div>
    </div>
  );
}

function StatBox({ label, value, accent, positive }: { label: string; value: string; accent?: boolean; positive?: boolean }) {
  return (
    <div className="bg-card border border-border/50 rounded-lg px-3 py-2 min-w-[120px]">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`text-base font-bold mt-0.5 ${
        accent ? "text-secondary" :
        positive === true ? "text-emerald-600" :
        positive === false ? "text-rose-600" : "text-foreground"
      }`}>
        {value}
      </div>
    </div>
  );
}
