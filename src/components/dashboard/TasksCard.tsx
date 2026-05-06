import { ClipboardList } from "lucide-react";

export function TasksCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-base font-semibold text-foreground mb-4">Tarefas para hoje, dia 06</h3>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ClipboardList className="size-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Você não possui nenhuma tarefa para o dia de hoje.</p>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        <span className="text-xs px-3 py-1.5 rounded-md bg-destructive/90 text-destructive-foreground font-semibold">
          2 atrasada(s)
        </span>
        <span className="text-xs px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground font-semibold">
          0 para o dia de hoje
        </span>
        <span className="text-xs px-3 py-1.5 rounded-md bg-emerald-600/90 text-white font-semibold">
          10 no prazo
        </span>
      </div>
    </div>
  );
}
