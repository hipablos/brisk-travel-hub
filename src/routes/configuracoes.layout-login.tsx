import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";

export const Route = createFileRoute("/configuracoes/layout-login")({
  component: LayoutLoginPage,
  head: () => ({ meta: [{ title: "Brisk Viagens — Layout Login" }] }),
});

function LayoutLoginPage() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LogIn className="size-6" /> Layout Login
            </h1>
            <p className="text-sm text-muted-foreground">
              Personalize totalmente a aparência da tela de login.
            </p>
          </div>
          <Card>
            <CardHeader><CardTitle>Em construção</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Esta página será entregue na <strong>Fase 3</strong> do plano aprovado, com todos os campos
                solicitados: fundo (cor/gradiente/imagem), cores, configuração do logotipo,
                título, subtítulo e pré-visualização ao vivo.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
