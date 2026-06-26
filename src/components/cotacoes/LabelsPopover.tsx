import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, Plus, Check } from "lucide-react";
import {
  useAllLabels,
  saveCustomLabel,
  updateCotacaoLabels,
  type LabelDef,
} from "@/lib/cotacoes-store";

const PALETTE = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#ec4899", "#64748b"];

type Props = {
  cotacaoId: string;
  selected: string[];
  trigger?: React.ReactNode;
};

export function LabelsPopover({ cotacaoId, selected, trigger }: Props) {
  const all = useAllLabels();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  const toggle = (l: LabelDef) => {
    const has = selected.includes(l.name);
    const next = has ? selected.filter((x) => x !== l.name) : [...selected, l.name];
    updateCotacaoLabels(cotacaoId, next);
  };

  const create = () => {
    if (!name.trim()) return;
    saveCustomLabel({ name: name.trim(), color });
    updateCotacaoLabels(cotacaoId, [...selected, name.trim()]);
    setName("");
    setAdding(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        {trigger ?? (
          <button className="p-1 hover:text-foreground" title="Etiquetas">
            <Tag className="size-3.5" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Etiquetas</div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {all.map((l) => {
            const on = selected.includes(l.name);
            return (
              <button
                key={l.name}
                type="button"
                onClick={() => toggle(l)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-left"
              >
                <span className="size-3 rounded-sm" style={{ background: l.color }} />
                <span className="flex-1 text-sm truncate">{l.name}</span>
                {on && <Check className="size-3.5 text-primary" />}
              </button>
            );
          })}
        </div>

        <div className="border-t border-border/60 mt-2 pt-2">
          {adding ? (
            <div className="space-y-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8"
                autoFocus
              />
              <div className="flex gap-1">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="size-5 rounded-sm border-2"
                    style={{
                      background: c,
                      borderColor: color === c ? "white" : "transparent",
                      outline: color === c ? `2px solid ${c}` : "none",
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" className="flex-1 h-7" onClick={create}>
                  Criar
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-7" onClick={() => setAdding(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-sm text-muted-foreground"
            >
              <Plus className="size-3.5" /> Criar etiqueta
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
