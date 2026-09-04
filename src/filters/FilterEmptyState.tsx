import { SearchX } from "lucide-react";

export function FilterEmptyState({ onClear }: { onClear: () => void }) {
  return <div className="rounded-3xl border border-dashed border-border p-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60"><SearchX className="h-5 w-5 text-muted-foreground" /></div><h3 className="mt-4 font-black">Nenhum produto encontrado</h3><p className="mt-2 text-sm text-muted-foreground">Tente ampliar a faixa de preço ou remover algum filtro.</p><button type="button" onClick={onClear} className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Limpar filtros</button></div>;
}
