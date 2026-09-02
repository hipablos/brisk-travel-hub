import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Landmark, Pencil, Plus, Save, Trash2, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { useCotacoes } from "@/lib/cotacoes-store";
import {
  PROGRAMAS_MILHAS, MILHAS_TIPO_LABELS, custoMilheiro, deleteMilhaMovimento,
  formatPontos, resumoGeral, saveMilhaMovimento, useMilhasMovimentos,
  type MilhaMovimento, type MilhaTipo,
} from "@/lib/milhas-store";

export const Route = createFileRoute("/financeiro/milhas-pontos")({
  component: MilhasPontosPage,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Milhas e Pontos" },
      { name: "description", content: "Controle compras, saldo e custo real de pontos e milhas da agência." },
      { property: "og:title", content: "Brisk Viagens — Milhas e Pontos" },
      { property: "og:description", content: "Controle financeiro de pontos e milhas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type FormState = {
  data: string;
  programa: string;
  quantidade: string;
  valorTotal: string;
  banco: string;
  formaPagamento: string;
  cartao: string;
  parcelas: string;
  observacoes: string;
};

const emptyForm = (): FormState => ({
  data: new Date().toISOString().slice(0, 10), programa: PROGRAMAS_MILHAS[0], quantidade: "",
  valorTotal: "", banco: "", formaPagamento: "", cartao: "", parcelas: "1", observacoes: "",
});

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function MilhasPontosPage() {
  const movimentos = useMilhasMovimentos();
  const cotacoes = useCotacoes();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtroPrograma, setFiltroPrograma] = useState("todos");
  const [filtroInicio, setFiltroInicio] = useState("");
  const [filtroFim, setFiltroFim] = useState("");

  const resumo = useMemo(() => resumoGeral(movimentos), [movimentos]);
  const filtered = useMemo(() => movimentos.filter((m) => {
    if (filtroPrograma !== "todos" && m.programa !== filtroPrograma) return false;
    if (filtroInicio && m.data < filtroInicio) return false;
    if (filtroFim && m.data > filtroFim) return false;
    return true;
  }), [movimentos, filtroPrograma, filtroInicio, filtroFim]);

  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const reset = () => { setForm(emptyForm()); setEditingId(null); };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const quantidade = Math.round(Number(form.quantidade.replace(/\./g, "").replace(",", ".")) || 0);
    const valorTotal = Number(form.valorTotal.replace(/\./g, "").replace(",", ".")) || 0;
    if (quantidade <= 0) { toast.error("Informe uma quantidade maior que zero."); return; }
    if (form.tipo !== undefined) return;
    const result = await saveMilhaMovimento({
      id: editingId ?? crypto.randomUUID(), data: form.data, programa: form.programa,
      tipo: "compra", quantidade, valorTotal, banco: form.banco, formaPagamento: form.formaPagamento,
      cartao: form.cartao, parcelas: Math.max(1, Number(form.parcelas) || 1), observacoes: form.observacoes,
    });
    if (!result) { toast.error("Não foi possível salvar a compra."); return; }
    toast.success(editingId ? "Compra atualizada." : "Compra registrada.");
    reset();
  };

  const edit = (movement: MilhaMovimento) => {
    setEditingId(movement.id);
    setForm({
      data: movement.data, programa: movement.programa, quantidade: String(movement.quantidade),
      valorTotal: String(movement.valorTotal), banco: movement.banco ?? "", formaPagamento: movement.formaPagamento ?? "",
      cartao: movement.cartao ?? "", parcelas: String(movement.parcelas ?? 1), observacoes: movement.observacoes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (movement: MilhaMovimento) => {
    if (movement.tipo !== "compra") { toast.error("Utilizações e estornos são gerenciados pela cotação."); return; }
    if (!confirm("Excluir esta compra de milhas?")) return;
    await deleteMilhaMovimento(movement.id);
    toast.success("Compra excluída.");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
          <div>
            <p className="text-sm text-muted-foreground">Financeiro</p>
            <h1 className="text-2xl font-semibold text-foreground">Milhas e Pontos</h1>
            <p className="text-sm text-muted-foreground mt-1">Acompanhe o estoque e o custo real das suas compras de pontos.</p>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <Metric icon={<Wallet className="size-4" />} label="Pontos disponíveis" value={formatPontos(resumo.saldo)} />
            <Metric icon={<Landmark className="size-4" />} label="Total investido" value={brl(resumo.investido)} />
            <Metric icon={<CreditCard className="size-4" />} label="Custo médio / milheiro" value={brl(resumo.custoMedioMilheiro)} />
            <Metric icon={<Plus className="size-4" />} label="Quantidade de compras" value={String(resumo.compras)} />
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {resumo.resumos.map((item) => (
              <Card key={item.programa} className="border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{item.programa}</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-xl font-bold text-foreground">{formatPontos(item.saldo)}</p>
                  <p className="text-xs text-muted-foreground">saldo disponível</p>
                  <div className="pt-2 text-xs text-muted-foreground flex justify-between"><span>Investido</span><strong className="text-foreground">{brl(item.investido)}</strong></div>
                  <div className="text-xs text-muted-foreground flex justify-between"><span>Milheiro</span><strong className="text-foreground">{brl(item.custoMedioMilheiro)}</strong></div>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-lg">{editingId ? "Editar compra" : "Registrar compra de pontos ou milhas"}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Field label="Data"><Input type="date" value={form.data} onChange={(e) => update("data", e.target.value)} required /></Field>
                <Field label="Programa"><Select value={form.programa} onValueChange={(v) => update("programa", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMAS_MILHAS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Quantidade de pontos/milhas"><Input inputMode="numeric" placeholder="78.000" value={form.quantidade} onChange={(e) => update("quantidade", e.target.value)} required /></Field>
                <Field label="Valor total pago (R$)"><Input inputMode="decimal" placeholder="2.354,36" value={form.valorTotal} onChange={(e) => update("valorTotal", e.target.value)} required /></Field>
                <Field label="Banco"><Input value={form.banco} onChange={(e) => update("banco", e.target.value)} /></Field>
                <Field label="Forma de pagamento"><Input placeholder="PIX, cartão, boleto..." value={form.formaPagamento} onChange={(e) => update("formaPagamento", e.target.value)} /></Field>
                <Field label="Cartão"><Input value={form.cartao} onChange={(e) => update("cartao", e.target.value)} /></Field>
                <Field label="Parcelas"><Input type="number" min="1" value={form.parcelas} onChange={(e) => update("parcelas", e.target.value)} /></Field>
                <div className="md:col-span-2 xl:col-span-4"><Field label="Observações"><Textarea rows={2} value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} /></Field></div>
                <div className="md:col-span-2 xl:col-span-4 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
                  <p className="text-sm text-muted-foreground">Custo do milheiro: <strong className="text-foreground">{brl(custoMilheiro(Number(form.valorTotal.replace(/\./g, "").replace(",", ".")) || 0, Number(form.quantidade.replace(/\./g, "").replace(",", ".")) || 0))}</strong></p>
                  <div className="flex gap-2"><Button type="button" variant="outline" onClick={reset} className={editingId ? "" : "hidden"}><X className="size-4 mr-2" />Cancelar</Button><Button type="submit"><Save className="size-4 mr-2" />{editingId ? "Salvar alterações" : "Registrar compra"}</Button></div>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><CardTitle className="text-lg">Histórico de movimentações</CardTitle><div className="flex flex-wrap gap-2"><Select value={filtroPrograma} onValueChange={setFiltroPrograma}><SelectTrigger className="w-[170px]"><SelectValue placeholder="Todos os programas" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os programas</SelectItem>{resumo.resumos.map((r) => <SelectItem key={r.programa} value={r.programa}>{r.programa}</SelectItem>)}</SelectContent></Select><Input type="date" aria-label="Data inicial" value={filtroInicio} onChange={(e) => setFiltroInicio(e.target.value)} /><Input type="date" aria-label="Data final" value={filtroFim} onChange={(e) => setFiltroFim(e.target.value)} /></div></CardHeader>
            <CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Programa</TableHead><TableHead>Movimentação</TableHead><TableHead>Quantidade</TableHead><TableHead>Valor</TableHead><TableHead>Custo/milheiro</TableHead><TableHead>Banco</TableHead><TableHead>Pagamento</TableHead><TableHead>Cotação</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-10">Nenhuma movimentação encontrada.</TableCell></TableRow> : filtered.map((m) => { const cot = m.cotacaoId ? cotacoes.find((c) => c.id === m.cotacaoId) : undefined; const signed = m.tipo === "compra" || m.tipo === "estorno" ? m.quantidade : -m.quantidade; return <TableRow key={m.id}><TableCell>{new Date(`${m.data}T12:00:00`).toLocaleDateString("pt-BR")}</TableCell><TableCell className="font-medium">{m.programa}</TableCell><TableCell><Badge variant={m.tipo === "compra" ? "default" : "secondary"}>{MILHAS_TIPO_LABELS[m.tipo as MilhaTipo]}</Badge></TableCell><TableCell className={signed < 0 ? "text-destructive" : "text-emerald-600"}>{signed > 0 ? "+" : ""}{formatPontos(signed)}</TableCell><TableCell>{brl(m.valorTotal)}</TableCell><TableCell>{m.tipo === "compra" ? brl(custoMilheiro(m.valorTotal, m.quantidade)) : brl(custoMilheiro(m.valorTotal, m.quantidade))}</TableCell><TableCell>{m.banco || "—"}</TableCell><TableCell>{m.formaPagamento || "—"}</TableCell><TableCell>{cot ? `#${cot.code}` : "—"}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1">{m.tipo === "compra" && <><Button variant="ghost" size="icon" title="Editar compra" onClick={() => edit(m)}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" title="Excluir compra" onClick={() => remove(m)}><Trash2 className="size-4" /></Button></>}</div></TableCell></TableRow> })}</TableBody></Table></div></CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <Card className="border-border/60"><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground text-xs"><span className="text-primary">{icon}</span>{label}</div><p className="text-xl font-bold text-foreground mt-2 truncate">{value}</p></CardContent></Card>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
