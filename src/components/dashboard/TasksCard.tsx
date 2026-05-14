import { ClipboardList } from "lucide-react";

export function TasksCard() {
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit" });
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-base font-semibold text-foreground mb-4">Tarefas para hoje, dia {today}</h3>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ClipboardList className="size-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Você não possui nenhuma tarefa para o dia de hoje.</p>
      </div>
    </div>
  );
}
