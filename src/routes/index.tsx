import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

import { UpcomingFlights } from "@/components/dashboard/UpcomingFlights";
import { TasksCard } from "@/components/dashboard/TasksCard";
import { BudgetsChart } from "@/components/dashboard/BudgetsChart";
import { TopClients } from "@/components/dashboard/TopClients";
import { StatCards } from "@/components/dashboard/StatCards";
import { RecentCotacoes } from "@/components/dashboard/RecentCotacoes";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Brisk Viagens — Dashboard" },
      { name: "description", content: "CRM completo para a agência Brisk Viagens: voos, clientes, financeiro e mais." },
    ],
  }),
});

function Dashboard() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
          
          <StatCards />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <UpcomingFlights />
            <TasksCard />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <BudgetsChart />
            <TopClients />
          </div>
          <RecentCotacoes />
        </main>
      </div>
    </div>
  );
}
