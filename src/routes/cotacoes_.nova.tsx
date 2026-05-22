import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Save, User, Plane, Hotel, Car, Ship, Shield, MapPin,
  CalendarIcon, Plus, Trash2, FileText, UserPlus, DollarSign, ShoppingCart,
  Star, FileSignature, BookmarkCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  saveCotacao, useClientes, getCotacao, genCode, formatBRL,
  useFormasPagamento, computeFormaTotal,
  type CotacaoStatus, type Cotacao, type ValorCusto, type ValorVenda, type VendaLinha,
} from "@/lib/cotacoes-store";
import { FlightCard, novoVoo, type Voo } from "@/components/cotacoes/FlightCard";
import { Users } from "lucide-react";

import { toast } from "sonner";

type NovaSearch = { id?: string; redirect?: string };

export const Route = createFileRoute("/cotacoes_/nova")({
  component: NovaCotacao,
  validateSearch: (search: Record<string, unknown>): NovaSearch => ({
    id: typeof search.id === "string" ? search.id : undefined,
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Nova Cotação" },
      { name: "description", content: "Crie uma nova cotação de viagem para o cliente da Brisk Viagens." },
    ],
  }),
});

type ServiceType = "voo" | "hospedagem" | "transporte" | "experiencia" | "cruzeiro" | "seguro";

const serviceOptions: { id: ServiceType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "voo", label: "Voo", icon: Plane },
  { id: "hospedagem", label: "Hospedagem", icon: Hotel },
  { id: "transporte", label: "Transporte", icon: Car },
  { id: "experiencia", label: "Experiência", icon: MapPin },
  { id: "cruzeiro", label: "Cruzeiro", icon: Ship },
  { id: "seguro", label: "Seguro", icon: Shield },
];

type ServiceItem = { id: string; type: ServiceType; description: string; value: string };

