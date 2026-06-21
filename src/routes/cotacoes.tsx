import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { CotacoesFilters, filtrosVazios, type CotacoesFiltrosState } from "@/components/cotacoes/CotacoesFilters";
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
  const [filtros, setFiltros] = useState<CotacoesFiltrosState>(filtrosVazios);
  const [aplicados, setAplicados] = useState<CotacoesFiltrosState>(filtrosVazios);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar />
        <main className="p-6 w-full mx-auto flex-1 flex flex-col min-w-0">
          <CotacoesFilters
            value={filtros}
            onChange={setFiltros}
            onPesquisar={() => setAplicados(filtros)}
          />
          <CotacoesBoard filtros={aplicados} />
        </main>
      </div>
    </div>
  );
}
