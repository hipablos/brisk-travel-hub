import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, CalendarIcon, Link as LinkIcon, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CotacoesFilters() {
  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 min-w-0">
        <h1 className="text-2xl font-bold text-foreground">Cotações</h1>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="gap-2">
            <LinkIcon className="size-4" />
            Links
          </Button>
          <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/cotacoes/nova">
              <Plus className="size-4" />
              Nova Cotação
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-end bg-card p-4 rounded-xl border border-border/50 min-w-0">
        <div className="space-y-1.5 min-w-0">
          <label className="text-sm font-medium text-foreground">Cliente</label>
          <Select defaultValue="todos">
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="1">Karla</SelectItem>
              <SelectItem value="2">Junior Almeida</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 min-w-0">
          <label className="text-sm font-medium text-foreground">Tag/Identificador</label>
          <Input placeholder="Tag ou Identificador" />
        </div>

        <div className="space-y-1.5 md:col-span-2 min-w-0">
          <label className="text-sm font-medium text-foreground">Período da Cotação</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input placeholder="07/03/2026" className="pl-9" />
              <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">até</span>
            <div className="relative flex-1">
              <Input placeholder="06/05/2026" className="pl-9" />
              <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="flex items-end gap-2 min-w-0 md:col-span-2 xl:col-span-1 2xl:col-span-1">
          <div className="space-y-1.5 flex-1">
            <label className="text-sm font-medium text-foreground">Usuário</label>
            <Select defaultValue="todos">
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" className="mb-0 shrink-0">
            <Filter className="size-4" />
          </Button>
          <Button className="mb-0 shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
            Pesquisar
          </Button>
        </div>
      </div>
    </div>
  );
}
