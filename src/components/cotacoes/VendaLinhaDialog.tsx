import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useFormasPagamento, type VendaLinha } from "@/lib/cotacoes-store";
import { CalendarIcon, DollarSign } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: "custo" | "venda";
  initial?: VendaLinha | null;
  onSave: (linha: VendaLinha) => void;
  /** sugestões de autocomplete (categorias/fornecedores/clientes/contas já usadas) */
  suggestions?: {
    partes?: string[];
    contas?: string[];
    categorias?: string[];
  };
};

const empty = (): VendaLinha => ({
  id: crypto.randomUUID(),
  parte: "",
  conta: "",
  categoria: "",
  descricao: "",
  forma: "",
  parcela: "",
  vencimento: "",
  pagamento: "",
  valor: 0,
  pago: false,
});

export function VendaLinhaDialog({ open, onOpenChange, kind, initial, onSave, suggestions }: Props) {
  const isCusto = kind === "custo";
  const formas = useFormasPagamento();
  const [linha, setLinha] = useState<VendaLinha>(empty());

  useEffect(() => {
    if (open) setLinha(initial ? { ...initial } : empty());
  }, [open, initial]);

  const upd = (p: Partial<VendaLinha>) => setLinha((l) => ({ ...l, ...p }));

  const handleSave = () => {
    onSave({ ...linha, valor: Number(linha.valor) || 0 });
    onOpenChange(false);
  };

  const parteLabel = isCusto ? "Fornecedor" : "Cliente / Pagador";
  const parteList = suggestions?.partes ?? [];
  const contaList = suggestions?.contas ?? [];
  const catList = suggestions?.categorias ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Editar" : "Adicionar"} {isCusto ? "Custo" : "Venda"}
          </DialogTitle>
          <DialogDescription>
            {isCusto
              ? "Lance um custo associado a esta venda."
              : "Lance um recebimento desta venda."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Descrição</Label>
            <Input
              value={linha.descricao ?? ""}
              onChange={(e) => upd({ descricao: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{parteLabel}</Label>
            <Input
              list={`parte-${kind}`}
              value={linha.parte ?? ""}
              onChange={(e) => upd({ parte: e.target.value })}
            />
            <datalist id={`parte-${kind}`}>
              {parteList.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Input
              list={`cat-${kind}`}
              value={linha.categoria ?? ""}
              onChange={(e) => upd({ categoria: e.target.value })}
            />
            <datalist id={`cat-${kind}`}>
              {catList.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label>Banco / Conta</Label>
            <Input
              list={`conta-${kind}`}
              value={linha.conta ?? ""}
              onChange={(e) => upd({ conta: e.target.value })}
            />
            <datalist id={`conta-${kind}`}>
              {contaList.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label>Forma de Pagamento</Label>
            <Select value={linha.forma ?? ""} onValueChange={(v) => upd({ forma: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {formas.length === 0 && (
                  <SelectItem value="__none" disabled>Nenhuma forma cadastrada</SelectItem>
                )}
                {formas.map((f) => (
                  <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Parcelas</Label>
            <Input
              value={linha.parcela ?? ""}
              onChange={(e) => upd({ parcela: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Vencimento</Label>
            <div className="relative">
              <DateInput
                className="pl-9"
                value={linha.vencimento ?? ""}
                onChange={(iso) => upd({ vencimento: iso })}
              />
              <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Data de Pagamento</Label>
            <div className="relative">
              <DateInput
                className="pl-9"
                value={linha.pagamento ?? ""}
                onChange={(iso) => upd({ pagamento: iso })}
              />
              <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Valor (R$)</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                className="pl-9 text-right"
                value={linha.valor || ""}
                onChange={(e) => upd({ valor: parseFloat(e.target.value) || 0 })}
              />
              <DollarSign className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
            <div>
              <Label className="cursor-pointer">{isCusto ? "Custo pago" : "Recebimento confirmado"}</Label>
              <p className="text-xs text-muted-foreground">
                {isCusto ? "Marque se o custo já foi quitado." : "Marque se o valor já foi recebido."}
              </p>
            </div>
            <Switch checked={linha.pago} onCheckedChange={(c) => upd({ pago: c })} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            {initial ? "Salvar alterações" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
