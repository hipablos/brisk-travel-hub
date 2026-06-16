import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react";

export const Route = createFileRoute("/configuracoes/marca")({
  component: MarcaPage,
  head: () => ({ meta: [{ title: "Brisk Viagens — Marca Brisk" }] }),
});

function MarcaPage() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Palette className="size-6" /> Marca Brisk
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie a identidade visual do Brisk CRM (logotipo, favicon, cores, fundos, dados da empresa).
            </p>
          </div>
          <Card>
            <CardHeader><CardTitle>Em construção</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Esta página será entregue na <strong>Fase 3</strong> do plano aprovado, com todos os campos
                solicitados: nome do sistema, upload de logo, favicon, cores institucionais, tema,
                fundos institucionais, dados da empresa e pré-visualização ao vivo.
              </p>
              <p>
                O favicon oficial (avião dourado em fundo azul) já está aplicado no navegador.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