function NovaCotacao() {
  const navigate = useNavigate();
  const clientes = useClientes();
  const { id: editId } = Route.useSearch();
  const editing = !!editId;

  const [clienteId, setClienteId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tag, setTag] = useState("");
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [ida, setIda] = useState("");
  const [volta, setVolta] = useState("");
  const [adultos, setAdultos] = useState(2);
  const [criancas, setCriancas] = useState(0);
  const [observacoes, setObservacoes] = useState("");
  const [status, setStatus] = useState<CotacaoStatus>("aguardando");
  const [validade, setValidade] = useState("");
  const [pagamento, setPagamento] = useState("");
  const [formasPagamentoIds, setFormasPagamentoIds] = useState<string[]>([]);
  const formasPagamento = useFormasPagamento();

  const [services, setServices] = useState<ServiceItem[]>([
    { id: "1", type: "voo", description: "", value: "" },
  ]);

  const [vooIda, setVooIda] = useState<Voo>(() => novoVoo());
  const [vooVolta, setVooVolta] = useState<Voo | null>(null);

  // Valores tab
  const [valoresCusto, setValoresCusto] = useState<ValorCusto[]>([]);
  const [valoresVenda, setValoresVenda] = useState<ValorVenda[]>([]);

  // Venda tab
  const [vendaCustos, setVendaCustos] = useState<VendaLinha[]>([]);
  const [vendaVendas, setVendaVendas] = useState<VendaLinha[]>([]);
  const [vendaObservacoes, setVendaObservacoes] = useState("");
  const [dataVenda, setDataVenda] = useState("");
  const [valorComparacao, setValorComparacao] = useState<string>("");
  const [instrucoesPagamento, setInstrucoesPagamento] = useState("");
  const [linkPagamento, setLinkPagamento] = useState("");

  // Load existing cotacao when editing
  useEffect(() => {
    if (!editId) return;
    getCotacao(editId).then((c) => {
      if (!c) return;
      setClienteId(c.cliente.id);
      setEmail(c.cliente.email ?? "");
      setTelefone(c.cliente.telefone ?? "");
      setTag(c.tag ?? "");
      setOrigem(c.origem ?? "");
      setDestino(c.destino ?? "");
      setIda(c.ida ?? "");
      setVolta(c.volta ?? "");
      setAdultos(c.adultos);
      setCriancas(c.criancas);
      setObservacoes(c.observacoes ?? "");
      setStatus(c.status);
      setValidade(c.validade ?? "");
      setPagamento(c.pagamento ?? "");
      setFormasPagamentoIds(c.formasPagamentoIds ?? []);
      setServices(
        c.servicos.length
          ? c.servicos.map((s) => ({
              id: s.id,
              type: s.type as ServiceType,
              description: s.description,
              value: String(s.value),
            }))
          : [{ id: "1", type: "voo", description: "", value: "" }]
      );
      setValoresCusto(c.valoresCusto ?? []);
      setValoresVenda(c.valoresVenda ?? []);
      setVendaCustos(c.vendaCustos ?? []);
      setVendaVendas(c.vendaVendas ?? []);
      setVendaObservacoes(c.vendaObservacoes ?? "");
      setDataVenda(c.dataVenda ?? "");
      setValorComparacao(c.valorComparacao ? String(c.valorComparacao) : "");
      setInstrucoesPagamento(c.instrucoesPagamento ?? "");
      setLinkPagamento(c.linkPagamento ?? "");
      if (c.vooIda) setVooIda(c.vooIda as Voo);
      setVooVolta((c.vooVolta as Voo) ?? null);
    });
  }, [editId]);


  // Valores helpers
  const addValorCusto = () => setValoresCusto((l) => [...l, { id: crypto.randomUUID(), valor: 0 }]);
  const updValorCusto = (id: string, p: Partial<ValorCusto>) =>
    setValoresCusto((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const delValorCusto = (id: string) => setValoresCusto((l) => l.filter((x) => x.id !== id));

  const addValorVenda = () => setValoresVenda((l) => [...l, { id: crypto.randomUUID(), valor: 0 }]);
  const updValorVenda = (id: string, p: Partial<ValorVenda>) =>
    setValoresVenda((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const delValorVenda = (id: string) => setValoresVenda((l) => l.filter((x) => x.id !== id));

  const totalCustos = useMemo(() => valoresCusto.reduce((s, v) => s + (v.valor || 0), 0), [valoresCusto]);
  const totalVendas = useMemo(() => valoresVenda.reduce((s, v) => s + (v.valor || 0), 0), [valoresVenda]);
  const lucro = totalVendas - totalCustos;

  // Venda helpers
  const addVendaCusto = () =>
    setVendaCustos((l) => [...l, { id: crypto.randomUUID(), valor: 0, pago: false }]);
  const updVendaCusto = (id: string, p: Partial<VendaLinha>) =>
    setVendaCustos((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const delVendaCusto = (id: string) => setVendaCustos((l) => l.filter((x) => x.id !== id));

  const addVendaVenda = () =>
    setVendaVendas((l) => [...l, { id: crypto.randomUUID(), valor: 0, pago: false }]);
  const updVendaVenda = (id: string, p: Partial<VendaLinha>) =>
    setVendaVendas((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const delVendaVenda = (id: string) => setVendaVendas((l) => l.filter((x) => x.id !== id));

  const addService = (type: ServiceType) => {
    setServices((s) => [...s, { id: crypto.randomUUID(), type, description: "", value: "" }]);
  };
  const removeService = (id: string) => setServices((s) => s.filter((x) => x.id !== id));
  const updateService = (id: string, patch: Partial<ServiceItem>) => {
    setServices((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const total = useMemo(
    () => services.reduce((sum, s) => sum + (parseFloat(s.value.replace(",", ".")) || 0), 0),
    [services]
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente) {
      toast.error("Selecione ou cadastre um cliente");
      return;
    }
    const destinoFinal = (destino || vooIda.destino || "").trim();
    if (!destinoFinal) {
      toast.error("Informe o destino do voo de ida");
      return;
    }
    const existing = editId ? await getCotacao(editId) : undefined;
    const cotacao: Cotacao = {
      id: existing?.id ?? crypto.randomUUID(),
      code: existing?.code ?? genCode(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      status,
      cliente: { ...cliente, email: email || cliente.email, telefone: telefone || cliente.telefone },
      tag: tag || undefined,
      labels: existing?.labels ?? [],
      origem: origem || vooIda.origem,
      destino: destino || vooIda.destino,
      ida: ida || vooIda.data,
      volta: volta || vooVolta?.data,
      adultos, criancas,
      vooIda,
      vooVolta: vooVolta ?? undefined,
      servicos: services.map((s) => ({
        id: s.id, type: s.type, description: s.description,
        value: parseFloat(s.value.replace(",", ".")) || 0,
      })),
      observacoes,
      validade,
      pagamento,
      formasPagamentoIds,
      total,
      valoresCusto,
      valoresVenda,
      vendaCustos,
      vendaVendas,
      vendaObservacoes,
      dataVenda,
      valorComparacao: parseFloat(valorComparacao.replace(",", ".")) || undefined,
      instrucoesPagamento: instrucoesPagamento || undefined,
      linkPagamento: linkPagamento || undefined,
    };
    const saved = await saveCotacao(cotacao);
    if (!saved) {
      toast.error("Não foi possível salvar a cotação");
      return;
    }
    toast.success(editing ? "Cotação atualizada!" : "Cotação salva!");
    navigate({ to: "/cotacoes/$id", params: { id: saved.id } });
  };


  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="p-6 max-w-[1400px] w-full mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="icon">
                <Link to="/cotacoes"><ArrowLeft className="size-4" /></Link>
              </Button>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link to="/cotacoes" className="hover:text-foreground">Cotações</Link>
                  <span>/</span>
                  <span className="text-foreground">{editing ? "Editar" : "Nova"}</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground">{editing ? "Editar Cotação" : "Nova Cotação"}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline"><Link to="/cotacoes">Cancelar</Link></Button>
              <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="size-4" /> Salvar Cotação
              </Button>
            </div>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Tabs defaultValue="orcamento" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="orcamento" className="gap-2"><FileText className="size-4" />Orçamento</TabsTrigger>
                  <TabsTrigger value="valores" className="gap-2"><DollarSign className="size-4" />Valores</TabsTrigger>
                  <TabsTrigger value="venda" className="gap-2"><ShoppingCart className="size-4" />Venda</TabsTrigger>
                </TabsList>

                <TabsContent value="orcamento" className="space-y-6 mt-0">
              <section className="bg-card border border-border/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
                      <User className="size-4" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Dados do Cliente</h2>
                  </div>
                  <Button asChild type="button" variant="outline" size="sm" className="gap-2">
                    <Link to="/clientes/novo" search={{ redirect: "/cotacoes/nova" }}>
                      <UserPlus className="size-4" />
                      Cadastrar cliente
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Cliente *</Label>
                    <Select value={clienteId} onValueChange={setClienteId}>
                      <SelectTrigger>
                        <SelectValue placeholder={clientes.length ? "Selecione o cliente" : "Nenhum cliente — cadastre acima"} />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail</Label>
                    <Input type="email" placeholder="cliente@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone / WhatsApp</Label>
                    <Input placeholder="(11) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tag / Identificador</Label>
                    <Input placeholder="Ex.: Lua de Mel, Família..." value={tag} onChange={(e) => setTag(e.target.value)} />
                  </div>
                </div>
              </section>

              <FlightCard
                direction="ida"
                voo={vooIda}
                onChange={(patch) => setVooIda((v) => ({ ...v, ...patch }))}
              />

              {vooVolta ? (
                <FlightCard
                  direction="volta"
                  voo={vooVolta}
                  onChange={(patch) => setVooVolta((v) => (v ? { ...v, ...patch } : v))}
                  onRemove={() => setVooVolta(null)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setVooVolta(novoVoo())}
                  className="w-full rounded-xl border border-dashed border-border hover:border-secondary hover:bg-secondary/5 text-sm text-muted-foreground hover:text-foreground py-4 flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="size-4" /> Adicionar voo de volta
                </button>
              )}

              <section className="bg-card border border-border/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="size-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
                    <Users className="size-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Passageiros</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Adultos</Label>
                    <Input type="number" min={1} value={adultos} onChange={(e) => setAdultos(parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Crianças</Label>
                    <Input type="number" min={0} value={criancas} onChange={(e) => setCriancas(parseInt(e.target.value) || 0)} />
                  </div>
                </div>
              </section>


              <section className="bg-card border border-border/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
                      <FileText className="size-4" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Serviços</h2>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {serviceOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => addService(opt.id)}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-secondary/15 hover:border-secondary text-foreground transition-colors"
                    >
                      <Plus className="size-3" />
                      <opt.icon className="size-3.5" />
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {services.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Nenhum serviço adicionado. Clique acima para incluir.
                    </p>
                  )}
                  {services.map((s) => {
                    const opt = serviceOptions.find((o) => o.id === s.type)!;
                    return (
                      <div key={s.id} className="border border-border/60 rounded-lg p-3 grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-12 md:col-span-3 space-y-1.5">
                          <Label className="text-xs">Tipo</Label>
                          <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-secondary/10 border border-border/40 text-sm">
                            <opt.icon className="size-4 text-secondary" />
                            <span className="font-medium">{opt.label}</span>
                          </div>
                        </div>
                        <div className="col-span-12 md:col-span-6 space-y-1.5">
                          <Label className="text-xs">Descrição</Label>
                          <Input
                            placeholder="Descrição do serviço"
                            value={s.description}
                            onChange={(e) => updateService(s.id, { description: e.target.value })}
                          />
                        </div>
                        <div className="col-span-9 md:col-span-2 space-y-1.5">
                          <Label className="text-xs">Valor (R$)</Label>
                          <Input
                            placeholder="0,00"
                            value={s.value}
                            onChange={(e) => updateService(s.id, { value: e.target.value })}
                          />
                        </div>
                        <div className="col-span-3 md:col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeService(s.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="bg-card border border-border/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">Observações</h2>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Notas internas sobre a cotação..." rows={4} />
              </section>
                </TabsContent>

                <TabsContent value="valores" className="space-y-6 mt-0">
                  <section className="bg-card border border-border/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
                          <DollarSign className="size-4" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">Valores de Custo</h2>
                      </div>
                      <Button type="button" size="sm" variant="outline" className="gap-2" onClick={addValorCusto}>
                        <Plus className="size-4" /> Incluir
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Conta</TableHead>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead>Pagamento</TableHead>
                            <TableHead>Parcelas</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right">Valor (R$)</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {valoresCusto.length === 0 && (
                            <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-6">Nenhum custo lançado.</TableCell></TableRow>
                          )}
                          {valoresCusto.map((v) => (
                            <TableRow key={v.id}>
                              <TableCell><Input value={v.conta ?? ""} onChange={(e) => updValorCusto(v.id, { conta: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.fornecedor ?? ""} onChange={(e) => updValorCusto(v.id, { fornecedor: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.pagamento ?? ""} onChange={(e) => updValorCusto(v.id, { pagamento: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.parcelas ?? ""} onChange={(e) => updValorCusto(v.id, { parcelas: e.target.value })} /></TableCell>
                              <TableCell><Input type="date" value={v.vencimento ?? ""} onChange={(e) => updValorCusto(v.id, { vencimento: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.categoria ?? ""} onChange={(e) => updValorCusto(v.id, { categoria: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.descricao ?? ""} onChange={(e) => updValorCusto(v.id, { descricao: e.target.value })} /></TableCell>
                              <TableCell><Input type="number" step="0.01" className="text-right" value={v.valor || ""} onChange={(e) => updValorCusto(v.id, { valor: parseFloat(e.target.value) || 0 })} /></TableCell>
                              <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => delValorCusto(v.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-border/50 mt-4">
                      <div className="text-sm">
                        <span className="text-muted-foreground mr-3">Total de Custos</span>
                        <span className="text-lg font-bold text-foreground">R$ {formatBRL(totalCustos)}</span>
                      </div>
                    </div>
                  </section>

                  <section className="bg-card border border-border/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-secondary/10 grid place-items-center text-secondary">
                          <ShoppingCart className="size-4" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">Valores de Venda</h2>
                      </div>
                      <Button type="button" size="sm" variant="outline" className="gap-2" onClick={addValorVenda}>
                        <Plus className="size-4" /> Incluir
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right">Valor (R$)</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {valoresVenda.length === 0 && (
                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Nenhuma venda lançada.</TableCell></TableRow>
                          )}
                          {valoresVenda.map((v) => (
                            <TableRow key={v.id}>
                              <TableCell><Input value={v.descricao ?? ""} onChange={(e) => updValorVenda(v.id, { descricao: e.target.value })} /></TableCell>
                              <TableCell><Input type="number" step="0.01" className="text-right" value={v.valor || ""} onChange={(e) => updValorVenda(v.id, { valor: parseFloat(e.target.value) || 0 })} /></TableCell>
                              <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => delValorVenda(v.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-border/50 mt-4">
                      <div className="text-sm">
                        <span className="text-muted-foreground mr-3">Total de Venda</span>
                        <span className="text-lg font-bold text-secondary">R$ {formatBRL(totalVendas)}</span>
                      </div>
                    </div>
                  </section>
                </TabsContent>

                <TabsContent value="venda" className="space-y-6 mt-0">
                  <section className="bg-card border border-border/50 rounded-xl p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Button type="button" variant="outline" size="sm" className="gap-2"><Star className="size-4" />Avaliação</Button>
                      <Button type="button" variant="outline" size="sm" className="gap-2"><FileSignature className="size-4" />Contrato</Button>
                      <Button type="button" variant="outline" size="sm" className="gap-2"><BookmarkCheck className="size-4" />Reserva</Button>
                      <Button type="button" variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive"><Trash2 className="size-4" />Excluir Venda</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label>Data da Venda</Label>
                        <div className="relative">
                          <Input type="date" className="pl-9" value={dataVenda} onChange={(e) => setDataVenda(e.target.value)} />
                          <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Lucro</Label>
                        <div className="h-9 px-3 rounded-md border border-border/40 bg-secondary/5 flex items-center font-semibold text-secondary">
                          R$ {formatBRL(lucro)}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Lucro com Comissões</Label>
                        <div className="h-9 px-3 rounded-md border border-border/40 bg-secondary/5 flex items-center font-semibold text-secondary">
                          R$ {formatBRL(lucro)}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-card border border-border/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-foreground">Valores de Custo</h2>
                      <Button type="button" size="sm" variant="outline" className="gap-2" onClick={addVendaCusto}>
                        <Plus className="size-4" /> Incluir
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead>Conta</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Forma</TableHead>
                            <TableHead>Parcela</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Pagamento</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-center">Pago</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendaCustos.length === 0 && (
                            <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-6">Nenhum custo lançado.</TableCell></TableRow>
                          )}
                          {vendaCustos.map((v) => (
                            <TableRow key={v.id}>
                              <TableCell><Input value={v.parte ?? ""} onChange={(e) => updVendaCusto(v.id, { parte: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.conta ?? ""} onChange={(e) => updVendaCusto(v.id, { conta: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.categoria ?? ""} onChange={(e) => updVendaCusto(v.id, { categoria: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.descricao ?? ""} onChange={(e) => updVendaCusto(v.id, { descricao: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.forma ?? ""} onChange={(e) => updVendaCusto(v.id, { forma: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.parcela ?? ""} onChange={(e) => updVendaCusto(v.id, { parcela: e.target.value })} /></TableCell>
                              <TableCell><Input type="date" value={v.vencimento ?? ""} onChange={(e) => updVendaCusto(v.id, { vencimento: e.target.value })} /></TableCell>
                              <TableCell><Input type="date" value={v.pagamento ?? ""} onChange={(e) => updVendaCusto(v.id, { pagamento: e.target.value })} /></TableCell>
                              <TableCell><Input type="number" step="0.01" className="text-right" value={v.valor || ""} onChange={(e) => updVendaCusto(v.id, { valor: parseFloat(e.target.value) || 0 })} /></TableCell>
                              <TableCell className="text-center"><Switch checked={v.pago} onCheckedChange={(c) => updVendaCusto(v.id, { pago: c })} /></TableCell>
                              <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => delVendaCusto(v.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </section>

                  <section className="bg-card border border-border/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-foreground">Valores de Venda</h2>
                      <Button type="button" size="sm" variant="outline" className="gap-2" onClick={addVendaVenda}>
                        <Plus className="size-4" /> Incluir
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Conta</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Forma</TableHead>
                            <TableHead>Parcela</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Pagamento</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-center">Pago</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendaVendas.length === 0 && (
                            <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-6">Nenhuma venda lançada.</TableCell></TableRow>
                          )}
                          {vendaVendas.map((v) => (
                            <TableRow key={v.id}>
                              <TableCell><Input value={v.parte ?? ""} onChange={(e) => updVendaVenda(v.id, { parte: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.conta ?? ""} onChange={(e) => updVendaVenda(v.id, { conta: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.categoria ?? ""} onChange={(e) => updVendaVenda(v.id, { categoria: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.descricao ?? ""} onChange={(e) => updVendaVenda(v.id, { descricao: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.forma ?? ""} onChange={(e) => updVendaVenda(v.id, { forma: e.target.value })} /></TableCell>
                              <TableCell><Input value={v.parcela ?? ""} onChange={(e) => updVendaVenda(v.id, { parcela: e.target.value })} /></TableCell>
                              <TableCell><Input type="date" value={v.vencimento ?? ""} onChange={(e) => updVendaVenda(v.id, { vencimento: e.target.value })} /></TableCell>
                              <TableCell><Input type="date" value={v.pagamento ?? ""} onChange={(e) => updVendaVenda(v.id, { pagamento: e.target.value })} /></TableCell>
                              <TableCell><Input type="number" step="0.01" className="text-right" value={v.valor || ""} onChange={(e) => updVendaVenda(v.id, { valor: parseFloat(e.target.value) || 0 })} /></TableCell>
                              <TableCell className="text-center"><Switch checked={v.pago} onCheckedChange={(c) => updVendaVenda(v.id, { pago: c })} /></TableCell>
                              <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => delVendaVenda(v.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </section>

                  <section className="bg-card border border-border/50 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-3">Observação</h2>
                    <Textarea value={vendaObservacoes} onChange={(e) => setVendaObservacoes(e.target.value)} placeholder="Observações sobre a venda..." rows={4} />
                  </section>
                </TabsContent>
              </Tabs>
            </div>

            <aside className="space-y-6">
              <section className="bg-card border border-border/50 rounded-xl p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Resumo</h2>

                <div className="space-y-1.5 mb-4">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as CotacaoStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aguardando">Aguardando</SelectItem>
                      <SelectItem value="aguardando_cliente">Aguardando Cliente</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="reprovado">Reprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 mb-4">
                  <Label>Validade</Label>
                  <div className="relative">
                    <Input type="date" className="pl-9" value={validade} onChange={(e) => setValidade(e.target.value)} />
                    <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <Label>Formas de Pagamento</Label>
                  {formasPagamento.length === 0 ? (
                    <div className="text-xs text-muted-foreground border border-dashed border-border rounded-md p-3">
                      Nenhuma forma cadastrada.{" "}
                      <Link to="/formas-pagamento" className="text-primary underline">Cadastrar</Link>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto border border-border/50 rounded-md p-2">
                      {formasPagamento.filter((f) => f.ativo).map((f) => {
                        const checked = formasPagamentoIds.includes(f.id);
                        const calc = computeFormaTotal(total, f);
                        return (
                          <label
                            key={f.id}
                            className={cn(
                              "flex items-start gap-2 p-2 rounded cursor-pointer text-xs transition-colors",
                              checked ? "bg-secondary/10" : "hover:bg-muted/50"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setFormasPagamentoIds((ids) =>
                                  e.target.checked ? [...ids, f.id] : ids.filter((x) => x !== f.id)
                                )
                              }
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground">{f.nome}</div>
                              <div className="text-muted-foreground">
                                {f.parcelas > 1 ? `${f.parcelas}x de R$ ${formatBRL(calc.valorParcela)}` : `R$ ${formatBRL(calc.final)}`}
                                {f.desconto > 0 && <span className="text-emerald-600"> · -{f.desconto}%</span>}
                                {f.acrescimo > 0 && <span className="text-rose-600"> · +{f.acrescimo}%</span>}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-border/50 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Itens</span><span>{services.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span><span>R$ {formatBRL(total)}</span>
                  </div>
                  <div className={cn("flex items-center justify-between pt-2 border-t border-border/50")}>
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-xl font-bold text-secondary">R$ {formatBRL(total)}</span>
                  </div>
                </div>

                <Button type="submit" className="w-full mt-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Save className="size-4" /> Salvar Cotação
                </Button>
              </section>
            </aside>
          </form>
        </main>
      </div>
    </div>
  );
}
