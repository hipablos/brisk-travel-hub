import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { CotacoesFilters } from "@/components/cotacoes/CotacoesFilters";
import { CotacoesBoard } from "@/components/cotacoes/CotacoesBoard";

export const Route = createFileRoute("/cotacoes")({
  component: Cotacoes,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Cotações" },
      { name: "description", content: "Gerenciamento de cotações da agência Brisk Viagens." },
    ],
  }),
});

function Cotacoes() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar />
        <main className="p-6 w-full mx-auto flex-1 flex flex-col min-w-0 overflow-x-clip overflow-y-visible">
          <CotacoesFilters />
          <CotacoesBoard />
        </main>
      </div>
    </div>
  );
}
