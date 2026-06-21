import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
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
  useFormasPagamento, computeFormaTotal, deleteCotacao,
  DEFAULT_TERMOS, DEFAULT_OUTRAS_INFORMACOES,
  useTermosModelos,
  type CotacaoStatus, type Cotacao, type ValorCusto, type ValorVenda, type VendaLinha,
} from "@/lib/cotacoes-store";

import { FlightCard, novoVoo, type Voo } from "@/components/cotacoes/FlightCard";
import { ClienteAutocomplete } from "@/components/cotacoes/ClienteAutocomplete";
import { VendaLinhaDialog } from "@/components/cotacoes/VendaLinhaDialog";
import { TelegramAlertDiagnostic } from "@/components/cotacoes/TelegramAlertDiagnostic";
import { HospedagemInlineForm, novaHospedagem, type HospedagemDraft } from "@/components/hospedagens/HospedagemInlineForm";
import { ExperienciaInlineForm, novaExperiencia, type ExperienciaDraft } from "@/components/places/ExperienciaInlineForm";
import { supabase } from "@/integrations/supabase/client";
import { Users, Eye } from "lucide-react";

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
  { id: "transporte", label: "Transporte", icon: Car },
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
  const [termos, setTermos] = useState("");
  const [outrasInformacoes, setOutrasInformacoes] = useState("");
  const [termosModeloId, setTermosModeloId] = useState<string>("");
  const [outrasModeloId, setOutrasModeloId] = useState<string>("");
  const termosModelos = useTermosModelos();


  const [observacoes, setObservacoes] = useState("");
  const [status, setStatus] = useState<CotacaoStatus>("aguardando");
  const [validade, setValidade] = useState("");
  const [pagamento, setPagamento] = useState("");
  const [formasPagamentoIds, setFormasPagamentoIds] = useState<string[]>([]);
  const formasPagamento = useFormasPagamento();

  const [services, setServices] = useState<ServiceItem[]>([
    { id: "1", type: "voo", description: "", value: "" },
  ]);

  const [vooIdas, setVooIdas] = useState<Voo[]>(() => [novoVoo()]);
  const [vooVoltas, setVooVoltas] = useState<Voo[]>([]);

  // Hospedagens e Experiências vinculadas a esta cotação
  const [hospedagens, setHospedagens] = useState<HospedagemDraft[]>([]);
  const [experiencias, setExperiencias] = useState<ExperienciaDraft[]>([]);
  const [hospedagensRemovidas, setHospedagensRemovidas] = useState<string[]>([]);
  const [experienciasRemovidas, setExperienciasRemovidas] = useState<string[]>([]);

  // Valores tab
  const [valoresCusto, setValoresCusto] = useState<ValorCusto[]>([]);
  const [valoresVenda, setValoresVenda] = useState<ValorVenda[]>([]);

  // Venda tab
  const [vendaCustos, setVendaCustos] = useState<VendaLinha[]>([]);
  const [vendaVendas, setVendaVendas] = useState<VendaLinha[]>([]);
  const [vendaObservacoes, setVendaObservacoes] = useState("");
  const [dataVenda, setDataVenda] = useState("");
  const [localizador, setLocalizador] = useState("");
  const [valorComparacao, setValorComparacao] = useState<string>("");
  const [instrucoesPagamento, setInstrucoesPagamento] = useState("");
  const [linkPagamento, setLinkPagamento] = useState("");

  // Tipo de documento (Orçamento x Venda) — controla a aba ativa
  const [activeTab, setActiveTab] = useState<"orcamento" | "venda">("orcamento");
  const tipoDocumento: "orcamento" | "venda" = activeTab;




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
      setTermos(c.termos ?? "");
      setOutrasInformacoes(c.outrasInformacoes ?? "");

      setStatus(c.status);
      setValidade(c.validade ?? "");
      setPagamento(c.pagamento ?? "");
      setFormasPagamentoIds(c.formasPagamentoIds ?? []);
      setServices(
        c.servicos.length
          ? c.servicos
              .filter((s) => serviceOptions.some((o) => o.id === (s.type as ServiceType)))
              .map((s) => ({
                id: s.id,
                type: s.type as ServiceType,
                description: s.description,
                value: String(s.value),
              }))
          : []
      );
      setValoresCusto(c.valoresCusto ?? []);
      setValoresVenda(c.valoresVenda ?? []);
      setVendaCustos(c.vendaCustos ?? []);
      setVendaVendas(c.vendaVendas ?? []);
      setVendaObservacoes(c.vendaObservacoes ?? "");
      setDataVenda(c.dataVenda ?? "");
      setLocalizador(c.localizador ?? "");
      setValorComparacao(c.valorComparacao ? String(c.valorComparacao) : "");
      setInstrucoesPagamento(c.instrucoesPagamento ?? "");
      setLinkPagamento(c.linkPagamento ?? "");
      const idasArr = ((c as any).vooIdas as Voo[] | undefined) ?? (c.vooIda ? [c.vooIda as Voo] : [novoVoo()]);
      const voltasArr = ((c as any).vooVoltas as Voo[] | undefined) ?? (c.vooVolta ? [c.vooVolta as Voo] : []);
      setVooIdas(idasArr.length ? idasArr : [novoVoo()]);
      setVooVoltas(voltasArr);
    });

    // Carrega hospedagens e experiências já vinculadas
    (supabase.from as any)("hospedagens")
      .select("*").eq("cotacao_id", editId).order("checkin", { ascending: true })
      .then(({ data }: any) => {
        if (data) setHospedagens(data.map((h: any) => ({
          ...h,
          checkin: h.checkin ? h.checkin.slice(0, 16) : "",
          checkout: h.checkout ? h.checkout.slice(0, 16) : "",
        })));
      });
    (supabase.from as any)("experiencias")
      .select("*").eq("cotacao_id", editId).order("data", { ascending: true })
      .then(({ data }: any) => {
        if (data) setExperiencias(data.map((e: any) => ({
          ...e,
          hora_inicio: e.hora_inicio ? e.hora_inicio.slice(0, 5) : "",
          hora_termino: e.hora_termino ? e.hora_termino.slice(0, 5) : "",
        })));
      });
  }, [editId]);

  // Aplica modelo padrão em novas cotações quando os modelos carregam
  useEffect(() => {
    if (editing) return;
    const padraoT = termosModelos.find((m) => m.categoria === "termos" && m.padrao && m.ativo);
    const padraoO = termosModelos.find((m) => m.categoria === "outras" && m.padrao && m.ativo);
    if (padraoT && !termosModeloId) {
      setTermosModeloId(padraoT.id);
      setTermos(padraoT.conteudo);
    }
    if (padraoO && !outrasModeloId) {
      setOutrasModeloId(padraoO.id);
      setOutrasInformacoes(padraoO.conteudo);
    }
  }, [termosModelos, editing, termosModeloId, outrasModeloId]);




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

  // Dialog states para Adicionar Custo / Adicionar Venda
  const [custoDialog, setCustoDialog] = useState<{ open: boolean; edit: VendaLinha | null }>({ open: false, edit: null });
  const [vendaDialog, setVendaDialog] = useState<{ open: boolean; edit: VendaLinha | null }>({ open: false, edit: null });

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

  const buildCotacao = async (): Promise<Cotacao | null> => {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente) {
      toast.error("Selecione ou cadastre um cliente");
      return null;
    }
    const vooIda = vooIdas[0];
    const vooVolta = vooVoltas[0] ?? null;
    const destinoFinal = (destino || vooIda?.destino || "").trim();
    if (!destinoFinal) {
      toast.error("Informe o destino do voo de ida");
      return null;
    }
    const existing = editId ? await getCotacao(editId) : undefined;
    return {
      id: existing?.id ?? crypto.randomUUID(),
      code: existing?.code ?? genCode(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      status,
      cliente: { ...cliente, email: email || cliente.email, telefone: telefone || cliente.telefone },
      tag: tag || undefined,
      labels: existing?.labels ?? [],
      origem: origem || vooIda?.origem,
      destino: destino || vooIda?.destino,
      ida: ida || vooIda?.data,
      volta: volta || vooVolta?.data,
      adultos, criancas,
      vooIda,
      vooVolta: vooVolta ?? undefined,
      vooIdas,
      vooVoltas,
      servicos: services.map((s) => ({
        id: s.id, type: s.type, description: s.description,
        value: parseFloat(s.value.replace(",", ".")) || 0,
      })),
      observacoes,
      termos,
      outrasInformacoes,
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
      localizador: localizador || undefined,
      valorComparacao: parseFloat(valorComparacao.replace(",", ".")) || undefined,
      instrucoesPagamento: instrucoesPagamento || undefined,
      linkPagamento: linkPagamento || undefined,
      passageirosNomes: existing?.passageirosNomes,
    };
  };

  const syncHospedagensExperiencias = async (cotacaoId: string, clienteIdFinal: string | null) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    // Remoções
    if (hospedagensRemovidas.length) {
      await (supabase.from as any)("hospedagens").delete().in("id", hospedagensRemovidas);
    }
    if (experienciasRemovidas.length) {
      await (supabase.from as any)("experiencias").delete().in("id", experienciasRemovidas);
    }
    // Hospedagens
    for (const h of hospedagens) {
      if (!h.nome_hotel?.trim()) continue;
      const noites = h.checkin && h.checkout
        ? Math.max(0, Math.round((new Date(h.checkout).getTime() - new Date(h.checkin).getTime()) / 86400000))
        : (h.noites ?? null);
      const payload: any = {
        ...h,
        noites,
        checkin: h.checkin ? new Date(h.checkin).toISOString() : null,
        checkout: h.checkout ? new Date(h.checkout).toISOString() : null,
        cotacao_id: cotacaoId,
        cliente_id: clienteIdFinal,
      };
      if (h.id) {
        await (supabase.from as any)("hospedagens").update(payload).eq("id", h.id);
      } else {
        payload.created_by = userId;
        await (supabase.from as any)("hospedagens").insert(payload);
      }
    }
    // Experiências
    for (const ex of experiencias) {
      if (!ex.nome?.trim()) continue;
      const payload: any = {
        ...ex,
        data: ex.data || null,
        hora_inicio: ex.hora_inicio || null,
        hora_termino: ex.hora_termino || null,
        cotacao_id: cotacaoId,
        cliente_id: clienteIdFinal,
      };
      if (ex.id) {
        await (supabase.from as any)("experiencias").update(payload).eq("id", ex.id);
      } else {
        payload.created_by = userId;
        await (supabase.from as any)("experiencias").insert(payload);
      }
    }
    setHospedagensRemovidas([]);
    setExperienciasRemovidas([]);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cotacao = await buildCotacao();
    if (!cotacao) return;
    const saved = await saveCotacao(cotacao);
    if (!saved) {
      toast.error("Não foi possível salvar a cotação");
      return;
    }
    await syncHospedagensExperiencias(saved.id, clienteId || null);
    toast.success(editing ? "Cotação atualizada!" : "Cotação salva!");
    // Não navega mais automaticamente para o PDF
    if (!editing) {
      navigate({ to: "/cotacoes/nova", search: { id: saved.id } });
    }
    return saved;
  };

  const handleVisualizarPDF = async () => {
    const saved = await handleSave();
    if (saved) {
      navigate({ to: "/cotacoes/$id", params: { id: saved.id } });
    }
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
            <div className="flex items-center gap-2 flex-wrap">
              <Button asChild variant="outline"><Link to="/cotacoes">Cancelar</Link></Button>
              {editing && editId && (
                <TelegramAlertDiagnostic
                  cotacaoId={editId}
                  code={undefined}
                  status={status}
                  cliente={clientes.find((c) => c.id === clienteId) ?? null}
                  vooIdas={vooIdas}
                  vooVoltas={vooVoltas}
                />
              )}
              {editing && editId && (
                <Button
                  type="button"
                  variant="destructive"
                  className="gap-2"
                  onClick={async () => {
                    if (!confirm("Excluir esta cotação? Esta ação não pode ser desfeita.")) return;
                    await deleteCotacao(editId);
                    toast.success("Cotação excluída");
                    navigate({ to: "/cotacoes" });
                  }}
                >
                  <Trash2 className="size-4" /> Excluir
                </Button>
              )}
              <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="size-4" /> Salvar Cotação
              </Button>
            </div>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="orcamento" className="gap-2"><FileText className="size-4" />Orçamento</TabsTrigger>
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
                    <ClienteAutocomplete
                      clientes={clientes}
                      value={clientes.find((c) => c.id === clienteId)?.nome}
                      onSelect={(c) => {
                        setClienteId(c.id);
                        if (c.email) setEmail(c.email);
                        if (c.telefone) setTelefone(c.telefone);
                      }}
                      placeholder={clientes.length ? "Digite o nome do cliente..." : "Nenhum cliente — cadastre acima"}
                    />
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

              {vooIdas.map((v, idx) => (
                <FlightCard
                  key={v.id}
                  direction="ida"
                  voo={v}
                  index={idx}
                  total={vooIdas.length}
                  onChange={(patch) =>
                    setVooIdas((list) => list.map((x, i) => (i === idx ? { ...x, ...patch } : x)))
                  }
                  onDuplicate={() =>
                    setVooIdas((list) => {
                      const copy = { ...list[idx], id: crypto.randomUUID() };
                      const next = [...list];
                      next.splice(idx + 1, 0, copy);
                      return next;
                    })
                  }
                  onRemove={
                    vooIdas.length > 1
                      ? () => setVooIdas((list) => list.filter((_, i) => i !== idx))
                      : undefined
                  }
                />
              ))}

              <button
                type="button"
                onClick={() => setVooIdas((list) => [...list, novoVoo()])}
                className="w-full rounded-xl border border-dashed border-border hover:border-primary hover:bg-primary/5 text-sm text-muted-foreground hover:text-foreground py-3 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="size-4" /> Adicionar outro voo de ida
              </button>

              {vooVoltas.map((v, idx) => (
                <FlightCard
                  key={v.id}
                  direction="volta"
                  voo={v}
                  index={idx}
                  total={vooVoltas.length}
                  onChange={(patch) =>
                    setVooVoltas((list) => list.map((x, i) => (i === idx ? { ...x, ...patch } : x)))
                  }
                  onDuplicate={() =>
                    setVooVoltas((list) => {
                      const copy = { ...list[idx], id: crypto.randomUUID() };
                      const next = [...list];
                      next.splice(idx + 1, 0, copy);
                      return next;
                    })
                  }
                  onRemove={() => setVooVoltas((list) => list.filter((_, i) => i !== idx))}
                />
              ))}

              <button
                type="button"
                onClick={() => setVooVoltas((list) => [...list, novoVoo()])}
                className="w-full rounded-xl border border-dashed border-border hover:border-secondary hover:bg-secondary/5 text-sm text-muted-foreground hover:text-foreground py-4 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="size-4" /> {vooVoltas.length === 0 ? "Adicionar voo de volta" : "Adicionar outro voo de volta"}
              </button>


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
                      <Hotel className="size-4" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Hospedagens</h2>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="gap-2"
                    onClick={() => setHospedagens((l) => [...l, novaHospedagem()])}>
                    <Plus className="size-4" /> Adicionar hospedagem
                  </Button>
                </div>
                {hospedagens.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma hospedagem. Clique acima para adicionar — será salva e aparecerá no PDF.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {hospedagens.map((h, idx) => (
                      <HospedagemInlineForm
                        key={h.id ?? `new-${idx}`}
                        value={h}
                        index={idx}
                        onChange={(patch) => setHospedagens((l) => l.map((x, i) => i === idx ? { ...x, ...patch } : x))}
                        onRemove={() => {
                          if (h.id) setHospedagensRemovidas((r) => [...r, h.id!]);
                          setHospedagens((l) => l.filter((_, i) => i !== idx));
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-card border border-border/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
                      <MapPin className="size-4" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Experiências Turísticas</h2>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="gap-2"
                    onClick={() => setExperiencias((l) => [...l, novaExperiencia()])}>
                    <Plus className="size-4" /> Adicionar experiência
                  </Button>
                </div>
                {experiencias.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma experiência. Clique acima para adicionar — será salva e aparecerá no PDF.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {experiencias.map((ex, idx) => (
                      <ExperienciaInlineForm
                        key={ex.id ?? `new-${idx}`}
                        value={ex}
                        index={idx}
                        onChange={(patch) => setExperiencias((l) => l.map((x, i) => i === idx ? { ...x, ...patch } : x))}
                        onRemove={() => {
                          if (ex.id) setExperienciasRemovidas((r) => [...r, ex.id!]);
                          setExperiencias((l) => l.filter((_, i) => i !== idx));
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>


              <section className="bg-card border border-border/50 rounded-xl p-6 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
                    <h2 className="text-lg font-semibold text-foreground">Termos e Condições</h2>
                    <Button asChild type="button" variant="outline" size="sm" className="gap-2">
                      <Link to="/termos-condicoes"><FileSignature className="size-4" /> Gerenciar modelos</Link>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Selecione um modelo cadastrado. O conteúdo será salvo junto à cotação.</p>
                  <Select
                    value={termosModeloId || "__none"}
                    onValueChange={(v) => {
                      if (v === "__none") {
                        setTermosModeloId("");
                        setTermos("");
                        return;
                      }
                      const m = termosModelos.find((x) => x.id === v);
                      if (m) {
                        setTermosModeloId(m.id);
                        setTermos(m.conteudo);
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione um modelo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Sem termos</SelectItem>
                      {termosModelos.filter((m) => m.categoria === "termos" && m.ativo).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nome}{m.padrao ? " (padrão)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {termos && (
                    <div className="mt-2 text-[11px] text-muted-foreground whitespace-pre-wrap border border-dashed border-border/60 rounded p-2 max-h-32 overflow-auto">
                      {termos}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
                    <h2 className="text-lg font-semibold text-foreground">Outras Informações</h2>
                    <Button asChild type="button" variant="outline" size="sm" className="gap-2">
                      <Link to="/termos-condicoes"><FileSignature className="size-4" /> Gerenciar modelos</Link>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Selecione um modelo cadastrado. O conteúdo será salvo junto à cotação.</p>
                  <Select
                    value={outrasModeloId || "__none"}
                    onValueChange={(v) => {
                      if (v === "__none") {
                        setOutrasModeloId("");
                        setOutrasInformacoes("");
                        return;
                      }
                      const m = termosModelos.find((x) => x.id === v);
                      if (m) {
                        setOutrasModeloId(m.id);
                        setOutrasInformacoes(m.conteudo);
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione um modelo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Sem outras informações</SelectItem>
                      {termosModelos.filter((m) => m.categoria === "outras" && m.ativo).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nome}{m.padrao ? " (padrão)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {outrasInformacoes && (
                    <div className="mt-2 text-[11px] text-muted-foreground whitespace-pre-wrap border border-dashed border-border/60 rounded p-2 max-h-32 overflow-auto">
                      {outrasInformacoes}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Observações internas</h2>
                  <p className="text-xs text-muted-foreground mb-2">Não aparece no PDF — uso interno.</p>
                  <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Notas internas sobre a cotação..." rows={3} />
                </div>
              </section>


                </TabsContent>


                <TabsContent value="venda" className="space-y-6 mt-0">


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


                  {(status === "aprovado" || status === "aguardando_cliente") && vendaCustos.length === 0 && vendaVendas.length === 0 && (
                    <section className="rounded-xl border border-secondary/40 bg-gradient-to-br from-secondary/10 to-secondary/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                          <DollarSign className="size-4 text-secondary" />
                          Cotação aprovada — pronta para lançamento financeiro
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Lance os custos e recebimentos para registrar esta venda no financeiro.
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="lg"
                        className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-md"
                        onClick={() => setVendaDialog({ open: true, edit: null })}
                      >
                        <Plus className="size-4" /> Lançar Venda
                      </Button>
                    </section>
                  )}


                  {/* LOCALIZADOR DO VOO */}
                  <section className="bg-card border border-border/50 rounded-xl p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                      <div className="flex-1">
                        <Label htmlFor="localizador" className="text-sm font-semibold text-foreground">
                          Localizador do Voo
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Código de reserva (PNR) do voo. Opcional.
                        </p>
                      </div>
                      <div className="md:w-72">
                        <Input
                          id="localizador"
                          placeholder="Ex.: ABC123"
                          value={localizador}
                          onChange={(e) => setLocalizador(e.target.value.toUpperCase())}
                          className="font-mono tracking-wider uppercase bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 focus-visible:ring-yellow-500"
                        />
                      </div>
                    </div>
                  </section>

                  {/* CUSTOS */}
                  <section className="bg-card border border-border/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Custos</h2>
                        <p className="text-xs text-muted-foreground">
                          {vendaCustos.length} lançamento{vendaCustos.length === 1 ? "" : "s"} ·
                          Total R$ {formatBRL(vendaCustos.reduce((s, v) => s + (v.valor || 0), 0))}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={addVendaCusto}
                      >
                        <Plus className="size-4" /> Adicionar Custo
                      </Button>
                    </div>

                    {vendaCustos.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/60 px-6 py-10 text-center">
                        <p className="text-sm text-muted-foreground">Nenhum custo lançado.</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="mt-2 gap-2 text-secondary"
                          onClick={addVendaCusto}
                        >
                          <Plus className="size-4" /> Adicionar primeiro custo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {vendaCustos.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/40 px-3 py-2"
                          >
                            <Input
                              placeholder="Observação"
                              value={v.descricao ?? ""}
                              onChange={(e) => updVendaCusto(v.id, { descricao: e.target.value })}
                              className="flex-1"
                            />
                            <div className="flex items-center gap-1 w-44">
                              <span className="px-2 h-9 flex items-center rounded-md border border-border/40 bg-muted text-xs text-muted-foreground">R$</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={v.valor || ""}
                                onChange={(e) => updVendaCusto(v.id, { valor: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => delVendaCusto(v.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>


                  {/* VENDAS */}
                  <section className="bg-card border border-border/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Valores de Venda</h2>
                        <p className="text-xs text-muted-foreground">
                          {vendaVendas.length} lançamento{vendaVendas.length === 1 ? "" : "s"} ·
                          Total R$ {formatBRL(vendaVendas.reduce((s, v) => s + (v.valor || 0), 0))}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        onClick={() => setVendaDialog({ open: true, edit: null })}
                      >
                        <Plus className="size-4" /> Adicionar Venda
                      </Button>
                    </div>

                    {vendaVendas.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/60 px-6 py-10 text-center">
                        <p className="text-sm text-muted-foreground">Nenhuma venda lançada.</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="mt-2 gap-2 text-secondary"
                          onClick={() => setVendaDialog({ open: true, edit: null })}
                        >
                          <Plus className="size-4" /> Adicionar primeira venda
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {vendaVendas.map((v) => (
                          <div
                            key={v.id}
                            className="group flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 px-4 py-3 hover:border-border transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm text-foreground truncate">
                                  {v.descricao || v.categoria || "Venda sem descrição"}
                                </span>
                                {v.pago && (
                                  <span className="text-[10px] uppercase font-semibold tracking-wide text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
                                    Recebido
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                {[v.parte, v.forma, v.parcela, v.vencimento].filter(Boolean).join(" · ") || "—"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-sm text-secondary">R$ {formatBRL(v.valor || 0)}</div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setVendaDialog({ open: true, edit: v })}
                              >
                                Editar
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => delVendaVenda(v.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="bg-card border border-border/50 rounded-xl p-6 space-y-6">
                    <div>
                      <Label>Valor de Comparação</Label>
                      <div className="flex items-center gap-2 mt-1.5 max-w-xs">
                        <span className="px-3 h-9 flex items-center rounded-md border border-border/40 bg-muted text-sm text-muted-foreground">R$</span>
                        <Input
                          placeholder="0,00"
                          value={valorComparacao}
                          onChange={(e) => setValorComparacao(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Valor "de" para mostrar economia ao cliente no PDF.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Forma(s) de Pagamento</h3>
                      {formasPagamento.length === 0 ? (
                        <div className="text-xs text-muted-foreground border border-dashed border-border rounded-md p-3">
                          Nenhuma forma cadastrada.{" "}
                          <Link to="/formas-pagamento" className="text-primary underline">Cadastrar</Link>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {formasPagamento.filter((f) => f.ativo).map((f) => {
                            const checked = formasPagamentoIds.includes(f.id);
                            const calc = computeFormaTotal(totalVendas || total, f);
                            return (
                              <label
                                key={f.id}
                                className="flex items-start gap-2 py-1 cursor-pointer text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) =>
                                    setFormasPagamentoIds((ids) =>
                                      e.target.checked ? [...ids, f.id] : ids.filter((x) => x !== f.id)
                                    )
                                  }
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <span className="text-foreground">{f.nome}</span>
                                  <span className="text-muted-foreground ml-2 text-xs">
                                    {f.parcelas > 1
                                      ? `${f.parcelas}x de R$ ${formatBRL(calc.valorParcela)} (Total R$ ${formatBRL(calc.final)})`
                                      : `R$ ${formatBRL(calc.final)}`}
                                    {f.desconto > 0 && <span className="text-emerald-600"> · -{f.desconto}%</span>}
                                    {f.acrescimo > 0 && <span className="text-rose-600"> · +{f.acrescimo}%</span>}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Instruções para Pagamento</Label>
                      <Textarea
                        className="mt-1.5"
                        rows={3}
                        value={instrucoesPagamento}
                        onChange={(e) => setInstrucoesPagamento(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Link para Pagamento</Label>
                      <Input
                        className="mt-1.5"
                        placeholder="Adicione o link de pagamento para exibição no orçamento"
                        value={linkPagamento}
                        onChange={(e) => setLinkPagamento(e.target.value)}
                      />
                    </div>
                  </section>


                  <VendaLinhaDialog
                    open={custoDialog.open}
                    onOpenChange={(o) => setCustoDialog((s) => ({ ...s, open: o }))}
                    kind="custo"
                    initial={custoDialog.edit}
                    onSave={(linha) => {
                      if (custoDialog.edit) {
                        updVendaCusto(custoDialog.edit.id, linha);
                      } else {
                        setVendaCustos((l) => [...l, linha]);
                      }
                    }}
                    suggestions={{
                      partes: Array.from(new Set(vendaCustos.map((v) => v.parte).filter(Boolean) as string[])),
                      contas: Array.from(new Set(vendaCustos.map((v) => v.conta).filter(Boolean) as string[])),
                      categorias: Array.from(new Set(vendaCustos.map((v) => v.categoria).filter(Boolean) as string[])),
                    }}
                  />
                  <VendaLinhaDialog
                    open={vendaDialog.open}
                    onOpenChange={(o) => setVendaDialog((s) => ({ ...s, open: o }))}
                    kind="venda"
                    initial={vendaDialog.edit}
                    onSave={(linha) => {
                      if (vendaDialog.edit) {
                        updVendaVenda(vendaDialog.edit.id, linha);
                      } else {
                        setVendaVendas((l) => [...l, linha]);
                      }
                    }}
                    suggestions={{
                      partes: Array.from(new Set([
                        ...vendaVendas.map((v) => v.parte).filter(Boolean) as string[],
                        ...clientes.map((c) => c.nome),
                      ])),
                      contas: Array.from(new Set(vendaVendas.map((v) => v.conta).filter(Boolean) as string[])),
                      categorias: Array.from(new Set(vendaVendas.map((v) => v.categoria).filter(Boolean) as string[])),
                    }}
                  />
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
                    <DateInput className="pl-9" value={validade} onChange={(iso) => setValidade(iso)} />
                    <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {formasPagamentoIds.length > 0 && (
                  <div className="mb-4 text-xs text-muted-foreground">
                    {formasPagamentoIds.length} forma{formasPagamentoIds.length > 1 ? "s" : ""} de pagamento selecionada{formasPagamentoIds.length > 1 ? "s" : ""} (aba Valores)
                  </div>
                )}



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
                <Button type="button" onClick={handleVisualizarPDF} variant="outline" className="w-full mt-2 gap-2">
                  <Eye className="size-4" /> Visualizar PDF
                </Button>
              </section>
            </aside>
          </form>
        </main>
      </div>
    </div>
  );
}
