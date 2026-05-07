import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
  CalendarIcon, Plus, Trash2, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cotacoes/nova")({
  component: NovaCotacao,
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
  const [services, setServices] = useState<ServiceItem[]>([
    { id: "1", type: "voo", description: "", value: "" },
  ]);

  const addService = (type: ServiceType) => {
    setServices((s) => [...s, { id: crypto.randomUUID(), type, description: "", value: "" }]);
  };

  const removeService = (id: string) => {
    setServices((s) => s.filter((x) => x.id !== id));
  };

  const updateService = (id: string, patch: Partial<ServiceItem>) => {
    setServices((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const total = services.reduce((sum, s) => sum + (parseFloat(s.value.replace(",", ".")) || 0), 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/cotacoes" });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="p-6 max-w-[1400px] w-full mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="icon">
                <Link to="/cotacoes">
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link to="/cotacoes" className="hover:text-foreground">Cotações</Link>
                  <span>/</span>
                  <span className="text-foreground">Nova</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground">Nova Cotação</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link to="/cotacoes">Cancelar</Link>
              </Button>
              <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="size-4" />
                Salvar Cotação
              </Button>
            </div>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cliente */}
              <section className="bg-card border border-border/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="size-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
                    <User className="size-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Dados do Cliente</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Cliente *</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Karla</SelectItem>
                        <SelectItem value="2">Junior Almeida</SelectItem>
                        <SelectItem value="3">Wilson</SelectItem>
                        <SelectItem value="novo">+ Novo cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail</Label>
                    <Input type="email" placeholder="cliente@email.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone / WhatsApp</Label>
                    <Input placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tag / Identificador</Label>
                    <Input placeholder="Ex.: Lua de Mel, Família..." />
                  </div>
                </div>
              </section>

              {/* Viagem */}
              <section className="bg-card border border-border/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="size-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
                    <MapPin className="size-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Detalhes da Viagem</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Origem</Label>
                    <Input placeholder="Cidade de origem" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Destino *</Label>
                    <Input placeholder="Cidade de destino" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ida</Label>
                    <div className="relative">
                      <Input type="date" className="pl-9" />
                      <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Volta</Label>
                    <div className="relative">
                      <Input type="date" className="pl-9" />
                      <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Adultos</Label>
                    <Input type="number" min={1} defaultValue={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Crianças</Label>
                    <Input type="number" min={0} defaultValue={0} />
                  </div>
                </div>
              </section>

              {/* Serviços */}
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

              {/* Observações */}
              <section className="bg-card border border-border/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">Observações</h2>
                <Textarea placeholder="Notas internas sobre a cotação..." rows={4} />
              </section>
            </div>

            {/* Right column - Resumo */}
            <aside className="space-y-6">
              <section className="bg-card border border-border/50 rounded-xl p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Resumo</h2>

                <div className="space-y-1.5 mb-4">
                  <Label>Status</Label>
                  <Select defaultValue="aguardando">
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
                    <Input type="date" className="pl-9" />
                    <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <Label>Forma de Pagamento</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t border-border/50 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Itens</span>
                    <span>{services.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className={cn("flex items-center justify-between pt-2 border-t border-border/50")}>
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-xl font-bold text-secondary">
                      R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <Button type="submit" className="w-full mt-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Save className="size-4" />
                  Salvar Cotação
                </Button>
              </section>
            </aside>
          </form>
        </main>
      </div>
    </div>
  );
}
