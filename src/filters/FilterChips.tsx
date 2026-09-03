import { X } from "lucide-react";
import type { FilterState } from "./useFilters";

export function FilterChips({ filters, onRemove, onClearAll }: { filters: FilterState; onRemove: (key: keyof FilterState, value?: string) => void; onClearAll: () => void }) {
  const chips: Array<{ key: keyof FilterState; label: string; value?: string }> = [];
  filters.categories.forEach((v) => chips.push({ key: "categories", label: `Categoria: ${v}`, value: v }));
  filters.marketplaces.forEach((v) => chips.push({ key: "marketplaces", label: `Marketplace: ${v}`, value: v }));
  if (filters.minPrice > 0 || filters.maxPrice < 10000) chips.push({ key: "minPrice", label: `Preço: R$ ${filters.minPrice.toLocaleString("pt-BR")} – R$ ${filters.maxPrice.toLocaleString("pt-BR")}` });
  if (filters.minDiscount > 0) chips.push({ key: "minDiscount", label: `Desconto ≥ ${filters.minDiscount}%` });
  if (filters.minRating > 0) chips.push({ key: "minRating", label: `Avaliação ≥ ${filters.minRating}★` });
  if (filters.freeShipping) chips.push({ key: "freeShipping", label: "Frete grátis" });
  if (filters.bestOffer) chips.push({ key: "bestOffer", label: "Melhor oferta" });
  if (!chips.length) return null;
  return <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
    {chips.map((chip, i) => <span key={`${chip.key}-${chip.value ?? i}`} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
      {chip.label}<button type="button" aria-label={`Remover ${chip.label}`} onClick={() => onRemove(chip.key, chip.value)} className="rounded-full p-0.5 hover:bg-background hover:text-foreground"><X className="h-3 w-3" /></button>
    </span>)}
    <button type="button" onClick={onClearAll} className="text-xs font-medium text-primary hover:underline">Limpar</button>
  </div>;
}
