import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, User, FileText, CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { saveCliente, getCliente, type Cliente, type TipoCliente } from "@/lib/cotacoes-store";
import { toast } from "sonner";

const searchSchema = z.object({
  redirect: z.string().optional(),
  id: z.string().optional(),
});

export const Route = createFileRoute("/clientes_/novo")({
  component: NovoCliente,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Novo Cliente" },
      { name: "description", content: "Cadastre um novo cliente da Brisk Viagens." },
    ],
  }),
});

function NovoCliente() {
  const navigate = useNavigate();
  const { redirect, id: editId } = useSearch({ from: "/clientes_/novo" });

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    dataNascimento: "",
    sexo: "" as "" | "masculino" | "feminino" | "outro",
    tipos: [] as TipoCliente[],
    rg: "",
    cpf: "",
    passaporte: "",
    passaporteExpedicao: "",
    passaporteVencimento: "",
    vistoEmissao: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!editId) return;
    const c = getCliente(editId);
    if (!c) return;
    setForm({
      nome: c.nome || "",
      email: c.email || "",
      telefone: c.telefone || "",
      dataNascimento: c.dataNascimento || "",
      sexo: (c.sexo as "" | "masculino" | "feminino" | "outro") || "",
      tipos: c.tipos && c.tipos.length ? c.tipos : (c.tipo ? [c.tipo] : []),
      rg: c.rg || "",
      cpf: c.cpf || "",
      passaporte: c.passaporte || "",
      passaporteExpedicao: c.passaporteExpedicao || "",
      passaporteVencimento: c.passaporteVencimento || "",
      vistoEmissao: c.vistoEmissao || "",
    });
  }, [editId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe o nome completo");
      return;
    }
    const cliente: Cliente = {
      id: editId || crypto.randomUUID(),
      nome: form.nome,
      email: form.email || undefined,
      telefone: form.telefone || undefined,
      dataNascimento: form.dataNascimento || undefined,
      sexo: form.sexo || undefined,
      tipo: form.tipo || undefined,
      rg: form.rg || undefined,
      cpf: form.cpf || undefined,
      documento: form.cpf || form.passaporte || undefined,
      passaporte: form.passaporte || undefined,
      passaporteExpedicao: form.passaporteExpedicao || undefined,
      passaporteVencimento: form.passaporteVencimento || undefined,
      vistoEmissao: form.vistoEmissao || undefined,
    };
    saveCliente(cliente);
    toast.success(editId ? "Cliente atualizado!" : "Cliente cadastrado!");
    if (redirect) navigate({ to: redirect });
    else navigate({ to: "/clientes" });
  };

  const backTo = redirect || "/clientes";

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="p-6 max-w-[1100px] w-full mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="icon">
                <Link to={backTo}><ArrowLeft className="size-4" /></Link>
              </Button>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Clientes</span>
                  <span>/</span>
                  <span className="text-foreground">Novo</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground">Novo Cliente</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline"><Link to={backTo}>Cancelar</Link></Button>
              <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="size-4" /> Salvar Cliente
              </Button>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="dados" className="gap-2"><User className="size-4" /> Dados Pessoais</TabsTrigger>
                <TabsTrigger value="documentos" className="gap-2"><FileText className="size-4" /> Documentos</TabsTrigger>
              </TabsList>

              <TabsContent value="dados">
                <section className="bg-card border border-border/50 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Nome Completo *</Label>
                    <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data de Nascimento</Label>
                    <div className="relative">
                      <Input type="date" className="pl-9" value={form.dataNascimento} onChange={(e) => set("dataNascimento", e.target.value)} />
                      <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sexo</Label>
                    <Select value={form.sexo} onValueChange={(v) => set("sexo", v as typeof form.sexo)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo de Cliente</Label>
                    <Select value={form.tipo} onValueChange={(v) => set("tipo", v as TipoCliente)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passageiro">Passageiro</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                        <SelectItem value="representante">Representante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail</Label>
                    <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone / WhatsApp</Label>
                    <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} />
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="documentos">
                <section className="bg-card border border-border/50 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>RG</Label>
                    <Input value={form.rg} onChange={(e) => set("rg", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CPF</Label>
                    <Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2 border-t border-border/50 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Passaporte</h3>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Número do Passaporte</Label>
                    <Input value={form.passaporte} onChange={(e) => set("passaporte", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data de Expedição do Passaporte</Label>
                    <div className="relative">
                      <Input type="date" className="pl-9" value={form.passaporteExpedicao} onChange={(e) => set("passaporteExpedicao", e.target.value)} />
                      <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Vencimento do Passaporte</Label>
                    <div className="relative">
                      <Input type="date" className="pl-9" value={form.passaporteVencimento} onChange={(e) => set("passaporteVencimento", e.target.value)} />
                      <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2 border-t border-border/50 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Visto</h3>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data de Emissão do Visto</Label>
                    <div className="relative">
                      <Input type="date" className="pl-9" value={form.vistoEmissao} onChange={(e) => set("vistoEmissao", e.target.value)} />
                      <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </section>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-6">
              <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="size-4" /> Salvar Cliente
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
